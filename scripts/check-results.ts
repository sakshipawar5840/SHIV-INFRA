import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const { data: leads } = await s
    .from("leads")
    .select("*")
    .eq("company_id", "3e9e9ae1-8593-473f-9aa3-9bcee469d795")
    .order("created_at", { ascending: false })
    .limit(5);
  console.log("Leads:", JSON.stringify(leads));

  const { data: bills } = await s
    .from("bills")
    .select("*")
    .eq("company_id", "3e9e9ae1-8593-473f-9aa3-9bcee469d795")
    .order("created_at", { ascending: false })
    .limit(5);
  console.log("Bills:", JSON.stringify(bills));
}

main().catch((e) => console.error(e.message));
