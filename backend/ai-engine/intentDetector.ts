
// =====================================================
// SHIVINFRA AI
// INTENT DETECTOR ENGINE
//
// PRODUCTION INTENT DETECTION
// Supports:
// Marathi / English / Hindi / Hinglish
//
// IMPORTANT BUSINESS RULES:
// 1. Project context has priority for project actions
// 2. Project DELETE always wins over Customer DELETE
// 3. Customer DELETE only when project context is absent
// 4. Customer UPDATE detected from fields like budget/phone/email
// 5. Customer SEARCH detected from customer/client context
// 6. Gemini result is corrected by deterministic rules
// 7. Offline fallback supported
// 8. No demo-only logic

import { GoogleGenAI } from "@google/genai";


// =====================================================
// AI CLIENT
// =====================================================

const apiKey = process.env.GEMINI_API_KEY;

let aiClient: any = null;

if (
    apiKey &&
    apiKey !== "MY_GEMINI_API_KEY"
) {
    aiClient = new GoogleGenAI({
        apiKey
    });
}


// =====================================================
// OPENAI FALLBACK
// =====================================================
// Used as 2nd tier when Gemini fails (quota, timeout, 503).
// gpt-4o-mini is cheap and fast - suitable for intent detection.

const OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || "").trim();
const OPENAI_MODEL = String(process.env.OPENAI_MODEL || "gpt-4o-mini").trim();
const OPENAI_DAILY_LIMIT = Number(process.env.OPENAI_DAILY_LIMIT || 50);
const OPENAI_CACHE_TTL_MS = 5 * 60 * 1000;

let openaiCallCount = 0;
let openaiResetTime = Date.now() + 24 * 60 * 60 * 1000;
let openaiDegradedMode = false;

const openaiCache = new Map<string, GeminiCacheEntry>();

function canCallOpenAI(): boolean {
    if (Date.now() > openaiResetTime) {
        openaiCallCount = 0;
        openaiResetTime = Date.now() + 24 * 60 * 60 * 1000;
        openaiDegradedMode = false;
    }
    return openaiCallCount < OPENAI_DAILY_LIMIT;
}

function recordOpenAICall(): void {
    openaiCallCount++;
    if (openaiCallCount >= OPENAI_DAILY_LIMIT) {
        openaiDegradedMode = true;
        console.warn("[OPENAI DEGRADED MODE] Daily limit reached. Switching to rule-based fallback.");
    }
}

function getOpenAICachedIntent(message: string): AIIntent | null {
    const key = normalizeForCache(message);
    const entry = openaiCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > OPENAI_CACHE_TTL_MS) {
        openaiCache.delete(key);
        return null;
    }
    return { ...entry.result, confidence: (entry.result.confidence || 0.9) * 0.95 };
}

function cacheOpenAIIntent(message: string, result: AIIntent): void {
    const key = normalizeForCache(message);
    if (openaiCache.size > 100) {
        const oldestKey = openaiCache.keys().next().value;
        if (oldestKey) openaiCache.delete(oldestKey);
    }
    openaiCache.set(key, { result, timestamp: Date.now() });
}

async function callOpenAIForIntent(prompt: string, systemLabel: string): Promise<any | null> {
    if (!OPENAI_API_KEY) return null;
    if (!canCallOpenAI()) {
        console.log(`[AI PROVIDER] OpenAI daily limit reached - using rule-based fallback`);
        return null;
    }

const cached = getOpenAICachedIntent(systemLabel);
        if (cached) {
            console.log(`[AI PROVIDER] Using OpenAI cached result for: ${systemLabel.substring(0, 30)}`);
            return correctIntent(systemLabel, cached);
        }

    try {
        recordOpenAICall();
        console.log(`[AI PROVIDER] Using OpenAI fallback (${OPENAI_MODEL}) - Gemini unavailable`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                messages: [
                    { role: "system", content: "You are a construction ERP intent detection engine. Return ONLY valid JSON." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
                response_format: { type: "json_object" }
            }),
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text().catch(() => "");
            console.error(`[OPENAI ERROR] HTTP ${response.status}: ${errorText.substring(0, 200)}`);
            return null;
        }

        const data = await response.json();
        const text = data?.choices?.[0]?.message?.content || "";

        if (!text) {
            console.warn("[OPENAI] Empty response");
            return null;
        }

        try {
            const parsed = JSON.parse(text);
            return parsed;
        } catch (parseErr) {
            console.warn("[OPENAI] JSON parse failed:", text.substring(0, 100));
            return null;
        }

    } catch (error: any) {
        const msg = String(error?.message || error);
        if (msg.includes("429")) {
            console.warn("[OPENAI QUOTA EXCEEDED] Switching to rule-based fallback");
            openaiDegradedMode = true;
        } else {
            console.error("[OPENAI ERROR]", msg.substring(0, 200));
        }
        return null;
    }
}


// =====================================================
// GEMINI QUOTA MANAGEMENT
// =====================================================
// Free tier: 20 requests/day. Cache similar messages and
// throttle to preserve quota for unique requests.

const GEMINI_DAILY_LIMIT = Number(process.env.GEMINI_DAILY_LIMIT || 15);
const GEMINI_CACHE_TTL_MS = 5 * 60 * 1000;

interface GeminiCacheEntry {
    result: AIIntent;
    timestamp: number;
}

const geminiCache = new Map<string, GeminiCacheEntry>();
let geminiCallCount = 0;
let geminiResetTime = Date.now() + 24 * 60 * 60 * 1000;
let geminiDegradedMode = false;

function normalizeForCache(message: string): string {
    return message.toLowerCase().replace(/\s+/g, " ").trim();
}

function getCachedIntent(message: string): AIIntent | null {
    const key = normalizeForCache(message);
    const entry = geminiCache.get(key);

    if (!entry) {
        return null;
    }

    if (Date.now() - entry.timestamp > GEMINI_CACHE_TTL_MS) {
        geminiCache.delete(key);
        return null;
    }

    return { ...entry.result, confidence: (entry.result.confidence || 0.9) * 0.95 };
}

function cacheIntent(message: string, result: AIIntent): void {
    const key = normalizeForCache(message);

    if (geminiCache.size > 100) {
        const oldestKey = geminiCache.keys().next().value;
        if (oldestKey) {
            geminiCache.delete(oldestKey);
        }
    }

    geminiCache.set(key, { result, timestamp: Date.now() });
}

function canCallGemini(): boolean {
    if (Date.now() > geminiResetTime) {
        geminiCallCount = 0;
        geminiResetTime = Date.now() + 24 * 60 * 60 * 1000;
        geminiDegradedMode = false;
    }

    return geminiCallCount < GEMINI_DAILY_LIMIT;
}

function recordGeminiCall(): void {
    geminiCallCount++;

    if (geminiCallCount >= GEMINI_DAILY_LIMIT) {
        geminiDegradedMode = true;
        console.warn("[GEMINI DEGRADED MODE] Daily quota reached. Switching to fallback.");
    }
}

export function getGeminiStatus(): {
    callsToday: number;
    dailyLimit: number;
    degradedMode: boolean;
    cacheSize: number;
    resetTime: string;
} {
    return {
        callsToday: geminiCallCount,
        dailyLimit: GEMINI_DAILY_LIMIT,
        degradedMode: geminiDegradedMode,
        cacheSize: geminiCache.size,
        resetTime: new Date(geminiResetTime).toISOString()
    };
}

export function getAIProviderStatus(): {
    activeProvider: "gemini" | "openai" | "fallback";
    gemini: ReturnType<typeof getGeminiStatus>;
    openai: {
        callsToday: number;
        dailyLimit: number;
        degradedMode: boolean;
        cacheSize: number;
        resetTime: string;
        configured: boolean;
    };
    geminiConfigured: boolean;
} {
    let activeProvider: "gemini" | "openai" | "fallback" = "fallback";

    if (aiClient && canCallGemini() && !geminiDegradedMode) {
        activeProvider = "gemini";
    } else if (OPENAI_API_KEY && canCallOpenAI() && !openaiDegradedMode) {
        activeProvider = "openai";
    }

    return {
        activeProvider,
        gemini: getGeminiStatus(),
        openai: {
            callsToday: openaiCallCount,
            dailyLimit: OPENAI_DAILY_LIMIT,
            degradedMode: openaiDegradedMode,
            cacheSize: openaiCache.size,
            resetTime: new Date(openaiResetTime).toISOString(),
            configured: !!OPENAI_API_KEY
        },
        geminiConfigured: !!aiClient
    };
}


// =====================================================
// INTENT TYPES
// =====================================================

export interface AIIntent {
    name: string;
    action: string;
    entity: string;
    parameters: any;
    confidence?: number;
}


// =====================================================
// MAIN INTENT DETECTOR
// =====================================================

