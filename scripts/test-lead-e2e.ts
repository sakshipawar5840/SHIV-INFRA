import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
const OTHER_COMPANY_ID = "00000000-0000-0000-0000-000000000000";

let testResults: { test: string; status: string; details?: string }[] = [];

function recordResult(test: string, status: string, details?: string) {
    testResults.push({ test, status, details });
    const icon = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "⚠";
    console.log(`  ${icon} ${test}${details ? `: ${details}` : ""}`);
}

async function testLeadAdd() {
    console.log("\n=== LEAD ADD TESTS ===");

    // Create customer first with unique phone
    const uniquePhone = `91${Date.now().toString().slice(-8)}`;
    const { data: customer, error: custError } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Lead E2E Test Customer",
            phone: uniquePhone,
            status: "active",
        })
        .select()
        .single();

    if (custError || !customer) {
        recordResult("Add lead", "FAIL", `customer creation failed: ${custError?.message}`);
        return null;
    }

    // Create lead
    const { data: lead, error: createError } = await supabase
        .from("leads")
        .insert({
            company_id: COMPANY_ID,
            customer_id: customer.id,
            requirement: "3 BHK Flat in Pune",
            budget: 7500000,
            lead_source: "WhatsApp",
            status: "New",
            preferred_location: "Hadapsar",
            remarks: "Looking for ready possession",
        })
        .select()
        .single();

    if (createError) {
        recordResult("Add lead", "FAIL", `error: ${createError.message}`);
        await supabase.from("customers").delete().eq("id", customer.id);
        return null;
    }

    recordResult("Add lead", "PASS", `id=${lead?.id}`);
    recordResult("Lead has company_id", lead?.company_id === COMPANY_ID ? "PASS" : "FAIL", `company_id=${lead?.company_id}`);
    recordResult("Lead has customer_id", lead?.customer_id === customer.id ? "PASS" : "FAIL", `customer_id=${lead?.customer_id}`);

    return { lead, customer };
}

async function testLeadRead(leadId: string) {
    console.log("\n=== LEAD READ TESTS ===");

    // Direct DB lookup
    const { data: directLead, error: directError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

    if (directError) {
        recordResult("Read lead by ID", "FAIL", `error: ${directError.message}`);
    } else {
        recordResult("Read lead by ID", "PASS", `requirement=${directLead?.requirement}`);
    }

    // Read with customer join
    const { data: leadWithCustomer, error: joinError } = await supabase
        .from("leads")
        .select(`
            id,
            customer_id,
            requirement,
            customers (id, full_name, phone)
        `)
        .eq("id", leadId)
        .single();

    if (joinError) {
        recordResult("Read lead with customer", "FAIL", `error: ${joinError.message}`);
    } else {
        recordResult("Read lead with customer", leadWithCustomer?.customers?.full_name ? "PASS" : "FAIL", `customer=${leadWithCustomer?.customers?.full_name}`);
    }
}

async function testLeadSearch(companyId: string, searchText: string) {
    console.log("\n=== LEAD SEARCH TESTS ===");

    // Search by requirement
    const { data: byRequirement, error: reqError } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", companyId)
        .ilike("requirement", `%${searchText}%`);

    if (reqError) {
        recordResult("Search by requirement", "FAIL", `error: ${reqError.message}`);
    } else {
        recordResult("Search by requirement", byRequirement && byRequirement.length > 0 ? "PASS" : "FAIL", `found=${byRequirement?.length || 0}`);
    }

    // Search by location
    const { data: byLocation, error: locError } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", companyId)
        .ilike("preferred_location", `%Pune%`);

    if (locError) {
        recordResult("Search by location", "FAIL", `error: locError.message}`);
    } else {
        recordResult("Search by location", byLocation && byLocation.length > 0 ? "PASS" : "FAIL", `found=${byLocation?.length || 0}`);
    }
}

async function testLeadUpdate(leadId: string) {
    console.log("\n=== LEAD UPDATE TESTS ===");

    // Update budget and status
    const { data: updated, error: updateError } = await supabase
        .from("leads")
        .update({
            budget: 8500000,
            status: "Follow Up",
            remarks: "Updated: Looking for ready possession, budget increased",
        })
        .eq("id", leadId)
        .eq("company_id", COMPANY_ID)
        .select()
        .single();

    if (updateError) {
        recordResult("Update lead", "FAIL", `error: ${updateError.message}`);
        return;
    }

    recordResult("Update lead", "PASS", `budget=${updated?.budget}, status=${updated?.status}`);

    // Verify update persisted
    const { data: verifyLead } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

    recordResult("Update persisted", verifyLead?.budget === 8500000 && verifyLead?.status === "Follow Up" ? "PASS" : "FAIL", `budget=${verifyLead?.budget}, status=${verifyLead?.status}`);
}

async function testLeadDelete(leadId: string) {
    console.log("\n=== LEAD DELETE TESTS ===");

    // Delete lead
    const { error: deleteError } = await supabase
        .from("leads")
        .delete()
        .eq("id", leadId)
        .eq("company_id", COMPANY_ID);

    if (deleteError) {
        recordResult("Delete lead", "FAIL", `error: ${deleteError.message}`);
        return;
    }

    recordResult("Delete lead", "PASS", "deleted");

    // Verify lead no longer exists
    const { data: afterDelete } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .eq("company_id", COMPANY_ID);

    recordResult("Lead not found after delete", afterDelete && afterDelete.length === 0 ? "PASS" : "FAIL");
}

async function testCompanyIsolation(customerId: string) {
    console.log("\n=== COMPANY ISOLATION TESTS ===");

    // Create lead in company A
    const { data: leadA } = await supabase
        .from("leads")
        .insert({
            company_id: COMPANY_ID,
            customer_id: customerId,
            requirement: `Isolation Test Lead ${Date.now()}`,
            budget: 5000000,
            status: "New",
        })
        .select()
        .single();

    if (!leadA) {
        recordResult("Company isolation", "FAIL", "Could not create test lead");
        return;
    }

    // Try to access from company B
    const { data: leadsB } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", OTHER_COMPANY_ID)
        .eq("id", leadA.id);

    recordResult("Lead company isolation", leadsB && leadsB.length === 0 ? "PASS" : "FAIL");

    // Try to update from company B
    const { error: updateBError } = await supabase
        .from("leads")
        .update({ budget: 9999999 })
        .eq("id", leadA.id)
        .eq("company_id", OTHER_COMPANY_ID);

    // Should either error or update 0 rows
    const { data: afterUpdateB } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadA.id)
        .eq("company_id", COMPANY_ID);

    recordResult("Lead update isolation", afterUpdateB?.[0]?.budget === 5000000 ? "PASS" : "FAIL");

    // Try to delete from company B
    await supabase
        .from("leads")
        .delete()
        .eq("id", leadA.id)
        .eq("company_id", OTHER_COMPANY_ID);

    const { data: afterDeleteB } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadA.id)
        .eq("company_id", COMPANY_ID);

    recordResult("Lead delete isolation", afterDeleteB && afterDeleteB.length > 0 ? "PASS" : "FAIL");

    // Cleanup
    await supabase.from("leads").delete().eq("id", leadA.id);
}

