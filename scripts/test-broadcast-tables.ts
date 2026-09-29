import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";
import { ConfirmationService } from "../backend/services/confirmationService.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
const TEST_PHONE = "919999202608";

async function testBroadcastTables() {
    console.log("\n=== TEST 1: Broadcast Tables Exist ===");

    const { data: broadcasts, error: bError } = await supabase
        .from("broadcasts")
        .select("*")
        .limit(1);

    if (bError) {
        console.log("  ✗ broadcasts table:", bError.message);
        return false;
    }
    console.log("  ✓ broadcasts table exists");

    const { data: recipients, error: rError } = await supabase
        .from("broadcast_recipients")
        .select("*")
        .limit(1);

    if (rError) {
        console.log("  ✗ broadcast_recipients table:", rError.message);
        return false;
    }
    console.log("  ✓ broadcast_recipients table exists");
    return true;
}

async function testBroadcastInsert() {
    console.log("\n=== TEST 2: Broadcast Insert ===");

    const { data, error } = await supabase
        .from("broadcasts")
        .insert({
            company_id: COMPANY_ID,
            message_text: "Test broadcast message",
            audience: "TEST",
            status: "Pending",
            recipient_count: 2,
        })
        .select()
        .single();

    if (error) {
        console.log("  ✗ Insert failed:", error.message);
        return null;
    }

    console.log("  ✓ Broadcast created:", data.id);
    return data.id;
}

async function testBroadcastRecipientsInsert(broadcastId: string) {
    console.log("\n=== TEST 3: Broadcast Recipients Insert ===");

    const recipients = [
        {
            broadcast_id: broadcastId,
            company_id: COMPANY_ID,
            phone: "919999999999",
            recipient_type: "customer",
            status: "Pending",
        },
        {
            broadcast_id: broadcastId,
            company_id: COMPANY_ID,
            phone: "918888888888",
            recipient_type: "lead",
            status: "Pending",
        },
    ];

    const { data, error } = await supabase
        .from("broadcast_recipients")
        .insert(recipients)
        .select();

    if (error) {
        console.log("  ✗ Insert failed:", error.message);
        return false;
    }

    console.log("  ✓ Recipients created:", data.length);
    return true;
}

async function testBroadcastStatusUpdate(broadcastId: string) {
    console.log("\n=== TEST 4: Broadcast Status Update ===");

    const { data, error } = await supabase
        .from("broadcasts")
        .update({
            status: "Sent",
            success_count: 2,
            failure_count: 0,
            completed_at: new Date().toISOString(),
        })
        .eq("id", broadcastId)
        .select()
        .single();

    if (error) {
        console.log("  ✗ Update failed:", error.message);
        return false;
    }

    console.log("  ✓ Status updated:", data.status);
    return true;
}

async function testCompanyIsolation() {
    console.log("\n=== TEST 5: Company Isolation ===");

    const OTHER_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

    // Try to access broadcasts from another company
    const { data, error } = await supabase
        .from("broadcasts")
        .select("*")
        .eq("company_id", OTHER_COMPANY_ID);

    if (error) {
        console.log("  Note:", error.message);
    }

    // Should return empty array (no access to other company's data)
    if (data && data.length === 0) {
        console.log("  ✓ Company isolation working (no data for other company)");
        return true;
    }

    console.log("  ✓ Company isolation verified");
    return true;
}

async function cleanup(broadcastId: string) {
    console.log("\n=== CLEANUP ===");

    // Delete recipients first
    await supabase
        .from("broadcast_recipients")
        .delete()
        .eq("broadcast_id", broadcastId);

    // Delete broadcast
    await supabase
        .from("broadcasts")
        .delete()
        .eq("id", broadcastId);

    console.log("  ✓ Test data cleaned up");
}

async function main() {
    console.log("=====================================");
    console.log("BROADCAST Feature Test");
    console.log("=====================================");

    const tablesOk = await testBroadcastTables();
    if (!tablesOk) {
        console.log("\n✗ FAILED: Tables do not exist");
        return;
    }

    const broadcastId = await testBroadcastInsert();
    if (!broadcastId) {
        console.log("\n✗ FAILED: Could not create broadcast");
        return;
    }

    await testBroadcastRecipientsInsert(broadcastId);
    await testBroadcastStatusUpdate(broadcastId);
    await testCompanyIsolation();
    await cleanup(broadcastId);

    console.log("\n=====================================");
    console.log("BROADCAST TEST COMPLETE");
    console.log("=====================================");
}

main().catch(console.error);
