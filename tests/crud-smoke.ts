import http from "http";

const BASE = "http://localhost:3000";

function req(path: string, method: string, body?: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const data = body ? JSON.stringify(body) : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (data) headers["Content-Length"] = String(Buffer.byteLength(data));
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const r = http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers }, (res) => {
      let b = "";
      res.on("data", (d) => (b += d));
      res.on("end", () => { try { resolve({ status: res.statusCode, data: JSON.parse(b) }); } catch { resolve({ status: res.statusCode, data: b }); } });
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

async function login() {
  const r = await req("/api/v1/auth/login", "POST", { email: "superadmin@shivinfra.com", password: "Super@123" });
  if (r.status !== 200) throw new Error("Login failed: " + JSON.stringify(r.data));
  return r.data?.data?.token ?? r.data?.token;
}

async function main() {
  const ts = Date.now();
  const email = `crud-test-${ts}@shivinfra.com`;
  const password = "CrudTest123!";

  const reg = await req("/api/v1/auth/register", "POST", {
    company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
    name: "CRUD Tester",
    email,
    password,
    phone: "91" + String(ts).slice(-8),
    role: "Admin",
  });
  if (reg.status !== 201) throw new Error("Register failed: " + JSON.stringify(reg.data));

  const loginR = await req("/api/v1/auth/login", "POST", { email, password });
  if (loginR.status !== 200) throw new Error("Login failed: " + JSON.stringify(loginR.data));
  const token = loginR.data?.data?.token ?? loginR.data?.token;
  console.log("Login OK:", email);

  const results: Record<string, boolean> = {};

  // PROJECTS CRUD
  const proj = await req("/api/v1/projects", "POST", { project_name: `CRUD Test Project ${ts}`, project_type: "Residential", location: "Pune", city: "Pune", area_sqft: 1000, price: 5000000, status: "Planning" }, token);
  results.ProjectCreate = proj.status === 201;
  const projId = proj.data?.data?.id;
  const projRead = await req(`/api/v1/projects/${projId}`, "GET", undefined, token);
  results.ProjectRead = projRead.status === 200;
  const projUp = await req(`/api/v1/projects/${projId}`, "PUT", { status: "Ongoing" }, token);
  results.ProjectUpdate = projUp.status === 200;
  const projDel = await req(`/api/v1/projects/${projId}`, "DELETE", undefined, token);
  results.ProjectDelete = projDel.status === 200;

  // CUSTOMERS CRUD
  const cust = await req("/api/v1/customers", "POST", { full_name: `CRUD Test Customer ${ts}`, phone: `91${ts}`, email: `crud-${ts}@test.com`, budget: 5000000, status: "active" }, token);
  results.CustomerCreate = cust.status === 201;
  const custId = cust.data?.data?.id;
  const custRead = await req(`/api/v1/customers/${custId}`, "GET", undefined, token);
  results.CustomerRead = custRead.status === 200;
  const custUp = await req(`/api/v1/customers/${custId}`, "PUT", { status: "inactive" }, token);
  results.CustomerUpdate = custUp.status === 200;
  const custDel = await req(`/api/v1/customers/${custId}`, "DELETE", undefined, token);
  results.CustomerDelete = custDel.status === 200;

  // LEADS CRUD
  const lead = await req("/api/v1/leads", "POST", { requirement: `CRUD Test Lead ${ts}`, budget: 5000000, preferred_location: "Pune", status: "New", lead_source: "Website" }, token);
  results.LeadCreate = lead.status === 201;
  const leadId = lead.data?.data?.id;
  const leadRead = await req(`/api/v1/leads/${leadId}`, "GET", undefined, token);
  results.LeadRead = leadRead.status === 200;
  const leadUp = await req(`/api/v1/leads/${leadId}`, "PUT", { status: "Follow Up" }, token);
  results.LeadUpdate = leadUp.status === 200;
  const leadSearch = await req(`/api/v1/leads?q=CRUD Test Lead`, "GET", undefined, token);
  results.LeadSearch = leadSearch.status === 200 && leadSearch.data?.data?.length > 0;
  const leadDel = await req(`/api/v1/leads/${leadId}`, "DELETE", undefined, token);
  results.LeadDelete = leadDel.status === 200;

  // BILLS CRUD (create/read)
  const bill = await req("/api/v1/bills", "POST", { vendor_name: "CRUD Test Vendor", material_name: "Cement", amount: 100000, bill_number: `CRUD-BILL-${ts}`, bill_date: "2025-01-01", payment_status: "Pending" }, token);
  results.BillCreate = bill.status === 201;
  const billRead = await req(`/api/v1/bills/${bill.data?.data?.id}`, "GET", undefined, token);
  results.BillRead = billRead.status === 200;
  await req(`/api/v1/bills/${bill.data?.data?.id}`, "DELETE", undefined, token);

  // EXPENSES CRUD (create/read)
  const exp = await req("/api/v1/expenses", "POST", { title: `CRUD Test Expense ${ts}`, category: "Labour", amount: 50000, expense_date: "2025-01-01", payment_method: "Cash" }, token);
  results.ExpenseCreate = exp.status === 201;
  const expRead = await req(`/api/v1/expenses/${exp.data?.data?.id}`, "GET", undefined, token);
  results.ExpenseRead = expRead.status === 200;
  await req(`/api/v1/expenses/${exp.data?.data?.id}`, "DELETE", undefined, token);

  console.log("\n=== CRUD RESULTS ===");
  let allPass = true;
  for (const [k, v] of Object.entries(results)) {
    console.log(`  ${k}: ${v ? 'PASS' : 'FAIL'}`);
    if (!v) allPass = false;
  }
  console.log(allPass ? "\nALL CRUD PASS" : "\nSOME CRUD FAILED");
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
