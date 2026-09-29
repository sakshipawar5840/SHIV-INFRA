import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

async function verifyDashboardData() {
    console.log("=== DASHBOARD DATA VERIFICATION ===\n");

    const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";

    // Verify all dashboard queries return real data
    const queries = [
        { name: "projects", query: () => supabase.from("projects").select("*", { count: "exact", head: true }).eq("company_id", COMPANY_ID) },
        { name: "customers", query: () => supabase.from("customers").select("*", { count: "exact", head: true }).eq("company_id", COMPANY_ID) },
        { name: "leads", query: () => supabase.from("leads").select("*", { count: "exact", head: true }).eq("company_id", COMPANY_ID) },
        { name: "bills", query: () => supabase.from("bills").select("*", { count: "exact", head: true }).eq("company_id", COMPANY_ID) },
        { name: "expenses", query: () => supabase.from("expenses").select("*", { count: "exact", head: true }).eq("company_id", COMPANY_ID) },
        { name: "followups", query: () => supabase.from("followups").select("*", { count: "exact", head: true }).eq("company_id", COMPANY_ID) },
        { name: "notifications", query: () => supabase.from("notifications").select("*", { count: "exact", head: true }).eq("company_id", COMPANY_ID) },
    ];

    for (const { name, query } of queries) {
        const { count, error } = await query();
        if (error) {
            console.log(`  ✗ ${name}: ${error.message}`);
        } else {
            console.log(`  ✓ ${name}: ${count} records`);
        }
    }

    // Verify company isolation
    console.log("\n=== COMPANY ISOLATION TEST ===");
    const OTHER_COMPANY_ID = "00000000-0000-0000-0000-000000000000";
    const { count: otherCount } = await supabase.from("projects").select("*", { count: "exact", head: true }).eq("company_id", OTHER_COMPANY_ID);
    console.log(`  Projects for other company: ${otherCount} (should be 0)`);

    console.log("\n=== VERIFICATION COMPLETE ===");
}

verifyDashboardData().catch(console.error);
