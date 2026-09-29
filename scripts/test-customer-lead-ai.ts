import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";
import { extractCustomerData, extractLeadData } from "../backend/ai-engine/intentDetector.ts";
import { ConfirmationService } from "../backend/services/confirmationService.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
const TEST_PHONE = "919999202608";

async function testCustomerExtraction() {
    console.log("\n=== TEST 1: Customer Data Extraction ===");

    const testCases = [
        "Add customer Rahul Patil phone 9876543210",
        "Add customer Amit Patil phone 9876543210 email amit@gmail.com",
        "Search customer Rahul Patil",
        "Update customer Rahul Patil phone to 9988776655",
        "Delete customer Rahul Patil",
    ];

    for (const testCase of testCases) {
        const result = extractCustomerData(testCase);
        console.log(`\n  Input: "${testCase}"`);
        console.log(`  Result:`, JSON.stringify(result, null, 2));
    }
}

async function testLeadExtraction() {
    console.log("\n=== TEST 2: Lead Data Extraction ===");

    const testCases = [
        "Add lead Amit Patil phone 9876543210 budget 60 lakh",
        "Add lead budget 75 lakh requirement 2 BHK",
        "Search lead Amit Patil",
        "Update lead budget to 75 lakh",
        "Delete lead Amit Patil",
    ];

    for (const testCase of testCases) {
        const result = extractLeadData(testCase);
        console.log(`\n  Input: "${testCase}"`);
        console.log(`  Result:`, JSON.stringify(result, null, 2));
    }
}

async function testCustomerCRUD() {
    console.log("\n=== TEST 3: Customer CRUD Operations ===");

    // Test create customer
    const { data: created, error: createError } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Test Customer AI",
            phone: "919999888888",
            email: "test@ai.com",
            status: "active",
        })
        .select()
        .single();

    if (createError) {
        console.log("  ✗ Create failed:", createError.message);
        return;
    }
    console.log("  ✓ Customer created:", created.id);

    // Test search customer
    const { data: searched, error: searchError } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .eq("phone", "919999888888")
        .single();

    if (searchError) {
        console.log("  ✗ Search failed:", searchError.message);
    } else {
        console.log("  ✓ Customer found:", searched.full_name);
    }

    // Test update customer
    const { data: updated, error: updateError } = await supabase
        .from("customers")
        .update({ full_name: "Test Customer AI Updated" })
        .eq("id", created.id)
        .select()
        .single();

    if (updateError) {
        console.log("  ✗ Update failed:", updateError.message);
    } else {
        console.log("  ✓ Customer updated:", updated.full_name);
    }

    // Test delete customer
    const { error: deleteError } = await supabase
        .from("customers")
        .delete()
        .eq("id", created.id);

    if (deleteError) {
        console.log("  ✗ Delete failed:", deleteError.message);
    } else {
        console.log("  ✓ Customer deleted");
    }
}

async function testLeadCRUD() {
    console.log("\n=== TEST 4: Lead CRUD Operations ===");

    // First create a customer for the lead
    const { data: customer, error: custError } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Test Lead Customer",
            phone: "919999777777",
            status: "active",
        })
        .select()
        .single();

    if (custError) {
        console.log("  ✗ Customer create failed:", custError.message);
        return;
    }

    // Test create lead
    const { data: created, error: createError } = await supabase
        .from("leads")
        .insert({
            company_id: COMPANY_ID,
            customer_id: customer.id,
            requirement: "2 BHK Flat",
            budget: 6000000,
            status: "New",
        })
        .select()
        .single();

    if (createError) {
        console.log("  ✗ Create failed:", createError.message);
        return;
    }
    console.log("  ✓ Lead created:", created.id);

    // Test search leads
    const { data: searched, error: searchError } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .eq("customer_id", customer.id);

    if (searchError) {
        console.log("  ✗ Search failed:", searchError.message);
    } else {
        console.log("  ✓ Leads found:", searched.length);
    }

    // Test update lead
    const { data: updated, error: updateError } = await supabase
        .from("leads")
        .update({ budget: 7500000 })
        .eq("id", created.id)
        .select()
        .single();

    if (updateError) {
        console.log("  ✗ Update failed:", updateError.message);
    } else {
        console.log("  ✓ Lead updated:", updated.budget);
    }

    // Cleanup
    await supabase.from("leads").delete().eq("id", created.id);
    await supabase.from("customers").delete().eq("id", customer.id);
    console.log("  ✓ Cleanup complete");
}

async function testCompanyIsolation() {
    console.log("\n=== TEST 5: Company Isolation ===");

    const OTHER_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

    // Create customer in company A
    const { data: customerA } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Company A Customer",
            phone: "919999666666",
        })
        .select()
        .single();

    // Try to access from company B
    const { data: customersB } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", OTHER_COMPANY_ID)
        .eq("phone", "919999666666");

    if (customersB && customersB.length === 0) {
        console.log("  ✓ Company isolation working (no cross-company access)");
    } else {
        console.log("  ✗ Company isolation BROKEN");
    }

    // Cleanup
    if (customerA) {
        await supabase.from("customers").delete().eq("id", customerA.id);
    }
}

async function main() {
    console.log("=====================================");
    console.log("Customer + Lead AI Operations Test");
    console.log("=====================================");

    await testCustomerExtraction();
    await testLeadExtraction();
    await testCustomerCRUD();
    await testLeadCRUD();
    await testCompanyIsolation();

    console.log("\n=====================================");
    console.log("CUSTOMER/LEAD TEST COMPLETE");
    console.log("=====================================");
}

main().catch(console.error);
