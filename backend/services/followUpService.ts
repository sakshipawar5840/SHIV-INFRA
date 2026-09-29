// =====================================================
// SHIVINFRA FOLLOW-UP SERVICE
// Production follow-up scheduling and dispatch
// =====================================================

import { supabaseAdmin as supabase } from "../config/supabase.ts";
import WhatsAppService from "./whatsappService.ts";
import { FacebookMessagingService } from "./facebookMessagingService.ts";
import { InstagramMessagingService } from "./instagramMessagingService.ts";
import { SmsService } from "./smsService.ts";
import { settingService } from "./settingService.ts";
import customerService from "./customerService.ts";
import leadService from "./leadService.ts";
import { BroadcastController } from "../controllers/broadcastController.ts";


const FOLLOWUP_DEFAULT_DELAY_MINUTES = parseInt(
    process.env.FOLLOWUP_DEFAULT_DELAY_MINUTES ||
        "1440",
    10
);


export interface FollowUpRecord {
    id: string;
    company_id: string;
    lead_id?: string | null;
    phone: string;
    message: string;
    scheduled_at: string;
    sent: boolean;
    sent_at?: string | null;
    error?: string | null;
    reference_id?: string | null;
    reference_type?: string | null;
    created_at: string;
}

interface FollowUpCreateInput {
    company_id: string;
    lead_id?: string | null;
    phone: string;
    message: string;
    scheduled_at?: string | null;
    reference_id?: string | null;
    reference_type?: string | null;
}

export async function createFollowUp(
    payload: FollowUpCreateInput
): Promise<FollowUpRecord | null> {
    try {
        const { data, error } =
            await supabase
                .from("followups")
                .insert({
                    company_id: payload.company_id,
                    lead_id: payload.lead_id || null,
                    phone: String(payload.phone || "").trim(),
                    message: String(payload.message || "").trim(),
                    scheduled_at:
                        payload.scheduled_at ||
                        new Date(
                            Date.now() +
                            FOLLOWUP_DEFAULT_DELAY_MINUTES *
                            60 *
                            1000
                        ).toISOString(),
                    sent: false,
                    reference_id: payload.reference_id || null,
                    reference_type: payload.reference_type || null,
                })
                .select()
                .single();

        if (error) {

            console.error(
                "[SHIVINFRA FOLLOWUP] Create failed:",
                error
            );

            return null;

        }


        return data as FollowUpRecord;

    }
    catch (error) {

        console.error(
            "[SHIVINFRA FOLLOWUP] Unexpected create error:",
            error
        );

        return null;

    }

}


export async function getPendingFollowUps(
    limit: number = 50,
    companyId?: string
): Promise<FollowUpRecord[]> {

    try {

        let query = supabase
            .from("followups")
            .select("*")
            .eq(
                "sent",
                false
            )
            .lte(
                "scheduled_at",
                new Date().toISOString()
            )
            .order(
                "scheduled_at",
                { ascending: true }
            )
            .limit(limit);


        if (companyId) {

            query = query.eq(
                "company_id",
                companyId
            );

        }


        const { data, error } =
            await query;


        if (error) {

            console.error(
                "[SHIVINFRA FOLLOWUP] Fetch pending failed:",
                error
            );

            return [];

        }


        return (
            Array.isArray(data)
                ? data
                : []
        ) as FollowUpRecord[];

    }
    catch (error) {

        console.error(
            "[SHIVINFRA FOLLOWUP] Unexpected fetch error:",
            error
        );

        return [];

    }

}


export async function getPendingFollowUpForLead(
    leadId: string,
    companyId: string
): Promise<FollowUpRecord | null> {

    try {

        const { data, error } =
            await supabase
                .from("followups")
                .select("*")
                .eq(
                    "lead_id",
                    leadId
                )
                .eq(
                    "company_id",
                    companyId
                )
                .eq(
                    "sent",
                    false
                )
                .order(
                    "created_at",
                    { ascending: false }
                )
                .limit(1);


        if (error) {

            console.error(
                "[SHIVINFRA FOLLOWUP] Fetch pending for lead failed:",
                error
            );

            return null;

        }


        return (
            Array.isArray(data) && data.length > 0
                ? data[0]
                : null
        ) as FollowUpRecord | null;

    }
    catch (error) {

        console.error(
            "[SHIVINFRA FOLLOWUP] Unexpected fetch pending for lead error:",
            error
        );

        return null;

    }

}


export async function getPendingFollowUpByRef(
    companyId: string,
    referenceType: string,
    referenceId: string
): Promise<FollowUpRecord | null> {
    try {
        const { data, error } =
            await supabase
                .from("followups")
                .select("*")
                .eq("company_id", companyId)
                .eq("reference_type", referenceType)
                .eq("reference_id", referenceId)
                .eq("sent", false)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

        if (error && error.code !== "PGRST116") {
            console.error(
                "[SHIVINFRA FOLLOWUP] Fetch pending by ref failed:",
                error
            );
            return null;
        }

        return (data || null) as FollowUpRecord | null;
    } catch (error) {
        console.error(
            "[SHIVINFRA FOLLOWUP] Unexpected fetch pending by ref error:",
            error
        );
        return null;
    }
}