export async function detectIntent(
    message: string
): Promise<AIIntent> {

    console.log('[DETECT_INTENT] Processing:', message);

    try {

        const normalizedMessage =
            String(message || "").trim();

        if (!normalizedMessage) {
            return {
                name: "GENERAL_CHAT",
                action: "CHAT",
                entity: "AI",
                parameters: {},
                confidence: 0.2
            };
        }


        // =================================================
        // CHECK CACHE FIRST (preserve quota)
        // =================================================

        const cached = getCachedIntent(normalizedMessage);
        if (cached) {
            console.log('[DETECT_INTENT] Cache HIT for:', normalizedMessage);
            return correctIntent(normalizedMessage, cached);
        } else {
            console.log('[DETECT_INTENT] Cache MISS for:', normalizedMessage);
        }


        // =================================================
        // GEMINI INTENT DETECTION (with quota management)
        // =================================================

        if (aiClient && canCallGemini()) {
            try {

                const prompt = `

You are SHIVINFRA AI Construction ERP Intent Engine.

Understand the user's message in:
- Marathi
- English
- Hindi
- Hinglish

Return ONLY valid JSON.
Do not return markdown.
Do not return explanations.

CRITICAL CLASSIFICATION RULES:

1. PROJECT CONTEXT

If the message mentions:
project, projects, building, construction, site, tower,
flat, unit, sqft, bhk, possession, villa, plot

then treat it as PROJECT context.

2. CUSTOMER CONTEXT

If the message mentions:
customer, client, buyer, person

or a person's name together with:
budget, phone, mobile, email, address, city, status

then treat it as CUSTOMER context.

3. CUSTOMER UPDATE

"Update/Change/Edit <name> budget/phone/email/address/city/status"
without project keywords
=> UPDATE_CUSTOMER.

4. CUSTOMER DELETE

"Delete/Remove customer <name>"
or "Delete/Remove <name>"
without project keywords
=> DELETE_CUSTOMER.

5. TASK OPERATIONS

"Show/Find/Search/List task" or "my tasks" or "pending tasks"
=> SEARCH_TASKS.

"Add/Create/New task" or "assign task"
=> ADD_TASK.

"Update/Edit/Complete task" or "task status"
=> UPDATE_TASK.

"Delete/Remove task"
=> DELETE_TASK.

6. SITE VISIT OPERATIONS

"Show/Find/Search/List site visit" or "today's visit" or "upcoming visit"
=> SEARCH_SITE_VISITS.

"Book/Schedule/Create site visit"
=> BOOK_SITE_VISIT.

"Update/Edit/Change/Reschedule site visit"
=> UPDATE_SITE_VISIT.

"Delete/Remove/Cancel site visit"
=> DELETE_SITE_VISIT.

7. INVENTORY OPERATIONS

"Show/Find/Search/List inventory" or "show stock" or "available inventory"
or "how much cement/steel"
=> SEARCH_INVENTORY.

"Add/Create/New inventory" or "add cement" or "add steel"
=> ADD_INVENTORY.

"Update/Edit inventory" or "update stock"
=> UPDATE_INVENTORY.

"Delete/Remove inventory" or "delete stock"
=> DELETE_INVENTORY.

8. VENDOR OPERATIONS

"Show/Find/Search/List vendor" or "vendors" or "suppliers"
=> SEARCH_VENDORS.

"Add/Create/New vendor"
=> ADD_VENDOR.

"Update/Edit vendor" or "vendor phone" or "vendor details"
=> UPDATE_VENDOR.

"Delete/Remove vendor"
=> DELETE_VENDOR.

9. DOCUMENT OPERATIONS

"Show/Find/Search/List document" or "project documents" or "NOC"
or "agreement" or "permit" or "drawing"
=> SEARCH_DOCUMENTS.

"Upload/Add/Create/New document"
=> UPLOAD_DOCUMENT.

"Update/Edit document"
=> UPDATE_DOCUMENT.

"Delete/Remove document"
=> DELETE_DOCUMENT.

10. REPORT GENERATION

"Generate report" or "create report" or "financial summary"
or "financial report" or "expense summary" or "expense report"
=> GENERATE_REPORT.

11. CUSTOMER SEARCH

"Show/Find/Search/List customer <name>"
or "Show/Find/Search/List <name>"
without project/task/site visit/inventory/vendor/document/report keywords
=> SEARCH_CUSTOMERS.

6. PROJECT DELETE

Any message containing:
project/building/tower/site/construction/flat/unit/villa/plot

together with:
delete/remove

=> DELETE_PROJECT.

7. PROJECT UPDATE

Project context + update/change/edit
=> UPDATE_PROJECT.

8. PROJECT SEARCH

Project context + show/find/search/list/details
=> SEARCH_PROJECTS.

9. NEVER classify a clear PROJECT DELETE as DELETE_CUSTOMER.

10. NEVER classify a clear CUSTOMER DELETE as DELETE_PROJECT
when there is no project context.

11. CUSTOMER FIELD UPDATE

If a customer/person name is followed by:
budget, phone, mobile, email, address, city or status
and there is no project context,
=> UPDATE_CUSTOMER.

Available intents:

ADD_PROJECT
SEARCH_PROJECTS
UPDATE_PROJECT
DELETE_PROJECT

ADD_CUSTOMER
SEARCH_CUSTOMERS
UPDATE_CUSTOMER
DELETE_CUSTOMER

ADD_LEAD
SEARCH_LEADS
UPDATE_LEAD
DELETE_LEAD

ADD_EXPENSE
SEARCH_EXPENSES
UPDATE_EXPENSE
DELETE_EXPENSE

UPLOAD_BILL
SEARCH_BILLS
UPDATE_BILL
DELETE_BILL

SEARCH_MATERIAL

SEARCH_TASKS
ADD_TASK
UPDATE_TASK
DELETE_TASK

BOOK_SITE_VISIT
SEARCH_SITE_VISITS
UPDATE_SITE_VISIT
DELETE_SITE_VISIT

SEARCH_INVENTORY
ADD_INVENTORY
UPDATE_INVENTORY
DELETE_INVENTORY

SEARCH_VENDORS
ADD_VENDOR
UPDATE_VENDOR
DELETE_VENDOR

SEARCH_DOCUMENTS
UPLOAD_DOCUMENT
UPDATE_DOCUMENT
DELETE_DOCUMENT

GENERATE_REPORT

CREATE_BROADCAST

GENERAL_CHAT

JSON format:

{
    "name": "",
    "action": "",
    "entity": "",
    "parameters": {},
    "confidence": 0.0
}

Extract as many parameters as possible.

User message:
${normalizedMessage}
`;


            recordGeminiCall();

            const geminiPromise = aiClient.models.generateContent({
                model: process.env.GEMINI_MODEL || "gemini-flash-latest",
                contents: prompt
            });

            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), 10000);
            });

            const response = await Promise.race([geminiPromise, timeoutPromise]) as any;


            const text =
                String(response.text || "");

            const cleaned =
                text
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim();


            let parsed: any;

            try {

                parsed =
                    JSON.parse(cleaned);

            }
            catch {

                console.log(
                    "AI Intent JSON Parse Failed:",
                    cleaned
                );

                return fallbackIntent(
                    normalizedMessage
                );
            }


            // =================================================
            // MULTI-LINGUAL "DAKHAV"
            // =================================================

            const lowerMessage =
                normalizedMessage.toLowerCase();

            const specificEntityContext =
                lowerMessage.includes("expense") ||
                lowerMessage.includes("kharch") ||
                lowerMessage.includes("bill") ||
                lowerMessage.includes("invoice") ||
                lowerMessage.includes("customer") ||
                lowerMessage.includes("client") ||
                lowerMessage.includes("lead");

            if (
                lowerMessage.includes("dakhav") &&
                !specificEntityContext
            ) {

                return {
                    name: "SEARCH_PROJECTS",
                    action: "SEARCH",
                    entity: "PROJECT",
                    parameters:
                        extractSearchQuery(
                            normalizedMessage,
                            ["dakhav"]
                        ),
                    confidence: 0.7
                };
            }


            // =================================================
            // NORMALIZE GEMINI RESULT
            // =================================================

            const normalizedIntent: AIIntent = {

                name:
                    String(
                        parsed.name ||
                        "GENERAL_CHAT"
                    )
                        .trim()
                        .toUpperCase(),

                action:
                    String(
                        parsed.action ||
                        "CHAT"
                    )
                        .trim()
                        .toUpperCase(),

                entity:
                    String(
                        parsed.entity ||
                        "AI"
                    )
                        .trim()
                        .toUpperCase(),

                parameters:
                    parsed.parameters || {},

                confidence:
                    Number(
                        parsed.confidence || 0.9
                    )
            };


            // Cache the result for future similar queries
            cacheIntent(normalizedMessage, normalizedIntent);


            // =================================================
            // DETERMINISTIC CORRECTION
            // =================================================

            return correctIntent(
                normalizedMessage,
                normalizedIntent
            );

            } catch (geminiError: any) {
                const errMsg = String(geminiError?.message || geminiError);
                console.warn(`[AI PROVIDER] Gemini failed (${errMsg.substring(0, 100)}) - trying OpenAI fallback`);
                if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
                    geminiDegradedMode = true;
                }

                // Try OpenAI fallback
                const geminiPrompt = `Return ONLY valid JSON with intent classification. Available intents: ADD_PROJECT, SEARCH_PROJECTS, UPDATE_PROJECT, DELETE_PROJECT, ADD_CUSTOMER, SEARCH_CUSTOMERS, UPDATE_CUSTOMER, DELETE_CUSTOMER, ADD_LEAD, SEARCH_LEADS, UPDATE_LEAD, DELETE_LEAD, ADD_EXPENSE, SEARCH_EXPENSES, UPDATE_EXPENSE, DELETE_EXPENSE, UPLOAD_BILL, SEARCH_BILLS, UPDATE_BILL, DELETE_BILL, SEARCH_MATERIAL, SEARCH_TASKS, ADD_TASK, UPDATE_TASK, DELETE_TASK, BOOK_SITE_VISIT, SEARCH_SITE_VISITS, UPDATE_SITE_VISIT, DELETE_SITE_VISIT, SEARCH_INVENTORY, ADD_INVENTORY, UPDATE_INVENTORY, DELETE_INVENTORY, SEARCH_VENDORS, ADD_VENDOR, UPDATE_VENDOR, DELETE_VENDOR, SEARCH_DOCUMENTS, UPLOAD_DOCUMENT, UPDATE_DOCUMENT, DELETE_DOCUMENT, GENERATE_REPORT, CREATE_BROADCAST, GENERAL_CHAT. JSON format: {"name":"INTENT","action":"ACTION","entity":"ENTITY","parameters":{},"confidence":0.X}. Message: "${normalizedMessage}"`;
                const openaiResult = await callOpenAIForIntent(geminiPrompt, normalizedMessage);

                if (openaiResult && openaiResult.name) {
                    const intent: AIIntent = {
                        name: String(openaiResult.name || "GENERAL_CHAT").toUpperCase(),
                        action: String(openaiResult.action || "CHAT").toUpperCase(),
                        entity: String(openaiResult.entity || "AI").toUpperCase(),
                        parameters: openaiResult.parameters || {},
                        confidence: Number(openaiResult.confidence || 0.85)
                    };
                    cacheOpenAIIntent(normalizedMessage, intent);
                    return correctIntent(normalizedMessage, intent);
                }
            }
        }



        // =================================================
        // OFFLINE FALLBACK
        // =================================================

        return fallbackIntent(
            normalizedMessage
        );

    }
    catch (error: any) {

        const errorMessage = String(error?.message || error);

        if (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
            console.warn("[GEMINI QUOTA EXCEEDED] Switching to fallback mode. Calls today:", geminiCallCount);
            geminiDegradedMode = true;
        } else {
            console.log(
                "Intent Error",
                errorMessage
            );
        }

        return fallbackIntent(
            message
        );
    }
}


