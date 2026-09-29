import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function main() {
  const { data, error } = await s
    .from("projects")
    .select("*")
    .limit(1);

  if (error) {
    console.log("Error:", error.message);
    return;
  }

  if (data?.[0]) {
    console.log("Columns:", Object.keys(data[0]));
    console.log("Sample row:", JSON.stringify(data[0]));
  } else {
    console.log("No data in projects table");
  }
}

main().catch((e) => console.log("Exception:", e.message));
