// =====================================================
// SHIVINFRA FACEBOOK MESSENGER SERVICE
//
// Real Meta Graph API integration for Facebook Page messaging.
// Uses the official Facebook Graph API endpoint:
//   POST https://graph.facebook.com/v{version}/me/messages
//
// Requires:
//   - META_FB_PAGE_ID          (Facebook Page ID of the business page)
//   - META_FB_PAGE_ACCESS_TOKEN (Page Access Token with pages_manage_messages, pages_send_messages)
//
// This service NEVER fakes delivery. It calls the real Meta Graph API
// and returns the actual response. If credentials are missing, it
// returns a configuration error and does NOT send.
//
// =====================================================

import dotenv from "dotenv";

dotenv.config();

const FB_ACCESS_TOKEN = process.env.META_FB_PAGE_ACCESS_TOKEN;
const FB_PAGE_ID = process.env.META_FB_PAGE_ID;
const FB_API_VERSION = process.env.META_API_VERSION || process.env.META_FB_API_VERSION || "v18.0";

interface FbConfig {
    pageId?: string;
    accessToken?: string;
    apiVersion: string;
}

interface FbSendResult {
    success: boolean;
    configured: boolean;
    recipientId?: string;
    messageId?: string;
    error?: string;
    rawResponse?: any;
}

class FacebookMessagingService {
    private cfg: FbConfig;

    constructor(cfg?: Partial<FbConfig>) {
        this.cfg = {
            pageId: cfg?.pageId ?? FB_PAGE_ID,
            accessToken: cfg?.accessToken ?? FB_ACCESS_TOKEN,
            apiVersion: cfg?.apiVersion ?? FB_API_VERSION,
        };
    }

    /**
     * Check if the service is fully configured with valid credentials.
     */
    isConfigured(): boolean {
        return !!(
            this.cfg.pageId &&
            this.cfg.accessToken &&
            this.cfg.accessToken.length > 10 &&
            this.cfg.accessToken !== "EAAG..."
        );
    }

    /**
     * Validate a recipient ID. Facebook Messenger requires a numeric recipient ID
     * (the PSID - Page Scoped ID) of the conversation participant.
     */
    validateRecipient(recipientId: string): boolean {
        return /^\d+$/.test(String(recipientId).trim());
    }

    /**
     * Send a text message to a Facebook Messenger recipient.
     *
     * Per Meta docs, the endpoint is:
     *   POST https://graph.facebook.com/v{version}/me/messages?access_token={page_token}
     *
     * Body:
     *   {
     *     recipient: { id: "<PSID>" },
     *     message:  { text: "Hello" }
     *   }
     */
    async sendTextMessage(
        recipientId: string,
        text: string
    ): Promise<FbSendResult> {
        if (!this.isConfigured()) {
            return {
                success: false,
                configured: false,
                error: "Facebook Messenger is not configured. Supply META_FB_PAGE_ID and META_FB_PAGE_ACCESS_TOKEN.",
            };
        }

        if (!this.validateRecipient(recipientId)) {
            return {
                success: false,
                configured: true,
                error: `Invalid Facebook recipient ID: ${recipientId}. A numeric Page-Scoped ID (PSID) is required.`,
            };
        }

        const url = `https://graph.facebook.com/${this.cfg.apiVersion}/me/messages?access_token=${this.cfg.accessToken}`;
        const body = {
            recipient: { id: recipientId },
            message: { text: String(text) },
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    configured: true,
                    error: result?.error?.message || `Meta API error ${response.status}`,
                    rawResponse: result,
                };
            }

            // success when Meta returns recipient_id and message_id
            const rid = result?.recipient_id || result?.recipientId;
            const mid = result?.message_id || result?.messageId;

            return {
                success: !!(rid && mid),
                configured: true,
                recipientId: rid,
                messageId: mid,
                error: !!(rid && mid) ? undefined : "Unexpected Meta response – message may not have been sent.",
                rawResponse: result,
            };
        } catch (err: any) {
            return {
                success: false,
                configured: true,
                error: err?.message || "Facebook Messenger API call failed.",
            };
        }
    }

    /**
     * Fetch basic Page info to verify the access token is valid.
     * GET https://graph.facebook.com/v{version}/me?access_token={token}&fields=id,name
     */
    async verifyConfig(): Promise<{ valid: boolean; pageName?: string; error?: string }> {
        if (!this.isConfigured()) {
            return { valid: false, error: "Facebook Messenger credentials not configured." };
        }
        const url = `https://graph.facebook.com/${this.cfg.apiVersion}/me?access_token=${this.cfg.accessToken}&fields=id,name`;

        try {
            const response = await fetch(url, { method: "GET" });
            const result = await response.json();
            if (!response.ok) {
                return { valid: false, error: result?.error?.message || "Token validation failed." };
            }
            return { valid: true, pageName: result.name };
        } catch (err: any) {
            return { valid: false, error: err?.message || "Connection failed." };
        }
    }
}

const facebookMessagingService = new FacebookMessagingService();

export { FacebookMessagingService, facebookMessagingService };
export type { FbSendResult, FbConfig };
export default facebookMessagingService;