// =====================================================
// PROJECT CONTEXT
// =====================================================

function isProjectContext(
    text: string
): boolean {

    const projectKeywords = [

        "project",
        "projects",
        "building",
        "construction",
        "site",
        "tower",
        "flat",
        "unit",
        "sqft",
        "bhk",
        "possession",
        "villa",
        "plot"

    ];

    const normalized =
        text.toLowerCase();

    return projectKeywords.some(
        keyword =>
            normalized.includes(keyword)
    );
}


// =====================================================
// CUSTOMER CONTEXT
// =====================================================

function isCustomerContext(
    text: string
): boolean {

    const normalized =
        text.toLowerCase();

    return (
        normalized.includes("customer") ||
        normalized.includes("client") ||
        normalized.includes("buyer")
    );
}


// =====================================================
// ACTION HELPERS
// =====================================================

function hasUpdateAction(
    text: string
): boolean {

    return (
        text.includes("update") ||
        text.includes("change") ||
        text.includes("edit") ||
        text.includes("badal") ||
        text.includes("modify") ||
        text.includes("set")
    );
}


function hasDeleteAction(
    text: string
): boolean {

    return (
        text.includes("delete") ||
        text.includes("remove") ||
        text.includes("delete kar") ||
        text.includes("remove kar") ||
        text.includes("delete kara") ||
        text.includes("remove kara") ||
        text.includes("delete kr") ||
        text.includes("remove kr")
    );
}


function hasSearchAction(
    text: string
): boolean {

    return (
        text.includes("show") ||
        text.includes("find") ||
        text.includes("search") ||
        text.includes("list") ||
        text.includes("details") ||
        text.includes("dakhav")
    );
}


function hasCustomerField(
    text: string
): boolean {

    return (
        text.includes("budget") ||
        text.includes("phone") ||
        text.includes("mobile") ||
        text.includes("email") ||
        text.includes("address") ||
        text.includes("city") ||
        text.includes("status")
    );
}


// =====================================================
// CORRECT AI INTENT
//
// Deterministic business rules have priority over Gemini.
// =====================================================

export function correctIntent(
    message: string,
    intent: AIIntent
): AIIntent {

    const text =
        message
            .toLowerCase()
            .trim();

    const projectContext =
        isProjectContext(text);

    const customerContext =
        isCustomerContext(text);

    const updateAction =
        hasUpdateAction(text);

    const deleteAction =
        hasDeleteAction(text);

    const searchAction =
        hasSearchAction(text);

    const customerField =
        hasCustomerField(text);


    // =====================================================
    // PRIORITY #1
    // PROJECT DELETE
    //
    // This MUST run before customer delete.
    // =====================================================

    if (
        deleteAction &&
        projectContext
    ) {

        return {

            ...intent,

            name: "DELETE_PROJECT",

            action: "DELETE",

            entity: "PROJECT",

            parameters:
                extractProjectName(
                    message
                ),

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.95
                )
        };
    }


    // =====================================================
    // PRIORITY #2
    // CUSTOMER UPDATE
    //
    // Example:
    // Update Rohit Patil budget to 70 lakh
    //
    // MUST => UPDATE_CUSTOMER
    // =====================================================

    if (
        updateAction &&
        customerField &&
        !projectContext &&
        !text.includes("lead") &&
        !text.includes("leads") &&
        !text.includes("enquiry") &&
        !text.includes("inquiry")
    ) {

        return {

            ...intent,

            name: "UPDATE_CUSTOMER",

            action: "UPDATE",

            entity: "CUSTOMER",

            parameters:
                extractCustomerUpdateData(
                    message
                ),

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.9
                )
        };
    }


    // =====================================================
    // PRIORITY #3
    // CUSTOMER DELETE
    //
    // Only when project context is absent.
    // =====================================================

    if (
        deleteAction &&
        !projectContext &&
        !text.includes("lead") &&
        !text.includes("leads") &&
        !text.includes("enquiry") &&
        !text.includes("inquiry") &&
        !text.includes("expense") &&
        !text.includes("expenses") &&
        !text.includes("kharch") &&
        !text.includes("bill") &&
        !text.includes("bills") &&
        !text.includes("invoice")
    ) {

        return {

            ...intent,

            name: "DELETE_CUSTOMER",

            action: "DELETE",

            entity: "CUSTOMER",

            parameters: {

                name:
                    extractCustomerNameForDelete(
                        message
                    )
            },

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.95
                )
        };
    }


    // =====================================================
    // PRIORITY #3.5
    // LEAD DELETE
    // =====================================================

    if (
        deleteAction &&
        text.includes("lead")
    ) {

        return {

            ...intent,

            name: "DELETE_LEAD",

            action: "DELETE",

            entity: "LEAD",

            parameters:
                extractLeadName(
                    message
                ),

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.95
                )

        };

    }


    // =====================================================
    // PRIORITY #3.6
    // LEAD UPDATE
    // =====================================================

    if (
        updateAction &&
        text.includes("lead") &&
        !text.includes("add") &&
        !text.includes("create") &&
        !text.includes("enquiry") &&
        !text.includes("inquiry")
    ) {

        return {

            ...intent,

            name: "UPDATE_LEAD",

            action: "UPDATE",

            entity: "LEAD",

            parameters:
                extractLeadUpdateData(
                    message
                ),

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.9
                )

        };

    }


    // =====================================================
    // PRIORITY #3.7
    // BROADCAST
    // =====================================================

    if (
        text.includes("broadcast") ||
        text.includes("send message to all") ||
        text.includes("send update to all") ||
        text.includes("send this message") ||
        text.includes("send to all customers") ||
        text.includes("send to all leads") ||
        text.includes("send to leads") ||
        text.includes("send to customers")
    ) {

        return {

            ...intent,

            name: "CREATE_BROADCAST",

            action: "CREATE",

            entity: "BROADCAST",

            parameters:
                extractBroadcastData(
                    message
                ),

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.9
                )

        };

    }


    // =====================================================
    // PRIORITY #3.8
    // TASK / SITE VISIT / INVENTORY / VENDOR / DOCUMENT
    // =====================================================

    if (
        text.includes("task") ||
        text.includes("to-do") ||
        text.includes("todo") ||
        text.includes("assignment")
    ) {

        console.log('[DEBUG] TASK branch matched for:', text);

        if (
            text.includes("show task") ||
            text.includes("find task") ||
            text.includes("search task") ||
            text.includes("my tasks") ||
            text.includes("pending task") ||
            text.includes("tasks")
        ) {

            return {

                ...intent,

                name: "SEARCH_TASKS",

                action: "SEARCH",

                entity: "TASK",

                parameters: {},

                confidence:
                    Math.max(
                        intent.confidence || 0.8,
                        0.8
                    )

            };

        }

        if (
            text.includes("add task") ||
            text.includes("create task") ||
            text.includes("new task") ||
            text.includes("assign task")
        ) {

            return {

                ...intent,

                name: "ADD_TASK",

                action: "CREATE",

                entity: "TASK",

                parameters: {},

                confidence:
                    Math.max(
                        intent.confidence || 0.8,
                        0.8
                    )

            };

        }

        if (
            hasDeleteAction(text)
        ) {

            return {

                ...intent,

                name: "DELETE_TASK",

                action: "DELETE",

                entity: "TASK",

                parameters: {},

                confidence:
                    Math.max(
                        intent.confidence || 0.8,
                        0.9
                    )

            };

        }

        return {

            ...intent,

            name: "UPDATE_TASK",

            action: "UPDATE",

            entity: "TASK",

            parameters: {},

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.8
                )

        };

    }

    if (
        text.includes("site visit") ||
        text.includes("inspection")
    ) {

        if (
            text.includes("book") ||
            text.includes("schedule") ||
            text.includes("create") ||
            text.includes("new")
        ) {

            return {

                ...intent,

                name: "BOOK_SITE_VISIT",

                action: "CREATE",

                entity: "SITE_VISIT",

                parameters: {},

                confidence:
                    Math.max(
                        intent.confidence || 0.8,
                        0.8
                    )

            };

        }

        if (
            hasDeleteAction(text)
        ) {

            return {

                ...intent,

                name: "DELETE_SITE_VISIT",

                action: "DELETE",

                entity: "SITE_VISIT",

                parameters: {},

                confidence:
                    Math.max(
                        intent.confidence || 0.8,
                        0.9
                    )

            };

        }

        return {

            ...intent,

            name: "SEARCH_SITE_VISITS",

            action: "SEARCH",

            entity: "SITE_VISIT",

            parameters: {},

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.8
                )

        };

    }

    if (
        text.includes("inventory") ||
        text.includes("stock") ||
        text.includes("cement stock") ||
        text.includes("steel stock")
    ) {

        if (
            text.includes("add") ||
            text.includes("create") ||
            text.includes("new")
        ) {

            return {

                ...intent,

                name: "ADD_INVENTORY",

                action: "CREATE",

                entity: "INVENTORY",

                parameters: {},

                confidence:
                    Math.max(
                        intent.confidence || 0.8,
                        0.8
                    )

            };

        }

        if (
            hasDeleteAction(text)
        ) {

            return {

                ...intent,

                name: "DELETE_INVENTORY",

                action: "DELETE",

                entity: "INVENTORY",

                parameters: {},

                confidence:
                    Math.max(
                        intent.confidence || 0.8,
                        0.9
                    )

            };

        }

        return {

            ...intent,

            name: "SEARCH_INVENTORY",

            action: "SEARCH",

            entity: "INVENTORY",

            parameters: {},

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.8
                )

        };

    }

    if (
        text.includes("vendor") ||
        text.includes("supplier")
    ) {

        if (
            text.includes("add") ||
            text.includes("create") ||
            text.includes("new")
        ) {

            return {

                ...intent,

                name: "ADD_VENDOR",

                action: "CREATE",

                entity: "VENDOR",

                parameters: {},

                confidence:
                    Math.max(
                        intent.confidence || 0.8,
                        0.8
                    )

            };

        }

        if (
            hasDeleteAction(text)
        ) {

            return {

                ...intent,

                name: "DELETE_VENDOR",

                action: "DELETE",

                entity: "VENDOR",

                parameters: {},

                confidence:
                    Math.max(
                        intent.confidence || 0.8,
                        0.9
                    )

            };

        }

        return {

            ...intent,

            name: "SEARCH_VENDORS",

            action: "SEARCH",

            entity: "VENDOR",

            parameters: {},

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.8
                )

        };

    }

    if (
        text.includes("document") ||
        text.includes("noc") ||
        text.includes("agreement") ||
        text.includes("permit") ||
        text.includes("drawing")
    ) {

        if (
            text.includes("upload") ||
            text.includes("add") ||
            text.includes("create") ||
            text.includes("new")
        ) {

            return {

                ...intent,

                name: "UPLOAD_DOCUMENT",

                action: "CREATE",

                entity: "DOCUMENT",

                parameters: {},

                confidence:
                    Math.max(
                        intent.confidence || 0.8,
                        0.8
                    )

            };

        }

        if (
            hasDeleteAction(text)
        ) {

            return {

                ...intent,

                name: "DELETE_DOCUMENT",

                action: "DELETE",

                entity: "DOCUMENT",

                parameters: {},

                confidence:
                    Math.max(
                        intent.confidence || 0.8,
                        0.9
                    )

            };

        }

        return {

            ...intent,

            name: "SEARCH_DOCUMENTS",

            action: "SEARCH",

            entity: "DOCUMENT",

            parameters: {},

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.8
                )

        };

    }

    // =====================================================
    // MATERIAL SEARCH
    //
    // A bare BHK number is NOT evidence of a material search:
    // almost every "add project" message naturally contains BHK
    // info, so we must never downgrade a project CREATE/UPDATE
    // command into SEARCH_MATERIAL. Material search requires an
    // explicit material keyword, or a "near/nearby <location>"
    // supplier lookup. We also never override a first-pass
    // ADD_PROJECT / UPDATE_PROJECT intent (reasonable confidence).
    // =====================================================

    const isProjectCreateOrUpdateCommand =
        /\b(add|create|new|naveen|banav|tayar\s+kar|update|edit|modify|change|set)\b[\s_]*\b(project|proj)\b/i.test(text) ||
        /\b(project|proj)\b[\s_]*(add|create|new|banav|update|edit|modify|change)\b/i.test(text) ||
        (
            (
                hasUpdateAction(text) ||
                hasDeleteAction(text)
            ) &&
            isProjectContext(text)
        );

    const isProjectIntent =
        (intent.name === "ADD_PROJECT" || intent.name === "UPDATE_PROJECT") &&
        (intent.confidence || 0) >= 0.6;

    const isExplicitProjectCommand =
        isProjectCreateOrUpdateCommand ||
        isProjectIntent;

    const hasMaterialKeyword =
        text.includes("material") ||
        text.includes("cement") ||
        text.includes("steel") ||
        text.includes("sand") ||
        text.includes("brick") ||
        text.includes("aggregate") ||
        text.includes("tiles") ||
        text.includes("gravel") ||
        text.includes("concrete") ||
        text.includes("putty") ||
        text.includes("supplier") ||
        text.includes("vendor");

    const isNearbySupplierLookup =
        (
            text.includes("nearby") ||
            text.includes("near ")
        ) &&
        /[a-z]{3,}/i.test(text);

    if (
        !isExplicitProjectCommand &&
        (
            hasMaterialKeyword ||
            isNearbySupplierLookup
        )
    ) {

        return {

            ...intent,

            name: "SEARCH_MATERIAL",

            action: "SEARCH",

            entity: "MATERIAL",

            parameters:
                extractSearchQuery(
                    message,
                    [
                        "material",
                        "cement",
                        "steel",
                        "sand",
                        "brick",
                        "supplier",
                        "vendor",
                        "find",
                        "search",
                        "nearby",
                        "near"
                    ]
                ),

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.9
                )

        };

    }


    // =====================================================
    // CUSTOMER SEARCH
    // =====================================================

    if (
        searchAction &&
        !projectContext &&
        !text.includes("lead") &&
        !text.includes("leads") &&
        !text.includes("enquiry") &&
        !text.includes("inquiry") &&
        !text.includes("expense") &&
        !text.includes("expenses") &&
        !text.includes("kharch") &&
        !text.includes("bill") &&
        !text.includes("bills") &&
        !text.includes("invoice") &&
        (
            customerContext ||
            !isProjectContext(text)
        )
    ) {

        const customerName =
            extractCustomerNameForDelete(
                message
            );

        return {

            ...intent,

            name: "SEARCH_CUSTOMERS",

            action: "SEARCH",

            entity: "CUSTOMER",

            parameters:
                customerName
                    ? { name: customerName }
                    : {},

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.85
                )
        };
    }


    // =====================================================
    // PRIORITY #5
    // PROJECT UPDATE
    // =====================================================

    if (
        projectContext &&
        updateAction
    ) {

        return {

            ...intent,

            name: "UPDATE_PROJECT",

            action: "UPDATE",

            entity: "PROJECT",

            parameters:
                extractUpdateData(
                    message
                ),

            confidence:
                Math.max(
                    intent.confidence || 0.7,
                    0.8
                )
        };
    }


    // =====================================================
    // PRIORITY #6
    // PROJECT SEARCH
    // =====================================================

    if (
        projectContext &&
        searchAction
    ) {

        return {

            ...intent,

            name: "SEARCH_PROJECTS",

            action: "SEARCH",

            entity: "PROJECT",

            parameters:
                extractSearchQuery(
                    message,
                    [
                        "project",
                        "projects"
                    ]
                ),

            confidence:
                Math.max(
                    intent.confidence || 0.8,
                    0.85
                )
        };
    }


    // =====================================================
    // EXISTING VALID INTENT
    // =====================================================

    return intent;
}


