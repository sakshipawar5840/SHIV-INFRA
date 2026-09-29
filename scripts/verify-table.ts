import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

async function verifyTable() {
    console.log("=== VERIFYING PENDING_CONFIRMATIONS TABLE ===\n");

    // Method 1: Try to select from the table
    console.log("Method 1: Direct select");
    const { data: selectData, error: selectError } = await supabase
        .from("pending_confirmations")
        .select("*")
        .limit(1);

    if (selectError) {
        console.log("  ✗ Failed:", selectError.message);
        console.log("  Code:", selectError.code);
    } else {
        console.log("  ✓ Table exists! Rows:", selectData?.length || 0);
    }

    // Method 2: Try to insert a test row
    console.log("\nMethod 2: Insert test row");
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
        console.log("  ✗ Insert failed:", insertError.message);
        console.log("  Code:", insertError.code);
        console.log("  Details:", insertError.details);
    } else {
        console.log("  ✓ Insert succeeded! ID:", insertData.id);

        // Clean up
        await supabase
            .from("pending_confirmations")
            .delete()
            .eq("id", insertData.id);
        console.log("  ✓ Test row cleaned up");
    }

    // Method 3: Check columns
    console.log("\nMethod 3: Verify columns");
    const { data: colData, error: colError } = await supabase
        .from("pending_confirmations")
        .select("id, company_id, phone, intent, intent_data, status, action_executed, created_at, expires_at")
        .limit(1);

    if (colError) {
        console.log("  ✗ Column check failed:", colError.message);
    } else {
        console.log("  ✓ All required columns exist");
    }
}

verifyTable().catch(console.error);
