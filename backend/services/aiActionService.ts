// =====================================================
// SHIVINFRA AI ACTION SERVICE V35
// FINAL PRODUCTION CLEAN
// PART 1A / 8
//
// CORE ENGINE
// IMPORTS
// RESPONSE TYPES
// USER CONTEXT
// EXECUTION CONTEXT
// VALIDATION TYPES
// SERVICE CLASS
//
// Production Ready
// Multi-Tenant Safe
// WhatsApp AI Ready
// =====================================================

import projectService from "./projectService.ts";
import customerService from "./customerService.ts";
import leadService from "./leadService.ts";
import expenseService from "./expenseService.ts";

import billService from "./modules/BillService.ts";
import reportService from "./reportService.ts";

import activityLogger from "./activityLoggerService.ts";

import { createFollowUp, getPendingFollowUpForLead } from "./followUpService.ts";
import { WhatsAppService } from "./whatsappService.ts";
import { supabaseAdmin as supabase } from "../config/supabase.ts";

// =====================================================
// RESPONSE INTERFACE
// =====================================================

export interface AIActionResponse {
    success: boolean;
    code: string;
    message: string;
    data?: unknown;
    confidence?: number;
    execution_time?: number;
    timestamp: string;
}

// =====================================================
// USER CONTEXT
// =====================================================

export interface AIUserContext {
    id?: string;

    company_id: string;

    role:
        | "ADMIN"
        | "ENGINEER"
        | "CUSTOMER"
        | "SALES";

    channel?:
        | "WEB"
        | "WHATSAPP";
}

// =====================================================
// EXECUTION CONTEXT
// =====================================================

interface AIExecutionContext {
    intent: string;

    parameters: Record<string, unknown>;

    user: AIUserContext;

    startTime: number;

    confidence: number;
}

// =====================================================
// VALIDATION RESULT
// =====================================================

interface ValidationResult {
    valid: boolean;
    message?: string;
}

// =====================================================
// MAIN SERVICE
// =====================================================

class AIActionService {

    // =================================================
    // CONSTRUCTOR
    // =================================================

    constructor() {

        console.log(
            "🚀 SHIVINFRA AI ACTION SERVICE V35 STARTED"
        );

    }

    // =================================================
    // MAIN EXECUTION PIPELINE
    // =================================================

    public async execute(
        intent: string,
        parameters: Record<string, any> = {},
        user: AIUserContext
    ): Promise<AIActionResponse> {

        const startTime = Date.now();

        try {

            // =============================================
            // AUTHENTICATION VALIDATION
            // =============================================

            if (!user) {

                return this.error(
                    "AUTH_REQUIRED",
                    "User authentication required"
                );

            }

            // =============================================
            // COMPANY VALIDATION
            // =============================================

            if (
                !user.company_id ||
                !String(user.company_id).trim()
            ) {

                return this.error(
                    "COMPANY_REQUIRED",
                    "Company id missing"
                );

            }

            // =============================================
            // ROLE VALIDATION
            // =============================================

            const role = String(
                user.role || ""
            )
                .toUpperCase()
                .trim();

            if (
                role !== "ADMIN" &&
                role !== "ENGINEER" &&
                role !== "CUSTOMER"
            ) {

                return this.error(
                    "INVALID_ROLE",
                    "Invalid user role"
                );

            }

            // =============================================
            // INTENT NORMALIZATION
            // =============================================

            const normalizedIntent = String(
                intent || ""
            )
                .toUpperCase()
                .trim();

            if (!normalizedIntent) {

                return this.error(
                    "INTENT_REQUIRED",
                    "AI intent is required"
                );

            }

            // =============================================
            // CLEAN PARAMETERS
            // =============================================

            const rawParams =
                this.cleanParams(parameters);

            const sanitizedParams =
                this.sanitizeObject(rawParams);

            // =============================================
            // CONFIDENCE
            // =============================================

            const confidenceRaw =
                sanitizedParams.confidence;

            const confidence =
                confidenceRaw === undefined ||
                confidenceRaw === null ||
                confidenceRaw === ""
                    ? 1
                    : Number(confidenceRaw);

            // Confidence must never reach business services.
            delete sanitizedParams.confidence;

            if (
                !Number.isFinite(confidence) ||
                confidence < 0 ||
                confidence > 1
            ) {

                return this.error(
                    "INVALID_CONFIDENCE",
                    "Invalid AI confidence value"
                );

            }

            // =============================================
            // LOW CONFIDENCE PROTECTION
            // =============================================

            if (confidence < 0.70) {

                return {

                    success: false,

                    code: "LOW_CONFIDENCE",

                    message:
                        "AI confidence too low. Please provide more specific information.",

                    confidence,

                    execution_time:
                        Date.now() - startTime,

                    timestamp:
                        new Date().toISOString()

                };

            }

            // =============================================
            // EXECUTION CONTEXT
            // =============================================

            const context: AIExecutionContext = {

                intent:
                    normalizedIntent,

                parameters:
                    sanitizedParams,

                user: {

                    ...user,

                    company_id:
                        String(
                            user.company_id
                        ).trim(),

                    role:
                        role as AIUserContext["role"]

                },

                startTime,

                confidence

            };

            // =============================================
            // REQUEST VALIDATION
            // =============================================

            const validation =
                this.validateRequest(
                    context.intent,
                    context.parameters
                );

            if (!validation.valid) {

                return {

                    ...this.error(
                        "VALIDATION_FAILED",
                        validation.message ||
                        "Invalid request"
                    ),

                    confidence,

                    execution_time:
                        Date.now() - startTime

                };

            }

            // =============================================
            // ROLE PERMISSION CHECK
            // =============================================

            const allowed =
                this.checkPermission(
                    context.intent,
                    context.user.role
                );

            if (!allowed) {

                await this.securityAudit({

                    company_id:
                        context.user.company_id,

                    user_id:
                        context.user.id || null,

                    intent:
                        context.intent,

                    status:
                        "DENIED",

                    channel:
                        context.user.channel ||
                        "WEB"

                });

                return {

                    ...this.error(
                        "PERMISSION_DENIED",
                        "You do not have permission to perform this action."
                    ),

                    confidence,

                    execution_time:
                        Date.now() - startTime

                };

            }

            // =============================================
            // ACTION ROUTER
            // =============================================

            const result =
                await this.routeAction(
                    context
                );

            // =============================================
            // EXECUTION TIME
            // =============================================

            const executionTime =
                Date.now() - startTime;

            // =============================================
            // ACTIVITY LOG
            // =============================================

            await this.logActivity({

                company_id:
                    context.user.company_id,

                user_id:
                    context.user.id || null,

                intent:
                    context.intent,

                parameters:
                    context.parameters,

                result,

                execution_time:
                    executionTime,

                channel:
                    context.user.channel ||
                    "WEB"

            });

            // =============================================
            // SECURITY AUDIT
            // =============================================

            await this.securityAudit({

                company_id:
                    context.user.company_id,

                user_id:
                    context.user.id || null,

                intent:
                    context.intent,

                status:
                    result.success
                        ? "SUCCESS"
                        : "FAILED",

                channel:
                    context.user.channel ||
                    "WEB"

            });

            // =============================================
            // FINAL RESPONSE
            // =============================================

            return {

                ...result,

                confidence,

                execution_time:
                    executionTime,

                timestamp:
                    new Date().toISOString()

            };

        }
        catch (error: any) {

            console.error(
                "❌ AI ACTION SERVICE ERROR",
                {
                    intent,
                    company_id:
                        user?.company_id,
                    error:
                        error?.message ||
                        error
                }
            );

            const executionTime =
                Date.now() - startTime;

            // =============================================
            // ERROR ACTIVITY LOG
            // =============================================

            try {

                await this.logActivity({

                    company_id:
                        user?.company_id || null,

                    user_id:
                        user?.id || null,

                    intent:
                        String(intent || "")
                            .toUpperCase()
                            .trim(),

                    parameters:
                        this.sanitizeObject(
                            this.cleanParams(
                                parameters
                            )
                        ),

                    result: {

                        success: false,

                        code:
                            "SYSTEM_ERROR",

                        message:
                            error?.message ||
                            "AI execution failed"

                    },

                    execution_time:
                        executionTime,

                    channel:
                        user?.channel ||
                        "WEB"

                });

            }
            catch (logError: any) {

                console.error(
                    "❌ AI ERROR ACTIVITY LOG FAILED",
                    logError?.message ||
                    logError
                );

            }

            return {

                ...this.error(
                    "SYSTEM_ERROR",
                    error?.message ||
                    "AI execution failed"
                ),

                execution_time:
                    executionTime

            };

        }

    }

    // =================================================
    // ACTION ROUTER
    // =================================================

    private async routeAction(
        context: AIExecutionContext
    ): Promise<AIActionResponse> {

        const {
            intent,
            parameters,
            user
        } = context;

        switch (intent) {

            // =========================================
            // PROJECT
            // =========================================

            case "ADD_PROJECT":

                return this.addProject(
                    parameters,
                    user.company_id
                );

            case "SEARCH_PROJECTS":

                return this.searchProjects(
                    parameters,
                    user.company_id
                );

            case "UPDATE_PROJECT":

                return this.updateProject(
                    parameters,
                    user.company_id
                );

            case "DELETE_PROJECT":

                return this.deleteProject(
                    parameters,
                    user.company_id
                );

            // =========================================
            // CUSTOMER
            // =========================================

            case "ADD_CUSTOMER":

                return this.addCustomer(
                    parameters,
                    user.company_id
                );

            case "SEARCH_CUSTOMERS":

                return this.searchCustomers(
                    parameters,
                    user.company_id
                );

            case "UPDATE_CUSTOMER":

                return this.updateCustomer(
                    parameters,
                    user.company_id
                );

            case "DELETE_CUSTOMER":

                return this.deleteCustomer(
                    parameters,
                    user.company_id
                );

            // =========================================
            // LEAD
            // =========================================

            case "ADD_LEAD":

                return this.addLead(
                    parameters,
                    user.company_id,
                    user.id || null
                );

            case "SEARCH_LEADS":

                return this.searchLeads(
                    parameters,
                    user.company_id
                );

            case "UPDATE_LEAD":

                return this.updateLead(
                    parameters,
                    user.company_id
                );

            case "DELETE_LEAD":

                return this.deleteLead(
                    parameters,
                    user.company_id
                );

            // =========================================
            // EXPENSE
            // =========================================

            case "ADD_EXPENSE":

                return this.addExpense(
                    parameters,
                    user.company_id,
                    user.id || null
                );

            case "SEARCH_EXPENSES":

                return this.searchExpenses(
                    parameters,
                    user.company_id
                );

            case "UPDATE_EXPENSE":

                return this.updateExpense(
                    parameters,
                    user.company_id
                );

            case "DELETE_EXPENSE":

                return this.deleteExpense(
                    parameters,
                    user.company_id
                );

            // =========================================
            // BILL
            // =========================================

            case "UPLOAD_BILL":

                return this.uploadBill(
                    parameters,
                    user.company_id
                );

            case "SEARCH_BILLS":

                return this.searchBills(
                    parameters,
                    user.company_id
                );

            case "UPDATE_BILL":

                return this.updateBill(
                    parameters,
                    user.company_id
                );

            case "DELETE_BILL":

                return this.deleteBill(
                    parameters,
                    user.company_id
                );

            // =========================================
            // REPORT
            // =========================================

            case "GENERATE_REPORT":

                return this.generateReport(
                    parameters,
                    user.company_id
                );

            // =========================================
            // WHATSAPP
            // =========================================

            case "SEND_WHATSAPP_MESSAGE":

                return this.sendWhatsAppMessage(
                    parameters,
                    user.company_id
                );

            case "CREATE_BROADCAST":

                return this.createBroadcast(
                    parameters,
                    user.company_id
                );

            case "CREATE_FOLLOWUP":

                return this.createFollowUp(
                    parameters,
                    user.company_id
                );

            // =========================================
            // GENERAL CHAT
            // =========================================

            case "GENERAL_CHAT":

                return this.generalChat(
                    parameters,
                    user
                );

            // =========================================
            // UNKNOWN INTENT
            // =========================================

            default:

                return {

                    success: false,

                    code:
                        "INVALID_INTENT",

                    message:
                        `Unsupported intent: ${intent}`,

                    timestamp:
                        new Date().toISOString()

                };

        }

    }

    // =================================================
    // GENERIC ERROR RESPONSE
    // =================================================

    private error(
        code: string,
        message: string
    ): AIActionResponse {

        return {

            success: false,

            code,

            message,

            timestamp:
                new Date().toISOString()

        };

    }

    // =================================================
    // PARAMETER CLEANER
    // =================================================

    private cleanParams(
        params: any
    ): Record<string, any> {

        const clean:
            Record<string, any> = {};

        if (
            !params ||
            typeof params !== "object" ||
            Array.isArray(params)
        ) {

            return clean;

        }

        Object.keys(params).forEach(
            (key) => {

                const value =
                    params[key];

                if (
                    value !== undefined &&
                    value !== null
                ) {

                    clean[key] = value;

                }

            }
        );

        return clean;

    }

