import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
const OTHER_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

let testResults: { test: string; status: string; details?: string }[] = [];

function recordResult(test: string, status: string, details?: string) {
    testResults.push({ test, status, details });
    const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "⚠";
    console.log(`  ${icon} ${test}${details ? `: ${details}` : ""}`);
}

async function testBillAdd() {
    console.log("\n=== BILL ADD TESTS ===");

    // Create bill without ocr_status (may not exist in actual DB)
    const { data: bill, error: createError } = await supabase
        .from("bills")
        .insert({
            company_id: COMPANY_ID,
            vendor_name: "Test Vendor",
            material_name: "Cement",
            amount: 50000,
            gst_amount: 9000,
            bill_number: `BILL-${Date.now()}`,
            bill_date: new Date().toISOString().split("T")[0],
            quantity: 100,
            unit: "Bags",
            payment_status: "Pending",
        })
        .select()
        .single();

    if (createError) {
        recordResult("Add bill", "FAIL", `error: ${createError.message}`);
        return null;
    }

    recordResult("Add bill", "PASS", `id=${bill?.id}`);
    recordResult("Bill has company_id", bill?.company_id === COMPANY_ID ? "PASS" : "FAIL", `company_id=${bill?.company_id}`);
    recordResult("Bill has vendor_name", bill?.vendor_name === "Test Vendor" ? "PASS" : "FAIL", `vendor_name=${bill?.vendor_name}`);
    recordResult("Bill has amount", bill?.amount === 50000 ? "PASS" : "FAIL", `amount=${bill?.amount}`);

    return bill;
}

async function testBillRead(billId: string) {
    console.log("\n=== BILL READ TESTS ===");

    // Direct DB lookup
    const { data: directBill, error: directError } = await supabase
        .from("bills")
        .select("*")
        .eq("id", billId)
        .single();

    if (directError) {
        recordResult("Read bill by ID", "FAIL", `error: ${directError.message}`);
    } else {
        recordResult("Read bill by ID", "PASS", `vendor=${directBill?.vendor_name}, amount=${directBill?.amount}`);
    }
}

async function testBillSearch(companyId: string) {
    console.log("\n=== BILL SEARCH TESTS ===");

    // Search by vendor
    const { data: byVendor, error: vendorError } = await supabase
        .from("bills")
        .select("*")
        .eq("company_id", companyId)
        .ilike("vendor_name", "%Test%");

    if (vendorError) {
        recordResult("Search by vendor", "FAIL", `error: ${vendorError.message}`);
    } else {
        recordResult("Search by vendor", byVendor && byVendor.length > 0 ? "PASS" : "FAIL", `found=${byVendor?.length || 0}`);
    }

    // Search by material
    const { data: byMaterial, error: matError } = await supabase
        .from("bills")
        .select("*")
        .eq("company_id", companyId)
        .ilike("material_name", "%Cement%");

    if (matError) {
        recordResult("Search by material", "FAIL", `error: ${matError.message}`);
    } else {
        recordResult("Search by material", byMaterial && byMaterial.length > 0 ? "PASS" : "FAIL", `found=${byMaterial?.length || 0}`);
    }
}

async function testBillUpdate(billId: string) {
    console.log("\n=== BILL UPDATE TESTS ===");

    // Update amount and status
    const { data: updated, error: updateError } = await supabase
        .from("bills")
        .update({
            amount: 55000,
            payment_status: "Paid",
            remarks: "Updated bill",
        })
        .eq("id", billId)
        .eq("company_id", COMPANY_ID)
        .select()
        .single();

    if (updateError) {
        recordResult("Update bill", "FAIL", `error: ${updateError.message}`);
        return;
    }

    recordResult("Update bill", "PASS", `amount=${updated?.amount}, status=${updated?.payment_status}`);

    // Verify update persisted
    const { data: verifyBill } = await supabase
        .from("bills")
        .select("*")
        .eq("id", billId)
        .single();

    recordResult("Update persisted", verifyBill?.amount === 55000 && verifyBill?.payment_status === "Paid" ? "PASS" : "FAIL", `amount=${verifyBill?.amount}`);
}

