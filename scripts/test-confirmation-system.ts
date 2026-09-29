// =====================================================
// UPDATE_PROJECT CONFIRMATION SYSTEM TEST
// Tests the confirmation system directly (bypasses Gemini)
// =====================================================

import dotenv from "dotenv";
dotenv.config();

import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";
import { ConfirmationService } from "../backend/services/confirmationService.ts";
import { extractUpdateData } from "../backend/ai-engine/intentDetector.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
const TEST_PHONE = "919999202608";

console.log("=====================================");
console.log("UPDATE_PROJECT CONFIRMATION SYSTEM TEST");
console.log("=====================================");

async function testProjectExtraction() {
    console.log("\n=== TEST 1: Project Name Extraction ===");

    const testCases = [
        { input: "Update project ABC status to completed", expectedName: "ABC" },
        { input: "Change ABC project price to 50 lakh", expectedName: "ABC" },
        { input: "Update project ABC location to Pune", expectedName: "ABC" },
        { input: "Update Shiv Test Residency price to 75 lakh", expectedName: "Shiv Test Residency" },
    ];

    let passCount = 0;

    for (const tc of testCases) {
        const result = extractUpdateData(tc.input);
        console.log(`\n  Input: "${tc.input}"`);
        console.log(`  Result:`, JSON.stringify(result, null, 2));

        if (result.project_name && result.project_name !== tc.input && result.project_name.length < 50) {
            console.log(`  ✓ PASS: project_name = "${result.project_name}"`);
            passCount++;
        } else {
            console.log(`  ✗ FAIL: project_name extraction issue`);
        }
    }

    return passCount === testCases.length;
}

async function testConfirmationCreation() {
    console.log("\n=== TEST 2: Confirmation Creation ===");

    // Create a confirmation for UPDATE_PROJECT
    const updatePayload = {
        intent: {
            name: "UPDATE_PROJECT",
            action: "UPDATE",
            entity: "PROJECT",
            parameters: {
                project_name: "Shiv Test Residency",
                price: 7500000,
            },
        },
        userId: "test-user",
        role: "ADMIN",
        channel: "WHATSAPP",
        originalMessage: "Update Shiv Test Residency price to 75 lakh",
    };

    const confirmation = await ConfirmationService.createConfirmation(
        COMPANY_ID,
        TEST_PHONE,
        updatePayload
    );

    if (!confirmation) {
        console.log("  ✗ FAIL: Could not create confirmation");
        return false;
    }

    console.log(`  ✓ Confirmation created: ${confirmation.id}`);
    console.log(`  Status: ${confirmation.status}`);
    console.log(`  Intent: ${confirmation.intent}`);

    // Cleanup
    await supabase.from("pending_confirmations").delete().eq("id", confirmation.id);
    console.log("  ✓ Cleanup complete");

    return true;
}

async function testYesConfirmation() {
    console.log("\n=== TEST 3: YES Confirmation ===");

    // Create confirmation
    const updatePayload = {
        intent: {
            name: "UPDATE_PROJECT",
            action: "UPDATE",
            entity: "PROJECT",
            parameters: { project_name: "Shiv Test Residency", price: 7500000 },
        },
        userId: "test-user",
        role: "ADMIN",
        channel: "WHATSAPP",
        originalMessage: "Update Shiv Test Residency price to 75 lakh",
    };

    await ConfirmationService.createConfirmation(COMPANY_ID, TEST_PHONE, updatePayload);

    // Confirm (YES)
    const confirmed = await ConfirmationService.confirmPending(COMPANY_ID, TEST_PHONE);

    if (!confirmed) {
        console.log("  ✗ FAIL: Could not confirm");
        return false;
    }

    console.log(`  ✓ Confirmation confirmed: ${confirmed.id}`);
    console.log(`  Status: ${confirmed.status}`);

    // Try duplicate YES
    const duplicate = await ConfirmationService.confirmPending(COMPANY_ID, TEST_PHONE);

    if (duplicate) {
        console.log("  ✗ FAIL: Duplicate confirmation succeeded");
        return false;
    }

    console.log("  ✓ PASS: Duplicate YES prevented");

    // Cleanup
    await supabase.from("pending_confirmations").delete().eq("id", confirmed.id);
    return true;
}

async function testNoCancellation() {
    console.log("\n=== TEST 4: NO Cancellation ===");

    const cancelPhone = TEST_PHONE + "_cancel_" + Date.now();

    // Create confirmation
    const updatePayload = {
        intent: {
            name: "UPDATE_PROJECT",
            action: "UPDATE",
            entity: "PROJECT",
            parameters: { project_name: "Shiv Test Residency", price: 9900000 },
        },
        userId: "test-user",
        role: "ADMIN",
        channel: "WHATSAPP",
        originalMessage: "Update Shiv Test Residency price to 99 lakh",
    };

    await ConfirmationService.createConfirmation(COMPANY_ID, cancelPhone, updatePayload);

    // Cancel (NO)
    const cancelled = await ConfirmationService.cancelPending(COMPANY_ID, cancelPhone);

    if (!cancelled) {
        console.log("  ✗ FAIL: Could not cancel");
        return false;
    }

    console.log("  ✓ PASS: Cancellation succeeded");

    // Verify confirmation is cancelled
    const pending = await ConfirmationService.getPendingConfirmation(COMPANY_ID, cancelPhone);

    if (pending) {
        console.log("  ✗ FAIL: Confirmation still pending after cancellation");
        return false;
    }

    console.log("  ✓ PASS: No pending confirmation after cancellation");

    return true;
}

async function testExpiredConfirmation() {
    console.log("\n=== TEST 5: Expired Confirmation ===");

    const expiredPhone = TEST_PHONE + "_expired_" + Date.now();

    // Create confirmation with expired TTL
    const { data: expiredConf } = await supabase
        .from("pending_confirmations")
        .insert({
            company_id: COMPANY_ID,
            phone: expiredPhone,
            intent: "UPDATE_PROJECT",
            intent_data: { intent: { name: "UPDATE_PROJECT" } },
            status: "PENDING",
            expires_at: new Date(Date.now() - 60000).toISOString(), // Expired 1 minute ago
            action_executed: false,
        })
        .select()
        .single();

    if (!expiredConf) {
        console.log("  ✗ FAIL: Could not create expired confirmation");
        return false;
    }

    // Try to get pending confirmation (should return null because expired)
    const pending = await ConfirmationService.getPendingConfirmation(COMPANY_ID, expiredPhone);

    if (pending) {
        console.log("  ✗ FAIL: Expired confirmation returned as pending");
        await supabase.from("pending_confirmations").delete().eq("id", expiredConf.id);
        return false;
    }

    console.log("  ✓ PASS: Expired confirmation not returned");

    // Cleanup
    await supabase.from("pending_confirmations").delete().eq("id", expiredConf.id);
    return true;
}

async function main() {
    let allPassed = true;

    try {
        allPassed = await testProjectExtraction() && allPassed;
        allPassed = await testConfirmationCreation() && allPassed;
        allPassed = await testYesConfirmation() && allPassed;
        allPassed = await testNoCancellation() && allPassed;
        allPassed = await testExpiredConfirmation() && allPassed;

        console.log("\n=====================================");
        if (allPassed) {
            console.log("UPDATE_PROJECT CONFIRMATION: ALL TESTS PASSED");
        } else {
            console.log("UPDATE_PROJECT CONFIRMATION: SOME TESTS FAILED");
        }
        console.log("=====================================");
    } catch (error: any) {
        console.error("TEST ERROR:", error);
        console.log("\nSTATUS: FAIL");
    }
}

main().catch(console.error);
