import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";
import { extractLeadData } from "../backend/ai-engine/intentDetector.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";

async function testAddLeadWithCustomerResolution() {
    console.log("\n=== TEST: ADD_LEAD with Customer Resolution ===");

    const testMessage = "Add lead Amit Patil phone 9876543210 budget 60 lakh";

    console.log(`\n  Input: "${testMessage}"`);

    // Step 1: Extract lead data
    const leadData = extractLeadData(testMessage);
    console.log("\n  Extracted Lead Data:", JSON.stringify(leadData, null, 2));

    // Step 2: Extract customer info
    const customerPhone = leadData.customer_phone;
    const customerName = leadData.customer_name;

    console.log(`\n  Customer Phone: ${customerPhone}`);
    console.log(`  Customer Name: ${customerName}`);

    if (!customerPhone) {
        console.log("  ✗ No customer phone extracted - cannot resolve customer");
        return;
    }

    // Step 3: Normalize phone
    const normalizedPhone = customerPhone.replace(/\D/g, "").slice(-10);
    console.log(`  Normalized Phone: ${normalizedPhone}`);

    // Step 4: Check if customer exists
    const { data: existingCustomer, error: searchError } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .eq("phone", normalizedPhone)
        .maybeSingle();

    let customerId: string | null = null;

    if (searchError) {
        console.log("  ✗ Search error:", searchError.message);
        return;
    }

    if (existingCustomer) {
        console.log(`\n  ✓ Customer found: ${existingCustomer.full_name} (${existingCustomer.id})`);
        customerId = existingCustomer.id;
    } else {
        // Step 5: Create new customer
        console.log("\n  → Creating new customer...");
        const { data: newCustomer, error: createError } = await supabase
            .from("customers")
            .insert({
                company_id: COMPANY_ID,
                full_name: customerName || "WhatsApp Customer",
                phone: normalizedPhone,
                status: "active",
                source: "WhatsApp"
            })
            .select()
            .single();

        if (createError) {
            console.log("  ✗ Create error:", createError.message);
            return;
        }

        console.log(`  ✓ Customer created: ${newCustomer.full_name} (${newCustomer.id})`);
        customerId = newCustomer.id;
    }

    // Step 6: Create lead with customer_id
    console.log("\n  → Creating lead...");
    const { data: createdLead, error: leadError } = await supabase
        .from("leads")
        .insert({
            company_id: COMPANY_ID,
            customer_id: customerId,
            requirement: leadData.requirement,
            budget: leadData.budget,
            lead_source: leadData.lead_source,
            status: leadData.status,
            remarks: leadData.remarks
        })
        .select()
        .single();

    if (leadError) {
        console.log("  ✗ Lead create error:", leadError.message);
        return;
    }

    console.log(`  ✓ Lead created: ${createdLead.id}`);
    console.log(`    - Customer ID: ${createdLead.customer_id}`);
    console.log(`    - Requirement: ${createdLead.requirement}`);
    console.log(`    - Budget: ${createdLead.budget}`);
    console.log(`    - Status: ${createdLead.status}`);

    // Step 7: Verify lead-customer link
    const { data: leadWithCustomer, error: verifyError } = await supabase
        .from("leads")
        .select(`
            id,
            customer_id,
            requirement,
            budget,
            status,
            customers (
                id,
                full_name,
                phone
            )
        `)
        .eq("id", createdLead.id)
        .single();

    if (verifyError) {
        console.log("  ✗ Verify error:", verifyError.message);
    } else {
        console.log("\n  ✓ Lead-Customer link verified:");
        console.log(`    - Lead: ${leadWithCustomer.id}`);
        console.log(`    - Customer: ${leadWithCustomer.customers?.full_name} (${leadWithCustomer.customers?.phone})`);
    }

    // Cleanup
    await supabase.from("leads").delete().eq("id", createdLead.id);
    if (!existingCustomer && customerId) {
        await supabase.from("customers").delete().eq("id", customerId);
    }
    console.log("\n  ✓ Cleanup complete");
}

async function testAddLeadExistingCustomer() {
    console.log("\n=== TEST: ADD_LEAD with Existing Customer ===");

    const testMessage = "Add lead Rahul Patil phone 9876543210 budget 75 lakh";

    console.log(`\n  Input: "${testMessage}"`);

    // First create a customer with the same phone
    const { data: existingCustomer } = await supabase
        .from("customers")
        .insert({
            company_id: COMPANY_ID,
            full_name: "Rahul Patil Existing",
            phone: "9876543210",
            status: "active",
            source: "WhatsApp"
        })
        .select()
        .single();

    console.log(`  Pre-created customer: ${existingCustomer?.full_name} (${existingCustomer?.id})`);

    // Extract lead data
    const leadData = extractLeadData(testMessage);
    console.log("\n  Extracted Lead Data:", JSON.stringify(leadData, null, 2));

    const customerPhone = leadData.customer_phone;
    const normalizedPhone = customerPhone?.replace(/\D/g, "").slice(-10);

    // Check if customer exists
    const { data: foundCustomer } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", COMPANY_ID)
        .eq("phone", normalizedPhone)
        .maybeSingle();

    if (foundCustomer) {
        console.log(`\n  ✓ Existing customer found: ${foundCustomer.full_name} (${foundCustomer.id})`);

        // Create lead with existing customer
        const { data: createdLead } = await supabase
            .from("leads")
            .insert({
                company_id: COMPANY_ID,
                customer_id: foundCustomer.id,
                requirement: leadData.requirement,
                budget: leadData.budget,
                lead_source: leadData.lead_source,
                status: leadData.status,
                remarks: leadData.remarks
            })
            .select()
            .single();

        console.log(`  ✓ Lead created with existing customer: ${createdLead?.id}`);

        // Cleanup
        if (createdLead) {
            await supabase.from("leads").delete().eq("id", createdLead.id);
        }
    }

    // Cleanup customer
    if (existingCustomer) {
        await supabase.from("customers").delete().eq("id", existingCustomer.id);
    }
    console.log("\n  ✓ Cleanup complete");
}

async function main() {
    console.log("=====================================");
    console.log("ADD_LEAD with Customer Resolution Test");
    console.log("=====================================");

    await testAddLeadWithCustomerResolution();
    await testAddLeadExistingCustomer();

    console.log("\n=====================================");
    console.log("ADD_LEAD TEST COMPLETE");
    console.log("=====================================");
}

main().catch(console.error);
