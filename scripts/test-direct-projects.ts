import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const companyId = '3e9e9ae1-8593-473f-9aa3-9bcee469d795'; // From seed script
  
  // Test direct query with service role (bypasses RLS)
  const { data, error, count } = await supabase
    .from("projects")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(50);

  console.log("Direct query error:", error?.message);
  console.log("Direct query count:", count);
  console.log("Direct query data sample:", data?.slice(0, 2));
  
  if (data && data.length > 0) {
    const firstProject = data[0];
    console.log("First project keys:", Object.keys(firstProject));
    console.log("First project flat_type:", firstProject.flat_type);
    console.log("First project sqft:", firstProject.sqft);
    console.log("First project price:", firstProject.price);
    console.log("First project project_name:", firstProject.project_name);
    console.log("First project status:", firstProject.status);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });