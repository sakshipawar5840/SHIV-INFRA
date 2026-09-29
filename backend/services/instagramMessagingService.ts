// =====================================================
// SHIVINFRA INSTAGRAM MESSENGER SERVICE
//
// Real Meta Graph API integration for Instagram messaging.
//
// Instagram messaging via the Graph API is only available for
// Instagram Business or Creator accounts that are connected to
// a Facebook Page and have the `instagram_basic` and
// `pages_manage_engagement` / `instagram_manage_messages`
// permissions granted.
//
// Endpoint (text message):
//   POST https://graph.facebook.com/v{version}/{ig-user-id}/messages
//   Body: { recipient: { id: "<IG recipient ID>" }, message: { text: "Hi" } }
//
// OR (if a conversation exists):
//   POST .../{ig-user-id}/messages
//   with message payload for the conversation thread.
//
// IMPORTANT: Instagram DM APIs do NOT allow sending to an arbitrary
// @username. The recipient must be an Instagram user ID (IGSID / 
// thread participant) obtained via the Instagram Graph API
// /{ig-user-id}/messages or /tags endpoints. If no valid recipient
// identifier is supplied, the message is SKIPPED, never sent/faked.
//
// Requires:
//   - META_IG_ACCOUNT_ID       (Instagram Business Account ID)
//   - META_IG_ACCESS_TOKEN     (Page Access Token with IG messaging scopes)
//
// =====================================================

import dotenv from "dotenv";

dotenv.config();

const IG_ACCESS_TOKEN = process.env.META_IG_ACCESS_TOKEN;
const IG_ACCOUNT_ID = process.env.META_IG_ACCOUNT_ID;
const IG_API_VERSION = process.env.META_API_VERSION || process.env.META_IG_API_VERSION || "v18.0";

interface IgConfig {
    accountId?: string;
    accessToken?: string;
    apiVersion: string;
}

interface IgSendResult {
    success: boolean;
    configured: boolean;
    recipientId?: string;
    messageId?: string;
    error?: string;
    rawResponse?: any;
}

class InstagramMessagingService {
    private cfg: IgConfig;

    constructor(cfg?: Partial<IgConfig>) {
        this.cfg = {
            accountId: cfg?.accountId ?? IG_ACCOUNT_ID,
            accessToken: cfg?.accessToken ?? IG_ACCESS_TOKEN,
            apiVersion: cfg?.apiVersion ?? IG_API_VERSION,
        };
    }

    /**
     * Check if Instagram messaging is fully configured.
     */
    isConfigured(): boolean {
        return !!(
            this.cfg.accountId &&
            this.cfg.accessToken &&
            this.cfg.accessToken.length > 10 &&
            this.cfg.accessToken !== "EAAG..."
        );
    }

    /**
     * Validate that the recipient identifier is a numeric Instagram user ID.
     * Instagram DM API requires an IG recipient user ID — NOT a @handle.
     */
    validateRecipient(recipientId: string): boolean {
        return /^\d+$/.test(String(recipientId).trim());
    }

    /**
     * Send a text message on Instagram.
     *
     * Endpoint:
     *   POST https://graph.facebook.com/v{version}/{ig-user-id}/messages
     *   Query: access_token={page_access_token}
     */
    async sendTextMessage(
        recipientId: string,
        text: string
    ): Promise<IgSendResult> {
        if (!this.isConfigured()) {
            return {
                success: false,
                configured: false,
                error: "Instagram messaging is not configured. Supply META_IG_ACCOUNT_ID and META_IG_ACCESS_TOKEN.",
            };
        }

        if (!this.validateRecipient(recipientId)) {
            return {
                success: false,
                configured: true,
                error: `Invalid Instagram recipient ID: ${recipientId}. A numeric Instagram User ID is required, not a username.`,
            };
        }

        const url = `https://graph.facebook.com/${this.cfg.apiVersion}/${this.cfg.accountId}/messages?access_token=${this.cfg.accessToken}`;
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

            const mid = result?.message_id || result?.messageId;

            return {
                success: !!mid,
                configured: true,
                recipientId: recipientId,
                messageId: mid,
                error: mid ? undefined : "Unexpected Meta response – message may not have been sent.",
                rawResponse: result,
            };
        } catch (err: any) {
            return {
                success: false,
                configured: true,
                error: err?.message || "Instagram API call failed.",
            };
        }
    }

    /**
     * Fetch basic Instagram account info to verify the access token.
     */
    async verifyConfig(): Promise<{ valid: boolean; igName?: string; error?: string }> {
        if (!this.isConfigured()) {
            return { valid: false, error: "Instagram messaging credentials not configured." };
        }
        const url = `https://graph.facebook.com/${this.cfg.apiVersion}/${this.cfg.accountId}?access_token=${this.cfg.accessToken}&fields=id,username`;

        try {
            const response = await fetch(url, { method: "GET" });
            const result = await response.json();
            if (!response.ok) {
                return { valid: false, error: result?.error?.message || "Token validation failed." };
            }
            return { valid: true, igName: result.username };
        } catch (err: any) {
            return { valid: false, error: err?.message || "Connection failed." };
        }
    }
}

const instagramMessagingService = new InstagramMessagingService();

export { InstagramMessagingService, instagramMessagingService };
export type { IgSendResult, IgConfig };
export default instagramMessagingService;