// =====================================================
// OFFLINE FALLBACK
// =====================================================

function fallbackIntent(
    message: string
): AIIntent {

    const text =
        message
            .toLowerCase()
            .trim();


    // =====================================================
    // PROJECT CREATE
    // =====================================================

    if (
        text.includes("add project") ||
        text.includes("create project") ||
        text.includes("new project") ||
        text.includes("project add") ||
        text.includes("project create") ||
        text.includes("project banav") ||
        text.includes("project tayar kar")
    ) {

        return {

            name: "ADD_PROJECT",

            action: "CREATE",

            entity: "PROJECT",

            parameters:
                extractProjectData(
                    message
                ),

            confidence: 0.8
        };
    }


    // =====================================================
    // PROJECT DELETE
    //
    // MUST COME BEFORE CUSTOMER DELETE.
    // =====================================================

    if (
        isProjectContext(text) &&
        hasDeleteAction(text)
    ) {

        return {

            name: "DELETE_PROJECT",

            action: "DELETE",

            entity: "PROJECT",

            parameters:
                extractProjectName(
                    message
                ),

            confidence: 0.95
        };
    }


    // =====================================================
    // PROJECT SEARCH
    // =====================================================

    if (
        text.includes("show project") ||
        text.includes("find project") ||
        text.includes("search project") ||
        (
            text.includes("projects") &&
            !text.includes("add")
        ) ||
        text.includes("project details") ||
        text.includes("project chi details") ||
        text.includes("project dakhav") ||
        text.includes("projects dakhav") ||
        text.includes("mujhe project") ||
        text.includes("mujhe projects") ||
        text.includes("cha price kay") ||
        text.includes("chi price kay") ||
        text.includes("cha rate kay") ||
        text.includes("rate kay ahe") ||
        text.includes("price kay ahe") ||
        text.includes("cha details") ||
        text.includes("chi details")
    ) {

        return {

            name: "SEARCH_PROJECTS",

            action: "SEARCH",

            entity: "PROJECT",

            parameters:
                extractSearchQuery(
                    message,
                    [
                        "project",
                        "projects"
                    ]
                ),

            confidence: 0.8
        };
    }


    // =====================================================
    // CUSTOMER UPDATE
    //
    // IMPORTANT FIX:
    // This MUST be checked before generic project update.
    //
    // Example:
    // Update Rohit Patil budget to 70 lakh
    // =====================================================

    if (
        hasUpdateAction(text) &&
        hasCustomerField(text) &&
        !isProjectContext(text) &&
        !text.includes("lead") &&
        !text.includes("leads") &&
        !text.includes("enquiry") &&
        !text.includes("inquiry")
    ) {

        return {

            name: "UPDATE_CUSTOMER",

            action: "UPDATE",

            entity: "CUSTOMER",

            parameters:
                extractCustomerUpdateData(
                    message
                ),

            confidence: 0.9
        };
    }


    // =====================================================
    // PROJECT UPDATE
    // =====================================================

    if (
        text.includes("update project") ||
        text.includes("edit project") ||
        text.includes("project update") ||
        text.includes("project change") ||
        text.includes("project badal") ||
        text.includes("project update kar") ||
        (
            isProjectContext(text) &&
            (
                text.includes("price") ||
                text.includes("amount") ||
                text.includes("status")
            ) &&
            (
                hasUpdateAction(text) ||
                text.includes("kar")
            )
        )
    ) {

        return {

            name: "UPDATE_PROJECT",

            action: "UPDATE",

            entity: "PROJECT",

            parameters:
                extractUpdateData(
                    message
                ),

            confidence: 0.8
        };
    }


    // =====================================================
    // CUSTOMER DELETE
    //
    // Project DELETE was already checked above.
    // =====================================================

    if (
        !isProjectContext(text) &&
        hasDeleteAction(text) &&
        !text.includes("lead") &&
        !text.includes("leads") &&
        !text.includes("enquiry") &&
        !text.includes("inquiry") &&
        !text.includes("expense") &&
        !text.includes("expenses") &&
        !text.includes("kharch") &&
        !text.includes("bill") &&
        !text.includes("bills") &&
        !text.includes("invoice") &&
        (
            /delete\s+\w+/i.test(text) ||
            /remove\s+\w+/i.test(text)
        )
    ) {

        return {

            name: "DELETE_CUSTOMER",

            action: "DELETE",

            entity: "CUSTOMER",

            parameters: {

                name:
                    extractCustomerNameForDelete(
                        message
                    )
            },

            confidence: 0.9
        };
    }


    // =====================================================
    // CUSTOMER CREATE
    // =====================================================

    if (
        text.includes("add customer") ||
        text.includes("create customer") ||
        text.includes("new customer") ||
        text.includes("customer add") ||
        text.includes("customer create") ||
        text.includes("customer banav")
    ) {

        return {

            name: "ADD_CUSTOMER",

            action: "CREATE",

            entity: "CUSTOMER",

            parameters:
                extractCustomerData(
                    message
                ),

            confidence: 0.8
        };
    }


    // =====================================================
    // CUSTOMER SEARCH
    // =====================================================

    if (
        text.includes("show customer") ||
        text.includes("find customer") ||
        text.includes("search customer") ||
        (
            text.includes("customers") &&
            !text.includes("add")
        ) ||
        text.includes("customer details") ||
        text.includes("customer dakhav")
    ) {

        return {

            name: "SEARCH_CUSTOMERS",

            action: "SEARCH",

            entity: "CUSTOMER",

            parameters: {

                name:
                    extractCustomerNameForDelete(
                        message
                    )
            },

            confidence: 0.8
        };
    }


    // =====================================================
    // TASK SEARCH
    // =====================================================

    if (
        text.includes("show task") ||
        text.includes("find task") ||
        text.includes("search task") ||
        text.includes("my tasks") ||
        text.includes("pending task") ||
        (
            text.includes("tasks") &&
            !text.includes("add") &&
            !text.includes("create")
        ) ||
        text.includes("task details") ||
        text.includes("task dakhav") ||
        text.includes("to-do") ||
        text.includes("todo") ||
        text.includes("assignment")
    ) {
        return {

            name: "SEARCH_TASKS",

            action: "SEARCH",

            entity: "TASK",

            parameters: {},

            confidence: 0.8
        };
    }
    // TASK CREATE
    // =====================================================

    if (
        text.includes("add task") ||
        text.includes("create task") ||
        text.includes("new task") ||
        text.includes("task add") ||
        text.includes("task create") ||
        text.includes("assign task") ||
        text.includes("add a task") ||
        text.includes("create a task") ||
        text.includes("new a task")
    ) {
        return {

            name: "ADD_TASK",

            action: "CREATE",

            entity: "TASK",

            parameters:
                extractLeadData(
                    message
                ),

            confidence: 0.8
        };
    }
    // TASK UPDATE
    // =====================================================

    if (
        text.includes("update task") ||
        text.includes("edit task") ||
        text.includes("task update") ||
        text.includes("task status") ||
        text.includes("task complete") ||
        text.includes("mark task")
    ) {

        return {

            name: "UPDATE_TASK",

            action: "UPDATE",

            entity: "TASK",

            parameters:
                extractLeadUpdateData(
                    message
                ),

            confidence: 0.8
        };
    }
    // TASK DELETE
    // =====================================================

    if (
        hasDeleteAction(text) &&
        text.includes("task")
    ) {

        return {

            name: "DELETE_TASK",

            action: "DELETE",

            entity: "TASK",

            parameters:
                extractLeadName(
                    message
                ),

            confidence: 0.9
        };
    }
    // SITE VISIT CREATE / BOOK
    // =====================================================
    // MUST COME BEFORE SITE VISIT SEARCH because "book site visit"
    // also matches "site visit" substring.

    if (
        text.includes("book site visit") ||
        text.includes("schedule site visit") ||
        text.includes("create site visit") ||
        text.includes("new site visit") ||
        text.includes("add site visit") ||
        text.includes("site visit book") ||
        text.includes("book a site visit") ||
        text.includes("schedule a site visit")
    ) {
        return {

            name: "BOOK_SITE_VISIT",

            action: "CREATE",

            entity: "SITE_VISIT",

            parameters: {
                visit_date: extractSearchQuery(
                    message,
                    ["date", "tomorrow", "today", "next"]
                )
            },

            confidence: 0.8
        };
    }
    // SITE VISIT SEARCH
    // =====================================================

    if (
        text.includes("show site visit") ||
        text.includes("find site visit") ||
        text.includes("site visit") ||
        text.includes("site visits") ||
        text.includes("today's visit") ||
        text.includes("upcoming visit") ||
        text.includes("visit schedule") ||
        text.includes("inspection")
    ) {
        return {

            name: "SEARCH_SITE_VISITS",

            action: "SEARCH",

            entity: "SITE_VISIT",

            parameters: {},

            confidence: 0.8
        };
    }
    // SITE VISIT UPDATE
    // =====================================================

    if (
        text.includes("update site visit") ||
        text.includes("edit site visit") ||
        text.includes("change site visit") ||
        text.includes("reschedule site visit") ||
        text.includes("site visit update")
    ) {

        return {

            name: "UPDATE_SITE_VISIT",

            action: "UPDATE",

            entity: "SITE_VISIT",

            parameters: {},

            confidence: 0.8
        };
    }
    // SITE VISIT DELETE
    // =====================================================

    if (
        hasDeleteAction(text) &&
        text.includes("site visit")
    ) {

        return {

            name: "DELETE_SITE_VISIT",

            action: "DELETE",

            entity: "SITE_VISIT",

            parameters: {},

            confidence: 0.9
        };
    }
    // INVENTORY SEARCH
    // =====================================================

    if (
        text.includes("show inventory") ||
        text.includes("show stock") ||
        text.includes("available inventory") ||
        text.includes("inventory") ||
        text.includes("stock") ||
        text.includes("how much cement") ||
        text.includes("how much steel") ||
        text.includes("cement stock") ||
        text.includes("steel stock")
    ) {
        return {

            name: "SEARCH_INVENTORY",

            action: "SEARCH",

            entity: "INVENTORY",

            parameters: {},

            confidence: 0.8
        };
    }
    // INVENTORY CREATE
    // =====================================================

    if (
        text.includes("add inventory") ||
        text.includes("add stock") ||
        text.includes("create inventory") ||
        text.includes("new inventory") ||
        text.includes("add cement") ||
        text.includes("add steel") ||
        text.includes("inventory add")
    ) {

        return {

            name: "ADD_INVENTORY",

            action: "CREATE",

            entity: "INVENTORY",

            parameters:
                extractExpenseData(
                    message
                ),

            confidence: 0.8
        };
    }
    // INVENTORY UPDATE
    // =====================================================

    if (
        text.includes("update inventory") ||
        text.includes("update stock") ||
        text.includes("edit inventory") ||
        text.includes("stock update") ||
        text.includes("cement stock to") ||
        text.includes("inventory update")
    ) {

        return {

            name: "UPDATE_INVENTORY",

            action: "UPDATE",

            entity: "INVENTORY",

            parameters: {},

            confidence: 0.8
        };
    }
    // INVENTORY DELETE
    // =====================================================

    if (
        hasDeleteAction(text) &&
        (text.includes("inventory") || text.includes("stock"))
    ) {

        return {

            name: "DELETE_INVENTORY",

            action: "DELETE",

            entity: "INVENTORY",

            parameters: {},

            confidence: 0.9
        };
    }
    // VENDOR SEARCH
    // =====================================================

    if (
        text.includes("show vendor") ||
        text.includes("find vendor") ||
        text.includes("search vendor") ||
        text.includes("all vendors") ||
        text.includes("vendors") ||
        text.includes("supplier") ||
        text.includes("suppliers") ||
        text.includes("cement supplier") ||
        text.includes("cement suppliers")
    ) {

        return {

            name: "SEARCH_VENDORS",

            action: "SEARCH",

            entity: "VENDOR",

            parameters: {},

            confidence: 0.8
        };
    }
    // VENDOR CREATE
    // =====================================================

    if (
        text.includes("add vendor") ||
        text.includes("create vendor") ||
        text.includes("new vendor") ||
        text.includes("vendor add") ||
        text.includes("vendor create")
    ) {

        return {

            name: "ADD_VENDOR",

            action: "CREATE",

            entity: "VENDOR",

            parameters:
                extractCustomerData(
                    message
                ),

            confidence: 0.8
        };
    }
    // VENDOR UPDATE
    // =====================================================

    if (
        text.includes("update vendor") ||
        text.includes("edit vendor") ||
        text.includes("vendor update") ||
        text.includes("vendor phone") ||
        text.includes("vendor details")
    ) {

        return {

            name: "UPDATE_VENDOR",

            action: "UPDATE",

            entity: "VENDOR",

            parameters: {},

            confidence: 0.8
        };
    }
    // VENDOR DELETE
    // =====================================================

    if (
        hasDeleteAction(text) &&
        text.includes("vendor")
    ) {

        return {

            name: "DELETE_VENDOR",

            action: "DELETE",

            entity: "VENDOR",

            parameters:
                extractCustomerNameForDelete(
                    message
                ),

            confidence: 0.9
        };
    }
    // DOCUMENT SEARCH
    // =====================================================

    if (
        text.includes("show document") ||
        text.includes("find document") ||
        text.includes("search document") ||
        text.includes("project documents") ||
        text.includes("noc document") ||
        text.includes("agreement") ||
        text.includes("permit") ||
        text.includes("drawing") ||
        (
            text.includes("documents") &&
            !text.includes("add") &&
            !text.includes("upload") &&
            !text.includes("create")
        ) ||
        text.includes("document details")
    ) {

        return {

            name: "SEARCH_DOCUMENTS",

            action: "SEARCH",

            entity: "DOCUMENT",

            parameters: {},

            confidence: 0.8
        };
    }
    // DOCUMENT UPLOAD
    // =====================================================

    if (
        text.includes("upload document") ||
        text.includes("add document") ||
        text.includes("create document") ||
        text.includes("new document") ||
        text.includes("document upload") ||
        text.includes("document add")
    ) {

        return {

            name: "UPLOAD_DOCUMENT",

            action: "CREATE",

            entity: "DOCUMENT",

            parameters: {},

            confidence: 0.8
        };
    }
    // DOCUMENT UPDATE
    // =====================================================

    if (
        text.includes("update document") ||
        text.includes("edit document") ||
        text.includes("document update")
    ) {

        return {

            name: "UPDATE_DOCUMENT",

            action: "UPDATE",

            entity: "DOCUMENT",

            parameters: {},

            confidence: 0.8
        };
    }
    // DOCUMENT DELETE
    // =====================================================

    if (
        hasDeleteAction(text) &&
        text.includes("document")
    ) {

        return {

            name: "DELETE_DOCUMENT",

            action: "DELETE",

            entity: "DOCUMENT",

            parameters: {},

            confidence: 0.9
        };
    }
    // REPORT
    // =====================================================

    if (
        text.includes("generate report") ||
        text.includes("create report") ||
        text.includes("report") ||
        text.includes("report generate") ||
        text.includes("report banav") ||
        text.includes("report tayar kar") ||
        text.includes("financial summary") ||
        text.includes("financial report") ||
        text.includes("expense summary") ||
        text.includes("expense report")
    ) {

        return {

            name: "GENERATE_REPORT",

            action: "GENERATE",

            entity: "REPORT",

            parameters:
                extractReportData(
                    message
                ),

            confidence: 0.7
        };
    }


    // GENERIC CUSTOMER SEARCH
    // =====================================================

    if (
        !isProjectContext(text) &&
        (
            text.includes("show") ||
            text.includes("find") ||
            text.includes("search") ||
            text.includes("list")
        ) &&
        !text.includes("lead") &&
        !text.includes("leads") &&
        !text.includes("enquiry") &&
        !text.includes("inquiry") &&
        !text.includes("expense") &&
        !text.includes("expenses") &&
        !text.includes("bill") &&
        !text.includes("bills") &&
        !text.includes("project") &&
        !text.includes("projects")
    ) {

        return {

            name: "SEARCH_CUSTOMERS",

            action: "SEARCH",

            entity: "CUSTOMER",

            parameters: {

                name:
                    extractCustomerNameForDelete(
                        message
                    )
            },

            confidence: 0.8
        };
    }


    // =====================================================
    // LEAD DELETE
    //
    // MUST COME BEFORE LEAD CREATE.
    // =====================================================

    if (
        hasDeleteAction(text) &&
        text.includes("lead")
    ) {

        return {

            name: "DELETE_LEAD",

            action: "DELETE",

            entity: "LEAD",

            parameters:
                extractLeadName(
                    message
                ),

            confidence: 0.9

        };

    }


    // =====================================================
    // LEAD UPDATE
    // =====================================================

    if (
        hasUpdateAction(text) &&
        text.includes("lead") &&
        !text.includes("add") &&
        !text.includes("create") &&
        !text.includes("enquiry") &&
        !text.includes("inquiry")
    ) {

        return {

            name: "UPDATE_LEAD",

            action: "UPDATE",

            entity: "LEAD",

            parameters:
                extractLeadUpdateData(
                    message
                ),

            confidence: 0.85

        };

    }


    // =====================================================
    // LEAD CREATE
    // =====================================================

    if (
        text.includes("add lead") ||
        text.includes("create lead") ||
        /^(?:add|create|new)\s+lead/i.test(text) ||
        text.includes("lead add") ||
        text.includes("enquiry") ||
        text.includes("inquiry") ||
        text.includes("lead create") ||
        text.includes("enquiry create") ||
        text.includes("pahije") ||
        text.includes("chahiye") ||
        (
            text.includes("property") &&
            (
                text.includes("required") ||
                text.includes("need") ||
                text.includes("want")
            )
        ) ||
        /(\d)\s*BHK/i.test(text)
    ) {

        return {

            name: "ADD_LEAD",

            action: "CREATE",

            entity: "LEAD",

            parameters:
                extractLeadData(
                    message
                ),

            confidence: 0.8
        };
    }


    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    // =====================================================

    if (
        text.includes("show lead") ||
        text.includes("find lead") ||
        text.includes("search lead") ||
        (
            text.includes("leads") &&
            !text.includes("add")
        ) ||
        text.includes("lead details") ||
        text.includes("lead dakhav") ||
        text.includes("leads dakhav")
    ) {

        return {

            name: "SEARCH_LEADS",

            action: "SEARCH",

            entity: "LEAD",

            parameters: {},

            confidence: 0.8
        };
    }


    // =====================================================
    // EXPENSE CREATE
    // =====================================================

    if (
        text.includes("add expense") ||
        text.includes("create expense") ||
        text.includes("new expense") ||
        text.includes("expense add") ||
        text.includes("expense create") ||
        text.includes("kharch add") ||
        text.includes("expense add kar") ||
        text.includes("kharch add kar")
    ) {

        return {

            name: "ADD_EXPENSE",

            action: "CREATE",

            entity: "EXPENSE",

            parameters:
                extractExpenseData(
                    message
                ),

            confidence: 0.8
        };
    }


    // =====================================================
    // EXPENSE SEARCH
    // =====================================================

    if (
        text.includes("show expense") ||
        text.includes("find expense") ||
        text.includes("search expense") ||
        text.includes("expense list") ||
        (
            text.includes("expenses") &&
            !text.includes("add")
        ) ||
        text.includes("expense details") ||
        text.includes("expense dakhav") ||
        text.includes("kharch dakhav")
    ) {

        return {

            name: "SEARCH_EXPENSES",

            action: "SEARCH",

            entity: "EXPENSE",

            parameters: {},

            confidence: 0.8
        };
    }


    // =====================================================
    // BILL UPLOAD
    // =====================================================

    if (
        text.includes("upload bill") ||
        text.includes("add bill") ||
        text.includes("create bill") ||
        text.includes("new bill") ||
        text.includes("bill add") ||
        text.includes("bill upload") ||
        text.includes("bill create") ||
        text.includes("upload invoice")
    ) {

        return {

            name: "UPLOAD_BILL",

            action: "CREATE",

            entity: "BILL",

            parameters:
                extractBillData(
                    message
                ),

            confidence: 0.8
        };
    }


    // =====================================================
    // BILL SEARCH
    // =====================================================

    if (
        text.includes("show bill") ||
        text.includes("find bill") ||
        text.includes("search bill") ||
        (
            text.includes("bills") &&
            !text.includes("add") &&
            !text.includes("upload")
        ) ||
        text.includes("bill details") ||
        text.includes("bill dakhav") ||
        text.includes("bill kay ahe") ||
        text.includes("last bill")
    ) {

        const parameters: any = {};


        const projectMatch =
            message.match(
                /(?:project|proj)[:\s]+([A-Za-z0-9\s]+?)(?:\s+in\s+|\s+at\s+|\s+from\s+|\s+bill|\s+\d{4}|\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|$)/i
            );


        const vendorMatch =
            message.match(
                /(?:vendor|from|by)[:\s]+([A-Za-z0-9\s]+?)(?:\s+in\s+|\s+at\s+|\s+bill|\s+\d{4}|\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|$)/i
            );


        const invoiceMatch =
            message.match(
                /(?:invoice|bill)[:\s#]*([A-Za-z0-9\-/\\]+)/i
            );


        const materialMatch =
            message.match(
                /\b(cement|steel|sand|brick|aggregate|tiles|gravel|concrete|putty)\b/i
            );


        const monthNames =
            [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December"
            ];


        const monthPattern =
            new RegExp(
                `\\b(${monthNames.join("|")})\\b`,
                "i"
            );


        const monthMatch =
            message.match(monthPattern);


        const yearMatch =
            message.match(/\b(20\d{2})\b/);


        const isAggregate =
            /how much|total|spent|sum/i.test(message);


        if (projectMatch && projectMatch[1]) {


            parameters.project_name =
                projectMatch[1].trim();


        }


        if (vendorMatch && vendorMatch[1]) {


            parameters.vendor_name =
                vendorMatch[1].trim();


        }


        if (invoiceMatch && invoiceMatch[1]) {


            parameters.invoice_number =
                invoiceMatch[1].trim();


        }


        if (materialMatch) {


            parameters.material =
                materialMatch[1].toLowerCase();


        }


        if (monthMatch) {


            parameters.month =
                monthMatch[1].charAt(0).toUpperCase() +
                monthMatch[1].slice(1).toLowerCase();


        }


        if (yearMatch) {


            parameters.year =
                yearMatch[1];


        }


        if (isAggregate) {


            parameters.aggregate = true;


        }


        return {

            name: "SEARCH_BILLS",

            action: "SEARCH",

            entity: "BILL",

            parameters,

            confidence:
                Math.max(
                    0.8,
                    0.9
                )

        };

    }


    // =====================================================
    // BROADCAST
    // =====================================================

    if (
        text.includes("broadcast") ||
        text.includes("send message to all") ||
        text.includes("send update to all") ||
        text.includes("send this message") ||
        text.includes("send to all customers") ||
        text.includes("send to all leads") ||
        text.includes("send to leads") ||
        text.includes("send to customers")
    ) {

        return {

            name: "CREATE_BROADCAST",

            action: "CREATE",

            entity: "BROADCAST",

            parameters:
                extractBroadcastData(
                    message
                ),

            confidence: 0.8
        };
    }


    // =====================================================


    // =====================================================
    // MATERIAL SEARCH
    // =====================================================
    // Must NOT match inventory/vendor queries - those are handled above
    // Only match pure material queries without inventory/vendor context

    if (
        (text.includes("material") ||
         text.includes("cement") ||
         text.includes("steel") ||
         text.includes("sand") ||
         text.includes("brick") ||
         text.includes("aggregate") ||
         text.includes("tiles") ||
         text.includes("gravel") ||
         text.includes("concrete") ||
         text.includes("putty")) &&
        !text.includes("inventory") &&
        !text.includes("stock") &&
        !text.includes("vendor") &&
        !text.includes("supplier")
    ) {
        return {

            name: "SEARCH_MATERIAL",

            action: "SEARCH",

            entity: "MATERIAL",

            parameters:
                extractSearchQuery(
                    message,
                    [
                        "material",
                        "cement",
                        "steel",
                        "sand",
                        "brick",
                        "supplier",
                        "vendor",
                        "find",
                        "search",
                        "nearby",
                        "near"
                    ]
                ),

            confidence: 0.8
        };
    }


    // =====================================================
    // GENERAL CHAT
    // =====================================================

    return {

        name: "GENERAL_CHAT",

        action: "CHAT",

        entity: "AI",

        parameters: {},

        confidence: 0.5
    };
}


// =====================================================
// PROJECT DATA EXTRACTION
// =====================================================

function extractProjectData(
    message: string
): any {

    const cleaned =
        message
            .replace(
                /add project|create project|new project|project add|project create|project banav|project tayar kar/gi,
                ""
            )
            .trim();


    const locationMatch =
        message.match(
            /(?:at|in|madhe|madhye|me|par)\s+([A-Za-z0-9\s,]+?)(?:\s+project|\s+type|\s+bhk|\s+sqft|\s+price|\s+crore|\s+lakh|\s+\d|$)/i
        );


    const priceMatch =
        message.match(
            /(\d+(?:\.\d+)?)\s*(lakh|lac|cr|crore|lakhs|crores)/i
        );


    const flatMatches =
        message.match(
            /(\d+\s*(?:bhk|flat|villa|penthouse))/gi
        );


    let price: number | null = null;


    if (priceMatch) {

        const value =
            Number(priceMatch[1]);

        const unit =
            priceMatch[2]
                ? priceMatch[2].toLowerCase()
                : "";


        if (
            unit.startsWith("cr") ||
            unit.startsWith("crore")
        ) {

            price =
                value * 10000000;

        }
        else if (
            unit.startsWith("lakh") ||
            unit.startsWith("lac")
        ) {

            price =
                value * 100000;
        }
    }


    return {

        project_name:
            cleaned ||
            "New Project",

        location:
            locationMatch
                ? locationMatch[1].trim()
                : null,

        project_type:
            null,

        flat_types:
            flatMatches
                ? flatMatches
                    .map((f) => f.trim())
                    .join(", ")
                : null,

        price,

        city: null,

        status: "Ongoing"
    };
}


// =====================================================
// SEARCH QUERY EXTRACTION
// =====================================================

function extractSearchQuery(
    message: string,
    keywords: string[]
): any {

    let query =
        message;


    for (
        const word of keywords
    ) {

        query =
            query.replace(
                new RegExp(
                    word,
                    "gi"
                ),
                ""
            );
    }


    return {

        query:
            query.trim()
    };
}
// =====================================================

// UPDATE DATA EXTRACTION
// =====================================================

export function extractUpdateData(
    message: string
): any {
    const params: any = {};


    const cleaned =
        message
            .replace(
                /update project|edit project|project update|project change|project badal|project update kar|update|change|badal/gi,
                ""
            )
            .trim();


    const priceMatch =
        message.match(
            /(?:price|amount|kimat|daam)\s*(?:to|ka|la|ke|chi|cha|kar|ho)?\s*(\d+(?:\.\d+)?)\s*(lakh|lac|cr|crore)?/i
        );


    if (priceMatch) {

        let price =
            Number(priceMatch[1]);


        if (priceMatch[2]) {

            const unit =
                priceMatch[2]
                    .toLowerCase();


            if (
                unit.startsWith("cr") ||
                unit.startsWith("crore")
            ) {

                price *=
                    10000000;

            }
            else if (
                unit.startsWith("lakh") ||
                unit.startsWith("lac")
            ) {

                price *=
                    100000;
            }
        }


        params.price =
            price;
    }


    // Extract location if specified
    const locationMatch =
        message.match(
            /(?:location|place|area|jagah|sthan)\s*(?:to|ka|la|ke|chi|cha|kar|ho|mein)?\s*(.+?)(?:\s*$|\s+(?:price|amount|kimat|daam|and|aur|with|ke saath))/i
        );

    let extractedLocation = "";
    if (locationMatch) {
        params.location =
            locationMatch[1]
                .replace(/[,.]$/, "")
                .trim();
        extractedLocation = params.location;
    }


    // Extract project name - remove all update-related keywords, price, location
    const projectName =
        cleaned
            .replace(
                /price|amount|kimat|daam|location|place|area|jagah|sthan|to|kar|ke|ka|la|chi|cha|ho|mein|for|and|aur|with|ke saath|\d+(?:\.\d+)?\s*(lakh|lac|cr|crore)?/gi,
                ""
            )
            .replace(
                extractedLocation ? new RegExp(extractedLocation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi') : /(?!)/,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    if (projectName && projectName.length > 1) {

        params.project_name =
            projectName;

    }


    return params;

}

// =====================================================
// PROJECT NAME EXTRACTION
// =====================================================

function extractProjectName(
    message: string
): any {

    const cleaned =
        message
            .replace(
                /delete project|remove project|project delete|project remove|project delete kar|project remove kar|delete|remove|project/gi,
                ""
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    return {

        project_name:
            cleaned ||
            "this project"
    };
}


// =====================================================
// CUSTOMER DATA EXTRACTION
// =====================================================

export function extractCustomerData(
    message: string
): any {

    const cleaned =
        message
            .replace(
                /add customer|create customer|new customer|customer add|customer create|customer banav|search customer|update customer|delete customer|remove customer/gi,
                ""
            )
            .trim();


    const phoneMatch =
        message.match(
            /(\d{10})/
        );


    const emailMatch =
        message.match(
            /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
        );


    let nameOnly =
        cleaned
            .replace(
                /\b(phone|mobile|number|contact)\b.*?\d{10}/gi,
                ""
            )
            .replace(
                /\d{10}/g,
                ""
            )
            .replace(
                /\b(phone|mobile|number|contact)\b/gi,
                ""
            )
            .replace(
                /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
                ""
            )
            .replace(
                /\b(email|e-mail|mail)\b/gi,
                ""
            )
            .replace(
                /[,\-]+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    return {

        full_name:
            nameOnly ||
            "WhatsApp Customer",

        phone:
            phoneMatch
                ? phoneMatch[1]
                : null,

        email:
            emailMatch
                ? emailMatch[1]
                : null,

        status: "active",

        source: "WhatsApp"
    };
}


// =====================================================
// CUSTOMER UPDATE DATA EXTRACTION
// =====================================================

export function extractCustomerUpdateData(
    message: string
): any {

    const params: any = {};


    // =================================================
    // CUSTOMER NAME
    // =================================================

    const name =
        extractCustomerNameForDelete(
            message
        );

    if (name) {

        params.name =
            name;
    }


    // =================================================
    // PHONE
    // =================================================

    const phoneMatch =
        message.match(
            /(\d{10})/
        );

    if (phoneMatch) {

        params.phone =
            phoneMatch[1];
    }


    // =================================================
    // BUDGET
    //
    // Supports:
    // 70 lakh
    // 70 lac
    // 70 lakhs
    // 2 crore
    // 2 cr
    // 70000
    // =================================================

    // A number is only a budget when it is either preceded by an
    // explicit budget keyword (budget/price/amount/किंमत...) or is
    // directly followed by a currency unit. A bare number such as the
    // "2" in "2BHK" must never be treated as a budget.
    const budgetMatch =
        message.match(
            /\b(?:budget|amount|price|खर्च|किंमत)\b[\s:]*(?:to|is|=|ka|ki|la|ke|चा|साठी)?\s*(\d+(?:\.\d+)?)\s*(crore|cr|lakh|lac|lakhs|thousand|k)?|\b(\d+(?:\.\d+)?)\s*(crore|cr|lakh|lac|lakhs|thousand|k)\b/i
        );


    if (budgetMatch) {

        const rawNumber =
            budgetMatch[1] !== undefined
                ? budgetMatch[1]
                : budgetMatch[3];

        let value =
            Number(rawNumber);


        const rawUnit =
            budgetMatch[2] !== undefined
                ? budgetMatch[2]
                : (budgetMatch[4] || "");

        const unit =
            rawUnit
                ? String(rawUnit).toLowerCase()
                : "";


        if (
            unit === "crore" ||
            unit === "cr"
        ) {

            value *=
                10000000;

        }
        else if (
            unit === "lakh" ||
            unit === "lac" ||
            unit === "lakhs"
        ) {

            value *=
                100000;

        }
        else if (
            unit === "thousand" ||
            unit === "k"
        ) {

            value *=
                1000;
        }


        if (
            value > 0 &&
            value < 100000000
        ) {

            params.budget =
                value;
        }
    }


    // =================================================
    // EMAIL
    // =================================================

    if (
        message
            .toLowerCase()
            .includes("email")
    ) {

        const emailMatch =
            message.match(
                /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
            );


        if (emailMatch) {

            params.email =
                emailMatch[1];
        }
    }


    // =================================================
    // ADDRESS
    // =================================================

    if (
        message
            .toLowerCase()
            .includes("address")
    ) {

        const addressMatch =
            message.match(
                /address[:\s]+([A-Za-z0-9\s,]+?)(?:\s+city|\s+status|\s+phone|\s+email|\s+budget|\s+update|\s+change|\s+to|\s+kar|\s+ho|\s+ha|\s+aahe|$)/i
            );


        if (addressMatch) {

            params.address =
                addressMatch[1].trim();
        }
    }


    // =================================================
    // CITY / LOCATION
    // =================================================

    if (
        message
            .toLowerCase()
            .includes("city") ||
        message
            .toLowerCase()
            .includes("location")
    ) {

        const cityMatch =
            message.match(
                /(?:city|location)[:\s]+([A-Za-z0-9\s]+?)(?:\s+phone|\s+email|\s+budget|\s+update|\s+change|\s+to|\s+kar|\s+ho|\s+ha|\s+aahe|$)/i
            );


        if (cityMatch) {

            params.city =
                cityMatch[1].trim();
        }
    }


    // =================================================
    // STATUS
    // =================================================

    if (
        message
            .toLowerCase()
            .includes("status")
    ) {

        const statusMatch =
            message.match(
                /status[:\s]+(active|inactive|ongoing|completed|new|hot|warm|cold)/i
            );


        if (statusMatch) {

            params.status =
                statusMatch[1]
                    .toLowerCase();
        }
    }


    return params;
}


// =====================================================
// CUSTOMER NAME EXTRACTION
// =====================================================

function extractCustomerNameForDelete(
    message: string
): string {

    let cleaned =
        message
            .replace(
                /\b(?:delete|remove|client|customer|buyer|please|kindly|krupaya|kripa|update|change|edit|set|budget|price|phone|mobile|email|address|city|status|amount|to|ka|chi|cha|la|for|hai|ha|aahe|ho|kar|banav|tayar|show|find|search|list|dakhav|is|=)\b/gi,
                ""
            )
            .replace(
                /\b\d+(?:\.\d+)?\b/g,
                ""
            )
            .replace(
                /[,\-]+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    return cleaned;
}


// =====================================================
// LEAD DATA EXTRACTION
// =====================================================

export function extractLeadData(
    message: string
): any {

    const cleaned =
        message
            .replace(
                /add lead|create lead|\bnew lead\b|lead add|lead create|enquiry|inquiry|enquiry create|search lead|update lead|delete lead|remove lead/gi,
                ""
            )
            .trim();


    const phoneMatch =
        message.match(
            /(\d{10})/
        );


    const budgetMatch =
        message.match(
            /(\d+(?:\.\d+)?)\s*(lakh|lac|cr|crore)/i
        );


    let budget: number | null = null;


    if (budgetMatch) {

        budget =
            Number(
                budgetMatch[1]
            );


        const unit =
            budgetMatch[2]
                .toLowerCase();


        if (
            unit.startsWith("cr") ||
            unit.startsWith("crore")
        ) {

            budget *=
                10000000;

        }
        else if (
            unit.startsWith("lakh") ||
            unit.startsWith("lac")
        ) {

            budget *=
                100000;
        }

    }
    else {

        const cleanedForBudget =
            message
                .replace(/\d+\s*(?:bhk|flat|villa|penthouse)/gi, "")
                .trim();

        const allNumbers =
            cleanedForBudget.match(
                /(\d+(?:\.\d+)?)\s*(lakh|lac|cr|crore|\/)?/gi
            );


        if (
            Array.isArray(allNumbers) &&
            allNumbers.length > 0
        ) {

            const lastValue =
                allNumbers[
                    allNumbers.length - 1
                ];


            const lastNumberMatch =
                lastValue.match(
                    /(\d+(?:\.\d+)?)/
                );


            if (lastNumberMatch) {

                budget =
                    Number(
                        lastNumberMatch[1]
                    );


                const lower =
                    lastValue.toLowerCase();


                if (
                    lower.includes("lakh") ||
                    lower.includes("lac")
                ) {

                    budget *=
                        100000;

                }
                else if (
                    lower.includes("cr") ||
                    lower.includes("crore")
                ) {

                    budget *=
                        10000000;
                }
            }
        }
    }

    let customerName =
        cleaned
            .replace(
                /\b(phone|mobile|number|contact)\b.*?\d{10}/gi,
                ""
            )
            .replace(
                /\d{10}/g,
                ""
            )
            .replace(
                /\b(phone|mobile|number|contact)\b/gi,
                ""
            )
            .replace(
                /\d+(?:\.\d+)?\s*(lakh|lac|cr|crore)/gi,
                ""
            )
            .replace(
                /\b(lakh|lac|cr|crore|budget|requirement|bhk|flat|villa|penthouse|to|for|the|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must|shall|can|need|dare|ought|used|won|don't|doesn't|didn't|wouldn't|couldn't|shouldn't|can't|won't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't)\b/gi,
                ""
            )
            .replace(
                /\b\d+\b/g,
                ""
            )
            .replace(
                /[,\-]+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    const requirement =
        cleaned
            .replace(
                /\b(phone|mobile|number|contact)\b\s*\d{10}/gi,
                ""
            )
            .replace(
                /\d{10}/g,
                ""
            )
            .trim();

    return {

        requirement:
            requirement ||
            message,

        budget,

        lead_source:
            "WhatsApp",

        status:
            "New",

        remarks:
            "Created by SHIVINFRA AI",

        customer_phone:
            phoneMatch
                ? phoneMatch[1]
                : null,

        customer_name:
            customerName ||
            null
    };

}


// =====================================================
// LEAD NAME EXTRACTION
// =====================================================

function extractLeadName(
    message: string
): any {

    const uuidPattern =

    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;



    const uuidMatches =

    message.match(uuidPattern) || [];



    const cleaned =
        message
            .replace(
                /\b(?:delete|remove|enquiry|inquiry|please|kindly|krupaya|kripa|update|change|edit|set|budget|price|phone|mobile|email|address|city|status|amount|to|ka|chi|cha|la|for|hai|ha|aahe|ho|kar|banav|tayar|show|find|search|list|dakhav|is|=)\b/gi,
                ""
            )
            .replace(
                /^\s*lead\s+/i,
                ""
            )
            .replace(
                /\b\d+(?:\.\d+)?\s*(?:lakh|lac|cr|crore|thousand|k|rs|rupees|₹)?\b/gi,
                ""
            )
            .replace(
                /\b(?:lakh|lac|cr|crore|thousand|k|rs|rupees|₹)\b/gi,
                ""
            )
            .replace(
                /[,\-]+/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim();



    if (uuidMatches.length > 0) {

        return {

            name:
                uuidMatches[0]

        };

    }



    return {

        name:
            cleaned

    };

}


// =====================================================
// LEAD UPDATE DATA EXTRACTION
// =====================================================

export function extractLeadUpdateData(
    message: string
): any {

    const params: any = {};


    const name =
        extractLeadName(
            message
        );

    if (name) {

        params.name =
            name;

    }


    const budgetMatch =
        message.match(
            /(\d+(?:\.\d+)?)\s*(lakh|lac|cr|crore|lakhs|crores)/i
        ) ||
        message.match(
            /budget\s+(?:to\s+)?(\d+(?:\.\d+)?)/i
        );



    if (budgetMatch) {

        params.budget =

        Number(

            budgetMatch[1]

        );



        const unit =

        (budgetMatch[2] || "")

            .toLowerCase();



        if (
            unit.startsWith("cr") ||
            unit.startsWith("crore")
        ) {

            params.budget *=

                10000000;

        }
        else if (
            unit.startsWith("lakh") ||
            unit.startsWith("lac")
        ) {

            params.budget *=

                100000;

        }

    }


    const lowerMessage =
        message
            .toLowerCase();

    const statusMatch =
        message.match(
            /status\s+(?:to\s+)?(qualified|hot|follow\s*up|closed|lost|new)/i
        ) ||
        message.match(
            /(qualified|hot|follow\s*up|closed|lost|new)\s+status/i
        );

    if (statusMatch) {

        const statusValue =
            statusMatch[1]
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

        params.status =
            statusValue === "qualified"
                ? "Qualified"
                : statusValue === "hot"
                    ? "Hot"
                    : statusValue === "follow up"
                        ? "Follow Up"
                        : statusValue === "closed"
                            ? "Closed"
                            : statusValue === "lost"
                                ? "Lost"
                                : "New";

    }


    return params;

}


// =====================================================
// EXPENSE DATA EXTRACTION
// =====================================================

function extractExpenseData(
    message: string
): any {

    const amountMatch =
        message.match(
            /(\d+(?:\.\d+)?)\s*(?:rupees|rs|₹)?/i
        );


    return {

        expense_title:
            message
                .replace(
                    /add expense|create expense|new expense|expense add|expense create|kharch add/gi,
                    ""
                )
                .trim() ||
            "Expense",

        amount:
            amountMatch
                ? Number(
                    amountMatch[1]
                )
                : null,

        expense_category:
            "General",

        payment_method:
            "Cash",

        remarks:
            "Created by SHIVINFRA AI"
    };
}


// =====================================================
// BILL DATA EXTRACTION
// =====================================================

function extractBillData(
    message: string
): any {

    const amountMatch =
        message.match(
            /(\d+(?:\.\d+)?)\s*(?:rupees|rs|₹)?/i
        );


    return {

        vendor_name:
            "Unknown Vendor",

        material_name:
            "Unknown Material",

        amount:
            amountMatch
                ? Number(
                    amountMatch[1]
                )
                : 0,

        bill_number:
            `BILL-${Date.now()}`,

        bill_date:
            new Date()
                .toISOString()
                .split("T")[0],

        payment_status:
            "Pending",

        remarks:
            "Created by SHIVINFRA AI"
    };
}


// =====================================================
// REPORT DATA EXTRACTION
// =====================================================

function extractReportData(
    message: string
): any {

    const typeMatch =
        message.match(
            /(finance|leads|inventory|audit|project|customer)/i
        );


    return {

        report_type:
            typeMatch
                ? typeMatch[1]
                    .toUpperCase()
                : "FINANCE",

        file_format:
            "PDF"
    };
}


// =====================================================
// BROADCAST DATA EXTRACTION
// =====================================================

function extractBroadcastData(
    message: string
): any {

    const cleaned =
        message
            .replace(
                /broadcast|send message to all|send update to all|send this message|send to all customers|send to all leads|send to leads|send to customers/gi,
                ""
            )
            .trim();

    let audience = "CUSTOMERS";

    if (
        message.includes("lead") ||
        message.includes("leads")
    ) {
        audience = "LEADS";
    } else if (
        message.includes("customer") ||
        message.includes("customers")
    ) {
        audience = "CUSTOMERS";
    }

    const projectMatch =
        message.match(
            /(?:project|proj)[:\s]+([A-Za-z0-9\s]+?)(?:\s+in\s+|\s+at\s+|\s+from\s+|\s+bill|\s+\d{4}|\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|$)/i
        );

    const cityMatch =
        message.match(
            /(?:city|location|in|at)\s+([A-Za-z0-9\s]+?)(?:\s+project|\s+to\s+all|\s+broadcast|$)/i
        );

    return {

        audience,

        project_id: null,

        project_name:
            projectMatch
                ? projectMatch[1].trim()
                : null,

        city:
            cityMatch
                ? cityMatch[1].trim()
                : null,

        message:
            cleaned ||
            "Update from SHIVINFRA",

        lead_status: null
    };
}