    // =================================================
    // END PART 1A / 8
    // =================================================
    // =====================================================
// SHIVINFRA AI ACTION SERVICE V35
// PART 1B / 8
//
// REQUEST VALIDATION
// ROLE PERMISSION ENGINE
// TEXT / NUMBER HELPERS
// PHONE / EMAIL / UUID VALIDATION
// INPUT SANITIZATION
// SECURITY AUDIT
// ACTIVITY LOGGING
//
// Production Ready
// Multi-Tenant Safe
// AI + WhatsApp Ready
// =====================================================


// =====================================================
// REQUEST VALIDATION ENGINE
// =====================================================

private validateRequest(
    intent: string,
    params: Record<string, any>
): ValidationResult {

    const safeParams =
        params || {};

    switch (intent) {

        // =================================================
        // PROJECT
        // =================================================

        case "ADD_PROJECT": {

            const projectName =
                this.safeString(
                    safeParams.project_name ||
                    safeParams.projectName ||
                    safeParams.name
                );

            if (!projectName) {

                return {
                    valid: false,
                    message:
                        "Project name required"
                };

            }

            break;
        }

        case "SEARCH_PROJECTS": {

            // Search can be empty.
            // Example:
            // "show all projects"

            break;
        }

        case "UPDATE_PROJECT":
        case "DELETE_PROJECT": {

            const identifier =
                safeParams.id ||
                safeParams.project_id ||
                safeParams.project_name ||
                safeParams.projectName ||
                safeParams.name ||
                safeParams.query;

            if (!identifier) {

                return {
                    valid: false,
                    message:
                        "Project identifier required"
                };

            }

            break;
        }


        // =================================================
        // CUSTOMER
        // =================================================

        case "ADD_CUSTOMER": {

            const customerName =
                this.safeString(
                    safeParams.full_name ||
                    safeParams.fullName ||
                    safeParams.customer_name ||
                    safeParams.name
                );

            if (!customerName) {

                return {
                    valid: false,
                    message:
                        "Customer name required"
                };

            }

            // Phone is optional.
            if (
                safeParams.phone !== undefined &&
                safeParams.phone !== null &&
                safeParams.phone !== ""
            ) {

                const phone =
                    this.normalizePhone(
                        safeParams.phone
                    );

                if (
                    phone &&
                    !this.validatePhone(phone)
                ) {

                    return {
                        valid: false,
                        message:
                            "Invalid customer phone number"
                    };

                }

            }

            // Email validation only when supplied.
            if (
                safeParams.email &&
                !this.validateEmail(
                    this.safeString(
                        safeParams.email
                    )
                )
            ) {

                return {
                    valid: false,
                    message:
                        "Invalid customer email"
                };

            }

            break;
        }

        case "SEARCH_CUSTOMERS": {

            break;
        }

        case "UPDATE_CUSTOMER":
        case "DELETE_CUSTOMER": {

            const identifier =
                safeParams.id ||
                safeParams.customer_id ||
                safeParams.phone ||
                safeParams.mobile ||
                safeParams.name ||
                safeParams.full_name ||
                safeParams.customer_name ||
                safeParams.query;

            if (!identifier) {

                return {
                    valid: false,
                    message:
                        "Customer identifier required"
                };

            }

            break;
        }


        // =================================================
        // LEAD
        // =================================================

        case "ADD_LEAD": {

            const hasLeadIdentity =
                safeParams.phone ||
                safeParams.mobile ||
                safeParams.name ||
                safeParams.full_name ||
                safeParams.customer_name ||
                safeParams.customer_id;

            if (!hasLeadIdentity) {

                return {
                    valid: false,
                    message:
                        "Lead information required"
                };

            }

            if (safeParams.phone) {

                const phone =
                    this.normalizePhone(
                        safeParams.phone
                    );

                if (
                    !this.validatePhone(phone)
                ) {

                    return {
                        valid: false,
                        message:
                            "Invalid lead phone number"
                    };

                }

            }

            if (safeParams.email) {

                if (
                    !this.validateEmail(
                        this.safeString(
                            safeParams.email
                        )
                    )
                ) {

                    return {
                        valid: false,
                        message:
                            "Invalid lead email"
                    };

                }

            }

            break;
        }

        case "SEARCH_LEADS": {

            break;
        }

        case "UPDATE_LEAD":
        case "DELETE_LEAD": {

            const identifier =
                safeParams.id ||
                safeParams.lead_id ||
                safeParams.phone ||
                safeParams.mobile ||
                safeParams.customer_name ||
                safeParams.name ||
                safeParams.query;

            if (!identifier) {

                return {
                    valid: false,
                    message:
                        "Lead identifier required"
                };

            }

            break;
        }


        // =================================================
        // EXPENSE
        // =================================================

        case "ADD_EXPENSE": {

            const amount =
                this.safeNumber(
                    safeParams.amount ||
                    safeParams.price ||
                    safeParams.cost ||
                    safeParams.total
                );

            if (
                amount === null ||
                amount <= 0
            ) {

                return {
                    valid: false,
                    message:
                        "Valid expense amount required"
                };

            }

            break;
        }

        case "SEARCH_EXPENSES": {

            break;
        }

        case "UPDATE_EXPENSE":
        case "DELETE_EXPENSE": {

            const identifier =
                safeParams.id ||
                safeParams.expense_id ||
                safeParams.title ||
                safeParams.name ||
                safeParams.vendor ||
                safeParams.query;

            if (!identifier) {

                return {
                    valid: false,
                    message:
                        "Expense identifier required"
                };

            }

            break;
        }


        // =================================================
        // BILL
        // =================================================

        case "UPLOAD_BILL": {

            const fileUrl =
                safeParams.file_url ||
                safeParams.url ||
                safeParams.file;

            if (!fileUrl) {

                return {
                    valid: false,
                    message:
                        "Bill file required"
                };

            }

            break;
        }

        case "SEARCH_BILLS": {

            break;
        }

        case "UPDATE_BILL":
        case "DELETE_BILL": {

            const identifier =
                safeParams.id ||
                safeParams.bill_id ||
                safeParams.file_name ||
                safeParams.filename ||
                safeParams.vendor ||
                safeParams.query;

            if (!identifier) {

                return {
                    valid: false,
                    message:
                        "Bill identifier required"
                };

            }

            break;
        }


        // =================================================
        // REPORT
        // =================================================

        case "GENERATE_REPORT": {

            const reportType =
                this.safeString(
                    safeParams.type ||
                    safeParams.report_type ||
                    "SUMMARY"
                ).toUpperCase();

            const allowedReports = [

                "SUMMARY",

                "PROJECT",
                "PROJECTS",

                "CUSTOMER",
                "CUSTOMERS",

                "LEAD",
                "LEADS",

                "EXPENSE",
                "EXPENSES",

                "BILL",
                "BILLS",

                "FINANCIAL",

                "SALES",

                "DASHBOARD"

            ];

            if (
                reportType &&
                !allowedReports.includes(
                    reportType
                )
            ) {

                return {
                    valid: false,
                    message:
                        `Unsupported report type: ${reportType}`
                };

            }

            break;
        }


        // =================================================
        // WHATSAPP MESSAGE
        // =================================================

        case "SEND_WHATSAPP_MESSAGE": {

            const phone =
                this.safeString(
                    safeParams.phone ||
                    safeParams.mobile ||
                    safeParams.to
                );

            if (!phone) {

                return {
                    valid: false,
                    message:
                        "Phone number required"
                };

            }

            if (
                !this.validatePhone(
                    this.normalizePhone(phone)
                )
            ) {

                return {
                    valid: false,
                    message:
                        "Invalid WhatsApp phone number"
                };

            }

            const message =
                this.safeString(
                    safeParams.message ||
                    safeParams.text
                );

            if (!message) {

                return {
                    valid: false,
                    message:
                        "Message required"
                };

            }

            break;
        }


        // =================================================
        // BROADCAST
        // =================================================

        case "CREATE_BROADCAST": {

            const message =
                this.safeString(
                    safeParams.message ||
                    safeParams.text
                );

            if (!message) {

                return {
                    valid: false,
                    message:
                        "Broadcast message required"
                };

            }

            break;
        }


        // =================================================
        // FOLLOW-UP
        // =================================================

        case "CREATE_FOLLOWUP": {

            const hasTarget =
                safeParams.customer_id ||
                safeParams.lead_id ||
                safeParams.phone;

            if (!hasTarget) {

                return {
                    valid: false,
                    message:
                        "Customer, lead or phone required for follow-up"
                };

            }

            break;
        }


        // =================================================
        // GENERAL CHAT
        // =================================================

        case "GENERAL_CHAT": {

            const message =
                this.safeString(
                    safeParams.message ||
                    safeParams.query
                );

            if (!message) {

                return {
                    valid: false,
                    message:
                        "Message required"
                };

            }

            break;
        }


        // =================================================
        // UNKNOWN INTENT
        // =================================================

        default: {

            return {
                valid: false,
                message:
                    `Unsupported intent: ${intent}`
            };

        }

        }


        return {
        valid: true
    };

}


// =====================================================
// ROLE PERMISSION ENGINE
// =====================================================

private checkPermission(
    intent: string,
    role: string
): boolean {

    const userRole =
        String(
            role || "CUSTOMER"
        )
            .toUpperCase()
            .trim();

    const permissions:
        Record<string, string[]> = {

        // =================================================
        // ADMIN
        // =================================================

        ADMIN: [
            "*"
        ],


        // =================================================
        // ENGINEER
        // =================================================

        ENGINEER: [

            // Projects
            "SEARCH_PROJECTS",
            "ADD_PROJECT",
            "UPDATE_PROJECT",

            // Customers
            "SEARCH_CUSTOMERS",
            "ADD_CUSTOMER",
            "UPDATE_CUSTOMER",

            // Leads
            "SEARCH_LEADS",
            "ADD_LEAD",
            "UPDATE_LEAD",

            // Expenses
            "ADD_EXPENSE",
            "SEARCH_EXPENSES",
            "UPDATE_EXPENSE",

            // Bills
            "UPLOAD_BILL",
            "SEARCH_BILLS",

            // Reports
            "GENERATE_REPORT",

            // WhatsApp
            "SEND_WHATSAPP_MESSAGE",

            // General AI
            "GENERAL_CHAT"

        ],


        // =================================================
        // CUSTOMER
        // =================================================

        CUSTOMER: [

            "SEARCH_PROJECTS",

            "ADD_LEAD",

            "GENERAL_CHAT"

        ]

    };

    const allowed =
        permissions[userRole] || [];

    return (
        allowed.includes("*") ||
        allowed.includes(intent)
    );

}


// =====================================================
// TEXT NORMALIZER
// =====================================================

private normalizeText(
    value: any
): string {

    return String(
        value ?? ""
    )
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");

}


// =====================================================
// SAFE STRING
// =====================================================

private safeString(
    value: any
): string {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }

    return String(value)
        .trim();

}


// =====================================================
// SAFE NUMBER CONVERTER
// =====================================================

private safeNumber(
    value: any
): number | null {

    try {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {

            return null;

        }

        if (
            typeof value === "number"
        ) {

            return Number.isFinite(value)
                ? value
                : null;

        }

        let text =
            String(value)
                .toLowerCase()
                .replace(/,/g, "")
                .replace(/₹/g, "")
                .trim();

        if (!text) {

            return null;

        }

        // =============================================
        // CRORE
        // =============================================

        const croreMatch =
            text.match(
                /([\d.]+)\s*(crore|crores|cr)\b/i
            );

        if (croreMatch) {

            const number =
                Number(
                    croreMatch[1]
                );

            return Number.isFinite(number)
                ? number * 10000000
                : null;

        }

        // =============================================
        // LAKH
        // =============================================

        const lakhMatch =
            text.match(
                /([\d.]+)\s*(lakh|lakhs|lac|lacs|l)\b/i
            );

        if (lakhMatch) {

            const number =
                Number(
                    lakhMatch[1]
                );

            return Number.isFinite(number)
                ? number * 100000
                : null;

        }

        // =============================================
        // THOUSAND
        // =============================================

        const thousandMatch =
            text.match(
                /([\d.]+)\s*(thousand|k)\b/i
            );

        if (thousandMatch) {

            const number =
                Number(
                    thousandMatch[1]
                );

            return Number.isFinite(number)
                ? number * 1000
                : null;

        }

        // =============================================
        // NORMAL NUMBER
        // =============================================

        const cleaned =
            text.replace(
                /[^0-9.-]/g,
                ""
            );

        if (!cleaned) {

            return null;

        }

        const number =
            Number(cleaned);

        return Number.isFinite(number)
            ? number
            : null;

    }
    catch {

        return null;

    }

}


// =====================================================
// PHONE NORMALIZER
// =====================================================

private normalizePhone(
    phone: any
): string {

    let value =
        String(phone ?? "")
            .replace(/\D/g, "");

    // =============================================
    // +91XXXXXXXXXX
    // =============================================

    if (
        value.length === 12 &&
        value.startsWith("91")
    ) {

        value =
            value.substring(2);

    }

    // =============================================
    // 0XXXXXXXXXX
    // =============================================

    if (
        value.length === 11 &&
        value.startsWith("0")
    ) {

        value =
            value.substring(1);

    }

    return value;

}


// =====================================================
// EMAIL VALIDATOR
// =====================================================

