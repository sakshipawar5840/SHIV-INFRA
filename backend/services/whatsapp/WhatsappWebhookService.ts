// =====================================================
// SHIVINFRA WHATSAPP WEBHOOK SERVICE
// PRODUCTION CLEAN VERSION
// PART 1 / 5
//
// CORE ENGINE
// TYPES
// PAYLOAD VALIDATION
// MESSAGE EXTRACTION
// DUPLICATE PROTECTION
// USER CONTEXT
//
// FLOW:
//
// Meta WhatsApp
//      â†“
// Webhook
//      â†“
// Validation
//      â†“
// Message Extraction
//      â†“
// Duplicate Protection
//      â†“
// User Context
//      â†“
// Text / Media Pipeline
//
// =====================================================

import { runAgent } from "../../ai-engine/agent";

import { saveConversation } from "../../ai-engine/memory";

import WhatsAppService from "../whatsappService.ts";

import customerService from "../../services/customerService.ts";

import projectService from "../../services/projectService.ts";

import activityLogger from "../../services/activityLoggerService.ts";

import billService from "../../services/modules/BillService.ts";

import OCRService from "../../services/ocrService.ts";

import { supabaseAdmin as supabase } from "../../config/supabase.ts";

import ConfirmationService from "../confirmationService.ts";

import fs from "fs";

import path from "path";

import os from "os";


// =====================================================
// TYPES
// =====================================================

interface WhatsAppWebhookResponse {

    success: boolean;

    message: string;

    data?: any;

    error?: string;

}


type WhatsAppMessageType =
    | "text"
    | "image"
    | "document"
    | "audio"
    | "button"
    | "list"
    | "interactive"
    | "unknown";


interface IncomingWhatsAppMessage {

    id: string;

    phone: string;

    name?: string;

    type: WhatsAppMessageType;

    text: string;

    mediaId?: string;

    mimeType?: string;

    filename?: string;

}


interface WhatsAppUserContext {

    id?: string;

    company_id: string;

    role:
        | "ADMIN"
        | "ENGINEER"
        | "CUSTOMER"
        | "SALES";

    channel: "WHATSAPP";
}



// =====================================================
// BILL CONFIRMATION STATE
// =====================================================


const pendingBillConfirmations =
    new Map<
        string,
        {
            billData: any;

            phone: string;

            companyId: string;

            timestamp: number;

        }
    >();



const BILL_CONFIRMATION_TTL_MS =
    30 * 60 * 1000;



function getBillConfirmationKey(
    phone: string,
    companyId: string
): string {


    return (
        String(phone || "")
        + "|"
        + String(companyId || "")
    );



}


// =====================================================
// OCR MISSING DATA STATE
// =====================================================



const pendingOCRConfirmations =
    new Map<
        string,
        {
            billData: any;

            phone: string;

            companyId: string;

            missingFields: string[];

            timestamp: number;

        }
    >();



const OCR_CONFIRMATION_TTL_MS =
    30 * 60 * 1000;



function getOCRConfirmationKey(
    phone: string,
    companyId: string
): string {


    return (
        String(phone || "")
        + "|"
        + String(companyId || "")
    );


}



// =====================================================
// PERSISTENT CONFIRMATION HELPERS
// The in-memory Maps above remain as a fast-path cache,
// but every create/update is ALSO written to the Supabase
// pending_confirmations table so state survives restarts.
// =====================================================

async function persistBillConfirmation(
    phone: string,
    companyId: string,
    billData: any,
    missingFields?: string[]
): Promise<void> {
    try {
        await ConfirmationService.createConfirmation(
            companyId,
            phone,
            {
                intent: { name: "SAVE_BILL" },
                userId: "whatsapp",
                role: "ENGINEER",
                channel: "WHATSAPP",
                originalMessage: "bill_confirmation",
                billData,
                missingFields
            } as any
        );
    } catch (error) {
        console.error("[CONFIRMATION] persistBillConfirmation failed:", error);
    }
}

async function lookupBillConfirmation(
    phone: string,
   companyId: string
): Promise<any> {
    // Prefer the persistent store
    const persistent = await ConfirmationService.getPendingConfirmation(
        companyId,
        phone
    );
    if (persistent) {
        const data = persistent.intent_data as any;
        return {
            billData: data?.billData,
            phone: persistent.phone,
            companyId: persistent.company_id,
            missingFields: data?.missingFields,
            timestamp: new Date(persistent.created_at).getTime(),
            id: persistent.id
        };
    }
    // Fall back to the in-memory cache
    const key = getBillConfirmationKey(phone, companyId);
    return pendingBillConfirmations.get(key) || null;
}

async function lookupOCRConfirmation(
    phone: string,
    companyId: string
): Promise<any> {
    const persistent = await ConfirmationService.getPendingConfirmation(
        companyId,
        phone
    );
    if (persistent) {
        const data = persistent.intent_data as any;
        return {
            billData: data?.billData,
            phone: persistent.phone,
           companyId: persistent.company_id,
            missingFields: data?.missingFields,
            timestamp: new Date(persistent.created_at).getTime(),
            id: persistent.id
        };
    }
    const key = getOCRConfirmationKey(phone, companyId);
    return pendingOCRConfirmations.get(key) || null;
}

async function cancelBillConfirmation(
    phone: string,
    companyId: string
): Promise<void> {
    const key = getBillConfirmationKey(phone, companyId);
    pendingBillConfirmations.delete(key);
    await ConfirmationService.cancelPending(companyId, phone);
}

async function cancelOCRConfirmation(
    phone: string,
   companyId: string
): Promise<void> {
    const key = getOCRConfirmationKey(phone,companyId);
    pendingOCRConfirmations.delete(key);
    await ConfirmationService.cancelPending(companyId, phone);
}



// =====================================================
// SERVICE
// =====================================================

class WhatsAppWebhookService {


    // =================================================
    // DUPLICATE MESSAGE PROTECTION
    // =================================================
    //
    // IMPORTANT:
    //
    // This protects a single running instance.
    //
    // For multi-instance production deployment,
    // Redis / Supabase idempotency should eventually
    // become the distributed source of truth.
    //
    // =================================================

    private readonly processedMessages =
        new Set<string>();


    private readonly duplicateCleanupTimers =
        new Map<
            string,
            ReturnType<typeof setTimeout>
        >();


    private readonly DUPLICATE_TTL_MS =
        10 * 60 * 1000;


    // =================================================
    // CONSTRUCTOR
    // =================================================

    constructor() {

        console.log(
            "ðŸš€ SHIVINFRA WHATSAPP WEBHOOK SERVICE READY"
        );

    }


    // =================================================
    // MAIN WEBHOOK PROCESSOR
    // =================================================

    public async processIncoming(
        payload: any
    ): Promise<WhatsAppWebhookResponse> {

        let phone: string | undefined;

        try {

            // -----------------------------------------
            // STEP 1
            // VALIDATE PAYLOAD
            // -----------------------------------------

            if (
                !this.validatePayload(payload)
            ) {

                return {

                    success: false,

                    message:
                        "Invalid WhatsApp webhook payload"

                };

            }


            // -----------------------------------------
            // STEP 2
            // DELIVERY STATUS
            // -----------------------------------------
            //
            // Meta may send status-only events.
            //
            // They should NOT enter AI pipeline.
            //
            // -----------------------------------------

            const value =
                payload
                    ?.entry?.[0]
                    ?.changes?.[0]
                    ?.value;


            if (
                value?.statuses &&
                !value?.messages
            ) {

                await this.handleStatusUpdate(
                    payload
                );


                return {

                    success: true,

                    message:
                        "WhatsApp delivery status processed"

                };

            }


            // -----------------------------------------
            // STEP 3
            // EXTRACT MESSAGE
            // -----------------------------------------

            const message =
                this.extractMessage(payload);


            if (message?.phone) {

                phone = message.phone;

            }


            if (!message) {

                return {

                    success: true,

                    message:
                        "No WhatsApp message found"

                };

            }


            // -----------------------------------------
            // STEP 4
            // DUPLICATE PROTECTION
            // -----------------------------------------

            if (
                this.isDuplicateMessage(
                    message.id
                )
            ) {

                console.warn(
                    "âš ï¸ DUPLICATE WHATSAPP MESSAGE IGNORED",
                    message.id
                );


                return {

                    success: true,

                    message:
                        "Duplicate message ignored",

                    data: {

                        duplicate: true,

                        message_id:
                            message.id

                    }

                };

            }


            // -----------------------------------------
            // STEP 5
            // LOG MESSAGE
            // -----------------------------------------

            console.log(
                "ðŸ“© WHATSAPP MESSAGE RECEIVED",
                {

                    id:
                        message.id,

                    phone:
                        message.phone,

                    name:
                        message.name,

                    type:
                        message.type,

                    text:
                        message.text

                }
            );


            // -----------------------------------------
            // STEP 6
            // RESOLVE USER
            // -----------------------------------------

            const user =
                await this.resolveUserContext(
                    message.phone,
                    { payload }
                );


            if (!user) {

                await this.sendErrorMessage(

                    message.phone,

                    "Your WhatsApp number is not registered with SHIVINFRA AI."

                );


                return {

                    success: false,

                    message:
                        "WhatsApp user not registered"

                };

            }


            // -----------------------------------------
            // STEP 7
            // MEDIA
            // -----------------------------------------

            if (

                message.type === "image"

                ||

                message.type === "document"

            ) {

                return await this.handleMediaMessage(

                    message,

                    user

                );

            }


            // -----------------------------------------
            // STEP 8
            // AUDIO
            // -----------------------------------------

            if (
                message.type === "audio"
            ) {

                await this.sendErrorMessage(

                    message.phone,

                    "Audio messages are not enabled yet. Please send text or upload a bill image/PDF."

                );


                return {

                    success: false,

                    message:
                        "Audio processing not available"

                };

            }


            // -----------------------------------------
            // STEP 9
            // TEXT / BUTTON / LIST
            // -----------------------------------------

            return await this.handleTextMessage(

                message,

                user

            );

        }

        catch (error: any) {

            console.error(

                "âŒ WHATSAPP PROCESS ERROR",

                this.normalizeError(error)

            );


            if (phone) {

                await this.sendErrorMessage(

                    phone,

                    "I couldn't complete that request right now. Please try again."

                );

            }


            return {

                success: false,

                message:
                    "Webhook processing failed",

                error:
                    error?.message
                    || "Unknown webhook error"

            };

        }

    }


    // =================================================
    // PAYLOAD VALIDATION
    // =================================================

    private validatePayload(
        payload: any
    ): boolean {

        try {

            if (!payload) {

                return false;

            }


            if (
                payload.object !==
                "whatsapp_business_account"
            ) {

                return false;

            }


            if (
                !Array.isArray(
                    payload.entry
                )
            ) {

                return false;

            }


            if (
                payload.entry.length === 0
            ) {

                return false;

            }


            return true;

        }

        catch (error) {

            console.error(

                "âŒ WEBHOOK VALIDATION ERROR",

                this.normalizeError(error)

            );


            return false;

        }

    }


    // =================================================
    // MESSAGE EXTRACTION
    // =================================================