async function testDashboardVisibility() {
    console.log("\n=== DASHBOARD VISIBILITY TESTS ===");

    // Create customer and lead with unique phone
    const uniquePhone = `91${Date.now().toString().slice(-8)}`;
    const { data: customer, error: custError } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Dashboard Test Customer",
            phone: uniquePhone,
            status: "active",
        })
        .select()
        .single();

    if (custError || !customer) {
        recordResult("Dashboard visibility", "FAIL", `customer creation failed: ${custError?.message}`);
        return;
    }

    const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert({
            company_id: COMPANY_ID,
            customer_id: customer.id,
            requirement: `Dashboard Visibility Test ${Date.now()}`,
            budget: 6000000,
            status: "New",
        })
        .select()
        .single();

    if (leadError || !lead) {
        recordResult("Dashboard visibility", "FAIL", `lead creation failed: ${leadError?.message}`);
        await supabase.from("customers").delete().eq("id", customer.id);
        return;
    }

    // Simulate dashboard query (same as dashboardController)
    const { data: dashboardLeads, error: dashboardError } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .order("created_at", { ascending: false });

    if (dashboardError) {
        recordResult("Dashboard query", "FAIL", `error: ${dashboardError.message}`);
    } else {
        const found = dashboardLeads?.find((l: any) => l.id === lead.id);
        recordResult("Dashboard query", found ? "PASS" : "FAIL", `found=${found ? "yes" : "no"}`);
    }

    // Cleanup
    await supabase.from("leads").delete().eq("id", lead.id);
    await supabase.from("customers").delete().eq("id", customer.id);
}

async function main() {
    console.log("=====================================");
    console.log("LEAD MODULE END-TO-END TEST");
    console.log("=====================================");

    const result = await testLeadAdd();
    if (result?.lead) {
        await testLeadRead(result.lead.id);
        await testLeadSearch(COMPANY_ID, "BHK");
        await testLeadUpdate(result.lead.id);
        await testLeadDelete(result.lead.id);
        await testCompanyIsolation(result.customer.id);
    }
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