private validateEmail(
    email: string
): boolean {

    const value =
        this.safeString(email);

    if (!value) {

        return false;

    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(value);

}


// =====================================================
// PHONE VALIDATOR
// =====================================================

private validatePhone(
    phone: string
): boolean {

    const number =
        this.normalizePhone(phone);

    return /^[6-9][0-9]{9}$/
        .test(number);

}


// =====================================================
// UUID VALIDATOR
// =====================================================

private validateUUID(
    id: string
): boolean {

    const value =
        this.safeString(id);

    if (!value) {

        return false;

    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(value);

}


// =====================================================
// INPUT SANITIZER
// =====================================================

private sanitizeInput(
    value: any
): any {

    if (
        typeof value !== "string"
    ) {

        return value;

    }

    return value

        .replace(
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            ""
        )

        .replace(
            /javascript\s*:/gi,
            ""
        )

        .trim();

}


// =====================================================
// OBJECT SANITIZER
// =====================================================

private sanitizeObject(
    data: any
): any {

    if (
        data === null ||
        data === undefined
    ) {

        return data;

    }

    if (
        typeof data === "string"
    ) {

        return this.sanitizeInput(data);

    }

    if (
        typeof data !== "object"
    ) {

        return data;

    }

    if (
        Array.isArray(data)
    ) {

        return data.map(
            item =>
                this.sanitizeObject(item)
        );

    }

    const clean:
        Record<string, any> = {};

    Object.keys(data).forEach(
        key => {

            // =========================================
            // Prototype pollution protection
            // =========================================

            if (
                key === "__proto__" ||
                key === "prototype" ||
                key === "constructor"
            ) {

                return;

            }

            clean[key] =
                this.sanitizeObject(
                    data[key]
                );

        }
    );

    return clean;

}


// =====================================================
// SECURITY AUDIT LOGGER
// =====================================================

private async securityAudit(
    data: any
): Promise<void> {

    try {

        console.log(
            "🔐 SECURITY AUDIT",
            {
                company_id:
                    data?.company_id ||
                    null,

                user_id:
                    data?.user_id ||
                    null,

                intent:
                    data?.intent ||
                    null,

                status:
                    data?.status ||
                    "UNKNOWN",

                channel:
                    data?.channel ||
                    "WEB",

                time:
                    new Date()
                        .toISOString()
            }
        );

    }
    catch (error: any) {

        console.error(
            "❌ SECURITY AUDIT FAILED",
            error?.message ||
            "Unknown security audit error"
        );

    }

}


// =====================================================
// ACTIVITY LOGGER
// =====================================================

private async logActivity(
    data: any
): Promise<void> {

    try {

        await activityLogger.log({

            ...data,

            created_at:
                new Date()
                    .toISOString()

        });

    }
    catch (error: any) {

        // Activity logging must NEVER
        // break the business action.

        console.error(
            "❌ ACTIVITY LOGGER ERROR",
            error?.message ||
            "Unknown activity logger error"
        );

    }

}


// =====================================================
// END PART 1B / 8
// =====================================================
    // =====================================================
    // SHIVINFRA AI ACTION SERVICE V35
    // PART 2 / 8
    //
    // PROJECT AI ENGINE
    //
    // ADD PROJECT
    // SEARCH PROJECTS
    // UPDATE PROJECT
    // DELETE PROJECT
    // SMART PROJECT RESOLVER
    //
    // Production Ready
    // Multi-Tenant Safe
    // AI + WhatsApp Ready
    // =====================================================


    // =====================================================
    // ADD PROJECT
    // =====================================================

    private async addProject(
        params: Record<string, any>,
        companyId: string
    ): Promise<AIActionResponse> {

        try {

            // =============================================
            // NORMALIZE INPUT
            // =============================================

            const projectName =
                this.safeString(
                    params.project_name ||
                    params.projectName ||
                    params.name
                );

            if (!projectName) {

                return this.error(
                    "PROJECT_NAME_REQUIRED",
                    "Project name is required"
                );

            }

            // =============================================
            // BUILD PROJECT PAYLOAD
            // =============================================

            const payload: Record<string, any> = {

                company_id:
                    companyId,

                project_name:
                    projectName

            };

            // =============================================
            // OPTIONAL PROJECT FIELDS
            // =============================================

            const optionalFields = [

                "customer_id",
                "project_type",
                "location",
                "city",
                "state",
                "pincode",
                "description",
                "flat_types",
                "total_units",
                "available_units",
                "area_sqft",
                "price",
                "brochure_url",
                "gallery",
                "amenities",
                "contact_person",
                "contact_number",
                "status"

            ];

            for (
                const field of optionalFields
            ) {

                if (
                    params[field] !== undefined &&
                    params[field] !== null &&
                    params[field] !== ""
                ) {

                    payload[field] =
                        params[field];

                }

            }

            // =============================================
            // COMMON ALIASES
            // =============================================

            if (
                !payload.customer_id &&
                params.customerId
            ) {

                payload.customer_id =
                    params.customerId;

            }

            if (
                !payload.project_type &&
                params.type
            ) {

                payload.project_type =
                    params.type;

            }

            if (
                !payload.area_sqft &&
                params.area
            ) {

                payload.area_sqft =
                    this.safeNumber(
                        params.area
                    );

            }

            if (
                !payload.price &&
                params.budget
            ) {

                payload.price =
                    this.safeNumber(
                        params.budget
                    );

            }

            // =============================================
            // NORMALIZE NUMERIC FIELDS
            // =============================================

            const numericFields = [

                "total_units",
                "available_units",
                "area_sqft",
                "price"

            ];

            for (
                const field of numericFields
            ) {

                if (
                    payload[field] !== undefined
                ) {

                    const number =
                        this.safeNumber(
                            payload[field]
                        );

                    if (
                        number !== null
                    ) {

                        payload[field] =
                            number;

                    }

                }

            }

            // =============================================
            // DEFAULT STATUS
            // =============================================

            if (
                payload.status
            ) {

                payload.status =
                    this.normalizeText(
                        payload.status
                    );

            }

            // =============================================
            // DATABASE ACTION
            // =============================================

            const result =
                await projectService.createProject(
                    payload as any
                );

            if (
                !result
            ) {

                return this.error(
                    "PROJECT_CREATE_FAILED",
                    "Project could not be created"
                );

            }

            // =============================================
            // SUCCESS
            // =============================================

            return {

                success: true,

                code:
                    "PROJECT_CREATED",

                message:
                    `Project "${projectName}" created successfully`,

                data:
                    result,

                timestamp:
                    new Date()
                        .toISOString()

            };

        }
        catch (error: any) {

            console.error(
                "ADD PROJECT ERROR",
                error?.message ||
                error
            );

            return this.error(
                "PROJECT_CREATE_FAILED",
                error?.message ||
                "Failed to create project"
            );

        }

    }


    // =====================================================
    // SEARCH PROJECTS
    // =====================================================

    private async searchProjects(
        params: Record<string, any>,
        companyId: string
    ): Promise<AIActionResponse> {

        try {

            const query =
                this.safeString(
                    params.query ||
                    params.search ||
                    params.name ||
                    params.project_name ||
                    params.projectName
                );

            const filters: Record<string, any> = {

                company_id:
                    companyId

            };

            // =============================================
            // OPTIONAL FILTERS
            // =============================================

            if (query) {

                filters.query =
                    query;

            }

            if (
                params.status
            ) {

                filters.status =
                    this.normalizeText(
                        params.status
                    );

            }

            if (
                params.city
            ) {

                filters.city =
                    this.safeString(
                        params.city
                    );

            }

            if (
                params.project_type
            ) {

                filters.project_type =
                    this.safeString(
                        params.project_type
                    );

            }

            if (
                params.customer_id
            ) {

                filters.customer_id =
                    this.safeString(
                        params.customer_id
                    );

            }

            // =============================================
            // DATABASE SEARCH
            // =============================================

            let result: any;

            /*
             * Keep compatibility with different
             * projectService implementations.
             */

            if (
                typeof (projectService as any)
                    .searchProjects === "function"
            ) {

                result =
                    await (projectService as any)
                        .searchProjects(
                            filters
                        );

            }
            else if (
                typeof (projectService as any)
                    .getProjects === "function"
            ) {

                result =
                    await (projectService as any)
                        .getProjects(
                            filters
                        );

            }
            else if (
                typeof (projectService as any)
                    .getAllProjects === "function"
            ) {

                result =
                    await (projectService as any)
                        .getAllProjects(
                            companyId,
                            filters
                        );

            }
            else {

                throw new Error(
                    "Project search method not available in projectService"
                );

            }

            const projects =
                Array.isArray(result)
                    ? result
                    : result?.data ||
                      result?.projects ||
                      [];

            // =============================================
            // EMPTY RESULT
            // =============================================

            if (
                projects.length === 0
            ) {

                return {

                    success: true,

                    code:
                        "NO_PROJECTS_FOUND",

                    message:
                        query
                            ? `No projects found for "${query}"`
                            : "No projects found",

                    data: [],

                    timestamp:
                        new Date()
                            .toISOString()

                };

            }

            // =============================================
            // SUCCESS
            // =============================================

            return {

                success: true,

                code:
                    "PROJECTS_FOUND",

                message:
                    `${projects.length} project(s) found`,

                data:
                    projects,

                timestamp:
                    new Date()
                        .toISOString()

            };

        }
        catch (error: any) {

            console.error(
                "SEARCH PROJECTS ERROR",
                error?.message ||
                error
            );

            return this.error(
                "PROJECT_SEARCH_FAILED",
                error?.message ||
                "Failed to search projects"
            );

        }

    }


    // =====================================================
    // SMART PROJECT RESOLVER
    // =====================================================

    private async resolveProject(
        params: Record<string, any>,
        companyId: string
    ): Promise<{
        success: boolean;
        project?: any;
        message?: string;
    }> {

        try {

            // =============================================
            // DIRECT UUID
            // =============================================

            const directId =
                this.safeString(
                    params.id ||
                    params.project_id
                );

            if (
                directId &&
                this.validateUUID(directId)
            ) {

                if (
                    typeof (projectService as any)
                        .getProjectById === "function"
                ) {

                    const project =
                        await (projectService as any)
                            .getProjectById(
                                directId,
                                companyId
                            );

                    if (
                        project
                    ) {

                        return {
                            success: true,
                            project
                        };

                    }

                }

            }

            // =============================================
            // NAME / QUERY
            // =============================================

            const searchTerm =
                this.safeString(
                    params.project_name ||
                    params.projectName ||
                    params.name ||
                    params.query
                );

            if (!searchTerm) {

                return {

                    success: false,

                    message:
                        "Project identifier required"

                };

            }

            // =============================================
            // SEARCH USING COMPANY SCOPE
            // =============================================

            const searchResult =
                await this.searchProjects(
                    {
                        query:
                            searchTerm
                    },
                    companyId
                );

            if (
                !searchResult.success
            ) {

                return {

                    success: false,

                    message:
                        searchResult.message

                };

            }

            const projects =
                Array.isArray(
                    searchResult.data
                )
                    ? searchResult.data
                    : [];

            // =============================================
            // EXACT NAME MATCH
            // =============================================

            const normalizedSearch =
                this.normalizeText(
                    searchTerm
                );

            const exact =
                projects.find(
                    (project: any) => {

                        const name =
                            this.normalizeText(
                                project?.project_name ||
                                project?.projectName ||
                                project?.name
                            );

                        return (
                            name ===
                            normalizedSearch
                        );

                    }
                );

            if (
                exact
            ) {

                return {

                    success: true,

                    project:
                        exact

                };

            }

            // =============================================
            // SINGLE RESULT
            // =============================================

            if (
                projects.length === 1
            ) {

                return {

                    success: true,

                    project:
                        projects[0]

                };

            }

            // =============================================
            // MULTIPLE RESULTS
            // =============================================

            if (
                projects.length > 1
            ) {

                return {

                    success: false,

                    message:
                        `Multiple projects found for "${searchTerm}". Please specify the project name or ID.`

                };

            }

            // =============================================
            // NOT FOUND
            // =============================================

            return {

                success: false,

                message:
                    `Project "${searchTerm}" not found`

            };

        }
        catch (error: any) {

            console.error(
                "PROJECT RESOLVER ERROR",
                error?.message ||
                error
            );

            return {

                success: false,

                message:
                    "Unable to resolve project"

            };

        }

    }


    // =====================================================
    // UPDATE PROJECT
    // =====================================================

    private async updateProject(
        params: Record<string, any>,
        companyId: string
    ): Promise<AIActionResponse> {

        try {

            const resolved =
                await this.resolveProject(
                    params,
                    companyId
                );

            if (
                !resolved.success ||
                !resolved.project
            ) {

                return this.error(
                    "PROJECT_NOT_FOUND",
                    resolved.message ||
                    "Project not found"
                );

            }

            const project =
                resolved.project;

            const projectId =
                project.id;

            if (
                !projectId
            ) {

                return this.error(
                    "PROJECT_ID_MISSING",
                    "Resolved project ID missing"
                );

            }

            // =============================================
            // BUILD UPDATE PAYLOAD
            // =============================================

            const updates:
                Record<string, any> = {};

            const allowedFields = [

                "project_name",
                "project_type",
                "customer_id",
                "location",
                "city",
                "state",
                "pincode",
                "description",
                "flat_type",
                "total_units",
                "available_units",
                "area_sqft",
                "price",
                "brochure_url",
                "gallery",
                "amenities",
                "contact_person",
                "contact_number",
                "status"

            ];

            for (
                const field of allowedFields
            ) {

                if (
                    params[field] !== undefined &&
                    params[field] !== null &&
                    params[field] !== ""
                ) {

                    updates[field] =
                        params[field];

                }

            }

            // =============================================
            // ALIASES
            // =============================================

            if (
                params.projectName !== undefined
            ) {

                updates.project_name =
                    params.projectName;

            }

            if (
                params.name !== undefined &&
                !updates.project_name
            ) {

                updates.project_name =
                    params.name;

            }

            if (
                params.type !== undefined &&
                !updates.project_type
            ) {

                updates.project_type =
                    params.type;

            }

            if (
                params.customerId !== undefined
            ) {

                updates.customer_id =
                    params.customerId;

            }

            if (
                params.area !== undefined
            ) {

                updates.area_sqft =
                    this.safeNumber(
                        params.area
                    );

            }

            if (
                params.budget !== undefined
            ) {

                updates.price =
                    this.safeNumber(
                        params.budget
                    );

            }

            // =============================================
            // NUMERIC NORMALIZATION
            // =============================================

            const numericFields = [

                "total_units",
                "available_units",
                "area_sqft",
                "price"

            ];

            for (
                const field of numericFields
            ) {

                if (
                    updates[field] !== undefined
                ) {

                    const number =
                        this.safeNumber(
                            updates[field]
                        );

                    if (
                        number !== null
                    ) {

                        updates[field] =
                            number;

                    }

                }

            }

            // =============================================
            // STATUS NORMALIZATION
            // =============================================

            if (
                updates.status
            ) {

                updates.status =
                    this.normalizeText(
                        updates.status
                    );

            }

            // =============================================
            // NOTHING TO UPDATE
            // =============================================

            if (
                Object.keys(updates).length === 0
            ) {

                return this.error(
                    "NO_UPDATE_FIELDS",
                    "No project fields were provided for update"
                );

            }

            // =============================================
            // DATABASE UPDATE
            // =============================================

            let result: any;

            if (
                typeof (projectService as any)
                    .updateProject === "function"
            ) {

                result =
                    await (projectService as any)
                        .updateProject(
                            projectId,
                            updates,
                            companyId
                        );

            }
            else {

                throw new Error(
                    "Project update method not available in projectService"
                );

            }

            return {

                success: true,

                code:
                    "PROJECT_UPDATED",

                message:
                    `Project "${project.project_name || project.name || projectId}" updated successfully`,

                data:
                    result,

                timestamp:
                    new Date()
                        .toISOString()

            };

        }
        catch (error: any) {

            console.error(
                "UPDATE PROJECT ERROR",
                error?.message ||
                error
            );

            return this.error(
                "PROJECT_UPDATE_FAILED",
                error?.message ||
                "Failed to update project"
            );

        }

    }


    // =====================================================
    // DELETE PROJECT
    // =====================================================

    private async deleteProject(
        params: Record<string, any>,
        companyId: string
    ): Promise<AIActionResponse> {

        try {

            const resolved =
                await this.resolveProject(
                    params,
                    companyId
                );

            if (
                !resolved.success ||
                !resolved.project
            ) {

                return this.error(
                    "PROJECT_NOT_FOUND",
                    resolved.message ||
                    "Project not found"
                );

            }

            const project =
                resolved.project;

            const projectId =
                project.id;

            if (
                !projectId
            ) {

                return this.error(
                    "PROJECT_ID_MISSING",
                    "Resolved project ID missing"
                );

            }

            // =============================================
            // DATABASE DELETE
            // =============================================

            let result: any;

            if (
                typeof (projectService as any)
                    .deleteProject === "function"
            ) {

                result =
                    await (projectService as any)
                        .deleteProject(
                            projectId,
                            companyId
                        );

            }
            else {

                throw new Error(
                    "Project delete method not available in projectService"
                );

            }

            return {

                success: true,

                code:
                    "PROJECT_DELETED",

                message:
                    `Project "${project.project_name || project.name || projectId}" deleted successfully`,

                data:
                    result,

                timestamp:
                    new Date()
                        .toISOString()

            };

        }
        catch (error: any) {

            console.error(
                "DELETE PROJECT ERROR",
                error?.message ||
                error
            );

            return this.error(
                "PROJECT_DELETE_FAILED",
                error?.message ||
                "Failed to delete project"
            );

        }

    }


// =====================================================
// END PART 2 / 8
// =====================================================


// =====================================================
// PROJECT STATUS NORMALIZER
// =====================================================

private normalizeProjectStatus(
    value: any
): string {

    const status =
        this.normalizeText(
            value || "active"
        );


    const statusMap:
        Record<string, string> = {

        active: "active",
        open: "active",
        running: "active",
        ongoing: "active",

        inactive: "inactive",
        disabled: "inactive",
        closed: "inactive",

        completed: "completed",
        complete: "completed",
        done: "completed",

        upcoming: "upcoming",
        planned: "upcoming",

        cancelled: "cancelled",
        canceled: "cancelled"

    };


    return (
        statusMap[status] ||
        status
    );

}


// =====================================================
// EXTRACT ARRAY RESULT
//
// Supports service responses like:
//
// []
// { data: [] }
// { projects: [] }
// { data: { projects: [] } }
// { results: [] }
// =====================================================

private extractArrayResult(
    result: any
): any[] {

    if (
        Array.isArray(result)
    ) {

        return result;

    }


    if (
        Array.isArray(
            result?.projects
        )
    ) {

        return result.projects;

    }


    if (
        Array.isArray(
            result?.data
        )
    ) {

        return result.data;

    }


    if (
        Array.isArray(
            result?.results
        )
    ) {

        return result.results;

    }


    if (
        Array.isArray(
            result?.data?.projects
        )
    ) {

        return result.data.projects;

    }


    if (
        Array.isArray(
            result?.data?.results
        )
    ) {

        return result.data.results;

    }


    return [];

}


// =====================================================
// COMPANY ISOLATION CHECK
//
// IMPORTANT:
// AIActionService NEVER trusts a project from another
// company/tenant.
// =====================================================

private belongsToCompany(
    project: any,
    companyId: string
): boolean {

    if (
        !project ||
        !companyId
    ) {

        return false;

    }


    const projectCompanyId =
        this.safeString(
            project.company_id ||
            project.companyId
        );


    // If the service already queried using
    // company_id and does not return the field,
    // allow the result.
//
// The service itself must still enforce
// company filtering at DB level.

    if (!projectCompanyId) {

        return true;

    }


    return (
        projectCompanyId ===
        String(companyId).trim()
    );

}


// =====================================================
// EXPENSE AI ENGINE
// =====================================================

// =====================================================
// ADD EXPENSE
// =====================================================

private async addExpense(
    params: Record<string, any>,
    companyId: string,
    userId: string | null
): Promise<AIActionResponse> {

    try {

        const amount =
            this.safeNumber(
                params.amount ||
                params.price ||
                params.cost ||
                params.total
            );

        if (
            amount === null ||
            amount <= 0
        ) {

            return this.error(
                "INVALID_EXPENSE_AMOUNT",
                "Valid expense amount is required"
            );

        }

        const title =
            this.safeString(
                params.title ||
                params.expense_title ||
                params.name
            );

        const category =
            this.safeString(
                params.category ||
                params.expense_category ||
                params.expenseCategory ||
                "General"
            );

        const description =
            this.safeString(
                params.description ||
                params.remarks ||
                params.note
            );

        const vendor =
            this.safeString(
                params.vendor ||
                params.vendor_name ||
                params.supplier
            );

        const paymentMethod =
            this.safeString(
                params.payment_method ||
                params.paymentMode ||
                params.payment_mode ||
                params.paymentmode
            );

        const expenseDate =
            this.safeString(
                params.expense_date ||
                params.date ||
                params.expenseDate
            );

        const projectId =
            this.safeString(
                params.project_id ||
                params.projectId
            );

        const billId =
            this.safeString(
                params.bill_id ||
                params.billId
            );

        const payload: Record<string, any> = {

            company_id: companyId,

            amount,

            expense_title: title || "Expense",

            expense_category: category || "General",

            description: description || null,

            vendor: vendor || null,

            payment_method: paymentMethod || null,

            expense_date: expenseDate || null,

            project_id: projectId || null,

            bill_id: billId || null,

            created_by: userId

        };

        const result =
            await expenseService.createExpense(
                payload as any
            );

        return {

            success: true,

            code: "EXPENSE_CREATED",

            message: "Expense added successfully",

            data: result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "ADD EXPENSE ERROR",
            error?.message || error
        );

        return this.error(
            "EXPENSE_CREATE_FAILED",
            error?.message ||
            "Failed to add expense"
        );

    }

}


// =====================================================
// SEARCH EXPENSES
// =====================================================

private async searchExpenses(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const query =
            this.safeString(
                params.query ||
                params.message ||
                params.text ||
                params.search
            );

        const category =
            this.safeString(
                params.category ||
                params.expense_category
            );

        const projectId =
            this.safeString(
                params.project_id ||
                params.projectId
            );

        const searchParams: Record<string, any> = {

            company_id: companyId

        };

        if (query) {

            searchParams.query = query;

        }

        if (category) {

            searchParams.category = category;

        }

        if (projectId) {

            searchParams.project_id = projectId;

        }

        const result =
            await expenseService.aiSearchExpenses(
                companyId,
                searchParams
            );

        const data =
            Array.isArray(result)
                ? result
                : result?.data || [];

        return {

            success: true,

            code: "EXPENSES_FOUND",

            message:
                data.length > 0
                    ? `Found ${data.length} expense(s)`
                    : "No expenses found",

            data,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "SEARCH EXPENSES ERROR",
            error?.message || error
        );

        return this.error(
            "EXPENSE_SEARCH_FAILED",
            error?.message ||
            "Failed to search expenses"
        );

    }

}


// =====================================================
// UPDATE EXPENSE
// =====================================================

private async updateExpense(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const expenseId =
            this.safeString(
                params.id ||
                params.expense_id ||
                params.expenseId
            );

        if (!expenseId) {

            return this.error(
                "EXPENSE_ID_REQUIRED",
                "Expense id is required"
            );

        }

        const allowedFields: Record<string, any> = {

            amount: params.amount,

            title: params.title || params.expense_title,

            category: params.category || params.expense_category,

            description: params.description,

            vendor: params.vendor,

            payment_method: params.payment_method || params.paymentMode,

            expense_date: params.expense_date || params.date,

            project_id: params.project_id || params.projectId,

            bill_id: params.bill_id || params.billId,

            remarks: params.remarks

        };

        const cleanUpdates: Record<string, any> = {};

        for (
            const [
                key,
                value
            ] of Object.entries(
                allowedFields
            )
        ) {

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {

                cleanUpdates[key] = value;

            }

        }

        if (
            Object.keys(cleanUpdates).length === 0
        ) {

            return this.error(
                "NO_UPDATE_FIELDS",
                "No update fields provided"
            );

        }

        const result =
            await expenseService.updateExpense(
                expenseId,
                companyId,
                cleanUpdates
            );

        return {

            success: true,

            code: "EXPENSE_UPDATED",

            message: "Expense updated successfully",

            data: result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "UPDATE EXPENSE ERROR",
            error?.message || error
        );

        return this.error(
            "EXPENSE_UPDATE_FAILED",
            error?.message ||
            "Failed to update expense"
        );

    }

}


