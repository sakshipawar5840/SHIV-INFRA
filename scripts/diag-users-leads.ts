import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: users, error: uErr } = await supabase
    .from("users")
    .select("id, email, role, company_id, full_name")
    .limit(10);
  console.log("USERS:", JSON.stringify(users, null, 2));
  if (uErr) console.log("USERS_ERR:", uErr.message);

  const { data: cols, error: cErr } = await supabase
    .from("leads")
    .select("*")
    .limit(1);
  console.log("LEADS_SAMPLE:", JSON.stringify(cols, null, 2));
  if (cErr) console.log("LEADS_ERR:", cErr.message);

  process.exit(0);
}

main();