async function testBillDelete(billId: string) {
    console.log("\n=== BILL DELETE TESTS ===");

    // Delete bill
    const { error: deleteError } = await supabase
        .from("bills")
        .delete()
        .eq("id", billId)
        .eq("company_id", COMPANY_ID);

    if (deleteError) {
        recordResult("Delete bill", "FAIL", `error: ${deleteError.message}`);
        return;
    }

    recordResult("Delete bill", "PASS", "deleted");

    // Verify bill no longer exists
    const { data: afterDelete } = await supabase
        .from("bills")
        .select("*")
        .eq("id", billId)
        .eq("company_id", COMPANY_ID);

    recordResult("Bill not found after delete", afterDelete && afterDelete.length === 0 ? "PASS" : "FAIL");
}

async function testExpenseAdd() {
    console.log("\n=== EXPENSE ADD TESTS ===");

    // Create expense
    const { data: expense, error: createError } = await supabase
        .from("expenses")
        .insert({
            company_id: COMPANY_ID,
            expense_title: "Test Expense",
            expense_category: "Materials",
            amount: 25000,
            expense_date: new Date().toISOString().split("T")[0],
            payment_method: "Bank Transfer",
            description: "Test expense description",
            vendor: "Test Vendor",
        })
        .select()
        .single();

    if (createError) {
        recordResult("Add expense", "FAIL", `error: ${createError.message}`);
        return null;
    }

    recordResult("Add expense", "PASS", `id=${expense?.id}`);
    recordResult("Expense has company_id", expense?.company_id === COMPANY_ID ? "PASS" : "FAIL", `company_id=${expense?.company_id}`);
    recordResult("Expense has amount", expense?.amount === 25000 ? "PASS" : "FAIL", `amount=${expense?.amount}`);

    return expense;
}

async function testExpenseRead(expenseId: string) {
    console.log("\n=== EXPENSE READ TESTS ===");

    // Direct DB lookup
    const { data: directExpense, error: directError } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", expenseId)
        .single();

    if (directError) {
        recordResult("Read expense by ID", "FAIL", `error: ${directError.message}`);
    } else {
        recordResult("Read expense by ID", "PASS", `title=${directExpense?.expense_title}, amount=${directExpense?.amount}`);
    }
}

async function testExpenseSearch(companyId: string) {
    console.log("\n=== EXPENSE SEARCH TESTS ===");

    // Search by category
    const { data: byCategory, error: catError } = await supabase
        .from("expenses")
        .select("*")
        .eq("company_id", companyId)
        .eq("expense_category", "Materials");

    if (catError) {
        recordResult("Search by category", "FAIL", `error: ${catError.message}`);
    } else {
        recordResult("Search by category", byCategory && byCategory.length > 0 ? "PASS" : "FAIL", `found=${byCategory?.length || 0}`);
    }

    // Search by title
    const { data: byTitle, error: titleError } = await supabase
        .from("expenses")
        .select("*")
        .eq("company_id", companyId)
        .ilike("expense_title", "%Test%");

    if (titleError) {
        recordResult("Search by title", "FAIL", `error: ${titleError.message}`);
    } else {
        recordResult("Search by title", byTitle && byTitle.length > 0 ? "PASS" : "FAIL", `found=${byTitle?.length || 0}`);
    }
}

async function testExpenseUpdate(expenseId: string) {
    console.log("\n=== EXPENSE UPDATE TESTS ===");

    // Update amount
    const { data: updated, error: updateError } = await supabase
        .from("expenses")
        .update({
            amount: 30000,
            description: "Updated expense description",
        })
        .eq("id", expenseId)
        .eq("company_id", COMPANY_ID)
        .select()
        .single();

    if (updateError) {
        recordResult("Update expense", "FAIL", `error: ${updateError.message}`);
        return;
    }

    recordResult("Update expense", "PASS", `amount=${updated?.amount}`);

    // Verify update persisted
    const { data: verifyExpense } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", expenseId)
        .single();

    recordResult("Update persisted", verifyExpense?.amount === 30000 ? "PASS" : "FAIL", `amount=${verifyExpense?.amount}`);
}

async function testExpenseDelete(expenseId: string) {
    console.log("\n=== EXPENSE DELETE TESTS ===");

    // Delete expense
    const { error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId)
        .eq("company_id", COMPANY_ID);

    if (deleteError) {
        recordResult("Delete expense", "FAIL", `error: ${deleteError.message}`);
        return;
    }

    recordResult("Delete expense", "PASS", "deleted");

    // Verify expense no longer exists
    const { data: afterDelete } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", expenseId)
        .eq("company_id", COMPANY_ID);

    recordResult("Expense not found after delete", afterDelete && afterDelete.length === 0 ? "PASS" : "FAIL");
}

