import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  // Simulate what toolManager.ts does for ADD_PROJECT
  const params = {
    project_name: "Green Valley",
    location: "Hadapsar Pune",
    project_type: "Residential",
    flat_type: "2BHK and 3BHK",
    area_sqft: 1200,
    price: 8500000,
  };
  
  const companyId = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
  
  // This is what toolManager.ts line 947 does
  const payload = {
    company_id: companyId,
    project_name: params.project_name || "New Project",
    project_type: params.project_type || "Residential",
    location: params.location || "Not specified",
    city: params.city || "Pune",
    state: params.state || "",
    pincode: params.pincode || "",
    description: params.description || "",
    flat_types: params.flat_type || params.flat_types || "",
    total_units: params.total_units || 0,
    available_units: params.available_units || 0,
    area_sqft: params.area_sqft || params.sqft || null,
    price: params.price || 0,
    brochure_url: params.brochure_url || null,
    gallery: params.gallery || null,
    amenities: params.amenities || null,
    contact_person: params.contact_person || null,
    contact_number: params.contact_number || null,
    status: params.status || "Active",
  };
  
  console.log("Payload:", JSON.stringify(payload, null, 2));
  
  // Check for duplicate first (what projectService.createProject does)
  const { data: existing, error: duplicateError } = await supabase
    .from("projects")
    .select("id,project_name")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .ilike("project_name", payload.project_name)
    .maybeSingle();
  
  console.log("Existing check:", existing ? "DUPLICATE" : "NO DUPLICATE", duplicateError?.message);
  
  if (existing) {
    console.log("Would return duplicate");
    return;
  }
  
  // Now try the insert
  try {
    const { data, error } = await supabase
      .from("projects")
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.log("INSERT ERROR:", error.message);
      console.log("CODE:", error.code);
      console.log("DETAILS:", error.details);
      console.log("HINT:", error.hint);
    } else {
      console.log("INSERT SUCCESS:", JSON.stringify(data, null, 2));
    }
  } catch (e: any) {
    console.log("EXCEPTION:", e.message);
  }
}

main();
