// =====================================================
// SHIVINFRA SMS / TEXT MESSAGING SERVICE
//
// Real SMS integration via Twilio (primary) or a generic
// HTTP-based SMS gateway fallback. This service NEVER fakes
// delivery. It calls the real provider API and returns the
// actual result.
//
// Requires at minimum:
//   - SMS_ENABLED          (set to "true" to activate)
//   - SMS_PROVIDER         ("twilio" or "generic")
//   - SMS_FROM             (sender phone number / alphanumeric sender ID)
//   - SMS_API_KEY          (Twilio Auth Token or generic gateway API key)
//   - SMS_API_SECRET       (Twilio Auth Token — kept separate if preferred)
//   - SMS_ACCOUNT_SID      (Twilio Account SID, if using Twilio)
//   - SMS_ENDPOINT         (generic gateway base URL, if using generic)
//
// =====================================================

import dotenv from "dotenv";

dotenv.config();

interface SmsConfig {
    enabled: boolean;
    provider: string;
    from: string;
    accountSid?: string;
    apiKey?: string;
    apiSecret?: string;
    endpoint?: string;
}

interface SmsSendResult {
    success: boolean;
    configured: boolean;
    messageSid?: string;
    error?: string;
    rawResponse?: any;
}

class SmsService {
    private cfg: SmsConfig;

    constructor(cfg?: Partial<SmsConfig>) {
        this.cfg = {
            enabled: process.env.SMS_ENABLED === "true",
            provider: process.env.SMS_PROVIDER || "twilio",
            from: process.env.SMS_FROM || "",
            accountSid: process.env.SMS_ACCOUNT_SID,
            apiKey: process.env.SMS_API_KEY,
            apiSecret: process.env.SMS_API_SECRET,
            endpoint: process.env.SMS_ENDPOINT,
        };
        if (cfg) {
            Object.assign(this.cfg, cfg);
        }
    }

    isConfigured(): boolean {
        if (!this.cfg.enabled) return false;
        if (!this.cfg.from) return false;
        if (this.cfg.provider === "twilio") {
            return !!(this.cfg.accountSid && (this.cfg.apiKey || this.cfg.apiSecret));
        }
        return !!(this.cfg.endpoint && this.cfg.apiKey);
    }

    /**
     * Validate a phone number — must be E.164 format: +<country><number>.
     */
    validateRecipient(phone: string): boolean {
        const cleaned = String(phone).trim();
        return /^\+[1-9]\d{6,14}$/.test(cleaned);
    }

    /**
     * Send an SMS via Twilio REST API.
     * POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
     */
    private async sendViaTwilio(to: string, body: string): Promise<SmsSendResult> {
        if (!this.cfg.accountSid || !(this.cfg.apiKey || this.cfg.apiSecret)) {
            return { success: false, configured: false, error: "Twilio credentials incomplete." };
        }
        const url = `https://api.twilio.com/2010-04-01/Accounts/${this.cfg.accountSid}/Messages.json`;
        const authToken = this.cfg.apiKey || this.cfg.apiSecret || "";
        const auth = Buffer.from(`${this.cfg.accountSid}:${authToken}`).toString("base64");
        const params = new URLSearchParams();
        params.append("From", this.cfg.from);
        params.append("To", to);
        params.append("Body", body);

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params,
            });

            const result = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    configured: true,
                    error: result?.message || `Twilio API error ${response.status}`,
                    rawResponse: result,
                };
            }
            return {
                success: true,
                configured: true,
                messageSid: result.sid,
                rawResponse: result,
            };
        } catch (err: any) {
            return {
                success: false,
                configured: true,
                error: err?.message || "Twilio API call failed.",
            };
        }
    }

    /**
     * Send an SMS via a generic HTTP gateway.
     * POST {endpoint} with JSON body containing to, from, body, api_key.
     */
    private async sendViaGeneric(to: string, bodyText: string): Promise<SmsSendResult> {
        if (!this.cfg.endpoint || !this.cfg.apiKey) {
            return { success: false, configured: false, error: "Generic SMS gateway not configured (SMS_ENDPOINT + SMS_API_KEY)." };
        }
        try {
            const response = await fetch(this.cfg.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to,
                    from: this.cfg.from,
                    body: bodyText,
                    api_key: this.cfg.apiKey,
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    configured: true,
                    error: result?.error || result?.message || `Gateway error ${response.status}`,
                    rawResponse: result,
                };
            }
            return {
                success: result.sent === true || result.success === true,
                configured: true,
                messageSid: result.message_id || result.sid,
                rawResponse: result,
            };
        } catch (err: any) {
            return {
                success: false,
                configured: true,
                error: err?.message || "SMS gateway API call failed.",
            };
        }
    }

    /**
     * Send an SMS text message to a validated phone number.
     */
    async sendTextMessage(to: string, text: string): Promise<SmsSendResult> {
        if (!this.cfg.enabled) {
            return {
                success: false,
                configured: false,
                error: "SMS messaging is not enabled. Set SMS_ENABLED=true and configure provider credentials.",
            };
        }

        if (!this.validateRecipient(to)) {
            return {
                success: false,
                configured: this.isConfigured(),
                error: `Invalid phone number format: ${to}. E.164 format required (e.g. +14155550123).`,
            };
        }

        if (this.cfg.provider === "twilio") {
            return this.sendViaTwilio(to, text);
        }
        return this.sendViaGeneric(to, text);
    }

    /**
     * Verify SMS configuration by sending a test message.
     */
    async testConfig(to: string): Promise<SmsSendResult> {
        return this.sendTextMessage(to, "SHIV INFRA ERP SMS integration test message.");
    }
}

const smsService = new SmsService();

export { SmsService, smsService };
export type { SmsSendResult, SmsConfig };
export default smsService;