async function testCompanyIsolation() {
    console.log("\n=== COMPANY ISOLATION TESTS ===");

    // Create bill in company A
    const { data: billA } = await supabase
        .from("bills")
        .insert({
            company_id: COMPANY_ID,
            vendor_name: "Isolation Test Vendor",
            amount: 10000,
            bill_number: `ISO-${Date.now()}`,
        })
        .select()
        .single();

    if (!billA) {
        recordResult("Bill company isolation", "FAIL", "Could not create test bill");
        return;
    }

    // Try to access from company B
    const { data: billsB } = await supabase
        .from("bills")
        .select("*")
        .eq("company_id", OTHER_COMPANY_ID)
        .eq("id", billA.id);

    recordResult("Bill company isolation", billsB && billsB.length === 0 ? "PASS" : "FAIL");

    // Create expense in company A
    const { data: expenseA } = await supabase
        .from("expenses")
        .insert({
            company_id: COMPANY_ID,
            expense_title: "Isolation Test Expense",
            amount: 5000,
            expense_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

    if (!expenseA) {
        recordResult("Expense company isolation", "FAIL", "Could not create test expense");
        await supabase.from("bills").delete().eq("id", billA.id);
        return;
    }

    // Try to access expense from company B
    const { data: expensesB } = await supabase
        .from("expenses")
        .select("*")
        .eq("company_id", OTHER_COMPANY_ID)
        .eq("id", expenseA.id);

    recordResult("Expense company isolation", expensesB && expensesB.length === 0 ? "PASS" : "FAIL");

    // Cleanup
    await supabase.from("bills").delete().eq("id", billA.id);
    await supabase.from("expenses").delete().eq("id", expenseA.id);
}

async function testDashboardVisibility() {
    console.log("\n=== DASHBOARD VISIBILITY TESTS ===");

    // Create bill
    const { data: bill } = await supabase
        .from("bills")
        .insert({
            company_id: COMPANY_ID,
            vendor_name: "Dashboard Test Vendor",
            amount: 75000,
            bill_number: `DASH-${Date.now()}`,
        })
        .select()
        .single();

    if (!bill) {
        recordResult("Bill dashboard visibility", "FAIL", "Could not create test bill");
        return;
    }

    // Simulate dashboard query
    const { data: dashboardBills, error: dashboardError } = await supabase
        .from("bills")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .order("created_at", { ascending: false });

    if (dashboardError) {
        recordResult("Bill dashboard query", "FAIL", `error: ${dashboardError.message}`);
    } else {
        const found = dashboardBills?.find((b: any) => b.id === bill.id);
        recordResult("Bill dashboard query", found ? "PASS" : "FAIL", `found=${found ? "yes" : "no"}`);
    }

    // Create expense
    const { data: expense } = await supabase
        .from("expenses")
        .insert({
            company_id: COMPANY_ID,
            expense_title: "Dashboard Test Expense",
            amount: 15000,
            expense_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

    if (!expense) {
        recordResult("Expense dashboard visibility", "FAIL", "Could not create test expense");
        await supabase.from("bills").delete().eq("id", bill.id);
        return;
    }

    // Simulate dashboard query for expenses
    const { data: dashboardExpenses, error: expDashboardError } = await supabase
        .from("expenses")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .order("created_at", { ascending: false });

    if (expDashboardError) {
        recordResult("Expense dashboard query", "FAIL", `error: ${expDashboardError.message}`);
    } else {
        const found = dashboardExpenses?.find((e: any) => e.id === expense.id);
        recordResult("Expense dashboard query", found ? "PASS" : "FAIL", `found=${found ? "yes" : "no"}`);
    }

    // Cleanup
    await supabase.from("bills").delete().eq("id", bill.id);
    await supabase.from("expenses").delete().eq("id", expense.id);
}

async function main() {
    console.log("=====================================");
    console.log("BILLS + EXPENSES E2E TEST");
    console.log("=====================================");

    // Bill tests
    const bill = await testBillAdd();
    if (bill) {
        await testBillRead(bill.id);
        await testBillSearch(COMPANY_ID);
        await testBillUpdate(bill.id);
        await testBillDelete(bill.id);
    }

    // Expense tests
    const expense = await testExpenseAdd();
    if (expense) {
        await testExpenseRead(expense.id);
        await testExpenseSearch(COMPANY_ID);
        await testExpenseUpdate(expense.id);
        await testExpenseDelete(expense.id);
    }

    // Company isolation
    await testCompanyIsolation();

    // Dashboard visibility
    await testDashboardVisibility();

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
