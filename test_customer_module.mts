import customerService from "./backend/services/customerService.ts";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const COMPANY = process.env.DEFAULT_COMPANY_ID || "";
const NAME = "SHIVINFRA_VERIFICATION_CUSTOMER_20260822";
const PHONE = "91234567123";
const EMAIL = "shivinfra_verify_20260822@example.com";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function unique(phone: string, email: string) {
  const { data } = await supabase
    .from("customers")
    .select("id")
    .or(`phone.eq.${phone},email.eq.${email}`)
    .limit(1);
  return !data || data.length === 0;
}

async function run() {
  console.log("COMPANY_ID:", COMPANY ? "SET" : "MISSING");

  const isUnique = await unique(PHONE, EMAIL);
  console.log("UNIQUE CHECK:", isUnique ? "PASS (phone/email unused)" : "FAIL (collision)");

  // 1. ADD
  const created = await customerService.createCustomer({
    company_id: COMPANY,
    customer_name: NAME,
    phone: PHONE,
    email: EMAIL,
  });
  const id = (created.data && created.data.id) || null;
  console.log("ADD:", created.success ? "PASS" : "FAIL", "| id:", id, "| msg:", created.message);

  // 2. SEARCH
  const found = await customerService.searchCustomers(COMPANY, NAME);
  const match = found.find((c: any) => c.full_name === NAME && c.phone === PHONE);
  console.log("SEARCH:", match ? "PASS" : "FAIL", "| count:", found.length);

  // 3. UPDATE
  const updated = await customerService.updateCustomer(id!, COMPANY, {
    phone: "91234567124",
    email: "shivinfra_verify_updated@example.com",
  });
  console.log("UPDATE:", updated.success ? "PASS" : "FAIL", "| msg:", updated.message);

  // 4. SEARCH AFTER UPDATE
  const found2 = await customerService.searchCustomers(COMPANY, NAME);
  const m2 = found2.find((c: any) => c.full_name === NAME && c.phone === "91234567124");
  const stale = found2.find((c: any) => c.full_name === NAME && c.phone === PHONE);
  console.log("SEARCH AFTER UPDATE:", m2 ? "PASS" : "FAIL", "| stale phone still present:", !!stale);

  // 5. DELETE
  const deleted = await customerService.deleteCustomer(id!, COMPANY, {});
  console.log("DELETE:", deleted.success ? "PASS" : "FAIL", "| msg:", deleted.message);

  // 6. SEARCH AFTER DELETE
  const found3 = await customerService.searchCustomers(COMPANY, NAME);
  const after = found3.find((c: any) => c.full_name === NAME);
  console.log("SEARCH AFTER DELETE:", !after ? "PASS (not returned)" : "FAIL (still present)");
  console.log("VERIFIED ID:", id);
}

run().then(() => process.exit(0)).catch((e) => { console.error("TEST ERROR:", e.message); process.exit(1); });
