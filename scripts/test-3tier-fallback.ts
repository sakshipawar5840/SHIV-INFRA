// =====================================================
// 3-TIER FALLBACK CHAIN TEST
// Tests Gemini → OpenAI → Rule-based fallback
// =====================================================

import dotenv from "dotenv";
dotenv.config({ override: true });

const { detectIntent, getAIProviderStatus } = await import("../backend/ai-engine/intentDetector.ts");

console.log("=====================================");
console.log("3-TIER FALLBACK CHAIN TEST");
console.log("=====================================");

async function testProviderStatus() {
    console.log("\n=== TEST 1: Provider Status ===");

    const status = getAIProviderStatus();
    console.log("  Active Provider:", status.activeProvider);
    console.log("  Gemini Configured:", status.geminiConfigured);
    console.log("  Gemini Calls Today:", status.gemini.callsToday);
    console.log("  Gemini Degraded:", status.gemini.degradedMode);
    console.log("  OpenAI Configured:", status.openai.configured);
    console.log("  OpenAI Calls Today:", status.openai.callsToday);
    console.log("  OpenAI Degraded:", status.openai.degradedMode);

    if (status.geminiConfigured || status.openai.configured) {
        console.log("  ✓ PASS: At least one AI provider configured");
        return true;
    } else {
        console.log("  ✗ FAIL: No AI provider configured");
        return false;
    }
}

async function testIntent(message: string, expectedIntent: string) {
    console.log(`\n--- Test: "${message}" ---`);

    try {
        const startTime = Date.now();
        const intent = await detectIntent(message);
        const duration = Date.now() - startTime;

        console.log(`  Provider used: (see logs)`);
        console.log(`  Time: ${duration}ms`);
        console.log(`  Intent: ${intent.name}`);
        console.log(`  Action: ${intent.action}`);
        console.log(`  Entity: ${intent.entity}`);
        console.log(`  Confidence: ${intent.confidence}`);
        console.log(`  Parameters: ${JSON.stringify(intent.parameters)}`);

        if (intent.name === expectedIntent) {
            console.log(`  ✓ PASS: Expected ${expectedIntent}`);
            return true;
        } else {
            console.log(`  ✗ FAIL: Expected ${expectedIntent}, got ${intent.name}`);
            return false;
        }
    } catch (error: any) {
        console.log(`  ✗ ERROR: ${error?.message || error}`);
        return false;
    }
}

async function main() {
    let passCount = 0;
    let failCount = 0;

    const statusOk = await testProviderStatus();
    if (statusOk) passCount++; else failCount++;

    // Test the 6 expected intents
    const tests = [
        { msg: "Update project ABC status to completed", expected: "UPDATE_PROJECT" },
        { msg: "Add project ABC in Pune", expected: "ADD_PROJECT" },
        { msg: "Show all projects", expected: "SEARCH_PROJECTS" },
        { msg: "Find customer Rahul", expected: "SEARCH_CUSTOMERS" },
        { msg: "Delete project ABC", expected: "DELETE_PROJECT" },
        { msg: "Hello, how are you?", expected: "GENERAL_CHAT" }
    ];

    for (const test of tests) {
        const ok = await testIntent(test.msg, test.expected);
        if (ok) passCount++; else failCount++;
    }

    console.log("\n=====================================");
    console.log(`SUMMARY: ${passCount} PASS, ${failCount} FAIL`);
    console.log("=====================================");

    // Show final provider status
    const finalStatus = getAIProviderStatus();
    console.log(`\nFinal Active Provider: ${finalStatus.activeProvider}`);
}

main().catch(console.error);
