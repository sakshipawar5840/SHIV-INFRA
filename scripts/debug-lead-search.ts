import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";

async function debugLeadSearch() {
    console.log("=== DEBUG LEAD SEARCH ===\n");

    // Step 1: Create customer
    console.log("Step 1: Creating customer...");
    const { data: customer, error: custError } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Debug Search Customer",
            phone: "919888888888",
            status: "active",
        })
        .select()
        .single();

    if (custError) {
        console.log("  ✗ Customer creation FAILED:");
        console.log("    message:", custError.message);
        console.log("    code:", custError.code);
        console.log("    details:", custError.details);
        console.log("    hint:", custError.hint);
        return;
    }
    console.log("  ✓ Customer created:", customer?.id);
    console.log("    company_id:", customer?.company_id);
    console.log("    full_name:", customer?.full_name);
    console.log("    phone:", customer?.phone);

    // Step 2: Create lead
    console.log("\nStep 2: Creating lead...");
    const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert({
            company_id: COMPANY_ID,
            customer_id: customer?.id,
            requirement: "Debug Search Lead",
            budget: 5000000,
            status: "New",
        })
        .select()
        .single();

    if (leadError) {
        console.log("  ✗ Lead creation FAILED:");
        console.log("    message:", leadError.message);
        console.log("    code:", leadError.code);
        console.log("    details:", leadError.details);
        console.log("    hint:", leadError.hint);
        return;
    }
    console.log("  ✓ Lead created:", lead?.id);
    console.log("    company_id:", lead?.company_id);
    console.log("    customer_id:", lead?.customer_id);
    console.log("    requirement:", lead?.requirement);
    console.log("    budget:", lead?.budget);
    console.log("    status:", lead?.status);
    console.log("    is_deleted:", lead?.is_deleted);
    console.log("    created_at:", lead?.created_at);

    // Step 3: Direct DB lookup by ID
    console.log("\nStep 3: Direct DB lookup by ID...");
    const { data: directLookup, error: directError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", lead?.id);

    if (directError) {
        console.log("  ✗ Direct lookup FAILED:");
        console.log("    message:", directError.message);
    } else {
        console.log("  ✓ Direct lookup result:", directLookup?.length || 0, "rows");
        if (directLookup && directLookup.length > 0) {
            console.log("    Row:", JSON.stringify(directLookup[0], null, 2));
        }
    }

    // Step 4: Search with company_id only
    console.log("\nStep 4: Search with company_id only...");
    const { data: byCompany, error: companyError } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", COMPANY_ID);

    if (companyError) {
        console.log("  ✗ Search by company FAILED:");
        console.log("    message:", companyError.message);
    } else {
        console.log("  ✓ Search by company result:", byCompany?.length || 0, "rows");
    }

    // Step 5: Search with company_id AND is_deleted = false
    console.log("\nStep 5: Search with company_id AND is_deleted = false...");
    const { data: byCompanyAndDeleted, error: deletedError } = await supabase
        .from("leads")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .eq("is_deleted", false);

    if (deletedError) {
        console.log("  ✗ Search by company + is_deleted FAILED:");
        console.log("    message:", deletedError.message);
    } else {
        console.log("  ✓ Search by company + is_deleted result:", byCompanyAndDeleted?.length || 0, "rows");
    }

    // Step 6: Search with customer join
    console.log("\nStep 6: Search with customer join...");
    const { data: withCustomer, error: joinError } = await supabase
        .from("leads")
        .select(`
            id,
            company_id,
            customer_id,
            requirement,
            status,
            is_deleted,
            customers (id, full_name, phone)
        `)
        .eq("company_id", COMPANY_ID)
        .eq("is_deleted", false);

    if (joinError) {
        console.log("  ✗ Search with join FAILED:");
        console.log("    message:", joinError.message);
    } else {
        console.log("  ✓ Search with join result:", withCustomer?.length || 0, "rows");
        if (withCustomer && withCustomer.length > 0) {
            console.log("    First row:", JSON.stringify(withCustomer[0], null, 2));
        }
    }

    // Step 7: Check if lead exists with customer_id
    console.log("\nStep 7: Search by customer_id...");
    const { data: byCustomerId, error: custIdError } = await supabase
        .from("leads")
        .select("*")
        .eq("customer_id", customer?.id);

    if (custIdError) {
        console.log("  ✗ Search by customer_id FAILED:");
        console.log("    message:", custIdError.message);
    } else {
        console.log("  ✓ Search by customer_id result:", byCustomerId?.length || 0, "rows");
    }

    // Cleanup
    console.log("\nCleanup...");
    if (lead) {
        await supabase.from("leads").delete().eq("id", lead.id);
    }
    if (customer) {
        await supabase.from("customers").delete().eq("id", customer.id);
    }
    console.log("  ✓ Cleanup complete");
}

debugLeadSearch().catch(console.error);
