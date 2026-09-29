// =====================================================
// GEMINI LIVE AI TEST
// Tests Gemini API connectivity and intent detection
// =====================================================

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = String(process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = String(process.env.GEMINI_MODEL || "gemini-flash-latest").trim();

console.log("=====================================");
console.log("GEMINI LIVE AI TEST");
console.log("=====================================");
console.log(`Model: ${GEMINI_MODEL}`);
console.log(`API Key configured: ${GEMINI_API_KEY ? "YES (" + GEMINI_API_KEY.substring(0, 8) + "...)" : "NO"}`);

if (!GEMINI_API_KEY) {
    console.log("FAIL: GEMINI_API_KEY not configured");
    process.exit(1);
}

const aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function testGeminiRequest(message: string): Promise<any> {
    console.log(`\n--- Test: "${message}" ---`);

    try {
        const response = await aiClient.models.generateContent({
            model: GEMINI_MODEL,
            contents: `You are SHIVINFRA AI Construction ERP. Return ONLY valid JSON with intent classification.
Available intents: ADD_PROJECT, SEARCH_PROJECTS, UPDATE_PROJECT, DELETE_PROJECT, ADD_CUSTOMER, SEARCH_CUSTOMERS, UPDATE_CUSTOMER, DELETE_CUSTOMER, ADD_LEAD, SEARCH_LEADS, GENERAL_CHAT

Message: "${message}"

Return JSON: {"name":"INTENT_NAME","action":"ACTION","entity":"ENTITY","parameters":{...},"confidence":0.X}`
        });

        const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (!text) {
            console.log("  Response: EMPTY");
            return null;
        }

        console.log(`  Raw response: ${text.substring(0, 200)}`);

        // Try to parse JSON
        const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        console.log(`  Intent: ${parsed.name}`);
        console.log(`  Confidence: ${parsed.confidence}`);
        console.log(`  Parameters: ${JSON.stringify(parsed.parameters)}`);
        return parsed;

    } catch (error: any) {
        const errorMessage = error?.message || String(error);
        console.log(`  ERROR: ${errorMessage}`);

        // Check for specific error types
        if (errorMessage.includes("429")) {
            console.log("  → HTTP 429: Quota exceeded");
        } else if (errorMessage.includes("403")) {
            console.log("  → HTTP 403: API key invalid or API disabled");
        } else if (errorMessage.includes("503")) {
            console.log("  → HTTP 503: Service unavailable");
        }

        return null;
    }
}

async function main() {
    console.log("\n=== TEST 1: Gemini Connectivity ===");

    const testMessages = [
        "Show all projects",
        "Add project ABC in Pune",
        "Find customer Rahul"
    ];

    let passCount = 0;
    let failCount = 0;

    for (const msg of testMessages) {
        const result = await testGeminiRequest(msg);
        if (result) {
            passCount++;
            console.log(`  ✓ PASS: Got intent ${result.name}`);
        } else {
            failCount++;
            console.log(`  ✗ FAIL: No valid response`);
        }
    }

    console.log("\n=== SUMMARY ===");
    console.log(`Passed: ${passCount}/${testMessages.length}`);
    console.log(`Failed: ${failCount}/${testMessages.length}`);

    if (failCount > 0) {
        console.log("\nSTATUS: GEMINI LIVE API BLOCKED BY QUOTA OR ERROR");
    } else {
        console.log("\nSTATUS: GEMINI LIVE AI PASS");
    }
}

main().catch(console.error);