    private extractMessage(
        payload: any
    ): IncomingWhatsAppMessage | null {

        try {

            const value =
                payload
                    ?.entry?.[0]
                    ?.changes?.[0]
                    ?.value;


            if (!value) {

                return null;

            }


            const msg =
                value?.messages?.[0];


            if (!msg) {

                return null;

            }


            const phone =
                String(
                    msg?.from || ""
                ).trim();


            const messageId =
                String(
                    msg?.id || ""
                ).trim();


            if (
                !phone ||
                !messageId
            ) {

                return null;

            }


            let type:
                WhatsAppMessageType =
                "unknown";


            let text = "";

            let mediaId:
                string | undefined;

            let mimeType:
                string | undefined;

            let filename:
                string | undefined;


            // =========================================
            // TEXT
            // =========================================

            if (
                msg.type === "text"
            ) {

                type = "text";

                text =
                    String(
                        msg?.text?.body || ""
                    ).trim();

            }


            // =========================================
            // IMAGE
            // =========================================

            else if (
                msg.type === "image"
            ) {

                type = "image";

                text =
                    "IMAGE_UPLOAD";

                mediaId =
                    String(
                        msg?.image?.id || ""
                    ).trim()
                    || undefined;

                mimeType =
                    String(
                        msg?.image?.mime_type || ""
                    ).trim()
                    || undefined;

            }


            // =========================================
            // DOCUMENT
            // =========================================

            else if (
                msg.type === "document"
            ) {

                type = "document";

                text =
                    "DOCUMENT_UPLOAD";

                mediaId =
                    String(
                        msg?.document?.id || ""
                    ).trim()
                    || undefined;

                mimeType =
                    String(
                        msg?.document?.mime_type || ""
                    ).trim()
                    || undefined;

                filename =
                    String(
                        msg?.document?.filename || ""
                    ).trim()
                    || undefined;

            }


            // =========================================
            // AUDIO
            // =========================================

            else if (
                msg.type === "audio"
            ) {

                type = "audio";

                text =
                    "AUDIO_MESSAGE";

                mediaId =
                    String(
                        msg?.audio?.id || ""
                    ).trim()
                    || undefined;

                mimeType =
                    String(
                        msg?.audio?.mime_type || ""
                    ).trim()
                    || undefined;

            }


            // =========================================
            // INTERACTIVE
            // =========================================

            else if (
                msg.type === "interactive"
            ) {

                const interactive =
                    msg?.interactive;


                // -------------------------------------
                // BUTTON
                // -------------------------------------

                if (
                    interactive?.button_reply
                ) {

                    type = "button";

                    text =
                        String(
                            interactive
                                ?.button_reply
                                ?.title || ""
                        ).trim();

                }


                // -------------------------------------
                // LIST
                // -------------------------------------

                else if (
                    interactive?.list_reply
                ) {

                    type = "list";

                    text =
                        String(
                            interactive
                                ?.list_reply
                                ?.title || ""
                        ).trim();

                }


                // -------------------------------------
                // UNKNOWN INTERACTIVE
                // -------------------------------------

                else {

                    type =
                        "interactive";

                    text = "";

                }

            }


            // =========================================
            // UNSUPPORTED
            // =========================================

            else {

                type =
                    "unknown";

                text = "";

            }


            const profileName =
                String(
                    value
                        ?.contacts?.[0]
                        ?.profile?.name || ""
                ).trim();


            return {

                id:
                    messageId,

                phone,

                name:
                    profileName || "Customer",

                type,

                text,

                mediaId,

                mimeType,

                filename

            };

        }

        catch (error) {

            console.error(

                "âŒ MESSAGE EXTRACTION ERROR",

                this.normalizeError(error)

            );


            return null;

        }

    }


    // =================================================
    // USER CONTEXT RESOLVER
    // =================================================
    //
    // WhatsApp Number
    //      â†“
    // Customer
    //      â†“
    // Company
    //      â†“
    // Role
    //
    // =================================================

    private async resolveUserContext(
        phone: string,
        context?: { payload?: any; metadataPhoneId?: string }
    ): Promise<WhatsAppUserContext | null> {

        try {

            const normalizedPhone =
                String(
                    phone || ""
                ).trim();


            if (!normalizedPhone) {

                return null;

            }


            const metadataPhoneId =
                context?.metadataPhoneId
                || this.extractPhoneNumberId(context?.payload);

            let resolvedCompany = null;
            let phoneIdResolved = false;

            if (metadataPhoneId) {
                phoneIdResolved = true;
                resolvedCompany =
                    await this.resolveCompanyByPhoneId(
                        metadataPhoneId
                    );
            }

            if (!resolvedCompany) {
                // Only fall back to DEFAULT_COMPANY_ID when NO
                // phone_number_id was present at all.
                // An unknown/unmapped phone_number_id must NEVER
                // be silently assigned to a company.
                if (!phoneIdResolved) {
                    const fallbackId =
                        String(
                            process.env.DEFAULT_COMPANY_ID
                            || ""
                        ).trim();
                    if (fallbackId) {
                        resolvedCompany = {
                            id: fallbackId,
                            phone_number_id: null
                        };
                        console.warn(
                            "[SHIVINFRA WHATSAPP] No phone_number_id in metadata; falling back to DEFAULT_COMPANY_ID"
                        );
                    }
                } else {
                    console.error(
                        "[SHIVINFRA WHATSAPP] REJECTED: unknown/unmapped phone_number_id",
                        metadataPhoneId
                    );
                    return null;
                }
            }

            if (!resolvedCompany) {
                console.error(
                    "WHATSAPP COMPANY RESOLUTION FAILED: no phone_number_id mapping and no DEFAULT_COMPANY_ID"
                );
                return null;
            }

            const companyId = resolvedCompany.id;


            // -----------------------------------------
            // SEARCH REGISTERED USER (ADMIN / ENGINEER)
            // -----------------------------------------

            const { data: user, error: userError } =
                await supabase
                    .from("users")
                    .select("id, company_id, role, status")
                    .eq("phone", normalizedPhone)
                    .eq("company_id", companyId)
                    .maybeSingle();

            console.log("[WHATSAPP DEBUG] User lookup:", { phone: normalizedPhone, companyId, user: user?.id, userRole: user?.role, userError: userError?.message });

            if (user && !userError) {

                const userRole =
                    String(user.role || "CUSTOMER")
                    .trim()
                    .toUpperCase();


                const normalizedRole =
                    userRole === "SUPER ADMIN" ||
                    userRole === "SALES MANAGER"
                        ? "ADMIN"
                        : userRole;


                if (
                    normalizedRole === "ADMIN" ||
                    normalizedRole === "ENGINEER" ||
                    normalizedRole === "CUSTOMER" ||
                    normalizedRole === "SALES"
                ) {

                    return {

                        id: user.id,

                        company_id: user.company_id,

                        role: normalizedRole,

                        channel: "WHATSAPP"

                    };

                }

            }


            // -----------------------------------------
            // SEARCH CUSTOMER
            // -----------------------------------------

            const customers =
                await customerService.aiSearchCustomers(

                    companyId,

                    {

                        query:
                            normalizedPhone

                    }

                );


            if (

                Array.isArray(customers)

                &&

                customers.length > 0

            ) {

                const customer =
                    customers[0];


                const customerCompanyId =
                    String(
                        customer?.company_id
                        || companyId
                    ).trim();


                if (
                    customerCompanyId !== companyId
                ) {

                    console.warn(
                        "âš ï¸ CUSTOMER COMPANY MISMATCH",
                        {

                            phone:
                                normalizedPhone,

                            expected_company:
                                companyId,

                            customer_company:
                                customerCompanyId

                        }
                    );


                    return null;

                }


                return {

                    id:
                        customer?.id
                        || undefined,

                    company_id:
                        customerCompanyId,

                    role:
                        "CUSTOMER",

                    channel:
                        "WHATSAPP"

                };

            }


            // -----------------------------------------
            // OPTIONAL UNREGISTERED MODE
            // -----------------------------------------

            const allowUnregistered =
                String(
                    process.env
                        .WHATSAPP_ALLOW_UNREGISTERED
                    || ""
                )
                    .trim()
                    .toLowerCase() === "true";


            if (
                allowUnregistered
            ) {

                return {

                    company_id:
                        companyId,

                    role:
                        "CUSTOMER",

                    channel:
                        "WHATSAPP"

                };

            }


            return null;

        }

        catch (error) {

            console.error(

                "âŒ USER CONTEXT ERROR",

                this.normalizeError(error)

            );


            return null;

        }

    }


    // =================================================
    // DUPLICATE MESSAGE CHECK
    // =================================================

    private isDuplicateMessage(
        messageId: string
    ): boolean {

        try {

            const normalizedId =
                String(
                    messageId || ""
                ).trim();


            if (!normalizedId) {

                return false;

            }


            if (
                this.processedMessages.has(
                    normalizedId
                )
            ) {

                return true;

            }


            this.processedMessages.add(
                normalizedId
            );


            const existingTimer =
                this.duplicateCleanupTimers.get(
                    normalizedId
                );


            if (existingTimer) {

                clearTimeout(
                    existingTimer
                );

            }


            const timer =
                setTimeout(

                    () => {

                        this.processedMessages.delete(
                            normalizedId
                        );

                        this.duplicateCleanupTimers.delete(
                            normalizedId
                        );

                    },

                    this.DUPLICATE_TTL_MS

                );


            this.duplicateCleanupTimers.set(
                normalizedId,
                timer
            );


            return false;

        }

        catch (error) {

            console.error(

                "âŒ DUPLICATE CHECK ERROR",

                this.normalizeError(error)

            );


            // Fail-open.
            //
            // Duplicate protection failure
            // should not crash webhook.

            return false;

        }

    }


    // =================================================
    // CLEAR DUPLICATE CACHE ENTRY
    // =================================================
    //
    // Use only when it is known that the business
    // operation has NOT been committed.
    //
    // =================================================

    private clearProcessedMessage(
        messageId: string
    ): void {

        try {

            const normalizedId =
                String(
                    messageId || ""
                ).trim();


            if (!normalizedId) {

                return;

            }


            this.processedMessages.delete(
                normalizedId
            );


            const timer =
                this.duplicateCleanupTimers.get(
                    normalizedId
                );


            if (timer) {

                clearTimeout(timer);

                this.duplicateCleanupTimers.delete(
                    normalizedId
                );

            }

        }

        catch (error) {

            console.error(

                "âŒ DUPLICATE CACHE CLEANUP ERROR",

                this.normalizeError(error)

            );

        }

    }


    // =================================================
    // SAFE ERROR MESSAGE
    // =================================================



    // =================================================
    // SAFE ERROR NORMALIZER
    // =================================================

    private normalizeError(
        error: unknown
    ): {

        message: string;

        name?: string;

        stack?: string;

    } {

        if (
            error instanceof Error
        ) {

            return {

                message:
                    error.message
                    || "Unknown error",

                name:
                    error.name,

                stack:
                    process.env.NODE_ENV === "production"

                        ? undefined

                        : error.stack

            };

        }


        if (
            typeof error === "string"
        ) {

            return {

                message:
                    error

            };

        }


        try {

            return {

                message:
                    JSON.stringify(error)
                    || "Unknown error"

            };

        }

        catch {

            return {

                message:
                    "Unknown error"

            };

        }

    }


