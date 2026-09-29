import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // 1. Check actual activity_logs columns
  const { data: sample } = await supabase
    .from("activity_logs")
    .select("*")
    .limit(1);
  console.log("SAMPLE activity_logs:", JSON.stringify(sample, null, 2));

  // 2. Try to insert
  const { data, error } = await supabase
    .from("activity_logs")
    .insert({
      company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
      action_type: "TEST",
      details: "Schema debug test",
    })
    .select()
    .single();
  console.log("INSERT activity_logs result:", JSON.stringify(data));
  console.log("INSERT activity_logs error:", error?.message, error?.code, error?.details);

  // 3. List
  const { data: list, count } = await supabase
    .from("activity_logs")
    .select("*", { count: "exact" })
    .eq("company_id", "3e9e9ae1-8593-473f-9aa3-9bcee469d795")
    .limit(5);
  console.log("LIST count:", count);
  console.log("LIST sample:", JSON.stringify(list?.slice(0, 2), null, 2));

  process.exit(0);
}

main();