export async function markFollowUpSent(
    id: string,
    error?: string | null
): Promise<void> {

    try {

        await supabase
            .from("followups")
            .update({

                sent:
                    true,

                sent_at:
                    new Date().toISOString(),

                error:
                    error ||
                    null

            })
            .eq(
                "id",
                id
            );

    }
    catch (err) {

        console.error(
            "[SHIVINFRA FOLLOWUP] Mark sent failed:",
            err
        );

    }

}


export async function dispatchFollowUp(
    record: FollowUpRecord
): Promise<boolean> {

    try {

        const sent =
            await WhatsAppService.sendTextMessage(
                record.phone,
                record.message
            );


        await markFollowUpSent(
            record.id,
            sent
                ? null
                : "WhatsApp dispatch returned false"
        );


        return sent;

    }
    catch (error) {

        console.error(
            "[SHIVINFRA FOLLOWUP] Dispatch error:",
            error
        );

        await markFollowUpSent(
            record.id,
            error instanceof Error
                ? error.message
                : String(error)
        );

        return false;

    }

}


// =====================================================
// SCHEDULED BROADCAST PROCESSING
// =====================================================

async function processScheduledBroadcasts(): Promise<void> {
    try {
        // Recover broadcasts stuck in Dispatching due to a prior crash.
        // These cannot be safely retried (partial sends may have occurred),
        // so we mark them Failed with a timeout error for visibility.
        const STUCK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
        const stuckThreshold = new Date(Date.now() - STUCK_TIMEOUT_MS).toISOString();
        const { data: stuckBroadcasts, error: stuckError } = await supabase
            .from("broadcasts")
            .select("id")
            .eq("status", "Dispatching")
            .lt("updated_at", stuckThreshold)
            .limit(10);

        if (!stuckError && stuckBroadcasts && stuckBroadcasts.length > 0) {
            for (const stuck of stuckBroadcasts) {
                await supabase
                    .from("broadcasts")
                    .update({
                        status: "Failed",
                        error: "Dispatching timeout: server crashed or hung during dispatch. Partial sends may have occurred.",
                        completed_at: new Date().toISOString(),
                    })
                    .eq("id", stuck.id);
                console.log(`[SHIVINFRA BROADCAST] Recovered stuck Dispatching broadcast ${stuck.id} -> Failed`);
            }
        }

        const now = new Date().toISOString();
        const { data: dueBroadcasts, error: fetchError } = await supabase
            .from("broadcasts")
            .select("id, company_id, message_text, channel, audience_params, scheduled_at")
            .eq("status", "Scheduled")
            .lte("scheduled_at", now)
            .order("scheduled_at", { ascending: true })
            .limit(10);

        if (fetchError) {
            console.error("[SHIVINFRA BROADCAST] Failed to fetch due broadcasts:", fetchError);
            return;
        }

        if (!dueBroadcasts || dueBroadcasts.length === 0) {
            return;
        }

        console.log(`[SHIVINFRA BROADCAST] Found ${dueBroadcasts.length} due scheduled broadcast(s)`);

        for (const broadcast of dueBroadcasts) {
            // Atomically claim: Scheduled -> Dispatching
            const { data: claimed, error: claimError } = await supabase
                .from("broadcasts")
                .update({ status: "Dispatching" })
                .eq("id", broadcast.id)
                .eq("status", "Scheduled")
                .select()
                .single();

            if (claimError || !claimed) {
                console.log(`[SHIVINFRA BROADCAST] Broadcast ${broadcast.id} already claimed or status changed, skipping`);
                continue;
            }

            console.log(`[SHIVINFRA BROADCAST] Dispatching scheduled broadcast ${broadcast.id}`);

            try {
                const audienceParams = broadcast.audience_params || {};
                const audienceUpper = String(audienceParams.audience || "CUSTOMERS").toUpperCase();
                const city = audienceParams.city || null;
                const leadStatus = audienceParams.lead_status || null;
                const selectedChannels = broadcast.channel?.split(",").map((c: string) => c.trim()) || ["whatsapp"];

                let recipients: Array<{ phone: string; type: "customer" | "lead"; id: string }> = [];

                if (audienceUpper === "CUSTOMERS") {
                    const { data: customers } = await customerService.filterCustomers(broadcast.company_id, { city, status: leadStatus });
                    if (customers) {
                        recipients.push(
                            ...customers
                                .filter((c: any) => c.phone && String(c.phone).trim() !== "")
                                .map((c: any) => ({
                                    phone: String(c.phone).trim(),
                                    type: "customer" as const,
                                    id: c.id,
                                }))
                        );
                    }
                } else if (audienceUpper === "LEADS") {
                    const { data: leads } = await leadService.filterLeads(broadcast.company_id, { status: leadStatus, preferred_location: city });
                    if (leads) {
                        recipients.push(
                            ...leads
                                .filter((l: any) => l.customers?.phone && String(l.customers.phone).trim() !== "")
                                .map((l: any) => ({
                                    phone: String(l.customers.phone).trim(),
                                    type: "lead" as const,
                                    id: l.id,
                                }))
                        );
                    }
                }

                const seenPhones = new Set<string>();
                const uniqueRecipients = recipients.filter((r) => {
                    const normalized = String(r.phone).replace(/\D/g, "").slice(-10);
                    if (seenPhones.has(normalized)) return false;
                    seenPhones.add(normalized);
                    return true;
                });

                if (uniqueRecipients.length === 0) {
                    await supabase
                        .from("broadcasts")
                        .update({
                            status: "Failed",
                            success_count: 0,
                            failure_count: 0,
                            completed_at: new Date().toISOString(),
                            error: "No valid recipients found for the specified audience filters",
                        })
                        .eq("id", broadcast.id);
                    console.log(`[SHIVINFRA BROADCAST] Broadcast ${broadcast.id} - no valid recipients`);
                    continue;
                }

                let companySettings: Record<string, any> = {};
                try {
                    const settingsResult = await settingService.getByCompany(broadcast.company_id);
                    if (settingsResult.success && settingsResult.data) {
                        companySettings = settingsResult.data;
                    }
                } catch {
                    companySettings = {};
                }

                const envFbPageId = process.env.META_FB_PAGE_ID;
                const envFbToken = process.env.META_FB_PAGE_ACCESS_TOKEN;
                const envIgAccountId = process.env.META_IG_ACCOUNT_ID;
                const envIgToken = process.env.META_IG_ACCESS_TOKEN;

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

                const channelConfigured: Record<string, boolean> = {};
                const channelErrors: Record<string, string> = {};

                for (const ch of selectedChannels) {
                    if (ch === "whatsapp") {
                        channelConfigured[ch] = true;
                    } else if (ch === "facebook") {
                        channelConfigured[ch] = fbService.isConfigured();
                        if (!channelConfigured[ch]) channelErrors[ch] = "Facebook Messenger not configured";
                    } else if (ch === "instagram") {
                        channelConfigured[ch] = igService.isConfigured();
                        if (!channelConfigured[ch]) channelErrors[ch] = "Instagram messaging not configured";
                    } else if (ch === "sms") {
                        channelConfigured[ch] = smsServiceInst.isConfigured();
                        if (!channelConfigured[ch]) channelErrors[ch] = "SMS messaging not configured";
                    } else {
                        channelConfigured[ch] = false;
                        channelErrors[ch] = `Unknown channel: ${ch}`;
                    }
                }

                const result = await BroadcastController.dispatchBroadcast(broadcast.id, {
                    companyId: broadcast.company_id,
                    messageText: broadcast.message_text,
                    uniqueRecipients,
                    selectedChannels,
                    fbService,
                    igService,
                    smsService: smsServiceInst,
                    channelConfigured,
                    channelErrors,
                });

                console.log(`[SHIVINFRA BROADCAST] Broadcast ${broadcast.id} completed: ${result.sentCount} sent, ${result.failedCount} failed, ${result.skippedCount} skipped`);
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : String(err);
                console.error(`[SHIVINFRA BROADCAST] Error dispatching broadcast ${broadcast.id}:`, err);
                await supabase
                    .from("broadcasts")
                    .update({
                        status: "Failed",
                        success_count: 0,
                        failure_count: 1,
                        completed_at: new Date().toISOString(),
                        error: String(errMsg || "").slice(0, 2000),
                    })
                    .eq("id", broadcast.id);
            }
        }
    } catch (error) {
        console.error("[SHIVINFRA BROADCAST] Scheduler error:", error);
    }
}


