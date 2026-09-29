import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";
import {
    extractCustomerData,
    extractLeadData,
    extractCustomerUpdateData,
    extractLeadUpdateData
} from "../backend/ai-engine/intentDetector.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
const OTHER_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

let testResults: { test: string; status: string; details?: string }[] = [];

function recordResult(test: string, status: string, details?: string) {
    testResults.push({ test, status, details });
    const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "⚠";
    console.log(`  ${icon} ${test}${details ? `: ${details}` : ""}`);
}

async function testCustomerExtraction() {
    console.log("\n=== CUSTOMER EXTRACTION TESTS ===");

    const testCases = [
        { input: "Add customer Rahul Patil phone 9876543210", expectedName: "Rahul Patil", expectedPhone: "9876543210" },
        { input: "Add customer Amit Patil phone 9876543210 email amit@gmail.com", expectedName: "Amit Patil", expectedPhone: "9876543210" },
        { input: "Search customer Rahul Patil", expectedName: "Rahul Patil", expectedPhone: null },
        { input: "Update customer Rahul Patil phone to 9988776655", expectedName: "Rahul Patil", expectedPhone: "9988776655" },
        { input: "Delete customer Rahul Patil", expectedName: "Rahul Patil", expectedPhone: null },
    ];

    for (const tc of testCases) {
        const result = extractCustomerData(tc.input);
        const nameMatch = result.full_name === tc.expectedName;
        const phoneMatch = result.phone === tc.expectedPhone;
        recordResult(
            `Extract: "${tc.input.substring(0, 40)}..."`,
            nameMatch && phoneMatch ? "PASS" : "FAIL",
            `name=${result.full_name}, phone=${result.phone}`
        );
    }
}

async function testLeadExtraction() {
    console.log("\n=== LEAD EXTRACTION TESTS ===");

    const testCases = [
        { input: "Add lead Amit Patil phone 9876543210 budget 60 lakh", expectedName: "Amit Patil", expectedPhone: "9876543210", expectedBudget: 6000000 },
        { input: "Add lead budget 75 lakh requirement 2 BHK", expectedName: null, expectedPhone: null, expectedBudget: 7500000 },
        { input: "Search lead Amit Patil", expectedName: "Amit Patil", expectedPhone: null, expectedBudget: null },
        { input: "Update lead Amit Patil budget to 75 lakh", expectedName: "Amit Patil", expectedPhone: null, expectedBudget: 7500000 },
        { input: "Delete lead Amit Patil", expectedName: "Amit Patil", expectedPhone: null, expectedBudget: null },
    ];

    for (const tc of testCases) {
        const result = extractLeadData(tc.input);
        const nameMatch = result.customer_name === tc.expectedName;
        const phoneMatch = result.customer_phone === tc.expectedPhone;
        const budgetMatch = result.budget === tc.expectedBudget;
        recordResult(
            `Extract: "${tc.input.substring(0, 40)}..."`,
            nameMatch && phoneMatch && budgetMatch ? "PASS" : "FAIL",
            `name=${result.customer_name}, phone=${result.customer_phone}, budget=${result.budget}`
        );
    }
}

async function testAddCustomer() {
    console.log("\n=== ADD_CUSTOMER TESTS ===");

    // Test create customer
    const { data: created, error: createError } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Test Customer ADD",
            phone: "919999111111",
            email: "test.add@ai.com",
            status: "active",
        })
        .select()
        .single();

    recordResult("Create customer", createError ? "FAIL" : "PASS", createError?.message || `id=${created?.id}`);

    // Test duplicate prevention
    const { error: dupError } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Test Customer ADD Dup",
            phone: "919999111111",
            status: "active",
        });

    recordResult("Duplicate prevention", dupError ? "PASS" : "FAIL", dupError?.message || "No error on duplicate");

    // Cleanup
    if (created) {
        await supabase.from("customers").delete().eq("id", created.id);
    }
}

async function testSearchCustomers() {
    console.log("\n=== SEARCH_CUSTOMERS TESTS ===");

    // Create test customer
    const { data: customer } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Test Search Customer",
            phone: "919999222222",
            status: "active",
        })
        .select()
        .single();

    // Search by name
    const { data: byName } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .ilike("full_name", "%Test Search%")
        .eq("is_deleted", false);

    recordResult("Search by name", byName && byName.length > 0 ? "PASS" : "FAIL", `found=${byName?.length || 0}`);

    // Search by phone
    const { data: byPhone } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .eq("phone", "919999222222")
        .eq("is_deleted", false);

    recordResult("Search by phone", byPhone && byPhone.length > 0 ? "PASS" : "FAIL", `found=${byPhone?.length || 0}`);

    // Cleanup
    if (customer) {
        await supabase.from("customers").delete().eq("id", customer.id);
    }
}

