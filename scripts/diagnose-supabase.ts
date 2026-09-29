import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

async function diagnose() {
    console.log("=== SUPABASE DIAGNOSTIC ===\n");

    // Log the actual URL being used
    console.log("Supabase URL:", process.env.SUPABASE_URL);
    console.log("Service Role Key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log("Anon Key exists:", !!process.env.SUPABASE_ANON_KEY);

    // Test 1: Check tables we know exist
    const knownTables = [
        "companies",
        "users",
        "projects",
        "customers",
        "leads",
        "bills",
        "expenses",
        "notifications",
        "chat_history",
        "followups",
        "broadcasts",
        "broadcast_recipients",
    ];

    console.log("\n=== CHECKING KNOWN TABLES ===");
    for (const table of knownTables) {
        const { data, error } = await supabase
            .from(table)
            .select("*")
            .limit(1);

        if (error) {
            console.log(`  ✗ ${table}: ${error.message.substring(0, 60)}`);
        } else {
            console.log(`  ✓ ${table}: OK (${data?.length || 0} rows)`);
        }
    }

    // Test 2: Check pending_confirmations specifically
    console.log("\n=== CHECKING PENDING_CONFIRMATIONS ===");
    const { data: pcData, error: pcError } = await supabase
        .from("pending_confirmations")
        .select("*")
        .limit(1);

    if (pcError) {
        console.log("  ✗ pending_confirmations:", pcError.message);
        console.log("  Code:", pcError.code);
    } else {
        console.log("  ✓ pending_confirmations: EXISTS");
        console.log("  Rows:", pcData?.length || 0);
    }

    // Test 3: Try to count rows in a known table to verify connection
    console.log("\n=== CONNECTION VERIFICATION ===");
    const { count: usersCount, error: usersError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

    if (usersError) {
        console.log("  ✗ Users count failed:", usersError.message);
    } else {
        console.log("  ✓ Users table accessible, count:", usersCount);
    }

    // Test 4: Check if we can insert into a known table (then rollback)
    console.log("\n=== INSERT PERMISSION CHECK ===");
    const { data: insertTest, error: insertError } = await supabase
        .from("notifications")
        .insert({
            company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
            title: "DIAGNOSTIC_TEST",
            message: "Test notification - should be deleted",
        })
        .select()
        .single();

    if (insertError) {
        console.log("  ✗ Insert test failed:", insertError.message);
    } else {
        console.log("  ✓ Insert test succeeded, ID:", insertTest.id);
        // Clean up
        await supabase.from("notifications").delete().eq("id", insertTest.id);
        console.log("  ✓ Test record cleaned up");
    }

    console.log("\n=== DIAGNOSTIC COMPLETE ===");
}

diagnose().catch(console.error);
