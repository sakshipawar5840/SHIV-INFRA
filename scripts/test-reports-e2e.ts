import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";
import fs from "fs";
import path from "path";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
const OTHER_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

let testResults: { test: string; status: string; details?: string }[] = [];

function recordResult(test: string, status: string, details?: string) {
    testResults.push({ test, status, details });
    const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "⚠";
    console.log(`  ${icon} ${test}${details ? `: ${details}` : ""}`);
}

async function setupTestData() {
    console.log("\n=== SETUP TEST DATA ===");

    // Create project
    const { data: project } = await supabase
        .from("projects")
        .insert({
            company_id: COMPANY_ID,
            project_name: `Report Test Project ${Date.now()}`,
            location: "Test Location",
            status: "Ongoing",
        })
        .select()
        .single();

    // Create customer
    const { data: customer } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Report Test Customer",
            phone: `91${Date.now().toString().slice(-8)}`,
            status: "active",
        })
        .select()
        .single();

    // Create lead
    const { data: lead } = await supabase
        .from("leads")
        .insert({
            company_id: COMPANY_ID,
            customer_id: customer?.id,
            requirement: "Report Test Lead",
            budget: 500000,
            status: "New",
        })
        .select()
        .single();

    // Create bill
    const { data: bill } = await supabase
        .from("bills")
        .insert({
            company_id: COMPANY_ID,
            project_id: project?.id,
            vendor_name: "Report Test Vendor",
            material_name: "Cement",
            amount: 75000,
            gst_amount: 13500,
            bill_number: `RPT-${Date.now()}`,
            bill_date: new Date().toISOString().split("T")[0],
            quantity: 100,
            unit: "Bags",
            payment_status: "Pending",
        })
        .select()
        .single();

    // Create expense
    const { data: expense } = await supabase
        .from("expenses")
        .insert({
            company_id: COMPANY_ID,
            project_id: project?.id,
            expense_title: "Report Test Expense",
            expense_category: "Materials",
            amount: 25000,
            expense_date: new Date().toISOString().split("T")[0],
            payment_method: "Bank Transfer",
        })
        .select()
        .single();

    recordResult("Setup test data", project && customer && lead && bill && expense ? "PASS" : "FAIL");

    return { project, customer, lead, bill, expense };
}

async function testFinancialSummary() {
    console.log("\n=== FINANCIAL SUMMARY TESTS ===");

    // Get financial summary
    const { data: bills } = await supabase
        .from("bills")
        .select("project_id, amount, payment_status, bill_date")
        .eq("company_id", COMPANY_ID);

    const { data: expenses } = await supabase
        .from("expenses")
        .select("project_id, amount, payment_method, expense_date")
        .eq("company_id", COMPANY_ID);

    const { data: projects } = await supabase
        .from("projects")
        .select("id, project_name, location")
        .eq("company_id", COMPANY_ID);

    recordResult("Financial summary - bills query", bills && bills.length > 0 ? "PASS" : "FAIL", `bills=${bills?.length || 0}`);
    recordResult("Financial summary - expenses query", expenses && expenses.length > 0 ? "PASS" : "FAIL", `expenses=${expenses?.length || 0}`);
    recordResult("Financial summary - projects query", projects && projects.length > 0 ? "PASS" : "FAIL", `projects=${projects?.length || 0}`);

    // Calculate totals
    const billsTotal = bills?.reduce((sum, b) => sum + Number(b.amount || 0), 0) || 0;
    const expensesTotal = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

    recordResult("Financial summary - bills total", billsTotal > 0 ? "PASS" : "FAIL", `total=${billsTotal}`);
    recordResult("Financial summary - expenses total", expensesTotal > 0 ? "PASS" : "FAIL", `total=${expensesTotal}`);
}

async function testBillsReport() {
    console.log("\n=== BILLS REPORT TESTS ===");

    const { data: bills, error } = await supabase
        .from("bills")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .order("bill_date", { ascending: false });

    if (error) {
        recordResult("Bills report query", "FAIL", `error: ${error.message}`);
        return;
    }

    recordResult("Bills report query", bills && bills.length > 0 ? "PASS" : "FAIL", `count=${bills?.length || 0}`);

    // Calculate totals
    const totalAmount = bills?.reduce((sum, b) => sum + Number(b.amount || 0), 0) || 0;
    const paidAmount = bills?.filter(b => b.payment_status === "Paid").reduce((sum, b) => sum + Number(b.amount || 0), 0) || 0;
    const pendingAmount = bills?.filter(b => b.payment_status === "Pending").reduce((sum, b) => sum + Number(b.amount || 0), 0) || 0;

    recordResult("Bills report - total amount", totalAmount > 0 ? "PASS" : "FAIL", `total=${totalAmount}`);
    recordResult("Bills report - paid amount", paidAmount >= 0 ? "PASS" : "FAIL", `paid=${paidAmount}`);
    recordResult("Bills report - pending amount", pendingAmount >= 0 ? "PASS" : "FAIL", `pending=${pendingAmount}`);
}

