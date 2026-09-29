import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const s = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

(async () => {
  const tables = [
    "projects",
    "customers",
    "leads",
    "bills",
    "expenses",
    "activity_logs",
  ];

  console.log("Real (non-deleted) record counts in company 3e9e9ae1...:");
  for (const t of tables) {
    let q = s.from(t).select("id", { count: "exact", head: true }).eq("company_id", "3e9e9ae1-8593-473f-9aa3-9bcee469d795");
    if (t === "projects" || t === "customers") q = q.eq("is_deleted", false);
    const { count } = await q;
    console.log(`  ${t}: ${count}`);
  }
  process.exit(0);
})();
