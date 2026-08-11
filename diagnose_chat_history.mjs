import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false }
});

async function testInsert() {
  const { data, error } = await supabaseAdmin
    .from("chat_history")
    .insert({
      company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
      message: "Test insert from diagnostic script"
    })
    .select();

  console.log("INSERT ERROR:", error);
  console.log("INSERT DATA:", data);

  if (!error && data && data.length > 0) {
    const insertedId = data[0].id;
    const { data: checkData, error: checkError } = await supabaseAdmin
      .from("chat_history")
      .select("*")
      .eq("id", insertedId)
      .single();

    console.log("CHECK ERROR:", checkError);
    console.log("CHECK DATA:", checkData);
  }
}

testInsert().catch(console.error);