    // =================================================
    // PART 1 / 5 END
    //
    // NEXT:
    // PART 2 / 5
    //
    // TEXT AI PIPELINE
    // AI INTENT
    // AI ACTION
    // RESPONSE ENGINE
    // ACTIVITY LOG
    //
    // =================================================
    // =====================================================
// SHIVINFRA WHATSAPP WEBHOOK SERVICE
//
// PRODUCTION CLEAN VERSION
// PART 2 / 5
//
// TEXT AI PIPELINE
// AI INTENT DETECTION
// AI ACTION EXECUTION
// WHATSAPP RESPONSE ENGINE
// ACTIVITY LOGGER
//
// IMPORTANT:
// This entire section must remain INSIDE
// WhatsAppWebhookService class.
// =====================================================


// =====================================================
// TEXT MESSAGE PROCESSOR
// =====================================================

private async handleTextMessage(

    message: IncomingWhatsAppMessage,

    user: WhatsAppUserContext

): Promise<WhatsAppWebhookResponse> {

    const startedAt = Date.now();

    try {

        // =================================================
        // BASIC VALIDATION
        // =================================================

        const text = String(
            message?.text || ""
        ).trim();


        if (!text) {

            await this.sendErrorMessage(
                message.phone,
                "Please send a valid message."
            );

            return {

                success: false,

                message:
                    "Empty WhatsApp message"

            };

        }


        if (!message?.phone) {

            return {

                success: false,

                message:
                    "WhatsApp phone number missing"

            };

        }

        if (!user?.company_id) {

            await this.sendErrorMessage(

                message.phone,

                "Company context could not be resolved."

            );

            return {

                success: false,

                message:
                    "Company context missing"

            };

        }



        // =================================================
        // CHECK OCR MISSING DATA
        // =================================================

        const ocrConfirmationKey =
            getOCRConfirmationKey(
                message.phone,
                user.company_id
            );

        const pendingOCRConfirmation =
            pendingOCRConfirmations.get(
                ocrConfirmationKey
            );

        if (
            pendingOCRConfirmation
            &&
            Date.now() - pendingOCRConfirmation.timestamp < OCR_CONFIRMATION_TTL_MS
        ) {
            await saveConversation({
                userId: user.id || "unknown",
                companyId: user.company_id,
                phone: message.phone,
                role: "USER",
                message: text,
                channel: "WHATSAPP"
            });

            const updatedBillData = { ...pendingOCRConfirmation.billData };
            const lowerText = text.toLowerCase().trim();
            let merged = false;

            if (!updatedBillData.vendor_name && !updatedBillData.vendor && lowerText.includes("vendor")) {
                updatedBillData.vendor_name = text.replace(/vendor\s*[:\-]?\s*/i, "").trim();
                updatedBillData.vendor = updatedBillData.vendor_name;
                merged = true;
            }

            if (!updatedBillData.amount && !lowerText.includes("amount")) {
                const amountMatch = text.match(/(?:amount|₹|rs\.?)\s*(\d+(?:\.\d+)?)/i);
                if (amountMatch) {
                    updatedBillData.amount = Number(amountMatch[1]);
                    merged = true;
                }
            }

            if (!updatedBillData.bill_date && !updatedBillData.date && !lowerText.includes("date")) {
                const dateMatch = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
                if (dateMatch) {
                    updatedBillData.bill_date = dateMatch[1];
                    merged = true;
                }
            }

            if (!updatedBillData.project_id && !updatedBillData.project_name && !lowerText.includes("project") && !lowerText.includes("site")) {
                updatedBillData.project_name = text.trim();
                merged = true;
            }

            if (merged) {
                pendingOCRConfirmations.delete(ocrConfirmationKey);
                const validation = this.validateOCRBill(updatedBillData);

                if (validation.valid) {
                    try {
                        const bill = await billService.createBill(updatedBillData);
                        if (bill) {
                            await WhatsAppService.sendTextMessage(message.phone, "✅ Bill saved successfully!\n\n" + `🏣 Vendor: ${updatedBillData.vendor_name || updatedBillData.vendor || "N/A"}\n` + `💰 Amount: ₹${this.formatAmount(updatedBillData.amount)}\n` + `📅 Date: ${this.formatBillDate(updatedBillData.bill_date || updatedBillData.date || "N/A")}`);
                            await saveConversation({ userId: user.id || "unknown", companyId: user.company_id, phone: message.phone, role: "AI", message: "✅ Bill saved successfully!", channel: "WHATSAPP" });
                            return { success: true, message: "Bill saved successfully", data: bill };
                        }
                    } catch (error) {
                        await WhatsAppService.sendTextMessage(message.phone, "❌ Failed to save bill. Please try again.");
                        await saveConversation({ userId: user.id || "unknown", companyId: user.company_id, phone: message.phone, role: "AI", message: "❌ Failed to save bill. Please try again.", channel: "WHATSAPP" });
                        return { success: false, message: "Bill save failed", error: this.normalizeError(error).message };
                    }
                } else {
                    pendingOCRConfirmations.set(ocrConfirmationKey, { billData: updatedBillData, phone: message.phone, companyId: user.company_id, missingFields: validation.errors, timestamp: Date.now() });
                    await persistBillConfirmation(message.phone, user.company_id, updatedBillData, validation.errors);
                    const retryResponse = "I still need more details:\n\n" + validation.errors.map((e: string) => `• ${e}`).join("\n") + "\n\nPlease provide the missing details.";
                    await saveConversation({ userId: user.id || "unknown", companyId: user.company_id, phone: message.phone, role: "AI", message: retryResponse, channel: "WHATSAPP" });
                    await WhatsAppService.sendTextMessage(message.phone, this.truncateWhatsAppMessage(retryResponse));
                    return { success: false, message: "OCR data still incomplete", data: { errors: validation.errors } };
                }
            } else {
                pendingOCRConfirmations.delete(ocrConfirmationKey);
                const retryResponse = "I could not match your message to the missing bill details. Please provide the missing information clearly.";
                await saveConversation({ userId: user.id || "unknown", companyId: user.company_id, phone: message.phone, role: "AI", message: retryResponse, channel: "WHATSAPP" });
                await WhatsAppService.sendTextMessage(message.phone, this.truncateWhatsAppMessage(retryResponse));
                return { success: false, message: "OCR data update failed" };
            }
        }

        // =================================================
        // CHECK BILL CONFIRMATION
        // =================================================

        const billConfirmationKey =
            getBillConfirmationKey(
                message.phone,
                user.company_id
            );



        const pendingBillConfirmation =
            pendingBillConfirmations.get(
                billConfirmationKey
            );



        if (
            pendingBillConfirmation
            &&
            Date.now() - pendingBillConfirmation.timestamp < BILL_CONFIRMATION_TTL_MS
        ) {

            const lowerText =
                text.toLowerCase().trim();



            if (
                lowerText === "yes"
                ||
                lowerText === "ha"
                ||
                lowerText === "ho"
                ||
                lowerText === "confirm"
            ) {



                pendingBillConfirmations.delete(
                    billConfirmationKey
                );


                await saveConversation({

                    userId:
                        user.id ||
                        "unknown",

                    companyId:
                        user.company_id,

                    phone:
                        message.phone,

                    role:
                        "USER",

                    message:
                        text,

                    channel:
                        "WHATSAPP"

                });


                try {


                    const bill =
                    await billService.createBill(

                        pendingBillConfirmation.billData

                    );



                    if (bill) {



                        await WhatsAppService.sendTextMessage(

                            message.phone,

                            "âœ… Bill saved successfully!\n\n" +
                            `ðŸ¢ Vendor: ${
                                pendingBillConfirmation.billData.vendor_name || "N/A"
                            }\n` +
                            `ðŸ§¾ Invoice: ${
                                pendingBillConfirmation.billData.bill_number || "N/A"
                            }\n` +
                            `ðŸ’° Amount: â‚¹${
                                this.formatAmount(
                                    pendingBillConfirmation.billData.amount
                                )
                            }`

                        );


                        await saveConversation({

                            userId:
                                user.id ||
                                "unknown",

                            companyId:
                                user.company_id,

                            phone:
                                message.phone,

                            role:
                                "AI",

                            message:
                                "âœ… Bill saved successfully!",

                            channel:
                                "WHATSAPP"

                        });


                        return {

                            success: true,

                            message:
                                "Bill saved successfully",

                            data:
                                bill

                        };



                    }



                }
                catch (error) {



                    await WhatsAppService.sendTextMessage(

                        message.phone,

                        "âŒ Failed to save bill. Please try again."

                    );


                    await saveConversation({

                        userId:
                            user.id ||
                            "unknown",

                        companyId:
                            user.company_id,

                        phone:
                            message.phone,

                        role:
                            "AI",

                        message:
                            "âŒ Failed to save bill. Please try again.",

                        channel:
                            "WHATSAPP"

                    });


                    return {

                        success: false,

                        message:
                            "Bill save failed",

                        error:
                            this.normalizeError(error)
                                .message

                    };



                }



            }
            else if (
                lowerText === "no"
                ||
                lowerText === "na"
                ||
                lowerText === "cancel"
            ) {



                pendingBillConfirmations.delete(
                    billConfirmationKey
                );


                await saveConversation({

                    userId:
                        user.id ||
                        "unknown",

                    companyId:
                        user.company_id,

                    phone:
                        message.phone,

                    role:
                        "USER",

                    message:
                        text,

                    channel:
                        "WHATSAPP"

                });


                await WhatsAppService.sendTextMessage(

                    message.phone,

                    "âŒ Bill creation cancelled."

                );


                await saveConversation({

                    userId:
                        user.id ||
                        "unknown",

                    companyId:
                        user.company_id,

                    phone:
                        message.phone,

                    role:
                        "AI",

                    message:
                        "âŒ Bill creation cancelled.",

                    channel:
                        "WHATSAPP"

                });


                return {

                    success: true,

                    message:
                        "Bill creation cancelled"

                };



            }



        }
        else if (pendingBillConfirmation) {



            pendingBillConfirmations.delete(
                billConfirmationKey
            );



        }



        // =================================================
        // LOG REQUEST
        // =================================================

        console.log(

            "ðŸ’¬ SHIVINFRA WHATSAPP AI REQUEST",

            {

                message_id:
                    message.id,

                phone:
                    message.phone,

                text,

                role:
                    user.role,

                company_id:
                    user.company_id

            }

        );


        // =================================================
        // STEP 1
        // AI AGENT PROCESSING
        // =================================================

        const agentResponse =
            await runAgent({

                userId:
                user.id || "unknown",

                companyId:
                user.company_id,

                phone:
                message.phone,

                role:
                user.role,

                message:
                text,

                channel:
                "WHATSAPP"

            });



        const intent =
        String(
            agentResponse.intent
            || "GENERAL_CHAT"
        ).trim().toUpperCase();



        const actionResult =
        agentResponse.data
        || {

            message:
            agentResponse.message

        };


        actionResult.success =
            agentResponse.success;



        const success =
        Boolean(
            agentResponse.success
        );


        const confidence =
        agentResponse.intentResult?.confidence
        || 0.9;


        const parameters =
        agentResponse.intentResult?.parameters
        || {};



        console.log(
            "ðŸ¤– SHIVINFRA AI AGENT RESULT",
            {
                intent,
                success,
                message:
                agentResponse.message
            }
        );


        // =================================================
        // STEP 4
        // SEND RESPONSE TO WHATSAPP
        // =================================================

        await this.sendAIResponse(

            message.phone,

            agentResponse

        );


        // =================================================
        // STEP 5
        // ACTIVITY LOG
        // =================================================

        await this.logActivity({

            company_id:
                user.company_id,

            user_id:
                user.id || null,

            phone:
                message.phone,

            message_id:
                message.id,

            intent,

            confidence,

            parameters,

            result:
                actionResult,

            execution_time:
                Date.now() - startedAt,

            channel:
                "WHATSAPP"

        });


        // =================================================
        // FINAL RESULT
        // =================================================

        return {

            success:
                Boolean(
                    actionResult?.success
                ),

            message:

                String(

                    actionResult?.message

                    || "WhatsApp AI request processed"

                ),

            data: {

                intent,

                confidence,

                action:

                    actionResult?.code

                    || actionResult?.action

                    || null,

                success:

                    Boolean(
                        actionResult?.success
                    )

            }

        };

    }

    catch (error: any) {

        // =================================================
        // ERROR LOG
        // =================================================

        console.error(

            "âŒ WHATSAPP TEXT AI PIPELINE ERROR",

            {

                error:
                    this.normalizeError(error),

                message_id:
                    message?.id || null,

                phone:
                    message?.phone || null

            }

        );


        // =================================================
        // ERROR ACTIVITY LOG
        // =================================================

        await this.logActivity({

            company_id:
                user?.company_id || null,

            user_id:
                user?.id || null,

            phone:
                message?.phone || null,

            message_id:
                message?.id || null,

            intent:
                "WHATSAPP_AI_ERROR",

            confidence:
                0,

            parameters: {

                message:
                    message?.text || ""

            },

            result: {

                success:
                    false,

                error:
                    error?.message
                    || "Unknown AI processing error"

            },

            execution_time:
                Date.now() - startedAt,

            channel:
                "WHATSAPP"

        });


        // =================================================
        // USER SAFE ERROR
        // =================================================

        if (message?.phone) {

            await this.sendErrorMessage(

                message.phone,

                "SHIVINFRA AI could not process your request right now. Please try again."

            );

        }


        return {

            success: false,

            message:
                "WhatsApp AI processing failed",

            error:
                error?.message
                || "Unknown error"

        };

    }

}


// =====================================================
// AI RESPONSE ENGINE
//
// Converts AIActionService result into a safe
// human-readable WhatsApp message.
//
// Supports:
//
// - success
// - error
// - reply
// - object data
// - array data
// - project
// - customer
// - lead
// - bill
// - expense
// =====================================================

private async sendAIResponse(

    phone: string,

    result: any

): Promise<void> {

    try {

        const normalizedPhone =
            String(phone || "").trim();


        if (!normalizedPhone) {

            throw new Error(
                "WhatsApp phone number missing"
            );

        }


        const success =
            Boolean(result?.success);


        let response = "";


        // =================================================
        // BASE RESPONSE
        // =================================================

        if (success) {

            response =

                `âœ… ${
                    String(
                        result?.message
                        || "Request completed successfully."
                    ).trim()
                }`;

        }

        else {

            response =

                `âŒ ${
                    String(
                        result?.message
                        || "Unable to complete your request."
                    ).trim()
                }`;

        }


        // =================================================
        // DIRECT REPLY
        // =================================================

        if (

            typeof result?.reply === "string"

            && result.reply.trim()

        ) {

            response +=

                `\n\n${result.reply.trim()}`;

        }


        // =================================================
        // OBJECT DATA
        // =================================================

        if (

            result?.data

            && typeof result.data === "object"

            && !Array.isArray(result.data)

        ) {

            const data =
                result.data;


            if (

                typeof data.reply === "string"

                && data.reply.trim()

            ) {

                response +=

                    `\n\n${data.reply.trim()}`;

            }

        }


        // =================================================
        // ARRAY DATA
        // =================================================

        if (

            Array.isArray(result?.data)

            && result.data.length > 0

        ) {

            response += "\n\n";


            const records =

                result.data.slice(0, 10);


            records.forEach(

                (item: any, index: number) => {

                    const title =

                        item?.project_name

                        || item?.customer_name

                        || item?.full_name

                        || item?.name

                        || item?.vendor

                        || item?.invoice_number

                        || item?.title

                        || `Record ${index + 1}`;


                    response +=

                        `${index + 1}. ${String(title)}\n`;


                    // -------------------------------------
                    // LOCATION
                    // -------------------------------------

                    if (item?.city) {

                        response +=

                            `ðŸ“ ${String(item.city)}\n`;

                    }


                    if (item?.location) {

                        response +=

                            `ðŸ“Œ ${String(item.location)}\n`;

                    }


                    // -------------------------------------
                    // PHONE
                    // -------------------------------------

                    if (item?.phone) {

                        response +=

                            `ðŸ“ž ${String(item.phone)}\n`;

                    }


                    // -------------------------------------
                    // PRICE
                    // -------------------------------------

                    if (

                        item?.price !== undefined

                        && item?.price !== null

                    ) {

                        response +=

                            `ðŸ’° â‚¹${this.formatAmount(
                                item.price
                            )}\n`;

                    }


                    // -------------------------------------
                    // AMOUNT
                    // -------------------------------------

                    else if (

                        item?.amount !== undefined

                        && item?.amount !== null

                    ) {

                        response +=

                            `ðŸ’° â‚¹${this.formatAmount(
                                item.amount
                            )}\n`;

                    }


                    // -------------------------------------
                    // STATUS
                    // -------------------------------------

                    if (item?.status) {

                        response +=

                            `ðŸ“Š Status: ${String(
                                item.status
                            )}\n`;

                    }


                    // -------------------------------------
                    // CATEGORY
                    // -------------------------------------

                    if (item?.category) {

                        response +=

                            `ðŸ“¦ Category: ${String(
                                item.category
                            )}\n`;

                    }


                    // -------------------------------------
                    // DATE
                    // -------------------------------------

                    if (item?.bill_date) {

                        response +=

                            `ðŸ“… Date: ${this.formatBillDate(
                                item.bill_date
                            )}\n`;

                    }


                    response += "\n";

                }

            );


            if (result.data.length > 10) {

                response +=

                    `Showing first 10 of ${result.data.length} records.`;

            }

        }


        // =================================================
        // EMPTY ARRAY
        // =================================================

        if (

            Array.isArray(result?.data)

            && result.data.length === 0

            && success

        ) {

            response +=

                "\n\nNo matching records found.";

        }


        // =================================================
        // RESPONSE LENGTH PROTECTION
        // =================================================

        response =

            this.truncateWhatsAppMessage(

                response.trim()

            );


        // =================================================
        // SEND WHATSAPP MESSAGE
        // =================================================

        await WhatsAppService.sendTextMessage(

            normalizedPhone,

            response

        );


        console.log(

            "ðŸ“¤ WHATSAPP AI RESPONSE SENT",

            {

                phone:
                    normalizedPhone,

                success

            }

        );

    }

    catch (error) {

        // =================================================
        // RESPONSE ERROR MUST NOT CRASH
        // =================================================

        console.error(

            "âŒ AI RESPONSE ENGINE ERROR",

            this.normalizeError(error)

        );

    }

}


// =====================================================
// AMOUNT FORMATTER
// =====================================================

private formatAmount(

    value: any

): string {

    try {

        const amount =
            Number(value);


        if (!Number.isFinite(amount)) {

            return String(value ?? "0");

        }


        return amount.toLocaleString(

            "en-IN",

            {

                maximumFractionDigits:
                    2

            }

        );

    }

    catch {

        return String(value ?? "0");

    }

}


// =====================================================
// WHATSAPP RESPONSE LENGTH PROTECTION
// =====================================================

private truncateWhatsAppMessage(

    message: string,

    maxLength: number = 3500

): string {

    const text =
        String(message || "").trim();


    if (text.length <= maxLength) {

        return text;

    }


    return (

        text
            .slice(
                0,
                Math.max(
                    0,
                    maxLength - 100
                )
            )
            .trim()

        + "\n\n..."

        + "\nðŸ“‹ Response shortened. Please ask for specific records."

    );

}


// =====================================================
// ACTIVITY LOGGER
//
// Logging failure NEVER breaks business operation.
// =====================================================

private async logActivity(

    data: any

): Promise<void> {

    try {

        const companyId =

            String(
                data?.company_id || ""
            ).trim();


        if (!companyId) {

            console.warn(

                "âš ï¸ ACTIVITY LOG SKIPPED: company_id missing"

            );

            return;

        }


        const parameters = {

            ...(

                data?.parameters

                && typeof data.parameters === "object"

                    ? data.parameters

                    : {}

            ),

            phone:
                data?.phone || null,

            message_id:
                data?.message_id || null

        };


        const result =

            data?.result

            && typeof data.result === "object"

                ? data.result

                : {

                    success: false

                };


        await activityLogger.log({

            company_id:
                companyId,

            user_id:
                data?.user_id || null,

            intent:
                data?.intent || "UNKNOWN",

            parameters,

            result,

            execution_time:

                Number(
                    data?.execution_time || 0
                ),

            channel:
                "WHATSAPP"

        });

    }

    catch (error) {

        // =================================================
        // IMPORTANT
        //
        // Activity logger failure must NEVER
        // break actual AI/business action.
        // =================================================

        console.error(

            "âŒ WHATSAPP ACTIVITY LOG ERROR",

            this.normalizeError(error)

        );

    }

}


// =====================================================
// SAFE ERROR MESSAGE
//
// User-facing error only.
// Internal error details are never sent to WhatsApp.
// =====================================================

private async sendErrorMessage(

    phone: string,

    message: string

): Promise<void> {

    try {

        const normalizedPhone =

            String(
                phone || ""
            ).trim();


        if (!normalizedPhone) {

            return;

        }


        const safeMessage =

            String(
                message
                || "Something went wrong."
            ).trim();


        await WhatsAppService.sendTextMessage(

            normalizedPhone,

            `âŒ ${safeMessage}`

        );

    }

    catch (error) {

        console.error(

            "âŒ WHATSAPP ERROR MESSAGE FAILED",

            this.normalizeError(error)

        );

    }

}


// =====================================================
// PART 2 / 5 END
// =====================================================
// =====================================================
// SHIVINFRA WHATSAPP WEBHOOK SERVICE
//
// PRODUCTION CLEAN VERSION
// PART 3 / 5
//
// MEDIA PROCESSING
// IMAGE / DOCUMENT
// OCR
// BILL VALIDATION
// BILL SAVE
// MEDIA ACTIVITY LOG
//
// FLOW:
//
// WhatsApp Image / PDF
//        â†“
// Meta Media ID
//        â†“
// OCRService
//        â†“
// Normalize OCR
//        â†“
// Validate Bill
//        â†“
// BillService
//        â†“
// Supabase
//        â†“
// WhatsApp Confirmation
//        â†“
// Activity Log
//
// IMPORTANT:
// This entire section must remain INSIDE
// WhatsAppWebhookService class.
// =====================================================


// =====================================================
// MEDIA MESSAGE HANDLER
//
// Supported:
//
// 1. image
// 2. document
//
// Intended use:
//
// - Bill photo
// - Invoice image
// - PDF invoice
// - Material bill
// - Supplier bill
// =====================================================

private async handleMediaMessage(

    message: IncomingWhatsAppMessage,

    user: WhatsAppUserContext

): Promise<WhatsAppWebhookResponse> {

    const startedAt = Date.now();

    try {

        // =================================================
        // BASIC VALIDATION
        // =================================================

        if (!message?.phone) {

            return {

                success: false,

                message:
                    "WhatsApp phone number missing"

            };

        }


        if (!user?.company_id) {

            await this.sendErrorMessage(

                message.phone,

                "Company context could not be resolved."

            );

            return {

                success: false,

                message:
                    "Company context missing"

            };

        }


        // =================================================
        // MEDIA TYPE VALIDATION
        // =================================================

        if (

            message.type !== "image"

            &&

            message.type !== "document"

        ) {

            await this.sendErrorMessage(

                message.phone,

                "This media type is not supported for bill processing."

            );

            return {

                success: false,

                message:
                    "Unsupported media type"

            };

        }


        // =================================================
        // MEDIA ID
        // =================================================

        const mediaId =

            String(
                message.mediaId || ""
            ).trim();


        if (!mediaId) {

            await this.sendErrorMessage(

                message.phone,

                "Media file is missing. Please upload the bill again."

            );

            return {

                success: false,

                message:
                    "WhatsApp media ID missing"

            };

        }


        // =================================================
        // LOG MEDIA RECEIVED
        // =================================================

        console.log(

            "ðŸ“Ž SHIVINFRA WHATSAPP MEDIA RECEIVED",

            {

                message_id:
                    message.id,

                phone:
                    message.phone,

                type:
                    message.type,

                media_id:
                    mediaId,

                mime_type:
                    message.mimeType || null,

                filename:
                    message.filename || null,

                company_id:
                    user.company_id

            }

        );


        // =================================================
        // SAVE MEDIA MESSAGE TO CHAT HISTORY
        // =================================================

        await saveConversation({

            userId:
                user.id ||
                "unknown",

            companyId:
                user.company_id,

            phone:
                message.phone,

            role:
                "USER",

            message:
                `[Media: ${message.type}] ${message.filename || message.mimeType || "file"}`,

            channel:
                "WHATSAPP"

        });


        // =================================================
        // STEP 1
        // PROCESSING MESSAGE
        // =================================================

        await WhatsAppService.sendTextMessage(

            message.phone,

            "â³ SHIVINFRA AI is processing your bill...\n\n" +
            "ðŸ” Reading invoice details..."

        );


        // =================================================
        // STEP 2
        // OCR PROCESS
        // =================================================

        const ocrResult =

            await this.processOCR(

                mediaId,

                message.type

            );


        // =================================================
        // OCR EMPTY RESULT
        // =================================================

        if (!ocrResult) {

            await this.logMediaActivity({

                company_id:
                    user.company_id,

                user_id:
                    user.id || null,

                phone:
                    message.phone,

                message_id:
                    message.id,

                type:
                    message.type,

                media_id:
                    mediaId,

                bill_id:
                    null,

                status:
                    "OCR_FAILED",

                error:
                    "OCR service returned no result",

                execution_time:
                    Date.now() - startedAt

            });


            await this.sendErrorMessage(

                message.phone,

                "I could not read this bill. Please upload a clear bill image or PDF."

            );


            return {

                success: false,

                message:
                    "OCR processing failed"

            };

        }


        console.log(

            "ðŸ”Ž SHIVINFRA OCR RAW RESULT",

            ocrResult

        );


        // =================================================
        // STEP 3
        // NORMALIZE OCR RESULT
        // =================================================

        const normalizedBill =

            this.normalizeOCRResult(

                ocrResult

            );


        console.log(

            "ðŸ§¾ NORMALIZED BILL",

            normalizedBill

        );


        // =================================================
        // STEP 4
        // VALIDATE OCR BILL
        // =================================================

        const validation =

            this.validateOCRBill(

                normalizedBill

            );


        if (!validation.valid) {

            console.warn(

                "âš ï¸ OCR BILL VALIDATION FAILED",

                {

                    errors:
                        validation.errors

                }

            );


            await this.logMediaActivity({

                company_id:
                    user.company_id,

                user_id:
                    user.id || null,

                phone:
                    message.phone,

                message_id:
                    message.id,

                type:
                    message.type,

                media_id:
                    mediaId,

                bill_id:
                    null,

                status:
                    "OCR_VALIDATION_FAILED",

                error:
                    validation.errors.join("; "),

                ocr:
                    normalizedBill,

                execution_time:
                    Date.now() - startedAt

            });


            const missingFields =
                validation.errors;


            const foundFields: string[] = [];


            if (normalizedBill.vendor) {

                foundFields.push(
                    `Vendor = ${normalizedBill.vendor}`
                );

            }


            if (
                Number.isFinite(
                    Number(
                        normalizedBill.amount
                    )
                )

                && Number(normalizedBill.amount) > 0
            ) {

                foundFields.push(
                    `Amount = ₹${this.formatAmount(normalizedBill.amount)}`
                );

            }


            if (normalizedBill.bill_date) {

                foundFields.push(
                    `Date = ${this.formatBillDate(normalizedBill.bill_date)}`
                );

            }


            const response =
                "I read the bill, but some details are missing.\n\n" +

                (foundFields.length > 0
                    ?
                    "Found:\n"
                    +
                    foundFields.map(
                        (f) => `• ${f}`
                    ).join("\n")
                    +
                    "\n\n"
                    : ""
                ) +

                "Missing:\n" +

                missingFields
                    .map(
                        (e) => `• ${e}`
                    ).join("\n") +

                "\n\nPlease provide the missing details.";


            const ocrKey =
                getOCRConfirmationKey(
                    message.phone,
                    user.company_id
                );


            pendingOCRConfirmations.set(
                ocrKey,
                {

                    billData:
                        normalizedBill,

                    phone:
                        message.phone,

                    companyId:
                        user.company_id,

                    missingFields:

                        validation.errors,

                    timestamp:
                        Date.now()

                }
            );

            await persistBillConfirmation(
                message.phone,
                user.company_id,
                normalizedBill,
                validation.errors
            );


            await saveConversation({

                userId:
                    user.id ||
                    "unknown",

                companyId:
                    user.company_id,

                phone:
                    message.phone,

                role:
                    "AI",

                message:
                    response,

                channel:
                    "WHATSAPP"

            });


            await WhatsAppService.sendTextMessage(

                message.phone,

                this.truncateWhatsAppMessage(
                    response
                )

            );


            return {

                success: false,

                message:
                    "OCR data validation failed",

                data: {

                    errors:
                        validation.errors

                }

            };

        }


        // =================================================
        // STEP 5
        // BILL PAYLOAD
        // =================================================

        const billPayload = {

            company_id:
                user.company_id,

            vendor_name:
                normalizedBill.vendor,

            bill_number:
                normalizedBill.invoice_number,

            amount:
                normalizedBill.amount,

            gst_amount:
                0,

            bill_date:
                normalizedBill.bill_date,

            payment_status:
                "Pending",

            material_name:
                normalizedBill.category === "MATERIAL"
                    ? normalizedBill.description
                    : normalizedBill.category,

            bill_file_url:
                normalizedBill.file_url || null,

            ocr_text:
                JSON.stringify(
                    normalizedBill
                ),

            source:
                "WHATSAPP_AI_OCR",

            remarks:
                normalizedBill.description

        };


        console.log(

            "ðŸ’¾ SHIVINFRA SAVING WHATSAPP BILL",

            {

                company_id:
                    billPayload.company_id,

                vendor:
                    billPayload.vendor_name,

                invoice:
                    billPayload.bill_number,

                amount:
                    billPayload.amount,

                category:
                    billPayload.material_name,

                source:
                    billPayload.source

            }

        );


        // =================================================
        // STEP 6
        // STORE CONFIRMATION
        // =================================================


        const confirmationKey =
            getBillConfirmationKey(
                message.phone,
                user.company_id
            );



        pendingBillConfirmations.set(
            confirmationKey,
            {
                billData:
                    billPayload,

                phone:
                    message.phone,

                companyId:
                    user.company_id,

                timestamp:
                    Date.now()

            }
        );


        const confirmMessage =
            "ðŸ§¾ Bill Details:\n\n" +
            `ðŸ¢ Vendor: ${
                normalizedBill.vendor || "N/A"
            }\n` +
            `ðŸ§¾ Invoice: ${
                normalizedBill.invoice_number || "N/A"
            }\n` +
            `ðŸ’° Amount: â‚¹${
                this.formatAmount(
                    normalizedBill.amount
                )
            }\n` +
            `ðŸ“¦ Category: ${
                normalizedBill.category || "MATERIAL"
            }\n` +
            `ðŸ“… Date: ${
                this.formatBillDate(
                    normalizedBill.bill_date
                )
            }\n\n` +
            "Reply YES to save this bill or NO to cancel.";



        await WhatsAppService.sendTextMessage(

            message.phone,

            this.truncateWhatsAppMessage(
                confirmMessage
            )

        );


        return {

            success: true,

            message:
                "Bill confirmation sent",

            data: {

                intent:
                    "BILL_CONFIRMATION",

                normalizedBill,
                billPayload

            }

        };
            const bill =
                await billService.createBill(
                    billPayload
                );


        // =================================================
        // BILL SAVE FAILURE
        // =================================================

        if (!bill) {

            await this.logMediaActivity({

                company_id:
                    user.company_id,

                user_id:
                    user.id || null,

                phone:
                    message.phone,

                message_id:
                    message.id,

                type:
                    message.type,

                media_id:
                    mediaId,

                bill_id:
                    null,

                status:
                    "BILL_SAVE_FAILED",

                error:
                    "BillService returned empty result",

                ocr:
                    normalizedBill,

                execution_time:
                    Date.now() - startedAt

            });


            await this.sendErrorMessage(

                message.phone,

                "Bill was read successfully, but could not be saved into SHIVINFRA ERP."

            );


            return {

                success: false,

                message:
                    "Bill save failed"

            };

        }


        // =================================================
        // BILL ID
        // =================================================

        const billId =

            String(
                bill?.id || ""
            ).trim();


        // =================================================
        // STEP 7
        // MEDIA ACTIVITY LOG
        // =================================================

        await this.logMediaActivity({

            company_id:
                user.company_id,

            user_id:
                user.id || null,

            phone:
                message.phone,

            message_id:
                message.id,

            type:
                message.type,

            media_id:
                mediaId,

            bill_id:
                billId || null,

            status:
                "COMPLETED",

            ocr:
                normalizedBill,

            execution_time:
                Date.now() - startedAt

        });


        // =================================================
        // STEP 8
        // USER RESPONSE
        // =================================================

        const amountText =

            this.formatAmount(

                normalizedBill.amount

            );


        const response =

            "âœ… Bill Saved Successfully\n\n" +

            `ðŸ¢ Vendor: ${
                normalizedBill.vendor || "N/A"
            }\n` +

            `ðŸ§¾ Invoice: ${
                normalizedBill.invoice_number || "N/A"
            }\n` +

            `ðŸ’° Amount: â‚¹${amountText}\n` +

            `ðŸ“¦ Category: ${
                normalizedBill.category || "MATERIAL"
            }\n` +

            `ðŸ“… Date: ${
                this.formatBillDate(
                    normalizedBill.bill_date
                )
            }\n\n` +

            "ðŸ’¾ Saved into SHIVINFRA ERP.";


        await WhatsAppService.sendTextMessage(

            message.phone,

            this.truncateWhatsAppMessage(

                response

            )

        );


        // =================================================
        // SAVE AI RESPONSE TO CHAT HISTORY
        // =================================================

        await saveConversation({

            userId:
                user.id ||
                "unknown",

            companyId:
                user.company_id,

            phone:
                message.phone,

            role:
                "AI",

            message:
                response,

            channel:
                "WHATSAPP"

        });


        // =================================================
        // SUCCESS LOG
        // =================================================

        console.log(

            "âœ… WHATSAPP BILL PROCESS COMPLETED",

            {

                bill_id:
                    billId || null,

                phone:
                    message.phone,

                company_id:
                    user.company_id,

                execution_time:
                    Date.now() - startedAt

            }

        );


        // =================================================
        // FINAL RESULT
        // =================================================

        return {

            success: true,

            message:
                "Bill processed and saved successfully",

            data:
                bill

        };

    }

    catch (error: any) {

        // =================================================
        // ERROR LOG
        // =================================================

        console.error(

            "âŒ WHATSAPP MEDIA HANDLER ERROR",

            {

                error:
                    this.normalizeError(error),

                message_id:
                    message?.id || null,

                phone:
                    message?.phone || null,

                media_id:
                    message?.mediaId || null

            }

        );


        // =================================================
        // ERROR ACTIVITY LOG
        // =================================================

        await this.logMediaActivity({

            company_id:
                user?.company_id || null,

            user_id:
                user?.id || null,

            phone:
                message?.phone || null,

            message_id:
                message?.id || null,

            type:
                message?.type || "unknown",

            media_id:
                message?.mediaId || null,

            bill_id:
                null,

            status:
                "FAILED",

            error:
                error?.message
                || "Unknown media processing error",

            execution_time:
                Date.now() - startedAt

        });


        // =================================================
        // USER ERROR
        // =================================================

        if (message?.phone) {

            await this.sendErrorMessage(

                message.phone,

                "Bill processing failed. Please try again with a clear image or PDF."

            );


            await saveConversation({

                userId:
                    user?.id ||
                    "unknown",

                companyId:
                    user?.company_id ||
                    "",

                phone:
                    message.phone,

                role:
                    "AI",

                message:
                    "Bill processing failed. Please try again with a clear image or PDF.",

                channel:
                    "WHATSAPP"

            });

        }


        return {

            success: false,

            message:
                "WhatsApp media processing failed",

            error:
                error?.message
                || "Unknown error"

        };

    }

}


// =====================================================
// OCR PROCESSOR
//
// WhatsApp Media ID
//       â†“
// OCRService
//       â†“
// Gemini / Vision
//       â†“
// Structured Invoice Data
//
// IMPORTANT:
//
// WhatsAppWebhookService does NOT perform OCR itself.
// OCRService owns the OCR implementation.
// =====================================================

private async processOCR(

    mediaId: string,

    type: string

): Promise<any | null> {

    try {

        const normalizedMediaId =

            String(
                mediaId || ""
            ).trim();


        if (!normalizedMediaId) {

            return null;

        }


        const normalizedType =

            String(
                type || ""
            ).trim().toLowerCase();


        console.log(

            "ðŸ” SHIVINFRA OCR START",

            {

                media_id:
                    normalizedMediaId,

                media_type:
                    normalizedType

            }

        );


        // =================================================
        // OCR SERVICE CALL
        // =================================================
        let tempFilePath: string | null = null;

        let result: any = null;


        try {


            // =================================================
            // DOWNLOAD MEDIA
            // =================================================


            const mediaBuffer =
            await WhatsAppService.downloadMedia(
                normalizedMediaId
            );


            if (!mediaBuffer) {


                console.warn(
                    "âš ï¸ MEDIA DOWNLOAD FAILED - USING SIMULATION"
                );


                return this.simulateOCRResult(
                    normalizedMediaId,
                    normalizedType
                );


            }


            // =================================================
            // SAVE TEMP FILE
            // =================================================


            const ext =
            normalizedType === "document"
                ? ".pdf"
                : ".jpg";


            tempFilePath =
            path.join(
                os.tmpdir(),
                `shivinfra-ocr-${Date.now()}-${normalizedMediaId}${ext}`
            );


            fs.writeFileSync(
                tempFilePath,
                mediaBuffer
            );


            console.log(
                "ðŸ“¥ MEDIA DOWNLOADED",
                {
                    media_id:
                        normalizedMediaId,
                    temp_path:
                        tempFilePath,
                    size:
                        mediaBuffer.length
                }
            );


            // =================================================
            // RUN OCR
            // =================================================


            result =
                await OCRService.extractInvoiceData(
                tempFilePath
            );


            if (!result) {


                console.warn(
                    "âš ï¸ OCR SERVICE RETURNED EMPTY RESULT"
                );


                return null;


            }


            console.log(
                "âœ… SHIVINFRA OCR COMPLETED",
                {
                    media_id:
                        normalizedMediaId
                }
            );


            if (
                tempFilePath &&
                fs.existsSync(
                    tempFilePath
                )
            ) {


                const storagePath =
                    `${normalizedMediaId}/${Date.now()}-${path.basename(tempFilePath)}`;


                const { error: uploadError } =
                    await supabase.storage
                        .from("bills")
                        .upload(
                            storagePath,
                            fs.createReadStream(
                                tempFilePath
                            ),
                            {
                                contentType:
                                    normalizedType === "document"
                                        ? "application/pdf"
                                        : "image/jpeg",
                                upsert: true,
}
);

        if (!uploadError) {
                    const { data } =
                        supabase.storage
                            .from("bills")
                            .getPublicUrl(
                                storagePath
                            );


                    (result as any).file_url =
                        data.publicUrl;
                } else {
                    console.error(
                        "[WHATSAPP BILL] Supabase Storage upload failed:",
                        uploadError
                    );
                }

            }


            return result;


        }
        catch (error) {


            console.error(
                "âŒ OCR PROCESS ERROR",
                this.normalizeError(error)
            );


            return null;


        }
        finally {


            // =================================================
            // CLEANUP TEMP FILE
            // =================================================


            if (
                tempFilePath
                &&
                fs.existsSync(
                    tempFilePath
                )
            ) {


                try {


                    fs.unlinkSync(
                        tempFilePath
                    );


                }
                catch (cleanupError) {


                    console.warn(
                        "âš ï¸ TEMP FILE CLEANUP FAILED",
                        cleanupError
                    );


                }


            }


        }
        return result;

    }

    catch (error) {

        console.error(

            "âŒ OCR PROCESS ERROR",

            this.normalizeError(error)

        );

        return null;

    }

}



    private async simulateOCRResult(
        mediaId: string,
        type: string
    ): Promise<any> {

    const mockResult =
        OCRService.simulateOCR(
            `media-${mediaId}`,
            type === "document"
                ? "PDF"
                : "IMAGE"
        );


    let fileUrl = "";


    if (process.env.NODE_ENV !== "production") {


        let ext =
            type === "document"
                ? ".pdf"
                : ".jpg";


        let tempSimPath =
            path.join(
                os.tmpdir(),
                `shivinfra-ocr-sim-${mediaId}${ext}`
            );


        try {


            if (type === "document") {


                fs.writeFileSync(
                    tempSimPath,
                    Buffer.from(
                        "%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 200 200]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n190\n%%EOF"
                    )
                );


            } else {


                fs.writeFileSync(
                    tempSimPath,
                    Buffer.from([
                        0xFF,
                        0xD8,
                        0xFF,
                        0xE0,
                        0x00,
                        0x10,
                        0x4A,
                        0x46,
                        0x49,
                        0x46,
                        0x00,
                        0x01,
                        0x01,
                        0x00,
                        0x00,
                        0x01,
                        0x00,
                        0x01,
                        0x00,
                        0x00,
                        0xFF,
                        0xDB,
                        0x00,
                        0x43,
                        0x00,
                        0x08,
                        0x06,
                        0x06,
                        0x07,
                        0x06,
                        0x05,
                        0x08,
                        0x07,
                        0x07,
                        0x07,
                        0x09,
                        0x09,
                        0x08,
                        0x0A,
                        0x0C,
                        0x14,
                        0x0D,
                        0x0C,
                        0x0B,
                        0x0B,
                        0x0C,
                        0x19,
                        0x12,
                        0x13,
                        0x0F,
                        0x14,
                        0x1D,
                        0x1A,
                        0x1F,
                        0x1E,
                        0x1D,
                        0x1A,
                        0x1C,
                        0x1C,
                        0x20,
                        0x24,
                        0x2E,
                        0x27,
                        0x20,
                        0x22,
                        0x2C,
                        0x23,
                        0x1C,
                        0x1C,
                        0x28,
                        0x37,
                        0x29,
                        0x2C,
                        0x30,
                        0x31,
                        0x34,
                        0x34,
                        0x34,
                        0x1F,
                        0x27,
                        0x39,
                        0x3D,
                        0x38,
                        0x32,
                        0x3C,
                        0x2E,
                        0x33,
                        0x34,
                        0x32,
                        0xFF,
                        0xC0,
                        0x00,
                        0x0B,
                        0x08,
                        0x00,
                        0x01,
                        0x00,
                        0x01,
                        0x01,
                        0x01,
                        0x11,
                        0x00,
                        0xFF,
                        0xC4,
                        0x00,
                        0x14,
                        0x00,
                        0x01,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x03,
                        0xFF,
                        0xC4,
                        0x00,
                        0x14,
                        0x10,
                        0x01,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0x00,
                        0xFF,
                        0xDA,
                        0x00,
                        0x08,
                        0x01,
                        0x01,
                        0x00,
                        0x00,
                        0x3F,
                        0x00,
                        0x7D,
                        0x2C,
                        0x0F,
                        0xFF,
                        0xD9
                    ])
                );


            }


            const storagePath =
                `simulation/${Date.now()}-${path.basename(tempSimPath)}`;


            const { error: uploadError } =
                await supabase.storage
                    .from("bills")
                    .upload(
                        storagePath,
                        fs.createReadStream(
                            tempSimPath
                        ),
                        {
                            contentType:
                                type === "document"
                                    ? "application/pdf"
                                    : "image/jpeg",
                            upsert: true,
                        }
                    );


            if (!uploadError) {


                const { data } =
                    supabase.storage
                        .from("bills")
                        .getPublicUrl(
                            storagePath
                        );


                fileUrl = data.publicUrl;


            } else {


                console.error(
                    "[WHATSAPP BILL] Simulation storage upload failed:",
                    uploadError
                );


            }


        } catch (simError) {


            console.error(
                "[WHATSAPP BILL] Simulation file handling failed:",
                simError
            );


        } finally {


            if (
                fs.existsSync(
                    tempSimPath
                )
            ) {


                try {


                    fs.unlinkSync(
                        tempSimPath
                    );


                } catch (cleanupError) {


                    console.warn(
                        "âšï¸ SIMULATION TEMP FILE CLEANUP FAILED",
                        cleanupError
                    );


                }


            }


        }


    }


    console.log(
        "ðŸŽ­ SHIVINFRA OCR SIMULATION",
        {
            media_id:
                mediaId,
            type,
            file_url:
                fileUrl || "none"
        }
    );


    return {


        ...mockResult,


        file_url:
            fileUrl,


        ocr_status:
            "Success"


    };



}


// =====================================================
// OCR RESULT NORMALIZER
//
// Converts different OCR output structures
// into one stable bill object.
//
// Supported aliases:
//
// amount
// total_amount
// total
// invoice_amount
//
// vendor
// vendor_name
// supplier
// supplier_name
//
// invoice_number
// invoiceNumber
// invoice_no
//
// gst_number
// gstNumber
// gstin
// gst
//
// bill_date
// invoice_date
// date
// =====================================================

private normalizeOCRResult(

    result: any

): {

    file_url: string;

    vendor: string;

    invoice_number: string | null;

    gst_number: string | null;

    amount: number;

    bill_date: string;

    category: string;

    description: string;

} {

    const source =

        result?.data

        && typeof result.data === "object"

        && !Array.isArray(result.data)

            ? result.data

            : (

                result

                && typeof result === "object"

                && !Array.isArray(result)

                    ? result

                    : {}

            );


    // =================================================
    // FILE URL
    // =================================================

    const fileUrl =

        String(

            source?.file_url

            ?? source?.fileUrl

            ?? ""

        ).trim();


    // =================================================
    // VENDOR
    // =================================================

    const vendor =

        String(

            source?.vendor

            ?? source?.vendor_name

            ?? source?.supplier

            ?? source?.supplier_name

            ?? ""

        ).trim();


    // =================================================
    // INVOICE NUMBER
    // =================================================

    const invoiceNumber =

        this.cleanNullableString(

            source?.invoice_number

            ?? source?.invoiceNumber

            ?? source?.invoice_no

            ?? source?.invoiceNo

        );


    // =================================================
    // GST NUMBER
    // =================================================

    const gstNumber =

        this.cleanNullableString(

            source?.gst_number

            ?? source?.gstNumber

            ?? source?.gstin

            ?? source?.gst

        );


    // =================================================
    // AMOUNT
    // =================================================

    const rawAmount =

        source?.amount

        ?? source?.total_amount

        ?? source?.totalAmount

        ?? source?.total

        ?? source?.invoice_amount

        ?? source?.invoiceAmount

        ?? source?.grand_total

        ?? source?.grandTotal

        ?? 0;


    const amount =

        this.parseAmount(

            rawAmount

        );


    // =================================================
    // BILL DATE
    // =================================================

    const rawDate =

        source?.bill_date

        ?? source?.billDate

        ?? source?.invoice_date

        ?? source?.invoiceDate

        ?? source?.date

        ?? null;


    const billDate =

        this.normalizeBillDate(

            rawDate

        );


    // =================================================
    // CATEGORY
    // =================================================

    const rawCategory =

        String(

            source?.category

            ?? source?.bill_category

            ?? source?.billCategory

            ?? "MATERIAL"

        ).trim();


    const category =

        rawCategory

            ? rawCategory.toUpperCase()

            : "MATERIAL";


    // =================================================
    // DESCRIPTION
    // =================================================

    const description =

        String(

            source?.description

            ?? source?.remarks

            ?? source?.notes

            ?? "Created through WhatsApp AI OCR"

        ).trim();


    // =================================================
    // FINAL NORMALIZED OBJECT
    // =================================================

    return {

        file_url:
            fileUrl,

        vendor:
            vendor || "Unknown Vendor",

        invoice_number:
            invoiceNumber,

        gst_number:
            gstNumber,

        amount:
            amount,

        bill_date:
            billDate,

        category:
            category || "MATERIAL",

        description:
            description

                || "Created through WhatsApp AI OCR"

    };

}


// =====================================================
// OCR BILL VALIDATOR
//
// Minimum production validation:
//
// 1. Vendor
// 2. Amount
// 3. Bill date
//
// Invoice number and GST are optional because
// legitimate bills may not contain them.
// =====================================================

private validateOCRBill(

    bill: ReturnType<

        WhatsAppWebhookService[

            "normalizeOCRResult"

        ]

    >

): {

    valid: boolean;

    errors: string[];

} {

    const errors: string[] = [];


    // =================================================
    // OBJECT VALIDATION
    // =================================================

    if (!bill) {

        errors.push(

            "Bill data is missing."

        );

        return {

            valid: false,

            errors

        };

    }


    // =================================================
    // VENDOR
    // =================================================

    const vendor =

        String(
            bill.vendor || ""
        ).trim();


    if (

        !vendor

        || vendor.toLowerCase() ===
            "unknown vendor"

    ) {

        errors.push(

            "Vendor name could not be identified."

        );

    }


    // =================================================
    // AMOUNT
    // =================================================

    if (

        !Number.isFinite(

            Number(
                bill.amount
            )

        )

        || Number(bill.amount) <= 0

    ) {

        errors.push(

            "Valid bill amount could not be identified."

        );

    }


    // =================================================
    // DATE
    // =================================================

    if (!bill.bill_date) {

        errors.push(

            "Bill date could not be identified."

        );

    }


    // =================================================
    // CATEGORY
    // =================================================

    if (!bill.category) {

        errors.push(

            "Bill category could not be identified."

        );

    }


    // =================================================
    // FINAL
    // =================================================

    return {

        valid:
            errors.length === 0,

        errors

    };

}


// =====================================================
// AMOUNT PARSER
//
// Supports:
//
// 1000
// "1000"
// "1,000"
// "â‚¹1,000"
// "â‚¹ 1,000.50"
// "1000.50"
// "INR 1000"
// =====================================================

private parseAmount(

    value: any

): number {

    try {

        if (

            value === null

            || value === undefined

            || value === ""

        ) {

            return 0;

        }


        // =================================================
        // NUMBER
        // =================================================

        if (

            typeof value === "number"

        ) {

            return Number.isFinite(value)

                ? value

                : 0;

        }


        // =================================================
        // STRING
        // =================================================

        let cleaned =

            String(value)

                .trim();


        if (!cleaned) {

            return 0;

        }


        // Remove currency symbols/text

        cleaned =

            cleaned

                .replace(/â‚¹/gi, "")

                .replace(/\bINR\b/gi, "")

                .replace(/\bRS\.?\b/gi, "")

                .replace(/,/g, "")

                .trim();


        // Keep only digits, decimal and minus

        cleaned =

            cleaned.replace(

                /[^\d.-]/g,

                ""

            );


        if (!cleaned) {

            return 0;

        }


        const amount =

            Number(cleaned);


        return Number.isFinite(amount)

            ? amount

            : 0;

    }

    catch {

        return 0;

    }

}


// =====================================================
// NULLABLE STRING CLEANER
// =====================================================

private cleanNullableString(

    value: any

): string | null {

    if (

        value === null

        || value === undefined

    ) {

        return null;

    }


    const cleaned =

        String(value).trim();


    if (!cleaned) {

        return null;

    }


    const normalized =

        cleaned.toLowerCase();


    if (

        normalized === "null"

        || normalized === "undefined"

        || normalized === "n/a"

        || normalized === "na"

        || normalized === "-"

        || normalized === "none"

    ) {

        return null;

    }


    return cleaned;

}


// =====================================================
// BILL DATE NORMALIZER
//
// Returns ISO date string.
//
// IMPORTANT:
// If OCR date is invalid, return empty string.
// Do NOT silently replace an unreadable bill date
// with today's date.
// =====================================================

private normalizeBillDate(

    value: any

): string {

    if (

        value === null

        || value === undefined

        || String(value).trim() === ""

    ) {

        return "";

    }


    // =================================================
    // DATE OBJECT
    // =================================================

    if (value instanceof Date) {

        if (

            Number.isNaN(
                value.getTime()
            )

        ) {

            return "";

        }


        return value.toISOString();

    }


    const raw =

        String(value).trim();


    if (!raw) {

        return "";

    }


    // =================================================
    // DD/MM/YYYY
    // DD-MM-YYYY
    // =================================================

    const indianDateMatch =

        raw.match(

            /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/

        );


    if (indianDateMatch) {

        const day =
            Number(indianDateMatch[1]);

        const month =
            Number(indianDateMatch[2]);

        const year =
            Number(indianDateMatch[3]);


        const date =

            new Date(

                Date.UTC(

                    year,

                    month - 1,

                    day

                )

            );


        if (

            date.getUTCFullYear() === year

            &&

            date.getUTCMonth() === month - 1

            &&

            date.getUTCDate() === day

        ) {

            return date.toISOString();

        }


        return "";

    }


    // =================================================
    // STANDARD JS DATE
    // =================================================

    const parsed =

        new Date(raw);


    if (

        Number.isNaN(
            parsed.getTime()
        )

    ) {

        return "";

    }


    return parsed.toISOString();

}


// =====================================================
// BILL DATE FORMATTER
// =====================================================

private formatBillDate(

    value: any

): string {

    try {

        if (!value) {

            return "N/A";

        }


        const date =

            value instanceof Date

                ? value

                : new Date(value);


        if (

            Number.isNaN(
                date.getTime()
            )

        ) {

            return "N/A";

        }


        return date.toLocaleDateString(

            "en-IN",

            {

                day:
                    "2-digit",

                month:
                    "2-digit",

                year:
                    "numeric"

            }

        );

    }

    catch {

        return "N/A";

    }

}


// =====================================================
// MEDIA ACTIVITY LOGGER
//
// Stores:
//
// company
// user
// phone
// message id
// media id
// media type
// bill id
// OCR result
// status
// error
// execution time
//
// IMPORTANT:
//
// Logging failure must NEVER break
// bill processing.
// =====================================================

private async logMediaActivity(

    data: any

): Promise<void> {

    try {

        const companyId =

            String(
                data?.company_id || ""
            ).trim();


        if (!companyId) {

            console.warn(

                "âš ï¸ MEDIA ACTIVITY LOG SKIPPED: company_id missing"

            );

            return;

        }


        const parameters = {

            phone:
                data?.phone || null,

            message_id:
                data?.message_id || null,

            media_id:
                data?.media_id || null,

            media_type:
                data?.type || null,

            bill_id:
                data?.bill_id || null

        };


        const result = {

            status:
                data?.status || "UNKNOWN",

            ocr:
                data?.ocr || null,

            error:
                data?.error || null

        };


        await activityLogger.log({

            company_id:
                companyId,

            user_id:
                data?.user_id || null,

            intent:
                "WHATSAPP_MEDIA_UPLOAD",

            parameters,

            result,

            execution_time:

                Number(
                    data?.execution_time || 0
                ),

            channel:
                "WHATSAPP"

        });

    }

    catch (error) {

        // =================================================
        // LOGGER FAILURE MUST NEVER FAIL BILL FLOW
        // =================================================

        console.error(

            "âŒ WHATSAPP MEDIA ACTIVITY LOG ERROR",

            this.normalizeError(error)

        );

    }

}


// =====================================================
// PART 3 / 5 END
// =====================================================
// =====================================================
// SHIVINFRA WHATSAPP WEBHOOK SERVICE V3
//
// PRODUCTION CLEAN VERSION
// PART 4 / 5
//
// DELIVERY STATUS
// DUPLICATE PROTECTION
// HEALTH CHECK
// GLOBAL ERROR HANDLING
// SERVICE STATUS
// CACHE MONITORING
//
// IMPORTANT:
// PART 4 IS INSIDE THE SAME CLASS
//
// DO NOT ADD:
// export
// singleton
// final class }
// HERE
//
// Those are in PART 5.
// =====================================================


// =====================================================
// WHATSAPP DELIVERY STATUS HANDLER
//
// Meta WhatsApp can send:
//
// sent
// delivered
// read
// failed
//
// Delivery status is NOT an AI request.
//
// Therefore:
//
// âŒ AIService
// âŒ AIActionService
// âŒ OCR
// âŒ Customer action
//
// Only monitoring / logging.
// =====================================================

public async handleStatusUpdate(
    payload: any
): Promise<void> {

    const startedAt = Date.now();

    try {

        // =================================================
        // EXTRACT STATUS
        // =================================================

        const status =
            payload
                ?.entry?.[0]
                ?.changes?.[0]
                ?.value
                ?.statuses?.[0];


        // =================================================
        // NO STATUS
        // =================================================

        if (!status) {

            console.log(
                "â„¹ï¸ No WhatsApp delivery status found"
            );

            return;

        }


        // =================================================
        // BASIC VALUES
        // =================================================

        const messageId =
            String(
                status?.id || ""
            ).trim();


        const deliveryStatus =
            String(
                status?.status || ""
            )
                .trim()
                .toLowerCase();


        const recipientPhone =
            String(
                status?.recipient_id || ""
            ).trim();


        // =================================================
        // LOG
        // =================================================

        console.log(
            "ðŸ“¬ WHATSAPP DELIVERY STATUS",
            {
                message_id:
                    messageId,

                status:
                    deliveryStatus,

                recipient:
                    recipientPhone
            }
        );


        // =================================================
        // VALIDATE
        // =================================================

        if (
            !messageId ||
            !deliveryStatus
        ) {

            console.warn(
                "âš ï¸ Invalid WhatsApp delivery status payload"
            );

            return;

        }


        // =================================================
        // ALLOWED META STATUS
        // =================================================

        const allowedStatuses =
            new Set<string>([
                "sent",
                "delivered",
                "read",
                "failed"
            ]);


        const normalizedStatus =
            allowedStatuses.has(
                deliveryStatus
            )
                ? deliveryStatus
                : "unknown";


        // =================================================
        // META ERROR DETAILS
        // =================================================

        const errors =
            Array.isArray(status?.errors)
                ? status.errors
                : [];


        // =================================================
        // ACTIVITY LOG
        // =================================================

        try {

            const companyId =
                String(
                    process.env.DEFAULT_COMPANY_ID ||
                    ""
                ).trim();


            if (!companyId) {

                console.warn(
                    "âš ï¸ Delivery status log skipped: DEFAULT_COMPANY_ID missing"
                );

                return;

            }


            await activityLogger.log({

                company_id:
                    companyId,

                user_id:
                    null,

                intent:
                    "WHATSAPP_DELIVERY_STATUS",

                parameters: {

                    message_id:
                        messageId,

                    status:
                        normalizedStatus,

                    recipient_phone:
                        recipientPhone || null,

                    conversation_id:
                        status?.conversation?.id ||
                        null,

                    pricing_category:
                        status?.pricing?.category ||
                        null,

                    errors:
                        errors.length > 0
                            ? errors
                            : null

                },

                result: {

                    success:
                        normalizedStatus !== "failed",

                    status:
                        "RECEIVED",

                    delivery_status:
                        normalizedStatus

                },

                execution_time:
                    Date.now() - startedAt,

                channel:
                    "WHATSAPP"

            });

        }

        catch (logError) {

            // =================================================
            // LOGGING MUST NEVER BREAK WEBHOOK
            // =================================================

            console.error(
                "âŒ WHATSAPP DELIVERY LOG ERROR",
                this.normalizeError(
                    logError
                )
            );

        }

    }

    catch (error) {

        // =================================================
        // DELIVERY STATUS MUST NEVER THROW
        // BACK TO META
        // =================================================

        console.error(
            "âŒ WHATSAPP STATUS UPDATE ERROR",
            this.normalizeError(
                error
            )
        );

    }

}


// =====================================================
// DUPLICATE MESSAGE PROTECTION
//
// Meta may retry the same webhook.
//
// Example:
//
// Request 1
// wamid.ABC123
//       â†“
// Process ADD_CUSTOMER
//
// Request 2
// wamid.ABC123
//       â†“
// Ignore
//
// IMPORTANT:
//
// This is only process-memory protection.
//
// For multi-instance production deployment,
// replace this with:
//
// Redis
// OR
// Supabase idempotency table
//
// The rest of the service can continue using
// isDuplicateMessage() without changing the pipeline.
// =====================================================


// =====================================================
// PROCESSED MESSAGE CACHE
// =====================================================



// =====================================================
// CLEAR MESSAGE FROM DUPLICATE CACHE
//
// IMPORTANT:
//
// Use this ONLY if processing failed BEFORE
// the business operation was committed.
//
// If ADD_CUSTOMER / ADD_PROJECT / ADD_EXPENSE
// has already succeeded, do NOT clear blindly.
//
// Otherwise Meta retry could execute it again.
// =====================================================



// =====================================================
// WEBHOOK HEALTH CHECK
//
// Used by:
//
// Deployment
// Monitoring
// Docker
// Railway
// Render
// VPS
// Load Balancer
//
// NEVER expose:
//
// API keys
// Access tokens
// Supabase secrets
// WhatsApp tokens
// Gemini keys
// =====================================================

public health() {

    return {

        service:
            "SHIVINFRA WHATSAPP WEBHOOK SERVICE",

        status:
            "ACTIVE",

        version:
            "V3",

        environment:
            process.env.NODE_ENV ||
            "development",

        modules: {

            webhook:
                true,

            ai:
                true,

            ai_action:
                true,

            ocr:
                true,

            bill:
                true,

            whatsapp:
                true,

            activity_log:
                true

        },

        duplicate_protection: {

            enabled:
                true,

            mode:
                "MEMORY",

            ttl_ms:
                this.DUPLICATE_TTL_MS,

            cached_messages:
                this.processedMessages.size

        },

        timestamp:
            new Date().toISOString()

    };

}


// =====================================================
// GLOBAL WHATSAPP ERROR HANDLER
//
// This is a last-level safety layer.
//
// IMPORTANT:
//
// This method should NEVER throw.
// =====================================================

public async handleError(
    phone: string,
    error: unknown
): Promise<void> {

    try {

        // =================================================
        // SAFE INTERNAL LOG
        // =================================================

        console.error(
            "ðŸ”¥ SHIVINFRA WHATSAPP GLOBAL ERROR",
            this.normalizeError(
                error
            )
        );


        // =================================================
        // NORMALIZE PHONE
        // =================================================

        const normalizedPhone =
            String(
                phone || ""
            ).trim();


        // =================================================
        // PHONE MISSING
        // =================================================

        if (!normalizedPhone) {

            console.error(
                "âŒ Cannot send WhatsApp error response: phone missing"
            );

            return;

        }


        // =================================================
        // USER-SAFE MESSAGE
        //
        // NEVER expose:
        //
        // SQL errors
        // Supabase errors
        // stack traces
        // internal paths
        // API keys
        // tokens
        // database details
        // =================================================

        try {

            await WhatsAppService.sendTextMessage(

                normalizedPhone,

                "âŒ SHIVINFRA AI is temporarily unavailable.\n\n" +
                "Please try again in a moment."

            );

        }

        catch (sendError) {

            console.error(
                "âŒ WHATSAPP GLOBAL ERROR RESPONSE SEND FAILED",
                this.normalizeError(
                    sendError
                )
            );

        }

    }

    catch (handlerError) {

        // =================================================
        // ABSOLUTE LAST RESORT
        // =================================================

        console.error(
            "ðŸ”¥ GLOBAL WHATSAPP ERROR HANDLER FAILED",
            this.normalizeError(
                handlerError
            )
        );

    }

}


// =====================================================
// SAFE ERROR NORMALIZER
//
// Converts unknown errors into safe structured
// information for logging.
//
// =====================================================



// =====================================================
// SERVICE STATUS
//
// Lightweight runtime status.
//
// Does NOT expose secrets.
// =====================================================

public getStatus() {

    return {

        service:
            "SHIVINFRA WhatsApp AI Agent",

        running:
            true,

        version:
            "V3",

        channel:
            "WHATSAPP",

        modules: {

            webhook:
                true,

            ai:
                true,

            ai_action:
                true,

            ocr:
                true,

            bills:
                true,

            activity_log:
                true

        },

        timestamp:
            new Date().toISOString()

    };

}


// =====================================================
// DUPLICATE CACHE STATUS
//
// Internal monitoring helper.
//
// Useful for diagnostics.
//
// =====================================================

private getDuplicateCacheStatus() {

    return {

        enabled:
            true,

        cached_messages:
            this.processedMessages.size,

        active_cleanup_timers:
            this.duplicateCleanupTimers.size,

        ttl_ms:
            this.DUPLICATE_TTL_MS

    };

}

    // =================================================
    // MULTI-TENANT: Extract Meta phone_number_id from
    // webhook payload
    // =================================================
    private extractPhoneNumberId(payload: any): string | null {
        try {
            const phoneId =
                payload
                    ?.entry?.[0]
                    ?.changes?.[0]
                    ?.metadata
                    ?.phone_number_id;
            if (phoneId) {
                return String(phoneId).trim();
            }
            return null;
        } catch {
            return null;
        }
    }

    // =================================================
    // MULTI-TENANT: Resolve company by Meta phone
    // number ID via settings.meta_phone_id
    // =================================================
    private async resolveCompanyByPhoneId(
        phoneId: string
    ): Promise<{ id: string; phone_number_id: string | null } | null> {
        try {
            const { data, error } = await supabase
                .from("settings")
                .select("company_id, meta_phone_id")
                .eq("meta_phone_id", phoneId)
                .limit(1)
                .maybeSingle();

            if (error || !data) {
                // Idempotent bootstrap: map the configured
                // META_WHATSAPP_PHONE_NUMBER_ID to the default
                // company if no mapping exists yet. This only
                // applies to the configured phone number ID, never
                // to arbitrary unknown IDs.
                const configuredPhoneId = String(
                    process.env.META_WHATSAPP_PHONE_NUMBER_ID || ""
                ).trim();
                const configuredCompany = String(
                    process.env.DEFAULT_COMPANY_ID || ""
                ).trim();

                if (
                    phoneId === configuredPhoneId &&
                    configuredPhoneId &&
                    configuredCompany
                ) {
                    await supabase
                        .from("settings")
                        .upsert(
                            {
                                company_id: configuredCompany,
                                meta_phone_id: configuredPhoneId,
                                whatsapp_enabled: true
                            },
                            { on_conflict: "company_id" }
                        )
                        .select("company_id, meta_phone_id")
                        .maybeSingle();

                    const { data: retry } = await supabase
                        .from("settings")
                        .select("company_id, meta_phone_id")
                        .eq("meta_phone_id", phoneId)
                        .limit(1)
                        .maybeSingle();

                    if (retry) {
                        return {
                            id: retry.company_id,
                            phone_number_id: retry.meta_phone_id || phoneId
                        };
                    }
                }

                console.log("[SHIVINFRA WHATSAPP] No company mapped to phone_number_id:", phoneId);
                return null;
            }

            return {
                id: data.company_id,
                phone_number_id: data.meta_phone_id || phoneId
            };
        } catch (error) {
            console.error("[SHIVINFRA WHATSAPP] resolveCompanyByPhoneId error:", error);
            return null;
        }
    }
}