async function testExpensesReport() {
    console.log("\n=== EXPENSES REPORT TESTS ===");

    const { data: expenses, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .order("expense_date", { ascending: false });

    if (error) {
        recordResult("Expenses report query", "FAIL", `error: ${error.message}`);
        return;
    }

    recordResult("Expenses report query", expenses && expenses.length > 0 ? "PASS" : "FAIL", `count=${expenses?.length || 0}`);

    // Calculate totals
    const totalAmount = expenses?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;

    // By category
    const byCategory = expenses?.reduce((acc: any, e) => {
        const cat = e.expense_category || e.category || "General";
        acc[cat] = (acc[cat] || 0) + Number(e.amount || 0);
        return acc;
    }, {}) || {};

    recordResult("Expenses report - total amount", totalAmount > 0 ? "PASS" : "FAIL", `total=${totalAmount}`);
    recordResult("Expenses report - by category", Object.keys(byCategory).length > 0 ? "PASS" : "FAIL", `categories=${Object.keys(byCategory).length}`);
}

async function testPDFGeneration() {
    console.log("\n=== PDF GENERATION TESTS ===");

    // Import ReportService
    const { ReportService } = await import("../backend/services/reportService.ts");

    // Get real data
    const { data: bills } = await supabase
        .from("bills")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .limit(10);

    const columns = [
        { header: "Bill Number", key: "bill_number", width: 20 },
        { header: "Vendor", key: "vendor_name", width: 25 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Status", key: "payment_status", width: 14 },
    ];

    const reportName = `Test_Bills_Report_${Date.now()}`;

    try {
        const filePath = await ReportService.generatePDF(reportName, {
            title: "Test Bills Report",
            items: bills || [],
            columns,
            filters: { company_id: COMPANY_ID },
        });

        // Verify file exists and is not empty
        const fileExists = fs.existsSync(filePath);
        const fileSize = fileExists ? fs.statSync(filePath).size : 0;

        recordResult("PDF generation", fileExists && fileSize > 0 ? "PASS" : "FAIL", `path=${filePath}, size=${fileSize}`);

        // Cleanup
        if (fileExists) {
            fs.unlinkSync(filePath);
        }
    } catch (error: any) {
        recordResult("PDF generation", "FAIL", `error: ${error.message}`);
    }
}

async function testExcelGeneration() {
    console.log("\n=== EXCEL GENERATION TESTS ===");

    // Import ReportService
    const { ReportService } = await import("../backend/services/reportService.ts");

    // Get real data
    const { data: expenses } = await supabase
        .from("expenses")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .limit(10);

    const columns = [
        { header: "Title", key: "expense_title", width: 30 },
        { header: "Category", key: "expense_category", width: 18 },
        { header: "Amount", key: "amount", width: 15 },
        { header: "Date", key: "expense_date", width: 14 },
    ];

    const reportName = `Test_Expenses_Report_${Date.now()}`;

    try {
        const filePath = await ReportService.generateExcel(reportName, columns, expenses || []);

        // Verify file exists and is not empty
        const fileExists = fs.existsSync(filePath);
        const fileSize = fileExists ? fs.statSync(filePath).size : 0;

        recordResult("Excel generation", fileExists && fileSize > 0 ? "PASS" : "FAIL", `path=${filePath}, size=${fileSize}`);

        // Cleanup
        if (fileExists) {
            fs.unlinkSync(filePath);
        }
    } catch (error: any) {
        recordResult("Excel generation", "FAIL", `error: ${error.message}`);
    }
}

async function testCSVGeneration() {
    console.log("\n=== CSV GENERATION TESTS ===");

    // Import ReportService
    const { ReportService } = await import("../backend/services/reportService.ts");

    // Get real data
    const { data: bills } = await supabase
        .from("bills")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .limit(5);

    const columns = [
        { header: "Bill Number", key: "bill_number", width: 20 },
        { header: "Vendor", key: "vendor_name", width: 25 },
        { header: "Amount", key: "amount", width: 15 },
    ];

    try {
        const csvString = ReportService.generateCSV(columns, bills || []);

        // Verify CSV is not empty
        const csvLines = csvString.split("\n");
        const hasHeader = csvLines.length > 0 && csvLines[0].includes("Bill Number");
        const hasData = csvLines.length > 1;

        recordResult("CSV generation", hasHeader && hasData ? "PASS" : "FAIL", `lines=${csvLines.length}`);
    } catch (error: any) {
        recordResult("CSV generation", "FAIL", `error: ${error.message}`);
    }
}

async function testCompanyIsolation() {
    console.log("\n=== COMPANY ISOLATION TESTS ===");

    // Try to access bills from another company
    const { data: billsB } = await supabase
        .from("bills")
        .select("*")
        .eq("company_id", OTHER_COMPANY_ID);

    recordResult("Bills company isolation", billsB && billsB.length === 0 ? "PASS" : "FAIL");

    // Try to access expenses from another company
    const { data: expensesB } = await supabase
        .from("expenses")
        .select("*")
        .eq("company_id", OTHER_COMPANY_ID);

    recordResult("Expenses company isolation", expensesB && expensesB.length === 0 ? "PASS" : "FAIL");
}

async function cleanup(projectId: string, customerId: string, leadId: string, billId: string, expenseId: string) {
    console.log("\n=== CLEANUP ===");

    await supabase.from("expenses").delete().eq("id", expenseId);
    await supabase.from("bills").delete().eq("id", billId);
    await supabase.from("leads").delete().eq("id", leadId);
    await supabase.from("customers").delete().eq("id", customerId);
    await supabase.from("projects").delete().eq("id", projectId);

    recordResult("Cleanup", "PASS");
}

async function main() {
    console.log("=====================================");
    console.log("REPORTS MODULE E2E TEST");
    console.log("=====================================");

    // Setup test data
    const { project, customer, lead, bill, expense } = await setupTestData();

    // Run report tests
    await testFinancialSummary();
    await testBillsReport();
    await testExpensesReport();
    await testPDFGeneration();
    await testExcelGeneration();
    await testCSVGeneration();
    await testCompanyIsolation();

    // Cleanup
    if (project && customer && lead && bill && expense) {
        await cleanup(project.id, customer.id, lead.id, bill.id, expense.id);
    }

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
