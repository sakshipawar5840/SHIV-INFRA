import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE = "http://localhost:3000/api/v1";

async function main() {
  const email = "testadmin20260816104158@shivinfra.com";
  const password = "TestLeadE2E_2026!";
  const hashed = await bcrypt.hash(password, 10);
  await supabase.from("users").update({ password: hashed }).eq("email", email);

  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginJson = await loginRes.json();
  if (!loginJson.token) {
    console.log("LOGIN FAIL", loginJson);
    process.exit(1);
  }
  const auth = { Authorization: `Bearer ${loginJson.token}`, "Content-Type": "application/json" };

  // 1. POST
  const postRes = await fetch(`${BASE}/activity-logs`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      action_type: "TEST",
      details: "Auth diag test",
    }),
  });
  const postJson = await postRes.json();
  console.log("POST status:", postRes.status);
  console.log("POST body:", JSON.stringify(postJson).slice(0, 300));

  // 2. GET
  const getRes = await fetch(`${BASE}/activity-logs?limit=5`, { headers: auth });
  const getJson = await getRes.json();
  console.log("GET status:", getRes.status, "count:", getJson.count);
  if (getJson.data && getJson.data[0]) {
    console.log("GET first record keys:", Object.keys(getJson.data[0]));
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