async function testUpdateCustomer() {
    console.log("\n=== UPDATE_CUSTOMER TESTS ===");

    // Create test customer
    const { data: customer } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Test Update Customer",
            phone: "919999333333",
            email: "old@ai.com",
            status: "active",
        })
        .select()
        .single();

    if (!customer) {
        recordResult("Update customer", "FAIL", "Could not create test customer");
        return;
    }

    // Update only email
    const { data: updated, error: updateError } = await supabase
        .from("customers")
        .update({ email: "new@ai.com" })
        .eq("id", customer.id)
        .eq("company_id", COMPANY_ID)
        .select()
        .single();

    recordResult("Update single field", updateError ? "FAIL" : "PASS", updateError?.message || `email=${updated?.email}`);

    // Verify other fields unchanged
    recordResult(
        "Unchanged fields preserved",
        updated?.full_name === "Test Update Customer" && updated?.phone === "919999333333" ? "PASS" : "FAIL",
        `name=${updated?.full_name}, phone=${updated?.phone}`
    );

    // Cleanup
    await supabase.from("customers").delete().eq("id", customer.id);
}

async function testDeleteCustomer() {
    console.log("\n=== DELETE_CUSTOMER TESTS ===");

    // Create test customer
    const { data: customer } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Test Delete Customer",
            phone: "919999444444",
            status: "active",
        })
        .select()
        .single();

    if (!customer) {
        recordResult("Delete customer", "FAIL", "Could not create test customer");
        return;
    }

    // Soft delete
    const { data: deleted, error: deleteError } = await supabase
        .from("customers")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", customer.id)
        .eq("company_id", COMPANY_ID)
        .select()
        .single();

    recordResult("Soft delete", deleteError ? "FAIL" : "PASS", deleteError?.message || `is_deleted=${deleted?.is_deleted}`);

    // Verify not in normal search
    const { data: afterDelete } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .eq("id", customer.id)
        .eq("is_deleted", false);

    recordResult("Not in normal search after delete", afterDelete && afterDelete.length === 0 ? "PASS" : "FAIL");

    // Hard delete for cleanup
    await supabase.from("customers").delete().eq("id", customer.id);
}

async function testAddLead() {
    console.log("\n=== ADD_LEAD TESTS ===");

    // Create customer first
    const { data: customer } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Test Lead Customer",
            phone: "919999555555",
            status: "active",
        })
        .select()
        .single();

    if (!customer) {
        recordResult("Add lead", "FAIL", "Could not create test customer");
        return;
    }

    // Create lead
    const { data: lead, error: createError } = await supabase
        .from("leads")
        .insert({
            company_id: COMPANY_ID,
            customer_id: customer.id,
            requirement: "2 BHK Flat",
            budget: 6000000,
            lead_source: "WhatsApp",
            status: "New",
        })
        .select()
        .single();

    recordResult("Create lead", createError ? "FAIL" : "PASS", createError?.message || `id=${lead?.id}`);

    // Verify lead-customer link
    const { data: leadWithCustomer } = await supabase
        .from("leads")
        .select(`
            id,
            customer_id,
            customers (id, full_name, phone)
        `)
        .eq("id", lead?.id)
        .single();

    recordResult(
        "Lead-customer link",
        leadWithCustomer?.customers?.full_name === "Test Lead Customer" ? "PASS" : "FAIL",
        `customer=${leadWithCustomer?.customers?.full_name}`
    );

    // Cleanup
    if (lead) {
        await supabase.from("leads").delete().eq("id", lead.id);
    }
    await supabase.from("customers").delete().eq("id", customer.id);
}

async function testSearchLeads() {
    console.log("\n=== SEARCH_LEADS TESTS ===");

    // Create customer and lead
    const { data: customer } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Test Search Lead Customer",
            phone: "919999666666",
            status: "active",
        })
        .select()
        .single();

    const { data: lead } = await supabase
        .from("leads")
        .insert({
            company_id: COMPANY_ID,
            customer_id: customer?.id,
            requirement: "3 BHK Flat",
            budget: 8000000,
            status: "New",
        })
        .select()
        .single();

    // Search leads
    const { data: leads, error: searchError } = await supabase
        .from("leads")
        .select(`
            id,
            customers (full_name, phone)
        `)
        .eq("company_id", COMPANY_ID);

    if (searchError) {
        recordResult("Search leads", "FAIL", `error: ${searchError.message}`);
    } else {
        recordResult("Search leads", leads && leads.length > 0 ? "PASS" : "FAIL", `found=${leads?.length || 0}`);
    }

    // Cleanup
    if (lead) {
        await supabase.from("leads").delete().eq("id", lead.id);
    }
    if (customer) {
        await supabase.from("customers").delete().eq("id", customer.id);
    }
}

async function testUpdateLead() {
    console.log("\n=== UPDATE_LEAD TESTS ===");

    // Create customer and lead
    const { data: customer } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Test Update Lead Customer",
            phone: "919999777777",
            status: "active",
        })
        .select()
        .single();

    const { data: lead } = await supabase
        .from("leads")
        .insert({
            company_id: COMPANY_ID,
            customer_id: customer?.id,
            requirement: "2 BHK",
            budget: 5000000,
            status: "New",
        })
        .select()
        .single();

    if (!lead || !customer) {
        recordResult("Update lead", "FAIL", "Could not create test data");
        return;
    }

    // Update only budget
    const { data: updated, error: updateError } = await supabase
        .from("leads")
        .update({ budget: 7500000 })
        .eq("id", lead.id)
        .eq("company_id", COMPANY_ID)
        .select()
        .single();

    recordResult("Update single field", updateError ? "FAIL" : "PASS", updateError?.message || `budget=${updated?.budget}`);

    // Verify other fields unchanged
    recordResult(
        "Unchanged fields preserved",
        updated?.requirement === "2 BHK" && updated?.status === "New" ? "PASS" : "FAIL",
        `requirement=${updated?.requirement}, status=${updated?.status}`
    );

    // Cleanup
    await supabase.from("leads").delete().eq("id", lead.id);
    await supabase.from("customers").delete().eq("id", customer.id);
}

