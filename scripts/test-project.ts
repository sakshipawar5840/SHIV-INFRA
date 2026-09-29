import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  try {
    const { data, error } = await s
      .from("projects")
      .insert({
        company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
        project_name: "Test Project XYZ " + Date.now(),
      })
      .select()
      .single();

    console.log("Data:", JSON.stringify(data));
    if (error) console.log("Error:", error.message);
  } catch (e: any) {
    console.log("Exception:", e.message);
  }
}

main();
