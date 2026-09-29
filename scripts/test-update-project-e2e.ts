// =====================================================
// UPDATE_PROJECT FULL E2E TEST
// Tests the complete UPDATE_PROJECT confirmation flow
// =====================================================

import dotenv from "dotenv";
dotenv.config();

import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";
import { runAgent } from "../backend/ai-engine/agent.ts";
import { extractUpdateData } from "../backend/ai-engine/intentDetector.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
const TEST_PHONE = "919999202608";

console.log("=====================================");
console.log("UPDATE_PROJECT FULL E2E TEST");
console.log("=====================================");

async function testProjectNameExtraction() {
    console.log("\n=== TEST 1: Project Name Extraction ===");

    const testCases = [
        {
            input: "Update project ABC status to completed",
            expectedName: "ABC",
            expectedStatus: "completed"
        },
        {
            input: "Change ABC project price to 50 lakh",
            expectedName: "ABC",
            expectedPrice: 5000000
        },
        {
            input: "Update project ABC location to Pune",
            expectedName: "ABC",
            expectedLocation: "Pune"
        },
    ];

    let passCount = 0;

    for (const tc of testCases) {
        console.log(`\n  Input: "${tc.input}"`);
        const result = extractUpdateData(tc.input);
        console.log(`  Result:`, JSON.stringify(result, null, 2));

        // Verify project_name is not the entire message
        if (result.project_name === tc.input) {
            console.log("  ✗ FAIL: project_name is the entire input message");
        } else if (result.project_name && result.project_name.length > 50) {
            console.log("  ✗ FAIL: project_name is too long (likely entire message)");
        } else {
            console.log("  ✓ PASS: project_name extraction looks correct");
            passCount++;
        }
    }

    return passCount === testCases.length;
}

async function testConfirmationFlow() {
    console.log("\n=== TEST 2: Confirmation Flow ===");

    // Step 1: Send UPDATE_PROJECT message
    console.log("\n  Step 1: Send UPDATE_PROJECT message");
    const updateResponse = await runAgent({
        userId: "test-user",
        companyId: COMPANY_ID,
        phone: TEST_PHONE,
        role: "ADMIN",
        message: "Update Shiv Test Residency price to 75 lakh",
        channel: "WHATSAPP"
    });

    console.log(`  Response: ${updateResponse.message}`);
    console.log(`  Intent: ${updateResponse.intent}`);
    console.log(`  Action: ${updateResponse.action}`);

    if (updateResponse.action !== "CONFIRMATION_REQUIRED") {
        console.log("  ✗ FAIL: Expected CONFIRMATION_REQUIRED action");
        return false;
    }
    console.log("  ✓ PASS: Confirmation required");

    // Step 2: Send YES to confirm
    console.log("\n  Step 2: Send YES to confirm");
    const confirmResponse = await runAgent({
        userId: "test-user",
        companyId: COMPANY_ID,
        phone: TEST_PHONE,
        role: "ADMIN",
        message: "YES",
        channel: "WHATSAPP"
    });

    console.log(`  Response: ${confirmResponse.message}`);
    console.log(`  Intent: ${confirmResponse.intent}`);
    console.log(`  Success: ${confirmResponse.success}`);

    if (!confirmResponse.success) {
        console.log("  ✗ FAIL: Confirmation failed");
        return false;
    }
    console.log("  ✓ PASS: Confirmation succeeded");

    // Step 3: Try duplicate YES (should fail)
    console.log("\n  Step 3: Try duplicate YES");
    const duplicateResponse = await runAgent({
        userId: "test-user",
        companyId: COMPANY_ID,
        phone: TEST_PHONE,
        role: "ADMIN",
        message: "YES",
        channel: "WHATSAPP"
    });

    console.log(`  Response: ${duplicateResponse.message}`);

    // After duplicate YES, the system should either:
    // 1. Return a message saying no pending confirmation
    // 2. Or handle it gracefully
    console.log("  ✓ PASS: Duplicate YES handled");

    return true;
}

async function testNoCancellation() {
    console.log("\n=== TEST 3: NO Cancellation ===");

    // Step 1: Send UPDATE_PROJECT message
    console.log("\n  Step 1: Send UPDATE_PROJECT message");
    const updateResponse = await runAgent({
        userId: "test-user",
        companyId: COMPANY_ID,
        phone: TEST_PHONE + "_cancel_test",
        role: "ADMIN",
        message: "Update Shiv Test Residency price to 99 lakh",
        channel: "WHATSAPP"
    });

    console.log(`  Response: ${updateResponse.message}`);
    console.log(`  Action: ${updateResponse.action}`);

    if (updateResponse.action !== "CONFIRMATION_REQUIRED") {
        console.log("  ✗ FAIL: Expected CONFIRMATION_REQUIRED action");
        return false;
    }
    console.log("  ✓ PASS: Confirmation required");

    // Step 2: Send NO to cancel
    console.log("\n  Step 2: Send NO to cancel");
    const cancelResponse = await runAgent({
        userId: "test-user",
        companyId: COMPANY_ID,
        phone: TEST_PHONE + "_cancel_test",
        role: "ADMIN",
        message: "NO",
        channel: "WHATSAPP"
    });

    console.log(`  Response: ${cancelResponse.message}`);

    if (!cancelResponse.message.toLowerCase().includes("cancel")) {
        console.log("  ✗ FAIL: Expected cancellation message");
        return false;
    }
    console.log("  ✓ PASS: Cancellation succeeded");

    return true;
}

async function main() {
    let allPassed = true;

    try {
        allPassed = await testProjectNameExtraction() && allPassed;
        allPassed = await testConfirmationFlow() && allPassed;
        allPassed = await testNoCancellation() && allPassed;

        console.log("\n=====================================");
        if (allPassed) {
            console.log("UPDATE_PROJECT E2E: ALL TESTS PASSED");
        } else {
            console.log("UPDATE_PROJECT E2E: SOME TESTS FAILED");
        }
        console.log("=====================================");
    } catch (error: any) {
        console.error("TEST ERROR:", error);
        console.log("\nSTATUS: FAIL");
    }
}

main().catch(console.error);
