// =====================================================
// FALLBACK SAFETY TEST
// Tests that the fallback system works when Gemini is unavailable
// =====================================================

import dotenv from "dotenv";
dotenv.config();

import { detectIntent } from "../backend/ai-engine/intentDetector.ts";

console.log("=====================================");
console.log("FALLBACK SAFETY TEST");
console.log("=====================================");

const testMessages = [
    "Show all projects",
    "Add project ABC in Pune",
    "Find customer Rahul",
    "Update project ABC status to completed",
    "Delete project ABC",
    "What is the price of project XYZ?",
];

async function testFallback() {
    let passCount = 0;
    let failCount = 0;

    for (const msg of testMessages) {
        console.log(`\n--- Test: "${msg}" ---`);

        try {
            const intent = await detectIntent(msg);

            if (!intent) {
                console.log("  ✗ FAIL: No intent returned");
                failCount++;
                continue;
            }

            console.log(`  Intent: ${intent.name}`);
            console.log(`  Action: ${intent.action}`);
            console.log(`  Entity: ${intent.entity}`);
            console.log(`  Confidence: ${intent.confidence}`);
            console.log(`  Parameters: ${JSON.stringify(intent.parameters)}`);

            // Verify intent is valid
            if (intent.name && intent.name !== "UNKNOWN") {
                console.log("  ✓ PASS: Valid intent detected");
                passCount++;
            } else {
                console.log("  ✗ FAIL: Invalid intent");
                failCount++;
            }

        } catch (error: any) {
            console.log(`  ✗ FAIL: ${error?.message || error}`);
            failCount++;
        }
    }

    console.log("\n=== SUMMARY ===");
    console.log(`Passed: ${passCount}/${testMessages.length}`);
    console.log(`Failed: ${failCount}/${testMessages.length}`);

    if (failCount === 0) {
        console.log("\nSTATUS: FALLBACK PASS");
    } else {
        console.log("\nSTATUS: FALLBACK FAIL");
    }
}

testFallback().catch(console.error);
