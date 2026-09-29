import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

async function debugMigration() {
    console.log("=== DEBUG MIGRATION STATUS ===\n");

    // Check Supabase URL
    console.log("Supabase URL:", process.env.SUPABASE_URL);

    // Try to list all tables using information_schema
    console.log("\nTest 1: Query information_schema for pending_confirmations");
    const { data: schemaData, error: schemaError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .eq("table_name", "pending_confirmations");

    if (schemaError) {
        console.log("  ✗ information_schema query failed:", schemaError.message);
    } else {
        console.log("  Result:", schemaData);
        if (schemaData && schemaData.length > 0) {
            console.log("  ✓ Table found in information_schema");
        } else {
            console.log("  ✗ Table NOT found in information_schema");
        }
    }

    // Try to list all public tables
    console.log("\nTest 2: List all public tables");
    const { data: tablesData, error: tablesError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .order("table_name");

    if (tablesError) {
        console.log("  ✗ List tables failed:", tablesError.message);
    } else {
        console.log("  Public tables:", tablesData?.map((t: any) => t.table_name).join(", "));
    }

    // Try direct insert with service role (bypass RLS)
    console.log("\nTest 3: Direct insert attempt");
    const { data: insertData, error: insertError } = await supabase
        .from("pending_confirmations")
        .insert({
            company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
            phone: "919999999999",
            intent: "TEST",
            payload: {},
            status: "PENDING",
            expires_at: new Date(Date.now() + 3600000).toISOString(),
        })
        .select();

    if (insertError) {
        console.log("  ✗ Insert failed:", insertError.message);
        console.log("  Code:", insertError.code);
        console.log("  Details:", insertError.details);
        console.log("  Hint:", insertError.hint);
    } else {
        console.log("  ✓ Insert succeeded:", insertData);
    }
}

debugMigration().catch(console.error);
