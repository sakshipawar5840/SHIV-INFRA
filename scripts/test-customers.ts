import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const s = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  const phones = ["9199991234", "919876543299"];
  for (const phone of phones) {
    const { data: user } = await s
      .from("users")
      .select("id, phone, role")
      .eq("phone", phone)
      .maybeSingle();

    const { data: customer } = await s
      .from("customers")
      .select("id, phone, full_name")
      .eq("phone", phone)
      .maybeSingle();

    console.log(`Phone ${phone}: user=${JSON.stringify(user)}, customer=${JSON.stringify(customer)}`);
  }
}

main().catch((e) => console.error(e.message));