// =====================================================
// DELETE EXPENSE
// =====================================================

private async deleteExpense(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const expenseId =
            this.safeString(
                params.id ||
                params.expense_id ||
                params.expenseId
            );

        if (!expenseId) {

            return this.error(
                "EXPENSE_ID_REQUIRED",
                "Expense id is required"
            );

        }

        const result =
            await expenseService.deleteExpense(
                expenseId,
                companyId
            );

        return {

            success: true,

            code: "EXPENSE_DELETED",

            message: "Expense deleted successfully",

            data: { id: expenseId },

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "DELETE EXPENSE ERROR",
            error?.message || error
        );

        return this.error(
            "EXPENSE_DELETE_FAILED",
            error?.message ||
            "Failed to delete expense"
        );

    }

}


// =====================================================
// END PART 3 / 8
// =====================================================
// =====================================================
// SHIVINFRA AI ACTION SERVICE V35
// PART 4 / 8
//
// CUSTOMER AI ENGINE
//
// ADD CUSTOMER
// SEARCH CUSTOMERS
// SMART CUSTOMER RESOLVER
// UPDATE CUSTOMER
// DELETE CUSTOMER
//
// Production Ready
// Multi-Tenant Safe
// AI + WhatsApp Ready
// =====================================================


// =====================================================
// ADD CUSTOMER
// =====================================================

private async addCustomer(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const customerName = this.safeString(
            params.full_name ||
            params.fullName ||
            params.customer_name ||
            params.customerName ||
            params.name
        );

        if (!customerName) {

            return this.error(
                "CUSTOMER_NAME_REQUIRED",
                "Customer name is required"
            );

        }


        const rawPhone =
            params.phone ||
            params.mobile ||
            params.contact_number ||
            params.contactNumber;


        const phone =
            rawPhone
                ? this.normalizePhone(rawPhone)
                : "";


        if (
            rawPhone &&
            !this.validatePhone(phone)
        ) {

            return this.error(
                "INVALID_CUSTOMER_PHONE",
                "Invalid customer phone number"
            );

        }


        const email =
            this.safeString(
                params.email
            );


        if (
            email &&
            !this.validateEmail(email)
        ) {

            return this.error(
                "INVALID_CUSTOMER_EMAIL",
                "Invalid customer email"
            );

        }


        // -------------------------------------------------
        // DUPLICATE PHONE CHECK
        // -------------------------------------------------

        if (phone) {

            const existing =
                await this.findCustomerByPhone(
                    phone,
                    companyId
                );


            if (existing) {

                return {

                    success: false,

                    code: "CUSTOMER_ALREADY_EXISTS",

                    message:
                        `Customer with phone ${phone} already exists`,

                    data: existing,

                    timestamp:
                        new Date().toISOString()

                };

            }

        }


        // -------------------------------------------------
        // CUSTOMER PAYLOAD
        // -------------------------------------------------

        const customerData:
            Record<string, any> = {

            company_id:
                companyId,

            full_name:
                customerName,

            phone:
                phone || null,

            email:
                email || null,

            address:
                this.safeString(
                    params.address
                ) || null,

            city:
                this.safeString(
                    params.city
                ) || null,

            state:
                this.safeString(
                    params.state
                ) || null,

            pincode:
                this.safeString(
                    params.pincode ||
                    params.pin_code ||
                    params.zip
                ) || null,

            customer_type:
                this.safeString(
                    params.customer_type ||
                    params.customerType ||
                    params.type
                ) || null,

            status:
                this.normalizeCustomerStatus(
                    params.status
                )

        };


        // -------------------------------------------------
        // REMOVE OPTIONAL NULL VALUES
        // -------------------------------------------------

        Object.keys(customerData).forEach(
            key => {

                if (
                    customerData[key] === null ||
                    customerData[key] === undefined ||
                    customerData[key] === ""
                ) {

                    if (key !== "company_id") {

                        delete customerData[key];

                    }

                }

            }
        );


        const service: any =
            customerService as any;


        if (
            typeof service.createCustomer !==
            "function"
        ) {

            throw new Error(
                "customerService.createCustomer is not available"
            );

        }


        const result =
            await service.createCustomer(
                customerData
            );


        return {

            success: true,

            code: "CUSTOMER_CREATED",

            message:
                `Customer "${customerName}" created successfully`,

            data:
                result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "ADD CUSTOMER ERROR",
            {
                company_id:
                    companyId,

                error:
                    error?.message ||
                    error
            }
        );


        return this.error(
            "CUSTOMER_CREATE_FAILED",
            error?.message ||
            "Failed to create customer"
        );

    }

}


// =====================================================
// SEARCH CUSTOMERS
// =====================================================

private async searchCustomers(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const query =
            this.safeString(
                params.query ||
                params.search ||
                params.search_query ||
                params.name ||
                params.full_name ||
                params.customer_name ||
                params.phone ||
                params.mobile
            );


        const service: any =
            customerService as any;


        let result: any;


        // -------------------------------------------------
        // PREFERRED SEARCH
        // -------------------------------------------------

        if (
            typeof service.searchCustomers ===
            "function"
        ) {

            result =
                await service.searchCustomers({

                    company_id:
                        companyId,

                    query:
                        query || undefined

                });

        }


        // -------------------------------------------------
        // FALLBACK
        // -------------------------------------------------

        else if (
            typeof service.getCustomers ===
            "function"
        ) {

            result =
                await service.getCustomers(
                    companyId
                );

        }
        else if (
            typeof service.getAllCustomers ===
            "function"
        ) {

            result =
                await service.getAllCustomers(
                    companyId
                );

        }
        else {

            throw new Error(
                "No customer search method available"
            );

        }


        let customers =
            this.extractCustomerArray(
                result
            );


        // -------------------------------------------------
        // COMPANY SAFETY
        // -------------------------------------------------

        customers =
            customers.filter(
                customer =>
                    this.belongsToCompany(
                        customer,
                        companyId
                    )
            );


        // -------------------------------------------------
        // LOCAL SEARCH FILTER
        // -------------------------------------------------

        if (query) {

            const normalizedQuery =
                this.normalizeText(
                    query
                );


            const normalizedPhone =
                this.normalizePhone(
                    query
                );


            customers =
                customers.filter(
                    (customer: any) => {

                        const name =
                            this.normalizeText(
                                customer?.full_name ||
                                customer?.name ||
                                customer?.customer_name
                            );


                        const phone =
                            this.normalizePhone(
                                customer?.phone ||
                                customer?.mobile ||
                                customer?.contact_number ||
                                ""
                            );


                        const email =
                            this.normalizeText(
                                customer?.email
                            );


                        return (
                            name.includes(
                                normalizedQuery
                            ) ||
                            normalizedQuery.includes(
                                name
                            ) ||
                            (
                                normalizedPhone &&
                                phone.includes(
                                    normalizedPhone
                                )
                            ) ||
                            email.includes(
                                normalizedQuery
                            )
                        );

                    }
                );

        }


        return {

            success: true,

            code:
                customers.length
                    ? "CUSTOMERS_FOUND"
                    : "CUSTOMERS_NOT_FOUND",

            message:
                customers.length
                    ? `${customers.length} customer(s) found`
                    : "No customers found",

            data: {

                count:
                    customers.length,

                customers

            },

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "SEARCH CUSTOMERS ERROR",
            {
                company_id:
                    companyId,

                error:
                    error?.message ||
                    error
            }
        );


        return this.error(
            "CUSTOMER_SEARCH_FAILED",
            error?.message ||
            "Failed to search customers"
        );

    }

}


// =====================================================
// SMART CUSTOMER RESOLVER
//
// Supports:
//
// customer id
// phone
// mobile
// exact name
// partial name
// query
//
// IMPORTANT:
// Never randomly chooses between multiple
// customers with the same/ambiguous name.
// =====================================================

private async resolveCustomer(
    params: Record<string, any>,
    companyId: string
): Promise<any | null> {

    try {

        const service: any =
            customerService as any;


        const directId =
            this.safeString(
                params.id ||
                params.customer_id ||
                params.customerId
            );


        const rawPhone =
            params.phone ||
            params.mobile ||
            params.contact_number ||
            params.contactNumber;


        const phone =
            rawPhone
                ? this.normalizePhone(rawPhone)
                : "";


        const name =
            this.safeString(
                params.full_name ||
                params.fullName ||
                params.customer_name ||
                params.customerName ||
                params.name ||
                params.query
            );


        // -------------------------------------------------
        // 1. DIRECT UUID
        // -------------------------------------------------

        if (
            directId &&
            this.validateUUID(directId)
        ) {

            if (
                typeof service.getCustomerById ===
                "function"
            ) {

                const customer =
                    await service.getCustomerById(
                        directId,
                        companyId
                    );


                if (
                    customer &&
                    this.belongsToCompany(
                        customer,
                        companyId
                    )
                ) {

                    return customer;

                }

            }


            if (
                typeof service.getCustomer ===
                "function"
            ) {

                const customer =
                    await service.getCustomer(
                        directId,
                        companyId
                    );


                if (
                    customer &&
                    this.belongsToCompany(
                        customer,
                        companyId
                    )
                ) {

                    return customer;

                }

            }

        }


        // -------------------------------------------------
        // 2. PHONE
        // -------------------------------------------------

        if (phone) {

            const customer =
                await this.findCustomerByPhone(
                    phone,
                    companyId
                );


            if (customer) {

                return customer;

            }

        }


        // -------------------------------------------------
        // 3. NAME
        // -------------------------------------------------

        if (!name) {

            return null;

        }


        const normalizedName =
            this.normalizeText(
                name
            );


        // -------------------------------------------------
        // EXACT NAME
        // -------------------------------------------------

        const exact =
            await this.findCustomerByName(
                name,
                companyId
            );


        if (exact) {

            return exact;

        }


        // -------------------------------------------------
        // FALLBACK SEARCH
        // -------------------------------------------------

        let customers: any[] = [];


        if (
            typeof service.searchCustomers ===
            "function"
        ) {

            const result =
                await service.searchCustomers({

                    company_id:
                        companyId,

                    query:
                        name

                });


            customers =
                this.extractCustomerArray(
                    result
                );

        }
        else if (
            typeof service.getCustomers ===
            "function"
        ) {

            const result =
                await service.getCustomers(
                    companyId
                );


            customers =
                this.extractCustomerArray(
                    result
                );

        }
        else if (
            typeof service.getAllCustomers ===
            "function"
        ) {

            const result =
                await service.getAllCustomers(
                    companyId
                );


            customers =
                this.extractCustomerArray(
                    result
                );

        }


        customers =
            customers.filter(
                customer =>
                    this.belongsToCompany(
                        customer,
                        companyId
                    )
            );


        if (!customers.length) {

            return null;

        }


        // -------------------------------------------------
        // EXACT NORMALIZED NAME
        // -------------------------------------------------

        const exactNormalized =
            customers.find(
                customer =>
                    this.normalizeText(
                        customer?.full_name ||
                        customer?.name ||
                        customer?.customer_name
                    ) === normalizedName
            );


        if (exactNormalized) {

            return exactNormalized;

        }


        // -------------------------------------------------
        // PARTIAL NAME
        // -------------------------------------------------

        const partialMatches =
            customers.filter(
                customer => {

                    const customerName =
                        this.normalizeText(
                            customer?.full_name ||
                            customer?.name ||
                            customer?.customer_name
                        );


                    return (
                        customerName.includes(
                            normalizedName
                        ) ||
                        normalizedName.includes(
                            customerName
                        )
                    );

                }
            );


        if (
            partialMatches.length === 1
        ) {

            return partialMatches[0];

        }


        // -------------------------------------------------
        // TOKEN MATCH
        // -------------------------------------------------

        const tokens =
            normalizedName
                .split(" ")
                .filter(
                    token =>
                        token.length >= 2
                );


        if (tokens.length) {

            const tokenMatches =
                customers.filter(
                    customer => {

                        const customerName =
                            this.normalizeText(
                                customer?.full_name ||
                                customer?.name ||
                                customer?.customer_name
                            );


                        const matched =
                            tokens.filter(
                                token =>
                                    customerName.includes(
                                        token
                                    )
                            ).length;


                        return (
                            matched >=
                            Math.max(
                                1,
                                Math.ceil(
                                    tokens.length *
                                    0.6
                                )
                            )
                        );

                    }
                );


            if (
                tokenMatches.length === 1
            ) {

                return tokenMatches[0];

            }

        }


        // -------------------------------------------------
        // AMBIGUOUS
        // -------------------------------------------------

        return null;

    }
    catch (error: any) {

        console.error(
            "CUSTOMER RESOLVER ERROR",
            {
                company_id:
                    companyId,

                error:
                    error?.message ||
                    error
            }
        );


        return null;

    }

}


// =====================================================
// FIND CUSTOMER BY PHONE
// =====================================================

private async findCustomerByPhone(
    phone: string,
    companyId: string
): Promise<any | null> {

    try {

        const normalizedPhone =
            this.normalizePhone(
                phone
            );


        if (
            !this.validatePhone(
                normalizedPhone
            )
        ) {

            return null;

        }


        const service: any =
            customerService as any;


        if (
            typeof service.getCustomerByPhone ===
            "function"
        ) {

            const result =
                await service.getCustomerByPhone(
                    normalizedPhone,
                    companyId
                );


            if (
                result &&
                this.belongsToCompany(
                    result,
                    companyId
                )
            ) {

                return result;

            }

        }


        if (
            typeof service.searchCustomers ===
            "function"
        ) {

            const result =
                await service.searchCustomers({

                    company_id:
                        companyId,

                    phone:
                        normalizedPhone,

                    query:
                        normalizedPhone

                });


            const customers =
                this.extractCustomerArray(
                    result
                );


            const match =
                customers.find(
                    (customer: any) =>
                        this.belongsToCompany(
                            customer,
                            companyId
                        ) &&
                        this.normalizePhone(
                            customer?.phone ||
                            customer?.mobile ||
                            ""
                        ) === normalizedPhone
                );


            if (match) {

                return match;

            }

        }


        return null;

    }
    catch (error: any) {

        console.error(
            "FIND CUSTOMER BY PHONE ERROR",
            {
                company_id:
                    companyId,

                error:
                    error?.message ||
                    error
            }
        );


        return null;

    }

}


// =====================================================
// FIND CUSTOMER BY NAME
// =====================================================