let schedulerInterval: ReturnType<
    typeof setInterval
> | null = null;


export function startFollowUpScheduler(
    intervalMs: number = 60 *
        1000
): void {

    if (schedulerInterval) {

        return;

    }


    console.log(
        "[SHIVINFRA FOLLOWUP] Scheduler started, polling every",
        intervalMs / 1000,
        "seconds"
    );


    schedulerInterval =
        setInterval(
            async () => {

                try {

                    const pending =
                        await getPendingFollowUps();


                    if (
                        pending.length >
                        0
                    ) {

                        console.log(
                            "[SHIVINFRA FOLLOWUP] Dispatching",
                            pending.length,
                            "pending follow-ups"
                        );


                        for (
                            const record
                            of pending
                        ) {

                            await dispatchFollowUp(
                                record
                            );

                        }

                    }

                    await processScheduledBroadcasts();

                }
                catch (error) {

                    console.error(
                        "[SHIVINFRA FOLLOWUP] Scheduler loop error:",
                        error
                    );

                }

            },
            intervalMs
        );

}


export function stopFollowUpScheduler(): void {

    if (
        schedulerInterval
    ) {

        clearInterval(
            schedulerInterval
        );

        schedulerInterval =
            null;

        console.log(
            "[SHIVINFRA FOLLOWUP] Scheduler stopped"
        );

    }

}