async function testDeleteLead() {
    console.log("\n=== DELETE_LEAD TESTS ===");

    // Create customer and lead
    const { data: customer } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Test Delete Lead Customer",
            phone: "919999888888",
            status: "active",
        })
        .select()
        .single();

    const { data: lead } = await supabase
        .from("leads")
        .insert({
            company_id: COMPANY_ID,
            customer_id: customer?.id,
            requirement: "1 BHK",
            budget: 3000000,
            status: "New",
        })
        .select()
        .single();

    if (!lead || !customer) {
        recordResult("Delete lead", "FAIL", "Could not create test data");
        return;
    }

    // Delete lead
    const { error: deleteError } = await supabase
        .from("leads")
        .delete()
        .eq("id", lead.id)
        .eq("company_id", COMPANY_ID);

    recordResult("Delete lead", deleteError ? "FAIL" : "PASS", deleteError?.message || "deleted");

    // Verify deleted
    const { data: afterDelete } = await supabase
        .from("leads")
        .select("*")
        .eq("id", lead.id)
        .eq("company_id", COMPANY_ID);

    recordResult("Lead not found after delete", afterDelete && afterDelete.length === 0 ? "PASS" : "FAIL");

    // Cleanup
    await supabase.from("customers").delete().eq("id", customer.id);
}

async function testCompanyIsolation() {
    console.log("\n=== COMPANY ISOLATION TESTS ===");

    // Create customer in company A
    const { data: customerA } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Company A Customer",
            phone: "919999000000",
            status: "active",
        })
        .select()
        .single();

    // Try to access from company B
    const { data: customersB } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", OTHER_COMPANY_ID)
        .eq("phone", "919999000000");

    recordResult("Customer company isolation", customersB && customersB.length === 0 ? "PASS" : "FAIL");

    // Create lead in company A
    const { data: leadA } = await supabase
        .from("leads")
        .insert({
            company_id: COMPANY_ID,
            customer_id: customerA?.id,
            requirement: "Test",
            budget: 1000000,
            status: "New",
        })
        .select()
        .single();

    // Try to access lead from company B
    const { data: leadsB } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", OTHER_COMPANY_ID)
        .eq("id", leadA?.id);

    recordResult("Lead company isolation", leadsB && leadsB.length === 0 ? "PASS" : "FAIL");

    // Cleanup
    if (leadA) {
        await supabase.from("leads").delete().eq("id", leadA.id);
    }
    if (customerA) {
        await supabase.from("customers").delete().eq("id", customerA.id);
    }
}

async function testDashboardConsistency() {
    console.log("\n=== DASHBOARD CONSISTENCY TESTS ===");

    // Create test data
    const { data: customer } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Dashboard Test Customer",
            phone: "919988888888",
            status: "active",
        })
        .select()
        .single();

    const { data: lead } = await supabase
        .from("leads")
        .insert({
            company_id: COMPANY_ID,
            customer_id: customer?.id,
            requirement: "Dashboard Test",
            budget: 5000000,
            status: "New",
        })
        .select()
        .single();

    // Verify customer appears in dashboard query
    const { data: dashboardCustomers } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .eq("is_deleted", false)
        .eq("id", customer?.id);

    recordResult("Customer in dashboard", dashboardCustomers && dashboardCustomers.length > 0 ? "PASS" : "FAIL");

    // Verify lead appears in dashboard query
    const { data: dashboardLeads, error: dashboardError } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .eq("id", lead?.id);

    if (dashboardError) {
        recordResult("Lead in dashboard", "FAIL", `error: ${dashboardError.message}`);
    } else {
        recordResult("Lead in dashboard", dashboardLeads && dashboardLeads.length > 0 ? "PASS" : "FAIL");
    }

    // Cleanup
    if (lead) {
        await supabase.from("leads").delete().eq("id", lead.id);
    }
    if (customer) {
        await supabase.from("customers").delete().eq("id", customer.id);
    }
}

async function main() {
    console.log("=====================================");
    console.log("CUSTOMER + LEAD AI OPERATIONS TEST");
    console.log("=====================================");

    await testCustomerExtraction();
    await testLeadExtraction();
    await testAddCustomer();
    await testSearchCustomers();
    await testUpdateCustomer();
    await testDeleteCustomer();
    await testAddLead();
    await testSearchLeads();
    await testUpdateLead();
    await testDeleteLead();
    await testCompanyIsolation();
    await testDashboardConsistency();

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