private async findCustomerByName(
    name: string,
    companyId: string
): Promise<any | null> {

    try {

        const customerName =
            this.safeString(
                name
            );


        if (!customerName) {

            return null;

        }


        const service: any =
            customerService as any;


        if (
            typeof service.getCustomerByName ===
            "function"
        ) {

            const result =
                await service.getCustomerByName(
                    customerName,
                    companyId
                );


            if (
                result &&
                this.belongsToCompany(
                    result,
                    companyId
                )
            ) {

                return result;

            }

        }


        if (
            typeof service.searchCustomers ===
            "function"
        ) {

            const result =
                await service.searchCustomers({

                    company_id:
                        companyId,

                    query:
                        customerName

                });


            const customers =
                this.extractCustomerArray(
                    result
                );


            const normalized =
                this.normalizeText(
                    customerName
                );


            const exact =
                customers.find(
                    (customer: any) =>
                        this.belongsToCompany(
                            customer,
                            companyId
                        ) &&
                        this.normalizeText(
                            customer?.full_name ||
                            customer?.name ||
                            customer?.customer_name
                        ) === normalized
                );


            return exact || null;

        }


        return null;

    }
    catch (error: any) {

        console.error(
            "FIND CUSTOMER BY NAME ERROR",
            {
                company_id:
                    companyId,

                error:
                    error?.message ||
                    error
            }
        );


        return null;

    }

}


// =====================================================
// UPDATE CUSTOMER
// =====================================================

private async updateCustomer(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const customer =
            await this.resolveCustomer(
                params,
                companyId
            );


        if (!customer) {

            return this.error(
                "CUSTOMER_NOT_FOUND",
                "Customer not found or customer name is ambiguous"
            );

        }


        const customerId =
            this.safeString(
                customer.id ||
                customer.customer_id
            );


        if (!customerId) {

            return this.error(
                "CUSTOMER_ID_MISSING",
                "Customer id could not be resolved"
            );

        }


        const updateData:
            Record<string, any> = {};


        // -------------------------------------------------
        // NAME
        // -------------------------------------------------

        const name =
            this.safeString(
                params.full_name ||
                params.fullName ||
                params.customer_name ||
                params.customerName ||
                params.name
            );


        if (name) {

            updateData.full_name =
                name;

        }


        // -------------------------------------------------
        // PHONE
        // -------------------------------------------------

        const rawPhone =
            params.phone ||
            params.mobile ||
            params.contact_number ||
            params.contactNumber;


        if (
            rawPhone !== undefined &&
            rawPhone !== null &&
            rawPhone !== ""
        ) {

            const phone =
                this.normalizePhone(
                    rawPhone
                );


            if (
                !this.validatePhone(phone)
            ) {

                return this.error(
                    "INVALID_CUSTOMER_PHONE",
                    "Invalid customer phone number"
                );

            }


            const existing =
                await this.findCustomerByPhone(
                    phone,
                    companyId
                );


            if (
                existing &&
                String(
                    existing.id
                ) !== String(customerId)
            ) {

                return this.error(
                    "CUSTOMER_PHONE_EXISTS",
                    "Another customer already uses this phone number"
                );

            }


            updateData.phone =
                phone;

        }


        // -------------------------------------------------
        // EMAIL
        // -------------------------------------------------

        if (
            params.email !== undefined
        ) {

            const email =
                this.safeString(
                    params.email
                );


            if (
                email &&
                !this.validateEmail(
                    email
                )
            ) {

                return this.error(
                    "INVALID_CUSTOMER_EMAIL",
                    "Invalid customer email"
                );

            }


            updateData.email =
                email || null;

        }


        // -------------------------------------------------
        // OTHER FIELDS
        // -------------------------------------------------

        const stringFields: Record<
            string,
            string[]
        > = {

            address: [
                "address"
            ],

            city: [
                "city"
            ],

            state: [
                "state"
            ],

            pincode: [
                "pincode",
                "pin_code",
                "zip"
            ],

            customer_type: [
                "customer_type",
                "customerType",
                "type"
            ]

        };


        Object.entries(
            stringFields
        ).forEach(
            ([field, aliases]) => {

                const alias =
                    aliases.find(
                        key =>
                            params[key] !==
                            undefined &&
                            params[key] !== null
                    );


                if (!alias) {

                    return;

                }


                updateData[field] =
                    this.safeString(
                        params[alias]
                    );

            }
        );


        // -------------------------------------------------
        // STATUS
        // -------------------------------------------------

        if (
            params.status !== undefined &&
            params.status !== null
        ) {

            updateData.status =
                this.normalizeCustomerStatus(
                    params.status
                );

        }


        // -------------------------------------------------
        // NEVER CHANGE TENANT
        // -------------------------------------------------

        delete updateData.company_id;
        delete updateData.id;


        if (
            !Object.keys(updateData).length
        ) {

            return this.error(
                "NO_UPDATE_FIELDS",
                "No customer fields provided for update"
            );

        }


        const service: any =
            customerService as any;


        if (
            typeof service.updateCustomer !==
            "function"
        ) {

            throw new Error(
                "customerService.updateCustomer is not available"
            );

        }


        const result =
            await service.updateCustomer(
                customerId,
                updateData,
                companyId
            );


        return {

            success: true,

            code:
                "CUSTOMER_UPDATED",

            message:
                `Customer "${customer.full_name || customer.name || customerId}" updated successfully`,

            data:
                result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "UPDATE CUSTOMER ERROR",
            {
                company_id:
                    companyId,

                error:
                    error?.message ||
                    error
            }
        );


        return this.error(
            "CUSTOMER_UPDATE_FAILED",
            error?.message ||
            "Failed to update customer"
        );

    }

}


// =====================================================
// DELETE CUSTOMER
// =====================================================

private async deleteCustomer(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const customer =
            await this.resolveCustomer(
                params,
                companyId
            );


        if (!customer) {

            return this.error(
                "CUSTOMER_NOT_FOUND",
                "Customer not found or customer name is ambiguous"
            );

        }


        const customerId =
            this.safeString(
                customer.id ||
                customer.customer_id
            );


        if (!customerId) {

            return this.error(
                "CUSTOMER_ID_MISSING",
                "Customer id could not be resolved"
            );

        }


        const service: any =
            customerService as any;


        if (
            typeof service.deleteCustomer !==
            "function"
        ) {

            throw new Error(
                "customerService.deleteCustomer is not available"
            );

        }


        await service.deleteCustomer(
            customerId,
            companyId
        );


        return {

            success: true,

            code:
                "CUSTOMER_DELETED",

            message:
                `Customer "${customer.full_name || customer.name || customerId}" deleted successfully`,

            data: {

                id:
                    customerId,

                full_name:
                    customer.full_name ||
                    customer.name ||
                    null

            },

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "DELETE CUSTOMER ERROR",
            {
                company_id:
                    companyId,

                error:
                    error?.message ||
                    error
            }
        );


        return this.error(
            "CUSTOMER_DELETE_FAILED",
            error?.message ||
            "Failed to delete customer"
        );

    }

}


// =====================================================
// CUSTOMER STATUS NORMALIZER
//
// Important:
// Existing SHIVINFRA customer DB constraint uses:
//
// active
// inactive
//
// Therefore never send:
// ACTIVE
// INACTIVE
// =====================================================

private normalizeCustomerStatus(
    value: any
): string {

    const status =
        this.normalizeText(
            value || "active"
        );


    const statusMap:
        Record<string, string> = {

        active:
            "active",

        activated:
            "active",

        enable:
            "active",

        enabled:
            "active",

        inactive:
            "inactive",

        disabled:
            "inactive",

        disable:
            "inactive",

        deactivated:
            "inactive"

    };


    return (
        statusMap[status] ||
        "active"
    );

}


// =====================================================
// EXTRACT CUSTOMER ARRAY
//
// Supports:
//
// []
// { data: [] }
// { customers: [] }
// { results: [] }
// { data: { customers: [] } }
// =====================================================

private extractCustomerArray(
    result: any
): any[] {

    if (
        Array.isArray(result)
    ) {

        return result;

    }


    if (
        Array.isArray(
            result?.customers
        )
    ) {

        return result.customers;

    }


    if (
        Array.isArray(
            result?.data
        )
    ) {

        return result.data;

    }


    if (
        Array.isArray(
            result?.results
        )
    ) {

        return result.results;

    }


    if (
        Array.isArray(
            result?.data?.customers
        )
    ) {

        return result.data.customers;

    }


    if (
        Array.isArray(
            result?.data?.results
        )
    ) {

        return result.data.results;

    }


    return [];

}


// =====================================================
// END PART 4 / 8
// =====================================================
// =====================================================
// SHIVINFRA AI ACTION SERVICE V35
// PART 5 / 8
//
// LEAD CRM AI ENGINE
//
// ADD LEAD
// SEARCH LEADS
// SMART LEAD RESOLVER
// UPDATE LEAD
// DELETE LEAD
//
// Production Ready
// Multi-Tenant Safe
// AI + WhatsApp Ready
// =====================================================


// =====================================================
// ADD LEAD
// =====================================================

private async addLead(
    params: Record<string, any>,
    companyId: string,
    userId: string | null
): Promise<AIActionResponse> {

    try {

        const safeCompanyId =
            this.safeString(companyId);

        if (!safeCompanyId) {

            return this.error(
                "COMPANY_REQUIRED",
                "Company id required"
            );

        }

        // -------------------------------------------------
        // CUSTOMER / LEAD NAME
        // -------------------------------------------------

        const name = this.safeString(
            params.name ||
            params.full_name ||
            params.customer_name ||
            params.lead_name
        );

        // -------------------------------------------------
        // PHONE
        // -------------------------------------------------

        const rawPhone =
            params.phone ||
            params.mobile ||
            params.whatsapp ||
            params.whatsapp_number;

        const phone =
            rawPhone
                ? this.normalizePhone(rawPhone)
                : "";

        // -------------------------------------------------
        // EMAIL
        // -------------------------------------------------

        const email =
            params.email
                ? this.safeString(params.email)
                : "";

        // -------------------------------------------------
        // BASIC VALIDATION
        // -------------------------------------------------

        if (!name && !phone && !params.customer_id) {

            return this.error(
                "LEAD_INFORMATION_REQUIRED",
                "Lead name, phone or customer id required"
            );

        }

        if (
            phone &&
            !this.validatePhone(phone)
        ) {

            return this.error(
                "INVALID_PHONE",
                "Invalid lead phone number"
            );

        }

        if (
            email &&
            !this.validateEmail(email)
        ) {

            return this.error(
                "INVALID_EMAIL",
                "Invalid lead email"
            );

        }

        // -------------------------------------------------
        // OPTIONAL FIELDS
        // -------------------------------------------------

        const projectId =
            this.safeString(
                params.project_id ||
                params.projectId
            ) || null;

        const customerId =
            this.safeString(
                params.customer_id ||
                params.customerId
            ) || null;

        const leadSource =
            this.safeString(
                params.lead_source ||
                params.leadSource ||
                params.source
            ) || "WHATSAPP";

        const requirement =
            this.safeString(
                params.requirement ||
                params.requirements ||
                params.property_requirement
            ) || null;

        const preferredLocation =
            this.safeString(
                params.preferred_location ||
                params.preferredLocation ||
                params.location
            ) || null;

        const remarks =
            this.safeString(
                params.remarks ||
                params.remark ||
                params.notes ||
                params.note
            ) || null;

        const status =
            this.safeString(
                params.status
            ) || "New";

        // -------------------------------------------------
        // BUDGET
        // -------------------------------------------------

        const budgetRaw =
            params.budget ||
            params.budget_amount ||
            params.amount ||
            params.price;

        const budget =
            budgetRaw !== undefined &&
            budgetRaw !== null &&
            budgetRaw !== ""
                ? this.safeNumber(budgetRaw)
                : null;

        if (
            budgetRaw !== undefined &&
            budgetRaw !== null &&
            budgetRaw !== "" &&
            budget === null
        ) {

            return this.error(
                "INVALID_BUDGET",
                "Invalid lead budget"
            );

        }

        // -------------------------------------------------
        // PREVENT DUPLICATE PHONE
        // -------------------------------------------------

        if (phone) {

            const existing =
                await this.findLeadByPhone(
                    phone,
                    safeCompanyId
                );

            if (existing) {

                return {

                    success: false,

                    code: "DUPLICATE_LEAD",

                    message:
                        `Lead already exists for ${phone}`,

                    data: existing,

                    timestamp:
                        new Date().toISOString()

                };

            }

        }

        // -------------------------------------------------
        // BUILD SERVICE PAYLOAD
        // -------------------------------------------------

        const payload: Record<string, any> = {

            company_id:
                safeCompanyId,

            customer_id:
                customerId,

            project_id:
                projectId,

            lead_source:
                leadSource,

            requirement,

            budget,

            preferred_location:
                preferredLocation,

            status,

            assigned_to:
                userId,

            remarks

        };

        // -------------------------------------------------
        // NAME / PHONE / EMAIL
        //
        // Existing leadService implementations may use
        // different customer fields, therefore only send
        // supplied values.
        // -------------------------------------------------

        if (name) {

            payload.name = name;

        }

        if (phone) {

            payload.phone = phone;

        }

        if (email) {

            payload.email = email;

        }

        // -------------------------------------------------
        // SERVICE EXECUTION
        // -------------------------------------------------

        const result =
            await leadService.createLead(
                payload as any
            );

        if (!result) {

            return this.error(
                "LEAD_CREATE_FAILED",
                "Unable to create lead"
            );

        }

        // -------------------------------------------------
        // NORMALIZE SERVICE RESPONSE
        // -------------------------------------------------

        const success =
            result?.success !== false;

        if (!success) {

            return {

                success: false,

                code:
                    result?.code ||
                    "LEAD_CREATE_FAILED",

                message:
                    result?.message ||
                    "Unable to create lead",

                data:
                    result?.data ||
                    result,

                timestamp:
                    new Date().toISOString()

            };

        }

        if (phone) {

            const existingFollowUp =
                await getPendingFollowUpForLead(
                    result?.id || result?.data?.id,
                    companyId
                );


            if (!existingFollowUp) {

                const requirement =
                    params.requirement ||
                    params.name ||
                    params.description ||
                    "our services";


                await createFollowUp({

                    company_id: companyId,

                    lead_id: result?.id || result?.data?.id,

                    phone: phone,

                    message:
                        "Thank you for your enquiry regarding " +
                        requirement +
                        ". Our team will contact you shortly."

                });

            }

        }

        return {

            success: true,

            code: "LEAD_CREATED",

            message:
                result?.message ||
                "Lead created successfully",

            data:
                result?.data ||
                result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "ADD LEAD ERROR",
            error
        );

        return this.error(
            "LEAD_CREATE_FAILED",
            error?.message ||
            "Failed to create lead"
        );

    }

}


// =====================================================
// SEARCH LEADS
// =====================================================

private async searchLeads(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const safeCompanyId =
            this.safeString(companyId);

        if (!safeCompanyId) {

            return this.error(
                "COMPANY_REQUIRED",
                "Company id required"
            );

        }

        // -------------------------------------------------
        // SEARCH PARAMETERS
        // -------------------------------------------------

        const query =
            this.safeString(
                params.query ||
                params.search ||
                params.name ||
                params.phone ||
                params.mobile ||
                params.customer_name
            );

        const status =
            this.safeString(
                params.status
            );

        const projectId =
            this.safeString(
                params.project_id ||
                params.projectId
            );

        const customerId =
            this.safeString(
                params.customer_id ||
                params.customerId
            );

        const leadSource =
            this.safeString(
                params.lead_source ||
                params.leadSource ||
                params.source
            );

        // -------------------------------------------------
        // SERVICE PARAMETERS
        // -------------------------------------------------

        const searchParams: Record<string, any> = {

            company_id:
                safeCompanyId

        };

        if (query) {

            searchParams.query =
                query;

        }

        if (status) {

            searchParams.status =
                status;

        }

        if (projectId) {

            searchParams.project_id =
                projectId;

        }

        if (customerId) {

            searchParams.customer_id =
                customerId;

        }

        if (leadSource) {

            searchParams.lead_source =
                leadSource;

        }

        // -------------------------------------------------
        // OPTIONAL LIMIT
        // -------------------------------------------------

        const limit =
            this.safeNumber(
                params.limit
            );

        if (
            limit !== null &&
            limit > 0
        ) {

            searchParams.limit =
                Math.min(
                    Math.floor(limit),
                    100
                );

        }

        // -------------------------------------------------
        // SEARCH
        // -------------------------------------------------

        const result =
            await leadService.getLeads(
                companyId
            );

        const data =
            result?.data ??
            result ??
            [];

        const leads =
            Array.isArray(data)
                ? data
                : Array.isArray(data?.leads)
                    ? data.leads
                    : [];

        return {

            success: true,

            code: "LEADS_FOUND",

            message:
                leads.length > 0
                    ? `${leads.length} lead(s) found`
                    : "No leads found",

            data: leads,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "SEARCH LEADS ERROR",
            error
        );

        return this.error(
            "LEAD_SEARCH_FAILED",
            error?.message ||
            "Failed to search leads"
        );

    }

}