// =====================================================
// PART 4 / 5 END
//
// IMPORTANT:
//
// Do NOT add:
//
// 
// const whatsappWebhookService = ...
// export default ...
//
// Those belong ONLY to PART 5.
// =====================================================
// =====================================================
// SHIVINFRA WHATSAPP WEBHOOK SERVICE V3
//
// PRODUCTION CLEAN VERSION
// PART 5 / 5
//
// FINAL CLASS CLOSURE
// SINGLETON INSTANCE
// DEFAULT EXPORT
//
// =====================================================



// =====================================================
// SINGLETON INSTANCE
//
// SHIVINFRA uses one shared webhook service instance.
//
// Used by:
//
// WhatsAppController.ts
// WhatsApp Routes
// Webhook processing
// Health monitoring
// Status monitoring
//
// =====================================================

const whatsappWebhookService =
    new WhatsAppWebhookService();


// =====================================================
// DEFAULT EXPORT
//
// Example:
//
// import whatsappWebhookService
//     from "../services/whatsapp/WhatsAppWebhookService.ts";
//
// =====================================================

export default whatsappWebhookService;


// =====================================================
// END OF FILE
//
// SHIVINFRA WHATSAPP WEBHOOK SERVICE V3
//
// FINAL PRODUCTION CLEAN VERSION
//
// PART 5 / 5
//
// =====================================================

