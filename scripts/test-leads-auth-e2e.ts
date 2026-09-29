import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();

const BASE = "http://localhost:3000/api/v1";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_PASSWORD = "TestLeadE2E_2026!";

async function main() {
  const email = "testadmin20260816104158@shivinfra.com";
  const companyId = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";

  // 1. Force-reset password
  const hashed = await bcrypt.hash(TEST_PASSWORD, 10);
  const { error: upErr } = await supabaseAdmin
    .from("users")
    .update({ password: hashed })
    .eq("email", email);
  if (upErr) {
    console.log("PWD_RESET_ERR:", upErr.message);
    process.exit(1);
  }
  console.log("1. Password reset OK for", email);

  // 2. Login via API
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  });
  const loginBody = await loginRes.text();
  console.log("2. LOGIN HTTP:", loginRes.status);
  console.log("   LOGIN BODY:", loginBody.slice(0, 300));
  if (loginRes.status !== 200) process.exit(1);

  const { token, user } = JSON.parse(loginBody);
  const authHeader = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  console.log("   TOKEN length:", token.length, "user.id:", user.id, "company_id:", user.company_id);

  // 3. CREATE Lead
  const createRes = await fetch(`${BASE}/leads`, {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({
      lead_source: "Website",
      requirement: "AUTH-E2E test lead 3BHK",
      budget: 8500000,
      preferred_location: "Baner, Pune",
      status: "New",
      remarks: "Created by authenticated E2E script",
    }),
  });
  const createBody = await createRes.text();
  console.log("3. CREATE LEAD HTTP:", createRes.status);
  console.log("   CREATE BODY:", createBody.slice(0, 400));
  if (createRes.status !== 201) process.exit(1);

  const created = JSON.parse(createBody).data;
  console.log("   CREATED ID:", created?.id, "company_id:", created?.company_id);

  // 4. LIST Leads (verify presence)
  const listRes = await fetch(`${BASE}/leads`, { headers: authHeader });
  const listBody = await listRes.text();
  const listJson = JSON.parse(listBody);
  const found = (listJson.data || []).find((l: any) => l.id === created.id);
  console.log("4. LIST HTTP:", listRes.status, "count:", listJson.count, "found:", !!found);
  if (!found) process.exit(1);

  // 5. UPDATE Lead
  const updRes = await fetch(`${BASE}/leads/${created.id}`, {
    method: "PUT",
    headers: authHeader,
    body: JSON.stringify({ status: "Hot", remarks: "Updated by E2E" }),
  });
  const updBody = await updRes.text();
  console.log("5. UPDATE HTTP:", updRes.status, "BODY:", updBody.slice(0, 200));
  if (updRes.status !== 200) process.exit(1);
  const updJson = JSON.parse(updBody);
  console.log("   UPDATED status:", updJson.data?.status, "remarks:", updJson.data?.remarks);

  // 6. DELETE Lead
  const delRes = await fetch(`${BASE}/leads/${created.id}`, {
    method: "DELETE",
    headers: authHeader,
  });
  const delBody = await delRes.text();
  console.log("6. DELETE HTTP:", delRes.status, "BODY:", delBody.slice(0, 200));
  if (delRes.status !== 200) process.exit(1);

  // 7. Verify deleted
  const list2 = await fetch(`${BASE}/leads`, { headers: authHeader });
  const list2Json = JSON.parse(await list2.text());
  const stillThere = (list2Json.data || []).find((l: any) => l.id === created.id);
  console.log("7. AFTER DELETE - found:", !!stillThere, "count:", list2Json.count);

  console.log("\n=== AUTH E2E CRUD ALL PASS ===");
  process.exit(0);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