// =====================================================
// SMART LEAD RESOLVER
//
// Used by UPDATE / DELETE.
//
// Resolution priority:
//
// 1. UUID
// 2. lead_id
// 3. phone
// 4. customer_id
// 5. exact name/query
//
// Company ID is ALWAYS included.
// =====================================================

private async resolveLead(
    params: Record<string, any>,
    companyId: string
): Promise<any | null> {

    const safeCompanyId =
        this.safeString(companyId);

    if (!safeCompanyId) {

        return null;

    }

    // -------------------------------------------------
    // DIRECT ID
    // -------------------------------------------------

    const directId =
        this.safeString(
            params.id ||
            params.lead_id ||
            params.leadId
        );

    if (
        directId &&
        this.validateUUID(directId)
    ) {

        try {

            const result =
                await leadService.getLeadById(
                    directId,
                    safeCompanyId
                );

            if (result?.data) {

                return result.data;

            }

            if (
                result &&
                result.id
            ) {

                return result;

            }

        }
        catch (error) {

            console.warn(
                "LEAD ID RESOLUTION FAILED",
                error
            );

        }

    }

    // -------------------------------------------------
    // PHONE
    // -------------------------------------------------

    const rawPhone =
        params.phone ||
        params.mobile;

    if (rawPhone) {

        const phone =
            this.normalizePhone(
                rawPhone
            );

        if (
            phone &&
            this.validatePhone(phone)
        ) {

            const found =
                await this.findLeadByPhone(
                    phone,
                    safeCompanyId
                );

            if (found) {

                return found;

            }

        }

    }

    // -------------------------------------------------
    // CUSTOMER ID
    // -------------------------------------------------

    const customerId =
        this.safeString(
            params.customer_id ||
            params.customerId
        );

    if (
        customerId &&
        this.validateUUID(customerId)
    ) {

        try {

            const result =
                await leadService.getLeads(
                    safeCompanyId
                );

            const data =
                result?.data ??
                result ??
                [];

            const leads =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.leads)
                        ? data.leads
                        : [];

            if (leads.length === 1) {

                return leads[0];

            }

        }
        catch (error) {

            console.warn(
                "LEAD CUSTOMER RESOLUTION FAILED",
                error
            );

        }

    }

    // -------------------------------------------------
    // NAME / QUERY
    // -------------------------------------------------

    const query =
        this.safeString(
            params.customer_name ||
            params.full_name ||
            params.name ||
            params.query
        );

    if (query) {

        try {

            const result =
                await leadService.getLeads(
                    safeCompanyId
                );

            const data =
                result?.data ??
                result ??
                [];

            const leads =
                Array.isArray(data)
                    ? data
                    : Array.isArray(data?.leads)
                        ? data.leads
                        : [];

            if (leads.length === 1) {

                return leads[0];

            }

            // -------------------------------------------------
            // EXACT NAME MATCH
            // -------------------------------------------------

            const normalizedQuery =
                this.normalizeText(query);

            const exactMatch =
                leads.find(
                    (lead: any) => {

                        const leadName =
                            this.normalizeText(
                                lead?.name ||
                                lead?.full_name ||
                                lead?.customer_name ||
                                ""
                            );

                        return (
                            leadName ===
                            normalizedQuery
                        );

                    }
                );

            if (exactMatch) {

                return exactMatch;

            }

        }
        catch (error) {

            console.warn(
                "LEAD NAME RESOLUTION FAILED",
                error
            );

        }

    }

    return null;

}


// =====================================================
// FIND LEAD BY PHONE
// =====================================================

private async findLeadByPhone(
    phone: string,
    companyId: string
): Promise<any | null> {

    try {

        const normalizedPhone =
            this.normalizePhone(phone);

        if (
            !normalizedPhone ||
            !this.validatePhone(
                normalizedPhone
            )
        ) {

            return null;

        }

        const result =
            await leadService.getLeads(
                companyId
            );

        const data =
            result?.data ??
            result ??
            [];

        const leads =
            Array.isArray(data)
                ? data
                : Array.isArray(data?.leads)
                    ? data.leads
                    : [];

        if (!leads.length) {

            return null;

        }

        const exact =
            leads.find(
                (lead: any) => {

                    const leadPhone =
                        this.normalizePhone(
                            lead?.phone ||
                            lead?.mobile ||
                            ""
                        );

                    return (
                        leadPhone ===
                        normalizedPhone
                    );

                }
            );

        return exact || leads[0];

    }
    catch (error) {

        console.warn(
            "FIND LEAD BY PHONE ERROR",
            error
        );

        return null;

    }

}


// =====================================================
// UPDATE LEAD
// =====================================================

private async updateLead(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const safeCompanyId =
            this.safeString(companyId);

        if (!safeCompanyId) {

            return this.error(
                "COMPANY_REQUIRED",
                "Company id required"
            );

        }

        // -------------------------------------------------
        // RESOLVE TARGET
        // -------------------------------------------------

        const lead =
            await this.resolveLead(
                params,
                safeCompanyId
            );

        if (!lead) {

            return this.error(
                "LEAD_NOT_FOUND",
                "Lead not found"
            );

        }

        const leadId =
            this.safeString(
                lead.id
            );

        if (!leadId) {

            return this.error(
                "LEAD_ID_MISSING",
                "Lead id could not be resolved"
            );

        }

        // -------------------------------------------------
        // BUILD UPDATE PAYLOAD
        // -------------------------------------------------

        const updates: Record<string, any> = {};

        // Name
        if (
            params.name !== undefined ||
            params.full_name !== undefined ||
            params.customer_name !== undefined
        ) {

            const name =
                this.safeString(
                    params.name ||
                    params.full_name ||
                    params.customer_name
                );

            if (name) {

                updates.name =
                    name;

            }

        }

        // Phone
        if (
            params.phone !== undefined ||
            params.mobile !== undefined
        ) {

            const phone =
                this.normalizePhone(
                    params.phone ||
                    params.mobile
                );

            if (
                !phone ||
                !this.validatePhone(phone)
            ) {

                return this.error(
                    "INVALID_PHONE",
                    "Invalid lead phone number"
                );

            }

            updates.phone =
                phone;

        }

        // Email
        if (
            params.email !== undefined
        ) {

            const email =
                this.safeString(
                    params.email
                );

            if (
                email &&
                !this.validateEmail(email)
            ) {

                return this.error(
                    "INVALID_EMAIL",
                    "Invalid lead email"
                );

            }

            updates.email =
                email || null;

        }

        // Customer
        if (
            params.customer_id !== undefined ||
            params.customerId !== undefined
        ) {

            updates.customer_id =
                this.safeString(
                    params.customer_id ||
                    params.customerId
                ) || null;

        }

        // Project
        if (
            params.project_id !== undefined ||
            params.projectId !== undefined
        ) {

            updates.project_id =
                this.safeString(
                    params.project_id ||
                    params.projectId
                ) || null;

        }

        // Source
        if (
            params.lead_source !== undefined ||
            params.leadSource !== undefined ||
            params.source !== undefined
        ) {

            updates.lead_source =
                this.safeString(
                    params.lead_source ||
                    params.leadSource ||
                    params.source
                );

        }

        // Requirement
        if (
            params.requirement !== undefined ||
            params.requirements !== undefined
        ) {

            updates.requirement =
                this.safeString(
                    params.requirement ||
                    params.requirements
                );

        }

        // Budget
        if (
            params.budget !== undefined ||
            params.budget_amount !== undefined ||
            params.amount !== undefined
        ) {

            const budget =
                this.safeNumber(
                    params.budget ||
                    params.budget_amount ||
                    params.amount
                );

            if (
                budget === null ||
                budget < 0
            ) {

                return this.error(
                    "INVALID_BUDGET",
                    "Invalid lead budget"
                );

            }

            updates.budget =
                budget;

        }

        // Preferred location
        if (
            params.preferred_location !== undefined ||
            params.preferredLocation !== undefined ||
            params.location !== undefined
        ) {

            updates.preferred_location =
                this.safeString(
                    params.preferred_location ||
                    params.preferredLocation ||
                    params.location
                );

        }

        // Status
        if (
            params.status !== undefined
        ) {

            const status =
                this.safeString(
                    params.status
                );

            if (status) {

                updates.status =
                    status;

            }

        }

        // Remarks
        if (
            params.remarks !== undefined ||
            params.remark !== undefined ||
            params.notes !== undefined
        ) {

            updates.remarks =
                this.safeString(
                    params.remarks ||
                    params.remark ||
                    params.notes
                );

        }

        // Assigned user
        if (
            params.assigned_to !== undefined ||
            params.assignedTo !== undefined
        ) {

            updates.assigned_to =
                this.safeString(
                    params.assigned_to ||
                    params.assignedTo
                ) || null;

        }

        // -------------------------------------------------
        // NO UPDATE FIELDS
        // -------------------------------------------------

        if (
            Object.keys(updates).length === 0
        ) {

            return this.error(
                "NO_UPDATE_FIELDS",
                "No lead fields provided for update"
            );

        }

        // -------------------------------------------------
        // COMPANY-SAFE UPDATE
        // -------------------------------------------------

        updates.company_id =
            safeCompanyId;

        const result =
            await leadService.updateLead(
                leadId,
                safeCompanyId,
                updates
            );

        if (
            result?.success === false
        ) {

            return {

                success: false,

                code:
                    result?.code ||
                    "LEAD_UPDATE_FAILED",

                message:
                    result?.message ||
                    "Failed to update lead",

                data:
                    result?.data ||
                    result,

                timestamp:
                    new Date().toISOString()

            };

        }

        return {

            success: true,

            code: "LEAD_UPDATED",

            message:
                result?.message ||
                "Lead updated successfully",

            data:
                result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "UPDATE LEAD ERROR",
            error
        );

        return this.error(
            "LEAD_UPDATE_FAILED",
            error?.message ||
            "Failed to update lead"
        );

    }

}


// =====================================================
// DELETE LEAD
// =====================================================

private async deleteLead(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const safeCompanyId =
            this.safeString(companyId);

        if (!safeCompanyId) {

            return this.error(
                "COMPANY_REQUIRED",
                "Company id required"
            );

        }

        // -------------------------------------------------
        // RESOLVE TARGET
        // -------------------------------------------------

        const lead =
            await this.resolveLead(
                params,
                safeCompanyId
            );

        if (!lead) {

            return this.error(
                "LEAD_NOT_FOUND",
                "Lead not found"
            );

        }

        const leadId =
            this.safeString(
                lead.id
            );

        if (!leadId) {

            return this.error(
                "LEAD_ID_MISSING",
                "Lead id could not be resolved"
            );

        }

        // -------------------------------------------------
        // DELETE
        // -------------------------------------------------

        const result =
            await leadService.deleteLead(
                leadId,
                safeCompanyId
            );

        if (
            result?.success === false
        ) {

            return {

                success: false,

                code:
                    "LEAD_DELETE_FAILED",

                message:
                    result?.message ||
                    "Failed to delete lead",

                data:
                    result,

                timestamp:
                    new Date().toISOString()

            };

        }

        return {

            success: true,

            code: "LEAD_DELETED",

            message:
                result?.message ||
                "Lead deleted successfully",

            data:
                result?.id
                    ? { id: result.id }
                    : result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "DELETE LEAD ERROR",
            error
        );

        return this.error(
            "LEAD_DELETE_FAILED",
            error?.message ||
            "Failed to delete lead"
        );

    }

}


// =====================================================
// END PART 5 / 8
// =====================================================
// =====================================================
// SHIVINFRA AI ACTION SERVICE V35
// PART 6 / 8
//
// BILL ENGINE
// REPORT ENGINE
// WHATSAPP ENGINE
//
// Production Ready
// Multi-Tenant Safe
// AI + WhatsApp Ready
// =====================================================


// =====================================================
// BILL ENGINE
// =====================================================

private async uploadBill(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const fileUrl = this.safeString(
            params.file_url ||
            params.url ||
            params.file
        );

        if (!fileUrl) {

            return this.error(
                "BILL_FILE_REQUIRED",
                "Bill file is required"
            );

        }

        const payload: Record<string, any> = {

            company_id: companyId,

            bill_file_url: fileUrl,

            vendor_name:
                this.safeString(
                    params.vendor_name ||
                    params.vendor ||
                    params.supplier
                ) || null,

            material_name:
                this.safeString(
                    params.material_name ||
                    params.material ||
                    params.category ||
                    params.bill_category
                ) || null,

            amount:
                this.safeNumber(
                    params.amount ||
                    params.total ||
                    params.price
                ),

            gst_amount:
                this.safeNumber(
                    params.gst_amount ||
                    params.gst_number ||
                    0
                ),

            bill_number:
                this.safeString(
                    params.bill_number ||
                    params.invoice_number ||
                    params.invoice_no
                ) || null,

            bill_date:
                params.bill_date ||
                params.invoice_date ||
                null,

            payment_status:
                params.payment_status ||
                "Pending",

            remarks:
                this.safeString(
                    params.remarks ||
                    params.description ||
                    params.notes
                ) || null

        };


        const service: any = billService;


        if (
            !service ||
            typeof service.createBill !== "function"
        ) {

            return this.error(
                "BILL_SERVICE_UNAVAILABLE",
                "Bill service is not available"
            );

        }


        const result =
            await service.createBill(payload);


        if (
            result &&
            typeof result === "object" &&
            "success" in result
        ) {

            return {

                ...result,

                timestamp:
                    new Date().toISOString()

            };

        }


        return {

            success: true,

            code: "BILL_UPLOADED",

            message:
                "Bill uploaded successfully",

            data: result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "UPLOAD BILL ERROR",
            error?.message || error
        );

        return this.error(
            "BILL_UPLOAD_FAILED",
            error?.message ||
            "Failed to upload bill"
        );

    }

}


// =====================================================
// SEARCH BILLS
// =====================================================

private async searchBills(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const service: any = billService;


        if (
            !service ||
            typeof service.getBills !== "function"
        ) {

            if (
                typeof service?.searchBills === "function"
            ) {

                const queryText =
                    this.safeString(
                        params.query ||
                        params.message ||
                        params.text ||
                        params.search ||
                        ""
                    );

                const result =
                    await service.searchBills(

                        companyId,

                        queryText

                    );

                return {

                    success: true,

                    code: "BILLS_FOUND",

                    message:
                        "Bills fetched successfully",

                    data: result,

                    timestamp:
                        new Date().toISOString()

                };

            }


            return this.error(
                "BILL_SERVICE_UNAVAILABLE",
                "Bill search service is not available"
            );

        }


        const result =
            await service.getBills(
                companyId,
                params
            );


        return {

            success: true,

            code: "BILLS_FOUND",

            message:
                "Bills fetched successfully",

            data: result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "SEARCH BILLS ERROR",
            error?.message || error
        );

        return this.error(
            "BILL_SEARCH_FAILED",
            error?.message ||
            "Failed to search bills"
        );

    }

}


// =====================================================
// UPDATE BILL
// =====================================================

private async updateBill(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const service: any = billService;


        if (
            !service ||
            typeof service.updateBill !== "function"
        ) {

            return this.error(
                "BILL_SERVICE_UNAVAILABLE",
                "Bill update service is not available"
            );

        }


        const identifier =
            params.id ||
            params.bill_id;


        if (!identifier) {

            return this.error(
                "BILL_ID_REQUIRED",
                "Bill id is required"
            );

        }


        const updates = {
            ...params
        };


        delete updates.id;
        delete updates.bill_id;


        updates.company_id =
            companyId;


        const result =
            await service.updateBill(
                identifier,
                updates
            );


        return {

            success: true,

            code: "BILL_UPDATED",

            message:
                "Bill updated successfully",

            data: result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "UPDATE BILL ERROR",
            error?.message || error
        );

        return this.error(
            "BILL_UPDATE_FAILED",
            error?.message ||
            "Failed to update bill"
        );

    }

}


