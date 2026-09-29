// =====================================================
// SHIVINFRA CONFIRMATION SYSTEM E2E TEST
// Tests persistent confirmation storage
// =====================================================

import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";
import { ConfirmationService } from "../backend/services/confirmationService.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
const TEST_PHONE = "919999202608";

async function testCreateConfirmation() {
    console.log("\n=== CREATE PENDING CONFIRMATION ===");

    const payload = {
        intent: { name: "DELETE_PROJECT", action: "DELETE", entity: "PROJECT", parameters: { project_id: "test-123" } },
        userId: "user-123",
        role: "ADMIN",
        channel: "WHATSAPP",
        originalMessage: "Delete project Test Project",
    };

    const result = await ConfirmationService.createConfirmation(
        COMPANY_ID,
        TEST_PHONE,
        payload
    );

    if (result) {
        console.log("✓ Confirmation created:", result.id);
        console.log("  Intent:", result.intent);
        console.log("  Status:", result.status);
        console.log("  Expires:", result.expires_at);
    } else {
        console.log("✗ Failed to create confirmation");
    }

    return result;
}

async function testGetPendingConfirmation() {
    console.log("\n=== GET PENDING CONFIRMATION ===");

    const result = await ConfirmationService.getPendingConfirmation(
        COMPANY_ID,
        TEST_PHONE
    );

    if (result) {
        console.log("✓ Pending confirmation found:", result.id);
        console.log("  Intent:", result.intent);
        console.log("  Status:", result.status);
    } else {
        console.log("✗ No pending confirmation found");
    }

    return result;
}

async function testConfirmPending() {
    console.log("\n=== CONFIRM PENDING (YES) ===");

    const result = await ConfirmationService.confirmPending(
        COMPANY_ID,
        TEST_PHONE
    );

    if (result) {
        console.log("✓ Confirmation confirmed:", result.id);
        console.log("  Status:", result.status);
        console.log("  Confirmed at:", result.confirmed_at);
    } else {
        console.log("✗ Failed to confirm (may already be confirmed)");
    }

    return result;
}

async function testDuplicatePrevention() {
    console.log("\n=== DUPLICATE PREVENTION (second YES) ===");

    const result = await ConfirmationService.confirmPending(
        COMPANY_ID,
        TEST_PHONE
    );

    if (result) {
        console.log("✗ Duplicate confirmation succeeded (BUG)");
    } else {
        console.log("✓ Duplicate confirmation prevented");
    }
}

async function testCancelPending() {
    console.log("\n=== CANCEL PENDING (NO) ===");

    // Create a new confirmation first
    const payload = {
        intent: { name: "DELETE_PROJECT", action: "DELETE", entity: "PROJECT", parameters: { project_id: "test-456" } },
        userId: "user-123",
        role: "ADMIN",
        channel: "WHATSAPP",
        originalMessage: "Delete project Test Project 2",
    };

    await ConfirmationService.createConfirmation(
        COMPANY_ID,
        TEST_PHONE + "-cancel",
        payload
    );

    const result = await ConfirmationService.cancelPending(
        COMPANY_ID,
        TEST_PHONE + "-cancel"
    );

    if (result) {
        console.log("✓ Confirmation cancelled successfully");
    } else {
        console.log("✗ Failed to cancel");
    }
}

async function testExpiredConfirmation() {
    console.log("\n=== EXPIRED CONFIRMATION ===");

    // Create a confirmation with past expiry
    const { data, error } = await supabase
        .from("pending_confirmations")
        .insert({
            company_id: COMPANY_ID,
            phone: TEST_PHONE + "-expired",
            intent: "DELETE_PROJECT",
            payload: { intent: { name: "DELETE_PROJECT" } },
            status: "PENDING",
            expires_at: new Date(Date.now() - 10000).toISOString(), // Already expired
        })
        .select()
        .single();

    if (error) {
        console.log("✗ Failed to create expired confirmation:", error.message);
        return;
    }

    console.log("Created expired confirmation:", data.id);

    // Try to get it - should return null and mark as expired
    const result = await ConfirmationService.getPendingConfirmation(
        COMPANY_ID,
        TEST_PHONE + "-expired"
    );

    if (result) {
        console.log("✗ Expired confirmation still returned (BUG)");
    } else {
        console.log("✓ Expired confirmation correctly rejected");
    }
}

async function testCompanyIsolation() {
    console.log("\n=== COMPANY ISOLATION ===");

    const OTHER_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

    // Create confirmation for company A
    const payload = {
        intent: { name: "DELETE_PROJECT", action: "DELETE", entity: "PROJECT" },
        userId: "user-123",
        role: "ADMIN",
        channel: "WHATSAPP",
        originalMessage: "Delete project",
    };

    await ConfirmationService.createConfirmation(
        COMPANY_ID,
        TEST_PHONE + "-isolation",
        payload
    );

    // Try to access from company B
    const result = await ConfirmationService.getPendingConfirmation(
        OTHER_COMPANY_ID,
        TEST_PHONE + "-isolation"
    );

    if (result) {
        console.log("✗ Cross-company access succeeded (BUG)");
    } else {
        console.log("✓ Company isolation working");
    }
}

async function cleanup() {
    console.log("\n=== CLEANUP ===");

    // Delete test confirmations
    const { error } = await supabase
        .from("pending_confirmations")
        .delete()
        .eq("company_id", COMPANY_ID)
        .like("phone", `${TEST_PHONE}%`);

    if (error) {
        console.log("✗ Cleanup failed:", error.message);
    } else {
        console.log("✓ Test data cleaned up");
    }
}

async function main() {
    console.log("=====================================");
    console.log("CONFIRMATION SYSTEM E2E TEST");
    console.log("=====================================");

    // Cleanup any existing test data
    await cleanup();

    // Test 1: Create confirmation
    await testCreateConfirmation();

    // Test 2: Get pending confirmation
    await testGetPendingConfirmation();

    // Test 3: Confirm (YES)
    await testConfirmPending();

    // Test 4: Duplicate prevention
    await testDuplicatePrevention();

    // Test 5: Cancel (NO)
    await testCancelPending();

    // Test 6: Expired confirmation
    await testExpiredConfirmation();

    // Test 7: Company isolation
    await testCompanyIsolation();

    // Cleanup
    await cleanup();

    console.log("\n=====================================");
    console.log("CONFIRMATION E2E TEST COMPLETE");
    console.log("=====================================");
}

main().catch(console.error);
