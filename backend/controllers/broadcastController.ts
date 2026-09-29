import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { supabaseAdmin as supabase } from "../config/supabase.ts";
import customerService from "../services/customerService.ts";
import leadService from "../services/leadService.ts";
import { WhatsAppService } from "../services/whatsappService.ts";
import { FacebookMessagingService } from "../services/facebookMessagingService.ts";
import { InstagramMessagingService } from "../services/instagramMessagingService.ts";
import { SmsService } from "../services/smsService.ts";
import { settingService } from "../services/settingService.ts";

interface Recipient {
    phone: string;
    type: "customer" | "lead";
    id: string;
}

interface ChannelResult {
    channel: string;
    status: "Sent" | "Failed" | "Skipped";
    error: string | null;
    providerMessageId?: string;
    sentAt: string | null;
}

export class BroadcastController {
    // =====================================================
    // CREATE BROADCAST
    // POST /api/v1/broadcasts
    // =====================================================
    static async createBroadcast(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const companyId = req.user?.company_id;
            const userId = req.user?.id;

            if (!companyId) {
                return res.status(401).json({
                    success: false,
                    message: "Company authentication missing",
                });
            }

            const {
                message_text,
                audience = "CUSTOMERS",
                city = null,
                lead_status = null,
                project_name = null,
                channels = ["whatsapp"],
                scheduled_at = null,
            } = req.body;

            const selectedChannels = Array.isArray(channels) ? channels : [channels];

            // Parse and validate scheduled_at if provided
            let scheduledAt: Date | null = null;
            let isScheduled = false;
            if (scheduled_at) {
                const parsed = new Date(scheduled_at);
                if (isNaN(parsed.getTime())) {
                    return res.status(400).json({
                        success: false,
                        code: "BROADCAST_INVALID_SCHEDULED_AT",
                        message: "scheduled_at must be a valid ISO 8601 timestamp",
                    });
                }
                scheduledAt = parsed;
                isScheduled = scheduledAt > new Date();
            }

            if (!message_text || String(message_text).trim() === "") {
                return res.status(400).json({
                    success: false,
                    code: "BROADCAST_MESSAGE_REQUIRED",
                    message: "Broadcast message is required",
                });
            }

            // -------------------------------------------------
            // 1. Gather recipients
            // -------------------------------------------------
            const audienceUpper = String(audience).toUpperCase();
            let recipients: Recipient[] = [];

            if (audienceUpper === "CUSTOMERS") {
                const { data: customers } = await customerService.filterCustomers(
                    companyId,
                    { city, status: lead_status }
                );

                if (customers) {
                    recipients.push(
                        ...customers
                            .filter(
                                (c: any) =>
                                    c.phone &&
                                    String(c.phone).trim() !== ""
                            )
                            .map((c: any) => ({
                                phone: String(c.phone).trim(),
                                type: "customer" as const,
                                id: c.id,
                            }))
                    );
                }
            } else if (audienceUpper === "LEADS") {
                const { data: leads } = await leadService.filterLeads(companyId, {
                    status: lead_status,
                    preferred_location: city,
                });

                if (leads) {
                    recipients.push(
                        ...leads
                            .filter(
                                (l: any) =>
                                    l.customers?.phone &&
                                    String(l.customers.phone).trim() !== ""
                            )
                            .map((l: any) => ({
                                phone: String(l.customers.phone).trim(),
                                type: "lead" as const,
                                id: l.id,
                            }))
                    );
                }
            }

            // Deduplicate by last 10 digits
            const seenPhones = new Set<string>();
            const uniqueRecipients = recipients.filter((r) => {
                const normalized = String(r.phone)
                    .replace(/\D/g, "")
                    .slice(-10);
                if (seenPhones.has(normalized)) {
                    return false;
                }
                seenPhones.add(normalized);
                return true;
            });

            if (uniqueRecipients.length === 0) {
                return res.status(400).json({
                    success: false,
                    code: "BROADCAST_NO_RECIPIENTS",
                    message: "No valid recipients found for the specified audience",
                });
            }

            // -------------------------------------------------
            // 2. Load company settings to determine channel config
            // -------------------------------------------------
            let companySettings: Record<string, any> = {};
            try {
                const settingsResult = await settingService.getByCompany(companyId);
                if (settingsResult.success && settingsResult.data) {
                    companySettings = settingsResult.data;
                }
            } catch {
                companySettings = {};
            }

            // Environment-level fallbacks (for direct Meta env vars)
            const envFbPageId = process.env.META_FB_PAGE_ID;
            const envFbToken = process.env.META_FB_PAGE_ACCESS_TOKEN;
            const envIgAccountId = process.env.META_IG_ACCOUNT_ID;
            const envIgToken = process.env.META_IG_ACCESS_TOKEN;

            // Build service instances from settings (DB) or env fallback
            const fbService = new FacebookMessagingService({
                pageId: companySettings.meta_fb_page_id || envFbPageId,
                accessToken: companySettings.meta_fb_page_access_token || envFbToken,
                apiVersion: process.env.META_API_VERSION || "v18.0",
            });
            const igService = new InstagramMessagingService({
                accountId: companySettings.meta_ig_account_id || envIgAccountId,
                accessToken: companySettings.meta_ig_access_token || envIgToken,
                apiVersion: process.env.META_API_VERSION || "v18.0",
            });
            const smsServiceInst = new SmsService({
                enabled: process.env.SMS_ENABLED === "true",
                provider: companySettings.smsProvider || process.env.SMS_PROVIDER || "twilio",
                from: companySettings.smsFrom || process.env.SMS_FROM || "",
                accountSid: companySettings.smsAccountSid || process.env.SMS_ACCOUNT_SID,
                apiKey: companySettings.smsApiKey || process.env.SMS_API_KEY,
                apiSecret: companySettings.smsApiKey || process.env.SMS_API_SECRET,
                endpoint: companySettings.smsEndpoint || process.env.SMS_ENDPOINT,
            });

            // -------------------------------------------------
            // 3. Channel configuration gate
            //    Check each selected channel and determine which
            //    are configured. Unconfigured channels are recorded
            //    but never attempted.
            // -------------------------------------------------
            const channelConfigured: Record<string, boolean> = {};
            const channelErrors: Record<string, string> = {};

            for (const ch of selectedChannels) {
                if (ch === "whatsapp") {
                    channelConfigured[ch] = WhatsAppService ? true : false;
                } else if (ch === "facebook") {
                    channelConfigured[ch] = fbService.isConfigured();
                    if (!channelConfigured[ch]) {
                        channelErrors[ch] = "Facebook Messenger is not configured. Configure META_FB_PAGE_ID and META_FB_PAGE_ACCESS_TOKEN in Settings > Facebook Meta Setup.";
                    }
                } else if (ch === "instagram") {
                    channelConfigured[ch] = igService.isConfigured();
                    if (!channelConfigured[ch]) {
                        channelErrors[ch] = "Instagram messaging is not configured. Configure META_IG_ACCOUNT_ID and META_IG_ACCESS_TOKEN in Settings > Instagram Meta Setup.";
                    }
                } else if (ch === "sms") {
                    channelConfigured[ch] = smsServiceInst.isConfigured();
                    if (!channelConfigured[ch]) {
                        channelErrors[ch] = "SMS messaging is not configured. Configure SMS settings in Settings > SMS / Text Setup.";
                    }
                } else {
                    channelConfigured[ch] = false;
                    channelErrors[ch] = `Unknown channel: ${ch}`;
                }
            }

            // -------------------------------------------------
            // 4. Create broadcast record
            // -------------------------------------------------
            const initialStatus = isScheduled ? "Scheduled" : "Pending";
            const audienceParams = isScheduled
                ? { audience: audienceUpper, city, lead_status, channels: selectedChannels }
                : {};
            const { data: broadcast, error: broadcastError } = await supabase
                .from("broadcasts")
                .insert({
                    company_id: companyId,
                    created_by: userId,
                    message_text: String(message_text).trim(),
                    audience: `${audienceUpper}${city ? ` (${city})` : ""}${lead_status ? ` - ${lead_status}` : ""}`,
                    status: initialStatus,
                    recipient_count: uniqueRecipients.length,
                    channel: selectedChannels.join(","),
                    scheduled_at: scheduledAt?.toISOString() || null,
                    audience_params: audienceParams,
                })
                .select()
                .single();

            if (broadcastError || !broadcast) {
                console.error("[BROADCAST] Insert failed:", broadcastError);
                return res.status(500).json({
                    success: false,
                    code: "BROADCAST_SAVE_FAILED",
                    message: "Failed to create broadcast record",
                });
            }

            // If scheduled for future, return early without dispatching
            if (isScheduled) {
                return res.status(201).json({
                    success: true,
                    code: "BROADCAST_SCHEDULED",
                    message: `Broadcast scheduled for ${scheduledAt!.toISOString()}`,
                    data: {
                        broadcast_id: broadcast.id,
                        audience: audienceUpper,
                        project_name,
                        city,
                        lead_status,
                        channels: selectedChannels,
                        message: String(message_text).trim(),
                        recipient_count: uniqueRecipients.length,
                        scheduled_at: scheduledAt!.toISOString(),
                        status: "Scheduled",
                    },
                });
            }

            // -------------------------------------------------
            // 5. Dispatch immediately (send now)
            // -------------------------------------------------
            await this.dispatchBroadcast(broadcast.id, {
                companyId,
                messageText: String(message_text).trim(),
                uniqueRecipients,
                selectedChannels,
                fbService,
                igService,
                smsService: smsServiceInst,
                channelConfigured,
                channelErrors,
            });

            // Fetch updated broadcast for response
            const { data: updatedBroadcast } = await supabase
                .from("broadcasts")
                .select("*")
                .eq("id", broadcast.id)
                .single();

            return res.status(201).json({
                success: (updatedBroadcast?.success_count || 0) > 0,
                code: "BROADCAST_SENT",
                message: `Broadcast dispatched: ${updatedBroadcast?.success_count || 0} sent${(updatedBroadcast?.failure_count || 0) > 0 ? `, ${updatedBroadcast?.failure_count || 0} failed` : ""}`,
                data: {
                    broadcast_id: broadcast.id,
                    audience: audienceUpper,
                    project_name,
                    city,
                    lead_status,
                    channels: selectedChannels,
                    message: String(message_text).trim(),
                    recipient_count: uniqueRecipients.length,
                    sent_count: updatedBroadcast?.success_count || 0,
                    failed_count: updatedBroadcast?.failure_count || 0,
                    skipped_count: 0,
                    status: updatedBroadcast?.status || "Unknown",
                    channel_status: channelConfigured,
                },
            });
        } catch (error: any) {
            console.error("[BROADCAST] Error:", error);
            next(error);
        }
    }

    /**
     * Dispatch a broadcast by ID. Used by both controller (immediate) and scheduler (scheduled).
     * Returns { sentCount, failedCount, skippedCount, finalStatus }
     */
    static async dispatchBroadcast(
        broadcastId: string,
        context: {
            companyId: string;
            messageText: string;
            uniqueRecipients: Recipient[];
            selectedChannels: string[];
            fbService: FacebookMessagingService;
            igService: InstagramMessagingService;
            smsService: SmsService;
            channelConfigured: Record<string, boolean>;
            channelErrors: Record<string, string>;
        }
    ): Promise<{ sentCount: number; failedCount: number; skippedCount: number; finalStatus: string }> {
        const { companyId, messageText, uniqueRecipients, selectedChannels, fbService, igService, smsService, channelConfigured, channelErrors } = context;

        const deliveryRecords: any[] = [];
        let sentCount = 0;
        let failedCount = 0;
        let skippedCount = 0;

        for (const recipient of uniqueRecipients) {
            for (const channel of selectedChannels) {
                const result: ChannelResult = await this.dispatchToChannel(
                    channel,
                    recipient,
                    messageText,
                    {
                        fbService,
                        igService,
                        smsService,
                        channelConfigured,
                        channelErrors,
                    }
                );

                deliveryRecords.push({
                    broadcast_id: broadcastId,
                    company_id: companyId,
                    phone: recipient.phone,
                    recipient_type: recipient.type,
                    recipient_id: recipient.id,
                    channel: channel,
                    provider_message_id: result.providerMessageId || null,
                    status: result.status,
                    error: result.error,
                    sent_at: result.sentAt,
                });

                if (result.status === "Sent") {
                    sentCount++;
                } else if (result.status === "Skipped") {
                    skippedCount++;
                } else {
                    failedCount++;
                }
            }
        }

        // Insert delivery records
        if (deliveryRecords.length > 0) {
            const { error: deliveryError } = await supabase
                .from("broadcast_recipients")
                .insert(deliveryRecords);

            if (deliveryError) {
                console.error("[BROADCAST] Delivery insert failed:", deliveryError);
            }
        }

        // Update broadcast status
        const finalStatus =
            failedCount === 0 && skippedCount === 0
                ? "Sent"
                : sentCount > 0
                ? "Partial"
                : "Failed";

        const { error: updateError } = await supabase
            .from("broadcasts")
            .update({
                status: finalStatus,
                success_count: sentCount,
                failure_count: failedCount + skippedCount,
                completed_at: new Date().toISOString(),
            })
            .eq("id", broadcastId);

        if (updateError) {
            console.error("[BROADCAST] Status update failed:", updateError);
        }

        return { sentCount, failedCount, skippedCount, finalStatus };
    }

    /**
     * Dispatch a single message to a single channel for a single recipient.
     * Public for reuse by scheduler.
     */
    static async dispatchToChannel(
        channel: string,
        recipient: Recipient,
        message: string,
        services: {
            fbService: FacebookMessagingService;
            igService: InstagramMessagingService;
            smsService: SmsService;
            channelConfigured: Record<string, boolean>;
            channelErrors: Record<string, string>;
        }
    ): Promise<ChannelResult> {
        // If channel is not configured, skip (never fake send)
        if (!services.channelConfigured[channel]) {
            return {
                channel,
                status: "Skipped",
                error: services.channelErrors[channel] || `${channel} is not configured`,
                providerMessageId: undefined,
                sentAt: null,
            };
        }

        try {
            if (channel === "whatsapp") {
                const sent = await WhatsAppService.sendTextMessage(
                    recipient.phone,
                    message
                );
                return {
                    channel,
                    status: sent ? "Sent" : "Failed",
                    error: sent ? null : "Meta API dispatch failed",
                    providerMessageId: sent ? `wa_${recipient.phone}` : undefined,
                    sentAt: sent ? new Date().toISOString() : null,
                };
            }

            if (channel === "facebook") {
                const result = await services.fbService.sendTextMessage(
                    recipient.phone,
                    message
                );
                return {
                    channel,
                    status: result.success ? "Sent" : "Failed",
                    error: result.error || null,
                    providerMessageId: result.messageId,
                    sentAt: result.success ? new Date().toISOString() : null,
                };
            }

            if (channel === "instagram") {
                const result = await services.igService.sendTextMessage(
                    recipient.phone,
                    message
                );
                return {
                    channel,
                    status: result.success ? "Sent" : "Failed",
                    error: result.error || null,
                    providerMessageId: result.messageId,
                    sentAt: result.success ? new Date().toISOString() : null,
                };
            }

            if (channel === "sms") {
                const result = await services.smsService.sendTextMessage(
                    recipient.phone,
                    message
                );
                return {
                    channel,
                    status: result.success ? "Sent" : "Failed",
                    error: result.error || null,
                    providerMessageId: result.messageSid,
                    sentAt: result.success ? new Date().toISOString() : null,
                };
            }

            // Unknown channel
            return {
                channel,
                status: "Skipped",
                error: `Unknown channel: ${channel}`,
                providerMessageId: undefined,
                sentAt: null,
            };
        } catch (err: any) {
            return {
                channel,
                status: "Failed",
                error: err?.message || "Send failed",
                providerMessageId: undefined,
                sentAt: null,
            };
        }
    }

    // =====================================================
    // LIST BROADCASTS
    // GET /api/v1/broadcasts
    // =====================================================
    static async listBroadcasts(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const companyId = req.user?.company_id;

            if (!companyId) {
                return res.status(401).json({
                    success: false,
                    message: "Company authentication missing",
                });
            }

            const { data, error } = await supabase
                .from("broadcasts")
                .select("*")
                .eq("company_id", companyId)
                .order("created_at", { ascending: false });

            if (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }

            return res.json({
                success: true,
                count: data?.length || 0,
                data: data || [],
            });
        } catch (error) {
            next(error);
        }
    }

    // =====================================================
    // GET BROADCAST BY ID
    // GET /api/v1/broadcasts/:id
    // =====================================================
    static async getBroadcastById(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const companyId = req.user?.company_id;
            const broadcastId = req.params.id;

            if (!companyId) {
                return res.status(401).json({
                    success: false,
                    message: "Company authentication missing",
                });
            }

            const { data: broadcast, error } = await supabase
                .from("broadcasts")
                .select("*")
                .eq("company_id", companyId)
                .eq("id", broadcastId)
                .single();

            if (error || !broadcast) {
                return res.status(404).json({
                    success: false,
                    message: "Broadcast not found",
                });
            }

            const { data: recipients } = await supabase
                .from("broadcast_recipients")
                .select("*")
                .eq("broadcast_id", broadcastId)
                .order("created_at", { ascending: true });

            const recipientStats: Record<string, { sent: number; failed: number; skipped: number; total: number }> = {};
            for (const ch of broadcast.channel?.split(",") || []) {
                const c = ch.trim();
                recipientStats[c] = { sent: 0, failed: 0, skipped: 0, total: 0 };
            }

            for (const r of recipients || []) {
                const ch = r.channel || "whatsapp";
                if (!recipientStats[ch]) {
                    recipientStats[ch] = { sent: 0, failed: 0, skipped: 0, total: 0 };
                }
                recipientStats[ch].total++;
                if (r.status === "Sent") recipientStats[ch].sent++;
                else if (r.status === "Skipped") recipientStats[ch].skipped++;
                else recipientStats[ch].failed++;
            }

            return res.json({
                success: true,
                data: {
                    ...broadcast,
                    recipients: recipients || [],
                    recipient_stats_by_channel: recipientStats,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    // =====================================================
    // GET BROADCAST STATISTICS
    // GET /api/v1/broadcasts/stats
    // =====================================================
    static async getBroadcastStats(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) {
        try {
            const companyId = req.user?.company_id;

            if (!companyId) {
                return res.status(401).json({
                    success: false,
                    message: "Company authentication missing",
                });
            }

            const { data, error } = await supabase
                .from("broadcasts")
                .select("status, recipient_count, success_count, failure_count")
                .eq("company_id", companyId);

            if (error) {
                return res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }

            const stats = {
                total_broadcasts: data?.length || 0,
                total_recipients: 0,
                total_sent: 0,
                total_failed: 0,
                by_status: {
                    Pending: 0,
                    Sent: 0,
                    Partial: 0,
                    Failed: 0,
                },
            };

            for (const row of data || []) {
                stats.total_recipients += row.recipient_count || 0;
                stats.total_sent += row.success_count || 0;
                stats.total_failed += row.failure_count || 0;
                if (row.status in stats.by_status) {
                    stats.by_status[row.status as keyof typeof stats.by_status]++;
                }
            }

            return res.json({
                success: true,
                data: stats,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default BroadcastController;