// =====================================================
// DELETE BILL
// =====================================================

private async deleteBill(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const service: any = billService;


        if (
            !service ||
            typeof service.deleteBill !== "function"
        ) {

            return this.error(
                "BILL_SERVICE_UNAVAILABLE",
                "Bill delete service is not available"
            );

        }


        const identifier =
            params.id ||
            params.bill_id;


        if (!identifier) {

            return this.error(
                "BILL_ID_REQUIRED",
                "Bill id is required"
            );

        }


        let result;


        try {

            result =
                await service.deleteBill(
                    identifier,
                    companyId
                );

        }
        catch {

            result =
                await service.deleteBill(
                    identifier
                );

        }


        return {

            success: true,

            code: "BILL_DELETED",

            message:
                "Bill deleted successfully",

            data: result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "DELETE BILL ERROR",
            error?.message || error
        );

        return this.error(
            "BILL_DELETE_FAILED",
            error?.message ||
            "Failed to delete bill"
        );

    }

}


// =====================================================
// REPORT ENGINE
// =====================================================

private async generateReport(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const type =
            this.safeString(
                params.type ||
                params.report_type ||
                "SUMMARY"
            ).toUpperCase();


        const service: any = reportService;


        if (!service) {

            return this.error(
                "REPORT_SERVICE_UNAVAILABLE",
                "Report service is not available"
            );

        }


        const reportParams = {

            ...params,

            type,

            report_type:
                type,

            company_id:
                companyId

        };


        let result: any = null;


        // -------------------------------------------------
        // Preferred report service methods
        // -------------------------------------------------

        if (
            typeof service.generateReport ===
            "function"
        ) {

            result =
                await service.generateReport(
                    reportParams
                );

        }
        else if (
            typeof service.createReport ===
            "function"
        ) {

            result =
                await service.createReport(
                    reportParams
                );

        }
        else if (
            typeof service.generate ===
            "function"
        ) {

            result =
                await service.generate(
                    reportParams
                );

        }
        else {

            return this.error(
                "REPORT_METHOD_UNAVAILABLE",
                "No report generation method found"
            );

        }


        return {

            success: true,

            code: "REPORT_GENERATED",

            message:
                "Report generated successfully",

            data: result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "GENERATE REPORT ERROR",
            error?.message || error
        );

        return this.error(
            "REPORT_GENERATION_FAILED",
            error?.message ||
            "Failed to generate report"
        );

    }

}


// =====================================================
// WHATSAPP MESSAGE ENGINE
// =====================================================

private async sendWhatsAppMessage(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const phone =
            this.normalizePhone(
                params.phone ||
                params.mobile ||
                params.to
            );


        const message =
            this.safeString(
                params.message ||
                params.text
            );


        if (!this.validatePhone(phone)) {

            return this.error(
                "INVALID_WHATSAPP_PHONE",
                "Invalid WhatsApp phone number"
            );

        }


        if (!message) {

            return this.error(
                "WHATSAPP_MESSAGE_REQUIRED",
                "WhatsApp message is required"
            );

        }


        /*
         * WhatsApp provider is intentionally resolved
         * dynamically so the action service does not
         * become tightly coupled to one provider.
         */

        const whatsappService =
            await this.getWhatsAppService();


        if (!whatsappService) {

            return this.error(
                "WHATSAPP_SERVICE_UNAVAILABLE",
                "WhatsApp service is not configured"
            );

        }


        let result: any;


        if (
            typeof whatsappService.sendMessage ===
            "function"
        ) {

            result =
                await whatsappService.sendMessage({

                    company_id:
                        companyId,

                    phone,

                    message

                });

        }
        else if (
            typeof whatsappService.sendText ===
            "function"
        ) {

            result =
                await whatsappService.sendText(
                    phone,
                    message,
                    companyId
                );

        }
        else {

            return this.error(
                "WHATSAPP_METHOD_UNAVAILABLE",
                "WhatsApp send method is not available"
            );

        }


        return {

            success: true,

            code: "WHATSAPP_MESSAGE_SENT",

            message:
                "WhatsApp message sent successfully",

            data: result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "SEND WHATSAPP MESSAGE ERROR",
            error?.message || error
        );

        return this.error(
            "WHATSAPP_SEND_FAILED",
            error?.message ||
            "Failed to send WhatsApp message"
        );

    }

}


// =====================================================
// WHATSAPP SERVICE RESOLVER
// =====================================================

private async getWhatsAppService(): Promise<any> {

    try {

        /*
         * This method checks globally registered
         * WhatsApp service without forcing a
         * compile-time dependency on a provider.
         */

        const globalObject =
            globalThis as any;


        if (
            globalObject.whatsappService
        ) {

            return globalObject.whatsappService;

        }


        if (
            globalObject.whatsappServiceInstance
        ) {

            return globalObject.whatsappServiceInstance;

        }


        return null;

    }
    catch {

        return null;

    }

}


// =====================================================
// CREATE BROADCAST
// =====================================================

    private async createBroadcast(
        params: Record<string, any>,
        companyId: string
    ): Promise<AIActionResponse> {

        try {

            const messageText =
                this.safeString(
                    params.message ||
                    params.text
                );


            if (!messageText) {

                return this.error(
                    "BROADCAST_MESSAGE_REQUIRED",
                    "Broadcast message is required"
                );

            }


            const audience =
                String(
                    params.audience ||
                    params.target ||
                    "CUSTOMERS"
                )
                .toUpperCase();


            const projectName =
                params.project_name ||
                params.project ||
                null;

            const city =
                params.city ||
                params.location ||
                null;

            const leadStatus =
                params.lead_status ||
                params.status ||
                null;

            let recipients: Array<{
                phone: string;
                type: "customer" | "lead";
                id: string;
            }> = [];


            if (audience === "CUSTOMERS") {

                const { data: customers } =
                    await customerService.filterCustomers(
                        companyId,
                        {
                            city,
                            status: leadStatus
                        }
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
                                phone:
                                    String(c.phone).trim(),
                                type: "customer" as const,
                                id: c.id
                            }))
                    );
                }
            } else if (audience === "LEADS") {

                const { data: leads } =
                    await leadService.filterLeads(
                        companyId,
                        {
                            status: leadStatus,
                            preferred_location: city
                        }
                    );

                if (leads) {

                    recipients.push(
                        ...leads
                            .filter(
                                (l: any) =>
                                    l.customers?.phone &&
                                    String(l.customers.phone).trim() !== ""
                            )
                            .map((l: any) => ({
                                phone:
                                    String(l.customers.phone).trim(),
                                type: "lead" as const,
                                id: l.id
                            }))
                    );
                }
            }


            const seenPhones =
                new Set<string>();

            const uniqueRecipients =
                recipients.filter(
                    (r) => {

                        const normalized =
                            String(r.phone)
                                .replace(/\D/g, "")
                                .slice(-10);

                        if (
                            seenPhones.has(
                                normalized
                            )
                        ) {

                            return false;
                        }

                        seenPhones.add(
                            normalized
                        );

                        return true;
                    }
                );


            if (
                uniqueRecipients.length ===
                0
            ) {

                return {

                    success: false,

                    code:
                        "BROADCAST_NO_RECIPIENTS",

                    message:
                        "No valid recipients found for the specified audience",

                    timestamp:
                        new Date()
                            .toISOString()

                };
            }


            const { data: broadcast, error: broadcastError } =
                await supabase
                    .from(
                        "broadcasts"
                    )
                    .insert({

                        company_id:
                            companyId,

                        created_by:
                            params.user_id ||
                            null,

                        message_text:
                            messageText,

                        audience:
                            `${audience}${city ? ` (${city})` : ""}${leadStatus ? ` - ${leadStatus}` : ""}`,

                        status:
                            "Pending",

                        recipient_count:
                            uniqueRecipients.length

                    })
                    .select()
                    .single();

            if (
                broadcastError ||
                !broadcast
            ) {

                console.error(
                    "[BROADCAST] Insert failed:",
                    broadcastError
                );

                return {

                    success: false,

                    code:
                        "BROADCAST_SAVE_FAILED",

                    message:
                        "Failed to create broadcast record",

                    timestamp:
                        new Date()
                            .toISOString()

                };
            }


            const deliveryRecords: any[] = [];

            let sentCount = 0;

            let failedCount = 0;


            for (
                const recipient of
                uniqueRecipients
            ) {

                try {

                    const sent =
                        await WhatsAppService.sendTextMessage(
                            recipient.phone,
                            messageText
                        );

                    deliveryRecords.push({

                        broadcast_id:
                            broadcast.id,

                        company_id:
                            companyId,

                        phone:
                            recipient.phone,

                        recipient_type:
                            recipient.type,

                        recipient_id:
                            recipient.id,

                        status:
                            sent
                                ? "Sent"
                                : "Failed",

                        error:
                            sent
                                ? null
                                : "Meta API dispatch failed",

                        sent_at:
                            sent
                                ? new Date()
                                    .toISOString()
                                : null

                    });

                    if (sent) {

                        sentCount++;
                    } else {

                        failedCount++;
                    }

                } catch (sendError: any) {

                    deliveryRecords.push({

                        broadcast_id:
                            broadcast.id,

                        company_id:
                            companyId,

                        phone:
                            recipient.phone,

                        recipient_type:
                            recipient.type,

                        recipient_id:
                            recipient.id,

                        status:
                            "Failed",

                        error:
                            sendError?.message ||
                            "Send failed",

                        sent_at:
                            null

                    });

                    failedCount++;
                }
            }


            if (
                deliveryRecords.length >
                0
            ) {

                const { error: deliveryError } =
                    await supabase
                        .from(
                            "broadcast_recipients"
                        )
                        .insert(
                            deliveryRecords
                        );

                if (
                    deliveryError
                ) {

                    console.error(
                        "[BROADCAST] Delivery insert failed:",
                        deliveryError
                    );
                }
            }


            const finalStatus =
                failedCount ===
                0
                    ? "Sent"
                    : sentCount > 0
                        ? "Partial"
                        : "Failed";

            const { error: updateError } =
                await supabase
                    .from(
                        "broadcasts"
                    )
                    .update({

                        status:
                            finalStatus,

                        success_count:
                            sentCount,

                        failure_count:
                            failedCount,

                        completed_at:
                            new Date()
                                .toISOString()

                    })
                    .eq(
                        "id",
                        broadcast.id
                    );

            if (
                updateError
            ) {

                console.error(
                    "[BROADCAST] Status update failed:",
                    updateError
                );
            }


            return {

                success:
                    sentCount >
                    0,

                code:
                    "BROADCAST_SENT",

                message:
                    `Broadcast sent to ${sentCount} recipients${failedCount > 0 ? `, ${failedCount} failed` : ""}`,

                data: {

                    broadcast_id:
                        broadcast.id,

                    audience,
                    project_name:
                        projectName ||
                        null,
                    city:
                        city ||
                        null,
                    lead_status:
                        leadStatus ||
                        null,
                    message:
                        messageText,
                    recipient_count:
                        uniqueRecipients.length,
                    sent_count:
                        sentCount,
                    failed_count:
                        failedCount,
                    status:
                        finalStatus

                },

                timestamp:
                    new Date()
                        .toISOString()

            };

        } catch (error: any) {

            console.error(
                "[BROADCAST] Error:",
                error
            );

            return {

                success: false,

                code:
                    "BROADCAST_ERROR",

                message:
                    error?.message ||
                    "Broadcast failed",

                timestamp:
                    new Date()
                        .toISOString()

            };
        }
    }

    // =====================================================
    // CREATE FOLLOW-UP
    // =====================================================

    private async createFollowUp(
    params: Record<string, any>,
    companyId: string
): Promise<AIActionResponse> {

    try {

        const target = {

            customer_id:
                params.customer_id ||
                null,

            lead_id:
                params.lead_id ||
                null,

            phone:
                params.phone ||
                params.mobile ||
                null

        };


        if (
            !target.customer_id &&
            !target.lead_id &&
            !target.phone
        ) {

            return this.error(
                "FOLLOWUP_TARGET_REQUIRED",
                "Customer, lead or phone is required"
            );

        }


        const message =
            this.safeString(
                params.message ||
                params.text ||
                params.followup_message
            );


        if (!message) {

            return this.error(
                "FOLLOWUP_MESSAGE_REQUIRED",
                "Follow-up message is required"
            );

        }


        const whatsappService =
            await this.getWhatsAppService();


        if (!whatsappService) {

            return this.error(
                "WHATSAPP_SERVICE_UNAVAILABLE",
                "WhatsApp service is not configured"
            );

        }


        const payload = {

            company_id:
                companyId,

            ...target,

            message,

            scheduled_at:
                params.scheduled_at ||
                params.followup_at ||
                params.date ||
                null

        };


        let result: any;


        if (
            typeof whatsappService.createFollowUp ===
            "function"
        ) {

            result =
                await whatsappService.createFollowUp(
                    payload
                );

        }
        else if (
            typeof whatsappService.scheduleFollowUp ===
            "function"
        ) {

            result =
                await whatsappService.scheduleFollowUp(
                    payload
                );

        }
        else {

            return this.error(
                "FOLLOWUP_METHOD_UNAVAILABLE",
                "Follow-up method is not available"
            );

        }


        return {

            success: true,

            code: "FOLLOWUP_CREATED",

            message:
                "Follow-up created successfully",

            data: result,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "CREATE FOLLOWUP ERROR",
            error?.message || error
        );

        return this.error(
            "FOLLOWUP_FAILED",
            error?.message ||
            "Failed to create follow-up"
        );

    }

}


// =====================================================
// END PART 6 / 8
// =====================================================
// =====================================================
// SHIVINFRA AI ACTION SERVICE V35
// PART 7 / 8
//
// GENERAL AI CHAT
// RESPONSE NORMALIZATION
// AI FALLBACK
// FINAL HELPERS
//
// Production Ready
// Multi-Tenant Safe
// AI + WhatsApp Ready
// =====================================================


// =====================================================
// GENERAL CHAT
// =====================================================

private async generalChat(
    params: Record<string, any>,
    user: AIUserContext
): Promise<AIActionResponse> {

    try {

        const message =
            this.safeString(
                params.message ||
                params.query ||
                params.text
            );


        if (!message) {

            return this.error(
                "MESSAGE_REQUIRED",
                "Message is required"
            );

        }


        /*
         * GENERAL_CHAT must never directly modify
         * business data.
         *
         * It is only a conversational fallback.
         */

        const aiService =
            await this.getAIService();


        if (!aiService) {

            return {

                success: true,

                code: "GENERAL_CHAT_RESPONSE",

                message:
                    this.getFallbackChatResponse(
                        message
                    ),

                data: {

                    type: "GENERAL_CHAT",

                    company_id:
                        user.company_id

                },

                timestamp:
                    new Date().toISOString()

            };

        }


        let response: any;


        /*
         * Support common AI service method names.
         */

        if (
            typeof aiService.chat ===
            "function"
        ) {

            response =
                await aiService.chat({

                    message,

                    user: {

                        id:
                            user.id || null,

                        company_id:
                            user.company_id,

                        role:
                            user.role,

                        channel:
                            user.channel || "WEB"

                    }

                });

        }
        else if (
            typeof aiService.generateResponse ===
            "function"
        ) {

            response =
                await aiService.generateResponse({

                    message,

                    user

                });

        }
        else if (
            typeof aiService.ask ===
            "function"
        ) {

            response =
                await aiService.ask(
                    message
                );

        }
        else {

            return {

                success: true,

                code:
                    "GENERAL_CHAT_RESPONSE",

                message:
                    this.getFallbackChatResponse(
                        message
                    ),

                timestamp:
                    new Date().toISOString()

            };

        }


        const normalized =
            this.normalizeAIResponse(
                response
            );


        return {

            success: true,

            code:
                "GENERAL_CHAT_RESPONSE",

            message:
                normalized.message,

            data:
                normalized.data,

            timestamp:
                new Date().toISOString()

        };

    }
    catch (error: any) {

        console.error(
            "GENERAL CHAT ERROR",
            error?.message || error
        );


        /*
         * General chat failure should not crash
         * the complete WhatsApp / AI pipeline.
         */

        return {

            success: true,

            code:
                "GENERAL_CHAT_FALLBACK",

            message:
                this.getFallbackChatResponse(
                    this.safeString(
                        params.message ||
                        params.query
                    )
                ),

            timestamp:
                new Date().toISOString()

        };

    }

}


