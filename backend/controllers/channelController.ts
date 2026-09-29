// =====================================================
// SHIVINFRA MESSAGING CHANNEL CONTROLLER
//
// Provides real-time configuration status and test
// endpoints for all messaging channels:
//   - WhatsApp (Meta)
//   - Facebook Messenger (Meta)
//   - Instagram DM (Meta)
//   - SMS / Text (Twilio or generic gateway)
//
// All secrets are validated server-side only. No access
// tokens are ever returned to the frontend.
// =====================================================

import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.ts";
import { WhatsAppService } from "../services/whatsappService.ts";
import { FacebookMessagingService } from "../services/facebookMessagingService.ts";
import { InstagramMessagingService } from "../services/instagramMessagingService.ts";
import { SmsService } from "../services/smsService.ts";
import { settingService } from "../services/settingService.ts";

export class ChannelController {
    // =================================================
    // GET /api/v1/channels/status
    // Returns the configuration status for each channel.
    // No secrets are returned — only boolean status + labels.
    // =================================================
    static async getChannelStatus(req: AuthenticatedRequest, res: Response) {
        try {
            const companyId = req.user?.company_id;
            if (!companyId) {
                return res.status(401).json({ success: false, error: "Unauthorized" });
            }

            // Load company-specific settings from DB
            let dbSettings: Record<string, any> = {};
            try {
                const settingsResult = await settingService.getByCompany(companyId);
                if (settingsResult.success && settingsResult.data) {
                    dbSettings = settingsResult.data;
                }
            } catch {
                dbSettings = {};
            }

            // Environment-level fallbacks
            const envFbPageId = process.env.META_FB_PAGE_ID;
            const envFbToken = process.env.META_FB_PAGE_ACCESS_TOKEN;
            const envIgAccountId = process.env.META_IG_ACCOUNT_ID;
            const envIgToken = process.env.META_IG_ACCESS_TOKEN;

            const fbService = new FacebookMessagingService({
                pageId: dbSettings.meta_fb_page_id || envFbPageId,
                accessToken: dbSettings.meta_fb_page_access_token || envFbToken,
                apiVersion: process.env.META_API_VERSION || "v18.0",
            });
            const igService = new InstagramMessagingService({
                accountId: dbSettings.meta_ig_account_id || envIgAccountId,
                accessToken: dbSettings.meta_ig_access_token || envIgToken,
                apiVersion: process.env.META_API_VERSION || "v18.0",
            });
            const smsService = new SmsService({
                enabled: process.env.SMS_ENABLED === "true",
                provider: dbSettings.smsProvider || process.env.SMS_PROVIDER || "twilio",
                from: dbSettings.smsFrom || process.env.SMS_FROM || "",
                accountSid: dbSettings.smsAccountSid || process.env.SMS_ACCOUNT_SID,
                apiKey: dbSettings.smsApiKey || process.env.SMS_API_KEY,
                apiSecret: dbSettings.smsApiKey || process.env.SMS_API_SECRET,
                endpoint: dbSettings.smsEndpoint || process.env.SMS_ENDPOINT,
            });

            // WhatsApp configured?
            const waConfigured = !!(
                process.env.META_WHATSAPP_TOKEN &&
                process.env.META_WHATSAPP_PHONE_NUMBER_ID &&
                process.env.META_WHATSAPP_TOKEN !== "EAAG..."
            );

            return res.status(200).json({
                success: true,
                data: {
                    whatsapp: {
                        configured: waConfigured,
                        status: waConfigured ? "Ready" : "NOT CONFIGURED",
                        label: waConfigured ? "Connected" : "Not Configured",
                    },
                    facebook: {
                        configured: fbService.isConfigured(),
                        status: fbService.isConfigured() ? "Ready" : "NOT CONFIGURED",
                        label: fbService.isConfigured() ? "Configured" : "Not Configured",
                    },
                    instagram: {
                        configured: igService.isConfigured(),
                        status: igService.isConfigured() ? "Ready" : "NOT CONFIGURED",
                        label: igService.isConfigured() ? "Configured" : "Not Configured",
                    },
                    sms: {
                        configured: smsService.isConfigured(),
                        status: smsService.isConfigured() ? "Ready" : "NOT CONFIGURED",
                        label: smsService.isConfigured() ? "Configured" : "Not Configured",
                    },
                },
            });
        } catch (err: any) {
            console.error("[CHANNEL STATUS] Error:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    // =================================================
    // POST /api/v1/channels/whatsapp/test
    // Test WhatsApp integration by sending a real message.
    // =================================================
    static async testWhatsApp(req: AuthenticatedRequest, res: Response) {
        try {
            const companyId = req.user?.company_id;
            if (!companyId) {
                return res.status(401).json({ success: false, error: "Unauthorized" });
            }
            const { phone } = req.body;
            if (!phone) {
                return res.status(400).json({ success: false, error: "Phone number is required" });
            }

            const isConfigured = !!(
                process.env.META_WHATSAPP_TOKEN &&
                process.env.META_WHATSAPP_PHONE_NUMBER_ID &&
                process.env.META_WHATSAPP_TOKEN !== "EAAG..."
            );

            if (!isConfigured) {
                return res.status(200).json({
                    success: true,
                    configured: false,
                    message: "WhatsApp Cloud API is not configured. Add META_WHATSAPP_TOKEN and META_WHATSAPP_PHONE_NUMBER_ID in Settings.",
                });
            }

            const sent = await WhatsAppService.sendTextMessage(
                phone,
                "Your WhatsApp integration is working. Test message from SHIV INFRA ERP."
            );

            return res.status(200).json({
                success: sent,
                configured: true,
                message: sent
                    ? `Test message sent to ${phone}`
                    : `Test message failed for ${phone}`,
            });
        } catch (err: any) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    // =================================================
    // POST /api/v1/channels/facebook/test
    // Test Facebook Messenger integration.
    // =================================================
    static async testFacebook(req: AuthenticatedRequest, res: Response) {
        try {
            const companyId = req.user?.company_id;
            if (!companyId) {
                return res.status(401).json({ success: false, error: "Unauthorized" });
            }
            const { recipient_id } = req.body;

            let dbSettings: Record<string, any> = {};
            try {
                const settingsResult = await settingService.getByCompany(companyId);
                if (settingsResult.success && settingsResult.data) {
                    dbSettings = settingsResult.data;
                }
            } catch {}

            const fbService = new FacebookMessagingService({
                pageId: dbSettings.meta_fb_page_id || process.env.META_FB_PAGE_ID,
                accessToken: dbSettings.meta_fb_page_access_token || process.env.META_FB_PAGE_ACCESS_TOKEN,
                apiVersion: process.env.META_API_VERSION || "v18.0",
            });

            if (!fbService.isConfigured()) {
                return res.status(200).json({
                    success: false,
                    configured: false,
                    message: "Facebook Messenger is not configured. Configure META_FB_PAGE_ID and META_FB_PAGE_ACCESS_TOKEN.",
                });
            }

            if (!recipient_id) {
                const verify = await fbService.verifyConfig();
                return res.status(200).json({
                    success: verify.valid,
                    configured: true,
                    message: verify.valid
                        ? `Facebook Page '${verify.pageName}' verified.`
                        : `Facebook token verification failed: ${verify.error}`,
                });
            }

            const result = await fbService.sendTextMessage(
                recipient_id,
                "Your Facebook Messenger integration is working. Test message from SHIV INFRA ERP."
            );

            return res.status(200).json({
                success: result.success,
                configured: true,
                message: result.success
                    ? `Test message sent to Facebook recipient ${recipient_id}`
                    : `Facebook send failed: ${result.error}`,
            });
        } catch (err: any) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    // =================================================
    // POST /api/v1/channels/instagram/test
    // Test Instagram messaging integration.
    // =================================================
    static async testInstagram(req: AuthenticatedRequest, res: Response) {
        try {
            const companyId = req.user?.company_id;
            if (!companyId) {
                return res.status(401).json({ success: false, error: "Unauthorized" });
            }
            const { recipient_id } = req.body;

            let dbSettings: Record<string, any> = {};
            try {
                const settingsResult = await settingService.getByCompany(companyId);
                if (settingsResult.success && settingsResult.data) {
                    dbSettings = settingsResult.data;
                }
            } catch {}

            const igService = new InstagramMessagingService({
                accountId: dbSettings.meta_ig_account_id || process.env.META_IG_ACCOUNT_ID,
                accessToken: dbSettings.meta_ig_access_token || process.env.META_IG_ACCESS_TOKEN,
                apiVersion: process.env.META_API_VERSION || "v18.0",
            });

            if (!igService.isConfigured()) {
                return res.status(200).json({
                    success: false,
                    configured: false,
                    message: "Instagram messaging is not configured. Configure META_IG_ACCOUNT_ID and META_IG_ACCESS_TOKEN.",
                });
            }

            if (!recipient_id) {
                const verify = await igService.verifyConfig();
                return res.status(200).json({
                    success: verify.valid,
                    configured: true,
                    message: verify.valid
                        ? `Instagram account '${verify.igName}' verified.`
                        : `Instagram token verification failed: ${verify.error}`,
                });
            }

            const result = await igService.sendTextMessage(
                recipient_id,
                "Your Instagram messaging integration is working. Test message from SHIV INFRA ERP."
            );

            return res.status(200).json({
                success: result.success,
                configured: true,
                message: result.success
                    ? `Test message sent to Instagram recipient ${recipient_id}`
                    : `Instagram send failed: ${result.error}`,
            });
        } catch (err: any) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    // =================================================
    // POST /api/v1/channels/sms/test
    // Test SMS integration.
    // =================================================
    static async testSms(req: AuthenticatedRequest, res: Response) {
        try {
            const companyId = req.user?.company_id;
            if (!companyId) {
                return res.status(401).json({ success: false, error: "Unauthorized" });
            }
            const { phone } = req.body;

            let dbSettings: Record<string, any> = {};
            try {
                const settingsResult = await settingService.getByCompany(companyId);
                if (settingsResult.success && settingsResult.data) {
                    dbSettings = settingsResult.data;
                }
            } catch {}

            const smsService = new SmsService({
                enabled: process.env.SMS_ENABLED === "true",
                provider: dbSettings.smsProvider || process.env.SMS_PROVIDER || "twilio",
                from: dbSettings.smsFrom || process.env.SMS_FROM || "",
                accountSid: dbSettings.smsAccountSid || process.env.SMS_ACCOUNT_SID,
                apiKey: dbSettings.smsApiKey || process.env.SMS_API_KEY,
                apiSecret: dbSettings.smsApiKey || process.env.SMS_API_SECRET,
                endpoint: dbSettings.smsEndpoint || process.env.SMS_ENDPOINT,
            });

            if (!smsService.isConfigured()) {
                return res.status(200).json({
                    success: false,
                    configured: false,
                    message: "SMS messaging is not configured. Set SMS_ENABLED=true and configure provider credentials.",
                });
            }

            if (!phone) {
                return res.status(400).json({
                    success: false,
                    configured: true,
                    message: "Phone number is required for SMS test.",
                });
            }

            const result = await smsService.testConfig(phone);
            return res.status(200).json({
                success: result.success,
                configured: true,
                message: result.success
                    ? `Test SMS sent to ${phone}`
                    : `SMS send failed: ${result.error}`,
            });
        } catch (err: any) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
}

export default ChannelController;
