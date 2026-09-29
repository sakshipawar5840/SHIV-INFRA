import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

async function debugTable() {
    console.log("=== DEBUG TABLE STATUS ===\n");

    // Try to use rpc to check if table exists
    console.log("Attempt 1: Check via rpc");
    const { data: rpcData, error: rpcError } = await supabase.rpc("exec_sql", {
        sql: "SELECT to_regclass('public.pending_confirmations') as table_exists",
    });

    if (rpcError) {
        console.log("  rpc failed:", rpcError.message);
    } else {
        console.log("  Result:", rpcData);
    }

    // Try to list all tables
    console.log("\nAttempt 2: List all tables via rpc");
    const { data: tablesData, error: tablesError } = await supabase.rpc("exec_sql", {
        sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
    });

    if (tablesError) {
        console.log("  rpc failed:", tablesError.message);
    } else {
        console.log("  Tables:", tablesData);
    }

    // Try direct insert with raw SQL via rpc
    console.log("\nAttempt 3: Direct SQL via rpc");
    const { data: insertData, error: insertError } = await supabase.rpc("exec_sql", {
        sql: `INSERT INTO public.pending_confirmations (company_id, phone, intent, intent_data, status, expires_at, action_executed)
              VALUES ('3e9e9ae1-8593-473f-9aa3-9bcee469d795', '919999999999', 'TEST', '{}', 'PENDING', now() + interval '1 hour', false)
              RETURNING id`,
    });

    if (insertError) {
        console.log("  rpc failed:", insertError.message);
    } else {
        console.log("  Insert result:", insertData);
    }
}

debugTable().catch(console.error);