// =====================================================
// AI SERVICE RESOLVER
// =====================================================

private async getAIService(): Promise<any> {

    try {

        const globalObject =
            globalThis as any;


        /*
         * If AIService has already been registered
         * by the application bootstrap, use it.
         */

        if (
            globalObject.aiService
        ) {

            return globalObject.aiService;

        }


        if (
            globalObject.aiServiceInstance
        ) {

            return globalObject.aiServiceInstance;

        }


        return null;

    }
    catch {

        return null;

    }

}


// =====================================================
// NORMALIZE AI RESPONSE
// =====================================================

private normalizeAIResponse(
    response: any
): {
    message: string;
    data?: unknown;
} {

    /*
     * String response
     */

    if (
        typeof response === "string"
    ) {

        return {

            message:
                this.safeString(response) ||
                "AI response generated"

        };

    }


    /*
     * Null / undefined response
     */

    if (
        !response ||
        typeof response !== "object"
    ) {

        return {

            message:
                "I could not generate a response right now."

        };

    }


    const message =
        this.safeString(

            response.message ||

            response.text ||

            response.response ||

            response.answer ||

            response.content

        );


    return {

        message:
            message ||
            "AI response generated successfully.",

        data:
            response.data !== undefined
                ? response.data
                : response

    };

}


// =====================================================
// GENERAL CHAT FALLBACK
// =====================================================

private getFallbackChatResponse(
    message: string
): string {

    const text =
        this.normalizeText(message);


    if (!text) {

        return "How can I help you?";

    }


    /*
     * Greeting
     */

    if (
        /^(hi|hello|hey|namaste|namaskar)\b/i
            .test(text)
    ) {

        return (
            "Hello! I am SHIVINFRA AI Assistant. " +
            "I can help with projects, customers, " +
            "leads, expenses, bills and reports."
        );

    }


    /*
     * Help
     */

    if (
        text.includes("help") ||
        text.includes("what can you do")
    ) {

        return (
            "I can manage projects, customers, leads, " +
            "expenses, bills and reports. " +
            "You can also use me through WhatsApp."
        );

    }


    /*
     * Project
     */

    if (
        text.includes("project")
    ) {

        return (
            "I can add, search, update and delete projects. " +
            "Tell me what you want to do."
        );

    }


    /*
     * Customer
     */

    if (
        text.includes("customer")
    ) {

        return (
            "I can add, search, update and manage customers. " +
            "Tell me the customer details."
        );

    }


    /*
     * Lead
     */

    if (
        text.includes("lead")
    ) {

        return (
            "I can create, search and update leads. " +
            "Tell me the lead details."
        );

    }


    /*
     * Expense
     */

    if (
        text.includes("expense") ||
        text.includes("kharcha") ||
        text.includes("खर्च")
    ) {

        return (
            "I can add, search and update expenses. " +
            "Please provide the amount and details."
        );

    }


    /*
     * Bill
     */

    if (
        text.includes("bill") ||
        text.includes("invoice")
    ) {

        return (
            "I can upload, search and manage bills. " +
            "Please provide the bill details or file."
        );

    }


    /*
     * Report
     */

    if (
        text.includes("report")
    ) {

        return (
            "I can generate project, customer, lead, " +
            "expense, bill and financial reports."
        );

    }


    return (
        "I understood your message, but I need more " +
        "details to perform that action. " +
        "You can ask me about projects, customers, " +
        "leads, expenses, bills or reports."
    );

}


// =====================================================
// NORMALIZE STATUS
// =====================================================

private normalizeStatus(
    value: any,
    defaultValue = "active"
): string {

    const status =
        this.normalizeText(value);


    if (!status) {

        return defaultValue;

    }


    const aliases: Record<string, string> = {

        active: "active",

        inactive: "inactive",

        enabled: "active",

        disabled: "inactive",

        open: "open",

        closed: "closed",

        pending: "pending",

        completed: "completed",

        complete: "completed",

        cancelled: "cancelled",

        canceled: "cancelled"

    };


    return (
        aliases[status] ||
        status
    );

}


// =====================================================
// NORMALIZE DATE
// =====================================================

private normalizeDate(
    value: any
): string | null {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return null;

    }


    if (
        value instanceof Date &&
        !Number.isNaN(
            value.getTime()
        )
    ) {

        return value
            .toISOString()
            .split("T")[0];

    }


    const text =
        this.safeString(value);


    if (!text) {

        return null;

    }


    /*
     * YYYY-MM-DD
     */

    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(text)
    ) {

        return text;

    }


    /*
     * DD/MM/YYYY
     */

    const indian =
        text.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
        );


    if (indian) {

        const day =
            indian[1].padStart(2, "0");

        const month =
            indian[2].padStart(2, "0");

        const year =
            indian[3];


        return `${year}-${month}-${day}`;

    }


    /*
     * General Date parsing
     */

    const parsed =
        new Date(text);


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return null;

    }


    return parsed
        .toISOString()
        .split("T")[0];

}


// =====================================================
// NORMALIZE BOOLEAN
// =====================================================

private normalizeBoolean(
    value: any,
    defaultValue = false
): boolean {

    if (
        value === undefined ||
        value === null
    ) {

        return defaultValue;

    }


    if (
        typeof value === "boolean"
    ) {

        return value;

    }


    const text =
        this.normalizeText(value);


    if (
        [
            "true",
            "yes",
            "y",
            "1",
            "on",
            "active",
            "enabled"
        ].includes(text)
    ) {

        return true;

    }


    if (
        [
            "false",
            "no",
            "n",
            "0",
            "off",
            "inactive",
            "disabled"
        ].includes(text)
    ) {

        return false;

    }


    return defaultValue;

}


// =====================================================
// LIMIT STRING LENGTH
// =====================================================

private limitString(
    value: any,
    maxLength = 5000
): string {

    const text =
        this.safeString(value);


    if (!text) {

        return "";

    }


    return text.length > maxLength
        ? text.substring(
            0,
            maxLength
        )
        : text;

}


// =====================================================
// SAFE JSON PARSER
// =====================================================

private safeJsonParse<T = any>(
    value: any,
    fallback: T
): T {

    if (
        typeof value !== "string"
    ) {

        return (
            value !== undefined &&
            value !== null
        )
            ? value as T
            : fallback;

    }


    try {

        return JSON.parse(value) as T;

    }
    catch {

        return fallback;

    }

}


// =====================================================
// COMPANY ID VALIDATION
// =====================================================

private validateCompanyId(
    companyId: any
): boolean {

    const value =
        this.safeString(companyId);


    if (!value) {

        return false;

    }


    /*
     * SHIVINFRA uses UUID company IDs.
     */

    return this.validateUUID(value);

}


// =====================================================
// REQUIRED UUID CHECK
// =====================================================

private requireUUID(
    value: any,
    fieldName: string
): ValidationResult {

    const id =
        this.safeString(value);


    if (!id) {

        return {

            valid: false,

            message:
                `${fieldName} is required`

        };

    }


    if (
        !this.validateUUID(id)
    ) {

        return {

            valid: false,

            message:
                `Invalid ${fieldName}`

        };

    }


    return {

        valid: true

    };

}


// =====================================================
// END PART 7 / 8
// =====================================================
// =====================================================
// SHIVINFRA AI ACTION SERVICE V35
// PART 8 / 8
//
// FINAL SAFETY HELPERS
// RESPONSE CLEANUP
// ERROR NORMALIZATION
// CLASS CLOSE
// EXPORT
//
// Production Ready
// Multi-Tenant Safe
// AI + WhatsApp Ready
// =====================================================


// =====================================================
// RESPONSE DATA SANITIZER
// =====================================================

private sanitizeResponseData(
    data: any
): any {

    try {

        if (
            data === undefined ||
            data === null
        ) {

            return data;

        }


        if (
            typeof data === "string"
        ) {

            return this.limitString(
                this.sanitizeInput(data),
                10000
            );

        }


        if (
            typeof data !== "object"
        ) {

            return data;

        }


        if (
            Array.isArray(data)
        ) {

            return data.map(
                item =>
                    this.sanitizeResponseData(item)
            );

        }


        const clean:
            Record<string, any> = {};


        Object.keys(data).forEach(
            key => {

                /*
                 * Never expose sensitive authentication
                 * information through AI responses.
                 */

                const normalizedKey =
                    key.toLowerCase();


                if (
                    normalizedKey.includes("password") ||
                    normalizedKey.includes("token") ||
                    normalizedKey.includes("secret") ||
                    normalizedKey.includes("private_key") ||
                    normalizedKey.includes("access_key") ||
                    normalizedKey.includes("refresh_token")
                ) {

                    return;

                }


                clean[key] =
                    this.sanitizeResponseData(
                        data[key]
                    );

            }
        );


        return clean;

    }
    catch {

        return null;

    }

}


// =====================================================
// ERROR MESSAGE NORMALIZER
// =====================================================

private normalizeErrorMessage(
    error: any,
    fallback = "Operation failed"
): string {

    try {

        if (!error) {

            return fallback;

        }


        if (
            typeof error === "string"
        ) {

            return (
                this.limitString(
                    error,
                    1000
                ) ||
                fallback
            );

        }


        if (
            error.message
        ) {

            return (
                this.limitString(
                    String(error.message),
                    1000
                ) ||
                fallback
            );

        }


        if (
            error.error?.message
        ) {

            return (
                this.limitString(
                    String(
                        error.error.message
                    ),
                    1000
                ) ||
                fallback
            );

        }


        return fallback;

    }
    catch {

        return fallback;

    }

}


// =====================================================
// SUCCESS RESPONSE BUILDER
// =====================================================

private success(
    code: string,
    message: string,
    data?: any
): AIActionResponse {

    const response:
        AIActionResponse = {

        success: true,

        code,

        message:
            this.limitString(
                message,
                2000
            ),

        timestamp:
            new Date().toISOString()

    };


    if (
        data !== undefined
    ) {

        response.data =
            this.sanitizeResponseData(
                data
            );

    }


    return response;

}


// =====================================================
// ERROR RESPONSE BUILDER
// =====================================================

private failure(
    code: string,
    message: string,
    data?: any
): AIActionResponse {

    const response:
        AIActionResponse = {

        success: false,

        code,

        message:
            this.limitString(
                message,
                2000
            ),

        timestamp:
            new Date().toISOString()

    };


    if (
        data !== undefined
    ) {

        response.data =
            this.sanitizeResponseData(
                data
            );

    }


    return response;

}


// =====================================================
// EXECUTION TIME FORMATTER
// =====================================================

private executionTime(
    startTime: number
): number {

    if (
        !Number.isFinite(startTime)
    ) {

        return 0;

    }


    return Math.max(
        0,
        Date.now() - startTime
    );

}


// =====================================================
// SAFE ID EXTRACTOR
// =====================================================

private extractId(
    params: Record<string, any>,
    ...keys: string[]
): string | null {

    for (
        const key of keys
    ) {

        const value =
            this.safeString(
                params?.[key]
            );


        if (value) {

            return value;

        }

    }


    return null;

}


// =====================================================
// SAFE SEARCH QUERY
// =====================================================

private extractSearchQuery(
    params: Record<string, any>
): string {

    return this.limitString(

        this.safeString(

            params?.query ||

            params?.search ||

            params?.search_query ||

            params?.keyword ||

            params?.name ||

            params?.full_name ||

            params?.customer_name ||

            params?.project_name ||

            params?.title

        ),

        500

    );

}


// =====================================================
// SAFE PAGINATION
// =====================================================

private getPagination(
    params: Record<string, any>
): {
    page: number;
    limit: number;
    offset: number;
} {

    let page =
        this.safeNumber(
            params?.page
        );


    let limit =
        this.safeNumber(
            params?.limit ||
            params?.page_size
        );


    if (
        page === null ||
        page < 1
    ) {

        page = 1;

    }


    if (
        limit === null ||
        limit < 1
    ) {

        limit = 50;

    }


    /*
     * Production safety:
     * never allow an AI request to fetch
     * an unlimited number of records.
     */

    limit =
        Math.min(
            Math.floor(limit),
            100
        );


    page =
        Math.floor(page);


    const offset =
        (page - 1) * limit;


    return {

        page,

        limit,

        offset

    };

}


// =====================================================
// OBJECT HAS VALUE
// =====================================================

private hasValue(
    value: any
): boolean {

    if (
        value === undefined ||
        value === null
    ) {

        return false;

    }


    if (
        typeof value === "string"
    ) {

        return value.trim().length > 0;

    }


    return true;

}


// =====================================================
// REMOVE EMPTY VALUES
// =====================================================

private removeEmptyValues(
    data: Record<string, any>
): Record<string, any> {

    const clean:
        Record<string, any> = {};


    if (
        !data ||
        typeof data !== "object"
    ) {

        return clean;

    }


    Object.keys(data).forEach(
        key => {

            const value =
                data[key];


            if (
                value === undefined ||
                value === null
            ) {

                return;

            }


            if (
                typeof value === "string" &&
                !value.trim()
            ) {

                return;

            }


            clean[key] =
                value;

        }
    );


    return clean;

}


// =====================================================
// NORMALIZE COMPANY SCOPED PARAMETERS
// =====================================================

private withCompanyScope(
    params: Record<string, any>,
    companyId: string
): Record<string, any> {

    return {

        ...this.removeEmptyValues(
            params || {}
        ),

        company_id:
            companyId

    };

}


// =====================================================
// LOG ACTION ERROR
// =====================================================

private logActionError(
    action: string,
    error: any,
    companyId?: string
): void {

    try {

        console.error(
            "❌ SHIVINFRA AI ACTION ERROR",
            {

                action,

                company_id:
                    companyId || null,

                message:
                    this.normalizeErrorMessage(
                        error
                    ),

                time:
                    new Date().toISOString()

            }
        );

    }
    catch {

        /*
         * Logging must never throw.
         */

    }

}


// =====================================================
// FINAL RESPONSE CLEANUP
// =====================================================

private finalizeResponse(
    response: AIActionResponse,
    startTime?: number
): AIActionResponse {

    const cleaned:
        AIActionResponse = {

        success:
            Boolean(
                response?.success
            ),

        code:
            this.safeString(
                response?.code
            ) ||
            (
                response?.success
                    ? "SUCCESS"
                    : "ACTION_FAILED"
            ),

        message:
            this.limitString(
                this.safeString(
                    response?.message
                ) ||
                (
                    response?.success
                        ? "Operation completed successfully"
                        : "Operation failed"
                ),
                2000
            ),

        timestamp:
            response?.timestamp ||
            new Date().toISOString()

    };


    if (
        response?.data !== undefined
    ) {

        cleaned.data =
            this.sanitizeResponseData(
                response.data
            );

    }


    if (
        response?.confidence !== undefined
    ) {

        cleaned.confidence =
            response.confidence;

    }


    if (
        startTime !== undefined
    ) {

        cleaned.execution_time =
            this.executionTime(
                startTime
            );

    }
    else if (
        response?.execution_time !== undefined
    ) {

        cleaned.execution_time =
            response.execution_time;

    }


    return cleaned;

}


// =====================================================
// SERVICE HEALTH CHECK
// =====================================================

public async healthCheck(): Promise<{
    success: boolean;
    service: string;
    status: string;
    timestamp: string;
}> {

    return {

        success: true,

        service:
            "SHIVINFRA AI ACTION SERVICE",

        status:
            "READY",

        timestamp:
            new Date().toISOString()

    };

}


// =====================================================
// SERVICE VERSION
// =====================================================

public getVersion(): string {

    return "V35";

}


// =====================================================
// SERVICE NAME
// =====================================================

public getServiceName(): string {

    return "SHIVINFRA AI ACTION SERVICE";

}


public health(): Record<string, any> {

    return {

        status: "ACTIVE",

        service:
            "SHIVINFRA AI ACTION SERVICE",

        version: "V35",

        timestamp:
            new Date().toISOString()

    };

}


// =====================================================
// FINAL CLASS CLOSE
// =====================================================

}


// =====================================================
// SINGLETON INSTANCE
// =====================================================

const aiActionService =
    new AIActionService();


// =====================================================
// DEFAULT EXPORT
// =====================================================

export default aiActionService;


// =====================================================
// NAMED EXPORT
// =====================================================

export {
    AIActionService
};


// =====================================================
// END SHIVINFRA AI ACTION SERVICE V35
// =====================================================
