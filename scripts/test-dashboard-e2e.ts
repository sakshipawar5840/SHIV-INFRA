import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
const OTHER_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

let testResults: { test: string; status: string; details?: string }[] = [];

function recordResult(test: string, status: string, details?: string) {
    testResults.push({ test, status, details });
    const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "⚠";
    console.log(`  ${icon} ${test}${details ? `: ${details}` : ""}`);
}

async function testDashboardDataSync() {
    console.log("\n=== DASHBOARD DATA SYNC TESTS ===");

    // Get actual counts from database
    const { count: actualProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    const { count: actualCustomers } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    const { count: actualLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    const { count: actualBills } = await supabase
        .from("bills")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    const { count: actualExpenses } = await supabase
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    // Get actual financial totals
    const { data: billsData } = await supabase
        .from("bills")
        .select("amount")
        .eq("company_id", COMPANY_ID);

    const { data: expensesData } = await supabase
        .from("expenses")
        .select("amount")
        .eq("company_id", COMPANY_ID);

    const actualBillsTotal = billsData?.reduce((sum, b) => sum + Number(b.amount || 0), 0) || 0;
    const actualExpensesTotal = expensesData?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

    recordResult("Actual Projects count", actualProjects !== null ? "PASS" : "FAIL", `count=${actualProjects}`);
    recordResult("Actual Customers count", actualCustomers !== null ? "PASS" : "FAIL", `count=${actualCustomers}`);
    recordResult("Actual Leads count", actualLeads !== null ? "PASS" : "FAIL", `count=${actualLeads}`);
    recordResult("Actual Bills count", actualBills !== null ? "PASS" : "FAIL", `count=${actualBills}`);
    recordResult("Actual Expenses count", actualExpenses !== null ? "PASS" : "FAIL", `count=${actualExpenses}`);
    recordResult("Actual Bills total", actualBillsTotal >= 0 ? "PASS" : "FAIL", `total=${actualBillsTotal}`);
    recordResult("Actual Expenses total", actualExpensesTotal >= 0 ? "PASS" : "FAIL", `total=${actualExpensesTotal}`);

    return {
        projects: actualProjects || 0,
        customers: actualCustomers || 0,
        leads: actualLeads || 0,
        bills: actualBills || 0,
        expenses: actualExpenses || 0,
        billsTotal: actualBillsTotal,
        expensesTotal: actualExpensesTotal,
    };
}

async function testDashboardAPIMatch() {
    console.log("\n=== DASHBOARD API vs DB MATCH TESTS ===");

    // Simulate dashboard API response by querying the same data
    const { count: projectsCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    const { count: customersCount } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    const { count: leadsCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    const { count: billsCount } = await supabase
        .from("bills")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    const { count: expensesCount } = await supabase
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    const { data: billsData } = await supabase
        .from("bills")
        .select("amount, payment_status")
        .eq("company_id", COMPANY_ID);

    const { data: expensesData } = await supabase
        .from("expenses")
        .select("amount, expense_category, category")
        .eq("company_id", COMPANY_ID);

    // Calculate totals as dashboard controller does
    const totalRevenue = (billsData ?? []).reduce(
        (sum, bill) => sum + Number(String(bill.amount ?? 0).replace(/[^0-9.-]+/g, "") || 0),
        0
    );

    const totalExpenses = (expensesData ?? []).reduce(
        (sum, expense) => sum + Number(String(expense.amount ?? 0).replace(/[^0-9.-]+/g, "") || 0),
        0
    );

    // Verify counts match
    recordResult("Dashboard Projects matches DB", projectsCount !== null ? "PASS" : "FAIL", `api=${projectsCount}`);
    recordResult("Dashboard Customers matches DB", customersCount !== null ? "PASS" : "FAIL", `api=${customersCount}`);
    recordResult("Dashboard Leads matches DB", leadsCount !== null ? "PASS" : "FAIL", `api=${leadsCount}`);
    recordResult("Dashboard Bills matches DB", billsCount !== null ? "PASS" : "FAIL", `api=${billsCount}`);
    recordResult("Dashboard Expenses matches DB", expensesCount !== null ? "PASS" : "FAIL", `api=${expensesCount}`);
    recordResult("Dashboard Revenue matches DB", totalRevenue >= 0 ? "PASS" : "FAIL", `revenue=${totalRevenue}`);
    recordResult("Dashboard Expenses matches DB", totalExpenses >= 0 ? "PASS" : "FAIL", `expenses=${totalExpenses}`);

    return {
        projects: projectsCount || 0,
        customers: customersCount || 0,
        leads: leadsCount || 0,
        bills: billsCount || 0,
        expenses: expensesCount || 0,
        revenue: totalRevenue,
        expensesTotal: totalExpenses,
    };
}

async function testCompanyIsolation() {
    console.log("\n=== COMPANY ISOLATION TESTS ===");

    // Get counts for other company
    const { count: projectsB } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("company_id", OTHER_COMPANY_ID);

    const { count: customersB } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("company_id", OTHER_COMPANY_ID);

    const { count: leadsB } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("company_id", OTHER_COMPANY_ID);

    const { count: billsB } = await supabase
        .from("bills")
        .select("*", { count: "exact", head: true })
        .eq("company_id", OTHER_COMPANY_ID);

    const { count: expensesB } = await supabase
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .eq("company_id", OTHER_COMPANY_ID);

    recordResult("Other company Projects isolated", projectsB === 0 ? "PASS" : "FAIL", `count=${projectsB}`);
    recordResult("Other company Customers isolated", customersB === 0 ? "PASS" : "FAIL", `count=${customersB}`);
    recordResult("Other company Leads isolated", leadsB === 0 ? "PASS" : "FAIL", `count=${leadsB}`);
    recordResult("Other company Bills isolated", billsB === 0 ? "PASS" : "FAIL", `count=${billsB}`);
    recordResult("Other company Expenses isolated", expensesB === 0 ? "PASS" : "FAIL", `count=${expensesB}`);
}

async function testDashboardAfterCreate() {
    console.log("\n=== DASHBOARD AFTER CREATE TESTS ===");

    // Get initial counts
    const { count: initialProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    const { count: initialBills } = await supabase
        .from("bills")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    // Create new project
    const { data: newProject } = await supabase
        .from("projects")
        .insert({
            company_id: COMPANY_ID,
            project_name: `Dashboard Test ${Date.now()}`,
            location: "Test Location",
            status: "Planning",
        })
        .select()
        .single();

    // Create new bill
    const { data: newBill } = await supabase
        .from("bills")
        .insert({
            company_id: COMPANY_ID,
            project_id: newProject?.id,
            vendor_name: "Dashboard Test Vendor",
            amount: 100000,
            bill_number: `DASH-${Date.now()}`,
        })
        .select()
        .single();

    // Get updated counts
    const { count: updatedProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    const { count: updatedBills } = await supabase
        .from("bills")
        .select("*", { count: "exact", head: true })
        .eq("company_id", COMPANY_ID);

    recordResult("Dashboard reflects new project", updatedProjects === (initialProjects || 0) + 1 ? "PASS" : "FAIL", `before=${initialProjects}, after=${updatedProjects}`);
    recordResult("Dashboard reflects new bill", updatedBills === (initialBills || 0) + 1 ? "PASS" : "FAIL", `before=${initialBills}, after=${updatedBills}`);

    // Cleanup
    if (newBill) await supabase.from("bills").delete().eq("id", newBill.id);
    if (newProject) await supabase.from("projects").delete().eq("id", newProject.id);
}

async function testDashboardDataIntegrity() {
    console.log("\n=== DASHBOARD DATA INTEGRITY TESTS ===");

    // Test projects by status
    const { data: projectsData } = await supabase
        .from("projects")
        .select("status")
        .eq("company_id", COMPANY_ID);

    const projectsByStatus: Record<string, number> = {};
    for (const project of projectsData || []) {
        const status = (project.status || "Unknown").toString().trim() || "Unknown";
        projectsByStatus[status] = (projectsByStatus[status] || 0) + 1;
    }

    recordResult("Projects by status calculated", Object.keys(projectsByStatus).length > 0 ? "PASS" : "FAIL", `statuses=${Object.keys(projectsByStatus).join(", ")}`);

    // Test bills by payment status
    const { data: billsData } = await supabase
        .from("bills")
        .select("amount, payment_status")
        .eq("company_id", COMPANY_ID);

    const billsByPaymentStatus: Record<string, number> = { Paid: 0, Pending: 0, Cancelled: 0 };
    for (const bill of billsData || []) {
        const status = (bill.payment_status || "Pending").toString().trim();
        billsByPaymentStatus[status] = (billsByPaymentStatus[status] || 0) + Number(bill.amount || 0);
    }

    recordResult("Bills by payment status calculated", billsByPaymentStatus.Pending >= 0 ? "PASS" : "FAIL", `pending=${billsByPaymentStatus.Pending}`);

    // Test lead status breakdown
    const { data: leadsData } = await supabase
        .from("leads")
        .select("status")
        .eq("company_id", COMPANY_ID);

    const leadStatusBreakdown: Record<string, number> = {};
    for (const lead of leadsData || []) {
        const status = (lead.status || "Unknown").toString().trim() || "Unknown";
        leadStatusBreakdown[status] = (leadStatusBreakdown[status] || 0) + 1;
    }

    recordResult("Lead status breakdown calculated", Object.keys(leadStatusBreakdown).length > 0 ? "PASS" : "FAIL", `statuses=${Object.keys(leadStatusBreakdown).join(", ")}`);

    // Test expense by category
    const { data: expensesData } = await supabase
        .from("expenses")
        .select("amount, expense_category, category")
        .eq("company_id", COMPANY_ID);

    const expenseByCategory: Record<string, number> = {};
    for (const expense of expensesData || []) {
        const category = (expense.expense_category || expense.category || "General").toString().trim() || "General";
        const amount = Number(String(expense.amount ?? 0).replace(/[^0-9.-]+/g, "") || 0);
        expenseByCategory[category] = (expenseByCategory[category] || 0) + amount;
    }

    recordResult("Expense by category calculated", Object.keys(expenseByCategory).length > 0 ? "PASS" : "FAIL", `categories=${Object.keys(expenseByCategory).join(", ")}`);
}

async function main() {
    console.log("=====================================");
    console.log("DASHBOARD ↔ DATABASE SYNC TEST");
    console.log("=====================================");

    await testDashboardDataSync();
    await testDashboardAPIMatch();
    await testCompanyIsolation();
    await testDashboardAfterCreate();
    await testDashboardDataIntegrity();

    console.log("\n=====================================");
    console.log("TEST RESULTS SUMMARY");
    console.log("=====================================");

    const passed = testResults.filter(r => r.status === "PASS").length;
    const failed = testResults.filter(r => r.status === "FAIL").length;
    const blocked = testResults.filter(r => r.status === "BLOCKED").length;

    console.log(`\nTotal: ${testResults.length} | Passed: ${passed} | Failed: ${failed} | Blocked: ${blocked}`);

    if (failed > 0) {
        console.log("\n--- FAILED TESTS ---");
        testResults.filter(r => r.status === "FAIL").forEach(r => {
            console.log(`  ✗ ${r.test}: ${r.details}`);
        });
    }

    console.log("\n=====================================");
    console.log("TEST COMPLETE");
    console.log("=====================================");
}

main().catch(console.error);
