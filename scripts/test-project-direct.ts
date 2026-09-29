import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  // First, let's see what the AI extracts from the message
  console.log("=== Testing Project Creation Directly ===");
  
  // Simulate what ProjectAI.addProject does
  const params = {
    project_name: "Green Valley",
    location: "Hadapsar Pune",
    project_type: "Residential",
    flat_type: "2BHK and 3BHK",
    area_sqft: 1200,
    price: 8500000,
  };
  
  const companyId = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
  
  const payload = {
    company_id: companyId,
    project_name: params.project_name,
    project_type: params.project_type || "Residential",
    location: params.location || "Not specified",
    city: params.city || "",
    state: params.state || "",
    pincode: params.pincode || "",
    description: params.description || "",
    price: Number(params.price) || 0,
    flat_type: params.flat_type || "",
    total_units: params.total_units || 0,
    available_units: params.available_units || 0,
    status: params.status || "Active",
  };
  
  console.log("Payload:", JSON.stringify(payload, null, 2));
  
  try {
    const { data, error } = await supabase
      .from("projects")
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.log("ERROR:", error.message);
      console.log("CODE:", error.code);
      console.log("DETAILS:", error.details);
      console.log("HINT:", error.hint);
    } else {
      console.log("SUCCESS:", JSON.stringify(data, null, 2));
    }
  } catch (e: any) {
    console.log("EXCEPTION:", e.message);
  }
}

main();
