// =====================================================
// UPDATE_PROJECT Data Integrity Test
// Tests the complete UPDATE_PROJECT flow
// =====================================================

import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";
import { extractUpdateData } from "../backend/ai-engine/intentDetector.ts";
import { ConfirmationService } from "../backend/services/confirmationService.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
const TEST_PHONE = "919999202608";

// Test project data
const TEST_PROJECT = {
    company_id: COMPANY_ID,
    project_name: "Shiv Test Residency",
    location: "Pune",
    city: "Pune",
    price: 5000000,
    status: "active",
    description: "Test project for UPDATE_PROJECT verification",
};

let testProjectId: string | null = null;

async function setupTestProject() {
    console.log("\n=== SETUP: Create test project ===");

    // Check if test project already exists
    const { data: existing } = await supabase
        .from("projects")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .eq("project_name", TEST_PROJECT.project_name)
        .eq("is_deleted", false)
        .single();

    if (existing) {
        testProjectId = existing.id;
        console.log("  Test project already exists:", testProjectId);
        return;
    }

    // Create test project
    const { data, error } = await supabase
        .from("projects")
        .insert(TEST_PROJECT)
        .select()
        .single();

    if (error) {
        console.log("  ✗ Failed to create test project:", error.message);
        return;
    }

    testProjectId = data.id;
    console.log("  ✓ Test project created:", testProjectId);
}

async function testExtraction() {
    console.log("\n=== TEST 1: Extract Update Data ===");

    const testCases = [
        {
            input: "Update Shiv Test Residency price to 75 lakh",
            expected: { price: 7500000, project_name: "Shiv Test Residency" },
        },
        {
            input: "Update Shiv Test Residency location to Baner",
            expected: { location: "Baner", project_name: "Shiv Test Residency" },
        },
        {
            input: "Update price to 60 lakh for Shiv Test Residency",
            expected: { price: 6000000 },
        },
    ];

    for (const testCase of testCases) {
        const result = extractUpdateData(testCase.input);
        console.log(`\n  Input: "${testCase.input}"`);
        console.log(`  Result:`, JSON.stringify(result, null, 2));

        // Verify project_name is NOT the entire message
        if (result.project_name && result.project_name.length > 50) {
            console.log("  ✗ FAIL: project_name is too long (likely entire message)");
        } else if (result.project_name === testCase.input) {
            console.log("  ✗ FAIL: project_name is the entire input message");
        } else {
            console.log("  ✓ PASS: project_name extraction looks correct");
        }
    }
}

async function testConfirmationFlow() {
    console.log("\n=== TEST 2: Confirmation Flow ===");

    if (!testProjectId) {
        console.log("  ✗ SKIP: No test project available");
        return;
    }

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

    // Create confirmation
    const confirmation = await ConfirmationService.createConfirmation(
        COMPANY_ID,
        TEST_PHONE,
        updatePayload
    );

    if (!confirmation) {
        console.log("  ✗ FAIL: Could not create confirmation");
        return;
    }

    console.log("  ✓ Confirmation created:", confirmation.id);
    console.log("  Intent data:", JSON.stringify(confirmation.intent_data, null, 2));

    // Retrieve pending confirmation
    const pending = await ConfirmationService.getPendingConfirmation(
        COMPANY_ID,
        TEST_PHONE
    );

    if (!pending) {
        console.log("  ✗ FAIL: Could not retrieve pending confirmation");
        return;
    }

    console.log("  ✓ Pending confirmation retrieved");

    // Confirm (YES)
    const confirmed = await ConfirmationService.confirmPending(
        COMPANY_ID,
        TEST_PHONE
    );

    if (!confirmed) {
        console.log("  ✗ FAIL: Could not confirm");
        return;
    }

    console.log("  ✓ Confirmation confirmed");

    // Try to confirm again (should fail - duplicate prevention)
    const duplicate = await ConfirmationService.confirmPending(
        COMPANY_ID,
        TEST_PHONE
    );

    if (duplicate) {
        console.log("  ✗ FAIL: Duplicate confirmation succeeded");
    } else {
        console.log("  ✓ PASS: Duplicate confirmation prevented");
    }

    // Cleanup
    await supabase
        .from("pending_confirmations")
        .delete()
        .eq("id", confirmation.id);
}

async function testUpdateExecution() {
    console.log("\n=== TEST 3: Update Execution ===");

    if (!testProjectId) {
        console.log("  ✗ SKIP: No test project available");
        return;
    }

    // Get current project state
    const { data: before } = await supabase
        .from("projects")
        .select("*")
        .eq("id", testProjectId)
        .single();

    console.log("\n  BEFORE update:");
    console.log("    project_name:", before?.project_name);
    console.log("    price:", before?.price);
    console.log("    location:", before?.location);

    // Simulate UPDATE_PROJECT execution with only price change
    const updateData = {
        price: 7500000,
    };

    const { data: updated, error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", testProjectId)
        .eq("company_id", COMPANY_ID)
        .eq("is_deleted", false)
        .select()
        .single();

    if (error) {
        console.log("  ✗ FAIL: Update failed:", error.message);
        return;
    }

    console.log("\n  AFTER update:");
    console.log("    project_name:", updated?.project_name);
    console.log("    price:", updated?.price);
    console.log("    location:", updated?.location);

    // Verify only price changed
    if (updated?.project_name !== before?.project_name) {
        console.log("  ✗ FAIL: project_name was changed!");
    } else {
        console.log("  ✓ PASS: project_name unchanged");
    }

    if (updated?.location !== before?.location) {
        console.log("  ✗ FAIL: location was changed!");
    } else {
        console.log("  ✓ PASS: location unchanged");
    }

    if (updated?.price === 7500000) {
        console.log("  ✓ PASS: price updated correctly");
    } else {
        console.log("  ✗ FAIL: price not updated correctly");
    }

    // Restore original price
    await supabase
        .from("projects")
        .update({ price: before?.price })
        .eq("id", testProjectId);

    console.log("  ✓ Original price restored");
}

async function cleanup() {
    console.log("\n=== CLEANUP ===");

    // Delete test confirmations
    await supabase
        .from("pending_confirmations")
        .delete()
        .eq("company_id", COMPANY_ID)
        .eq("phone", TEST_PHONE);

    console.log("  ✓ Test confirmations cleaned up");

    // Optionally delete test project
    // await supabase.from("projects").delete().eq("id", testProjectId);
    // console.log("  ✓ Test project deleted");
}

async function main() {
    console.log("=====================================");
    console.log("UPDATE_PROJECT Data Integrity Test");
    console.log("=====================================");

    await setupTestProject();
    await testExtraction();
    await testConfirmationFlow();
    await testUpdateExecution();
    await cleanup();

    console.log("\n=====================================");
    console.log("UPDATE_PROJECT TEST COMPLETE");
    console.log("=====================================");
}

main().catch(console.error);
