import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

async function checkPendingConfirmations() {
    console.log("=== CHECK PENDING_CONFIRMATIONS TABLE ===\n");

    // Method 1: Try to select from the table
    console.log("Test 1: Direct select from pending_confirmations");
    const { data: selectData, error: selectError } = await supabase
        .from("pending_confirmations")
        .select("*")
        .limit(1);

    if (selectError) {
        console.log("  ✗ FAILED:", selectError.message);
        console.log("  Code:", selectError.code);
        console.log("\n=== RESULT: TABLE DOES NOT EXIST ===");
        console.log("\nPlease execute the migration SQL in Supabase SQL Editor:");
        console.log("https://supabase.com/dashboard/project/wiyakkkuvcwikukmvwol/sql/new");
        console.log("\nFile: backend/database/migrations/20240101_create_pending_confirmations.sql");
        return false;
    }

    console.log("  ✓ SUCCESS: Table exists");
    console.log("  Rows found:", selectData?.length || 0);

    // Method 2: Try to insert a test row
    console.log("\nTest 2: Insert test row");
    const { data: insertData, error: insertError } = await supabase
        .from("pending_confirmations")
        .insert({
            company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
            phone: "919999999999",
            intent: "TEST_INTENT",
            intent_data: { test: true },
            status: "PENDING",
            expires_at: new Date(Date.now() + 3600000).toISOString(),
            action_executed: false,
        })
        .select()
        .single();

    if (insertError) {
        console.log("  ✗ FAILED:", insertError.message);
        return false;
    }

    console.log("  ✓ SUCCESS: Inserted row with ID:", insertData.id);

    // Method 3: Verify columns
    console.log("\nTest 3: Verify all required columns");
    const { data: colData, error: colError } = await supabase
        .from("pending_confirmations")
        .select("id, company_id, phone, intent, intent_data, status, action_executed, created_at, expires_at, confirmed_at, cancelled_at")
        .eq("id", insertData.id)
        .single();

    if (colError) {
        console.log("  ✗ FAILED:", colError.message);
    } else {
        console.log("  ✓ SUCCESS: All columns exist");
        console.log("  Sample row:", JSON.stringify(colData, null, 2));
    }

    // Cleanup
    console.log("\nTest 4: Cleanup test row");
    const { error: deleteError } = await supabase
        .from("pending_confirmations")
        .delete()
        .eq("id", insertData.id);

    if (deleteError) {
        console.log("  ✗ FAILED:", deleteError.message);
    } else {
        console.log("  ✓ SUCCESS: Test row cleaned up");
    }

    console.log("\n=== RESULT: TABLE EXISTS AND IS OPERATIONAL ===");
    return true;
}

checkPendingConfirmations().catch(console.error);
