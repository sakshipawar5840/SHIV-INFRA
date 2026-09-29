import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../backend/config/supabase.ts";

const SECRET = "shivinfra_jwt_secret_2026";
const BASE = "http://localhost:3000/api/v1";
const COMPANY = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";

async function main() {
  // find an admin user
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id,email,role,company_id")
    .eq("company_id", COMPANY)
    .in("role", ["admin", "superadmin"])
    .limit(1);
  if (!users || !users.length) throw new Error("No admin user found");
  const u = users[0];
  console.log("ADMIN USER:", u.email, u.role);
  const token = jwt.sign(
    { id: u.id, company_id: COMPANY, email: u.email, role: u.role },
    SECRET,
    { expiresIn: "2h" }
  );
  const H = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const get = async (p: string) => {
    const r = await fetch(BASE + p, { headers: H });
    const t = await r.text();
    try { return JSON.parse(t); } catch { console.log("GET RAW", r.status, t); return {}; }
  };
  const post = async (p: string, body: any) => {
    const r = await fetch(BASE + p, { method: "POST", headers: H, body: JSON.stringify(body) });
    const t = await r.text();
    console.log("POST", p, "STATUS", r.status, t.slice(0, 300));
    try { return JSON.parse(t); } catch { return {}; }
  };
  const put = async (p: string, body: any) => {
    const r = await fetch(BASE + p, { method: "PUT", headers: H, body: JSON.stringify(body) });
    const t = await r.text();
    console.log("PUT", p, "STATUS", r.status, t.slice(0, 300));
    try { return JSON.parse(t); } catch { return {}; }
  };
  const del = async (p: string) => {
    const r = await fetch(BASE + p, { method: "DELETE", headers: H });
    const t = await r.text();
    console.log("DEL", p, "STATUS", r.status, t.slice(0, 300));
    try { return JSON.parse(t); } catch { return {}; }
  };

  const ts = Date.now();

  // ===== PROJECTS =====
  console.log("\n=== PROJECTS ===");
  const pCreate = await post("/projects", {
    name: `KILO_TEST_PROJECT_${ts}`,
    project_name: `KILO_TEST_PROJECT_${ts}`,
    project_type: "Residential",
    location: "Pune Test",
    city: "Pune", state: "MH", pincode: "411001",
    description: "test desc",
    flat_types: "2 BHK",
    area_sqft: 1000,
    price: 5000000,
    status: "active",
    completion_status: "Slab",
    possession_date: "2027-01-01"
  });
  console.log("CREATE:", pCreate.success, pCreate.message, pCreate.data?.id, pCreate.data?.project_name);
  const pid = pCreate.data?.id;
  const pGet = await get("/projects");
  console.log("GET has created:", pGet.data?.some((x: any) => x.id === pid));
  const pUpd = await put(`/projects/${pid}`, {
    name: `KILO_TEST_PROJECT_${ts}_EDIT`,
    project_name: `KILO_TEST_PROJECT_${ts}_EDIT`,
    status: "completed"
  });
  console.log("UPDATE:", pUpd.success, pUpd.data?.project_name, pUpd.data?.status);
  const pDel = await del(`/projects/${pid}`);
  console.log("DELETE:", pDel.success);
  const pGet2 = await get("/projects");
  console.log("GET after delete has it:", pGet2.data?.some((x: any) => x.id === pid));

  // ===== CUSTOMERS =====
  console.log("\n=== CUSTOMERS ===");
  const cCreate = await post("/customers", {
    full_name: `KILO_TEST_CUSTOMER_${ts}`,
    phone: `+919999${ts.toString().slice(-6)}`,
    email: `kilo${ts}@test.com`,
    requirement: "2 BHK",
    budget: 5000000,
    interested_location: "Pune",
    notes: "test",
    status: "active"
  });
  console.log("CREATE:", cCreate.success, cCreate.message, cCreate.data?.id, cCreate.data?.full_name);
  const cid = cCreate.data?.id;
  const cGet = await get("/customers");
  console.log("GET has created:", cGet.data?.some((x: any) => x.id === cid));
  const cUpd = await put(`/customers/${cid}`, { full_name: `KILO_TEST_CUSTOMER_${ts}_EDIT`, status: "active" });
  console.log("UPDATE:", cUpd.success, cUpd.data?.full_name);
  const cDel = await del(`/customers/${cid}`);
  console.log("DELETE:", cDel.success);
  const cGet2 = await get("/customers");
  console.log("GET after delete has it:", cGet2.data?.some((x: any) => x.id === cid));

  // ===== LEADS =====
  console.log("\n=== LEADS ===");
  const lCreate = await post("/leads", {
    name: `KILO_TEST_LEAD_${ts}`,
    phone: `+919888${ts.toString().slice(-6)}`,
    email: `lead${ts}@test.com`,
    requirement: "3 BHK",
    budget: 7000000,
    preferred_location: "Pune",
    status: "New",
    lead_source: "Website",
    assigned_to: "Agent",
    remarks: "test"
  });
  console.log("CREATE:", lCreate.success, lCreate.message, lCreate.data?.id, lCreate.data?.name);
  const lid = lCreate.data?.id;
  const lGet = await get("/leads");
  console.log("GET has created:", lGet.data?.some((x: any) => x.id === lid));
  const lUpd = await put(`/leads/${lid}`, { status: "Contacted", name: `KILO_TEST_LEAD_${ts}_EDIT` });
  console.log("UPDATE:", lUpd.success, lUpd.data?.status, lUpd.data?.name);
  const lDel = await del(`/leads/${lid}`);
  console.log("DELETE:", lDel.success);
  const lGet2 = await get("/leads");
  console.log("GET after delete has it:", lGet2.data?.some((x: any) => x.id === lid));
}

main().then(() => console.log("\nDONE")).catch((e) => console.error("ERR", e));
