import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const tablesToCheck = [
    "tasks",
    "documents",
    "inquiries",
    "site_visits",
    "vendors",
    "materials",
    "activity_logs",
    "settings",
  ];

  console.log("Checking existing tables in public schema:\n");

  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .limit(1);

    if (error) {
      console.log(`❌ ${table}: MISSING (${error.message})`);
    } else {
      console.log(`✅ ${table}: EXISTS`);
    }
  }
}

main().catch((error) => {
  console.error("Check failed:", error);
  process.exit(1);
});
