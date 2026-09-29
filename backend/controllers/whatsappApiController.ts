// =====================================================
// SHIVINFRA WHATSAPP API CONTROLLER
//
// Real backend endpoints for:
// - WhatsApp conversations (grouped by phone + company)
// - Conversation messages
// - Activity / audit logs
//
// All endpoints are company-scoped and require JWT.
// =====================================================

import { Request, Response } from "express";
import { supabaseAdmin as supabase } from "../config/supabase.ts";
import { AuthenticatedRequest } from "../middleware/auth.ts";

async function resolveIdentity(
    companyId: string,
    phone: string
): Promise<{ name: string; role: string }> {
    try {
        const { data: user } = await supabase
            .from("users")
            .select("name, role")
            .eq("company_id", companyId)
            .eq("phone", phone)
            .maybeSingle();

        if (user) {
            const role = String(user.role || "").toUpperCase();
            return {
                name: user.name || phone,
                role: role === "SUPER ADMIN" || role === "SALES MANAGER" ? "ADMIN" : role,
            };
        }

        const { data: customer } = await supabase
            .from("customers")
            .select("name")
            .eq("company_id", companyId)
            .eq("phone", phone)
            .maybeSingle();

        if (customer) {
            return { name: customer.name || phone, role: "CUSTOMER" };
        }
    } catch {
        // Ignore and fall through to unknown
    }
    return { name: phone, role: "UNKNOWN" };
}

export class WhatsAppApiController {

    // =================================================
    // GET /api/v1/whatsapp/conversations
    // Company-scoped conversation list grouped by phone
    // =================================================
    static async listConversations(req: AuthenticatedRequest, res: Response) {
        try {
            const companyId = req.user?.company_id;
            if (!companyId) {
                return res.status(401).json({ success: false, error: "Unauthorized" });
            }

            const { data, error } = await supabase
                .from("chat_history")
                .select("company_id, phone, sender, message, created_at")
                .eq("company_id", companyId)
                .order("created_at", { ascending: true });

            if (error) {
                return res.status(500).json({ success: false, error: error.message });
            }

            const map = new Map<string, any>();
            for (const row of data || []) {
                const phone = row.phone || "unknown";
                if (!map.has(phone)) {
                    map.set(phone, {
                        phone,
                        lastMessage: row.message,
                        lastMessageAt: row.created_at,
                        messageCount: 0,
                        identity: null,
                    });
                }
                const conv = map.get(phone);
                conv.messageCount += 1;
                conv.lastMessage = row.message;
                conv.lastMessageAt = row.created_at;
            }

            const conversations = await Promise.all(
                Array.from(map.values()).map(async (c) => {
                    const identity = await resolveIdentity(companyId, c.phone);
                    return {
                        ...c,
                        name: identity.name,
                        role: identity.role,
                    };
                })
            );

            conversations.sort(
                (a, b) =>
                    new Date(b.lastMessageAt).getTime() -
                    new Date(a.lastMessageAt).getTime()
            );

            return res.status(200).json({ success: true, data: conversations });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // =================================================
    // GET /api/v1/whatsapp/conversations/:phone/messages
    // Phone + company scoped messages
    // =================================================
    static async getConversationMessages(req: AuthenticatedRequest, res: Response) {
        try {
            const companyId = req.user?.company_id;
            const phone = String(req.params.phone || "").trim();

            if (!companyId) {
                return res.status(401).json({ success: false, error: "Unauthorized" });
            }
            if (!phone) {
                return res.status(400).json({ success: false, error: "Phone parameter required" });
            }
            if (!/^\+?[0-9]{6,20}$/.test(phone.replace(/\s/g, ""))) {
                return res.status(400).json({ success: false, error: "Invalid phone format" });
            }

            const { data, error } = await supabase
                .from("chat_history")
                .select("company_id, phone, sender, message, created_at")
                .eq("company_id", companyId)
                .eq("phone", phone)
                .order("created_at", { ascending: true });

            if (error) {
                return res.status(500).json({ success: false, error: error.message });
            }

            return res.status(200).json({ success: true, data: data || [] });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // =================================================
    // GET /api/v1/whatsapp/activity
    // Recent activity/audit logs for the company
    // =================================================
    static async listActivity(req: AuthenticatedRequest, res: Response) {
        try {
            const companyId = req.user?.company_id;
            if (!companyId) {
                return res.status(401).json({ success: false, error: "Unauthorized" });
            }

            const { data, error } = await supabase
                .from("activity_logs")
                .select("id, created_at, action_type, details, user_email, user_id")
                .eq("company_id", companyId)
                .order("created_at", { ascending: false })
                .limit(100);

            if (error) {
                return res.status(500).json({ success: false, error: error.message });
            }

            return res.status(200).json({ success: true, data: data || [] });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // =================================================
    // POST /api/v1/whatsapp/send
    // Send a WhatsApp message to a specific phone (admin manual send)
    // =================================================
    static async sendMessage(req: AuthenticatedRequest, res: Response) {
        try {
            const companyId = req.user?.company_id;
            if (!companyId) {
                return res.status(401).json({ success: false, error: "Unauthorized" });
            }
            const { phone, message } = req.body;
            if (!phone) {
                return res.status(400).json({ success: false, error: "Phone number is required" });
            }
            if (!message || String(message).trim() === "") {
                return res.status(400).json({ success: false, error: "Message is required" });
            }

            const whatsappServiceModule = await import("../services/whatsappService.ts");
            const WhatsAppServiceClass = whatsappServiceModule.WhatsAppService || whatsappServiceModule.default;
            if (!WhatsAppServiceClass || !WhatsAppServiceClass.sendTextMessage) {
                return res.status(200).json({ success: false, configured: false, message: "WhatsApp service not available." });
            }

            const isConfigured = !!(process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID && process.env.META_WHATSAPP_TOKEN !== "EAAG...");
            if (!isConfigured) {
                return res.status(200).json({ success: false, configured: false, message: "WhatsApp Cloud API is not configured. Add your Meta credentials in Settings > WhatsApp Meta Setup." });
            }

            const sent = await WhatsAppServiceClass.sendTextMessage(phone, String(message).trim());
            
            // Save to chat_history
            try {
                await supabase
                    .from("chat_history")
                    .insert({
                        company_id: companyId,
                        phone: String(phone).trim(),
                        message: String(message).trim(),
                        sender: "Agent",
                    });
            } catch (saveErr) {
                console.error("[WHATSAPP SEND] Failed to save to chat_history:", saveErr);
            }

            return res.status(200).json({ 
                success: sent, 
                configured: true, 
                message: sent ? `Message sent to ${phone}` : `Message failed for ${phone}`,
                sent 
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // =================================================
    // POST /api/v1/whatsapp/test
    // Send a test WhatsApp message to verify configuration
    // =================================================
    static async testMessage(req: AuthenticatedRequest, res: Response) {
        try {
            const companyId = req.user?.company_id;
            if (!companyId) {
                return res.status(401).json({ success: false, error: "Unauthorized" });
            }
            const { phone } = req.body;
            if (!phone) {
                return res.status(400).json({ success: false, error: "Phone number is required" });
            }
            const whatsappServiceModule = await import("../services/whatsappService.ts");
            const WhatsAppServiceClass = whatsappServiceModule.WhatsAppService || whatsappServiceModule.default;
            if (!WhatsAppServiceClass || !WhatsAppServiceClass.sendTextMessage) {
                return res.status(200).json({ success: true, configured: false, message: "WhatsApp service not available." });
            }
            const isConfigured = !!(process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID && process.env.META_WHATSAPP_TOKEN !== "EAAG...");
            if (!isConfigured) {
                return res.status(200).json({ success: true, configured: false, message: "WhatsApp Cloud API is not configured. Add your Meta credentials in Settings > WhatsApp Meta Setup." });
            }
            const sent = await WhatsAppServiceClass.sendTextMessage(phone, "Your WhatsApp integration is working. Test message from SHIV INFRA ERP.");
            return res.status(200).json({ success: true, configured: true, message: `Test message ${sent ? 'sent' : 'failed to send'} to ${phone}`, sent });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default WhatsAppApiController;
