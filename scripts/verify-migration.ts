import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

async function verifyMigration() {
    console.log("=== VERIFYING MIGRATION ===\n");

    // Test 1: Try to select from the table
    console.log("Test 1: Select from pending_confirmations");
    const { data: selectData, error: selectError } = await supabase
        .from("pending_confirmations")
        .select("*")
        .limit(1);

    if (selectError) {
        console.log("  ✗ Select failed:", selectError.message);
        console.log("  Code:", selectError.code);
    } else {
        console.log("  ✓ Table exists, data:", selectData);
    }

    // Test 2: Try to insert a test row
    console.log("\nTest 2: Insert test row");
    const { data: insertData, error: insertError } = await supabase
        .from("pending_confirmations")
        .insert({
            company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
            phone: "919999999999",
            intent: "TEST_INTENT",
            payload: { test: true },
            status: "PENDING",
            expires_at: new Date(Date.now() + 3600000).toISOString(),
        })
        .select()
        .single();

    if (insertError) {
        console.log("  ✗ Insert failed:", insertError.message);
        console.log("  Code:", insertError.code);
        console.log("  Details:", insertError.details);
    } else {
        console.log("  ✓ Insert succeeded:", insertData.id);

        // Clean up test row
        const { error: deleteError } = await supabase
            .from("pending_confirmations")
            .delete()
            .eq("id", insertData.id);

        if (deleteError) {
            console.log("  ✗ Cleanup failed:", deleteError.message);
        } else {
            console.log("  ✓ Test row cleaned up");
        }
    }

    // Test 3: Check columns by selecting specific fields
    console.log("\nTest 3: Verify columns exist");
    const { data: columnData, error: columnError } = await supabase
        .from("pending_confirmations")
        .select("id, company_id, phone, intent, payload, status, created_at, expires_at")
        .limit(1);

    if (columnError) {
        console.log("  ✗ Column check failed:", columnError.message);
    } else {
        console.log("  ✓ All required columns exist");
    }
}

verifyMigration().catch(console.error);
