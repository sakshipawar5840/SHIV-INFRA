import { test, expect } from "@playwright/test";
import http from "http";

const BASE_URL = "http://localhost:3000";

function makeRequest(path: string, method: string, body?: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const data = body ? JSON.stringify(body) : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (data) headers["Content-Length"] = String(Buffer.byteLength(data));
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const req = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers },
      (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
          catch { resolve({ status: res.statusCode, data: body }); }
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

test("demo data is readable via API", async () => {
  // Register a fresh test user (avoids hardcoded passwords)
  const timestamp = Date.now();
  const email = `demo-api-test-${timestamp}@shivinfra.com`;
  const password = "DemoApiTest123!";
  const regRes = await makeRequest("/api/v1/auth/register", "POST", {
    company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
    name: "Demo API Tester",
    email,
    password,
    phone: "91" + String(timestamp).slice(-8),
    role: "Admin",
  });
  expect(regRes.status, `Register failed: ${JSON.stringify(regRes.data)}`).toBe(201);

  // Login with the new user
  const loginRes = await makeRequest("/api/v1/auth/login", "POST", { email, password });
  expect(loginRes.status, `Login failed: ${JSON.stringify(loginRes.data)}`).toBe(200);
  const token = loginRes.data?.data?.token ?? loginRes.data?.token;
  expect(token, "Token missing").toBeTruthy();

  // Verify DEMO projects visible
  const projRes = await makeRequest("/api/v1/projects", "GET", undefined, token);
  expect(projRes.status).toBe(200);
  const projects = projRes.data?.data ?? [];
  const demoProjects = projects.filter((p: any) => p.project_name?.startsWith("DEMO "));
  console.log(`  Projects: ${projects.length} total, ${demoProjects.length} DEMO`);
  expect(demoProjects.length).toBeGreaterThanOrEqual(4);

  // Verify DEMO customers
  const custRes = await makeRequest("/api/v1/customers", "GET", undefined, token);
  expect(custRes.status).toBe(200);
  const customers = custRes.data?.data ?? [];
  const demoCustomers = customers.filter((c: any) => c.full_name?.startsWith("DEMO "));
  console.log(`  Customers: ${customers.length} total, ${demoCustomers.length} DEMO`);
  expect(demoCustomers.length).toBeGreaterThanOrEqual(5);

  // Verify DEMO leads
  const leadRes = await makeRequest("/api/v1/leads", "GET", undefined, token);
  expect(leadRes.status).toBe(200);
  const leads = leadRes.data?.data ?? [];
  const demoLeads = leads.filter((l: any) => l.requirement?.startsWith("DEMO "));
  console.log(`  Leads: ${leads.length} total, ${demoLeads.length} DEMO`);
  expect(demoLeads.length).toBeGreaterThanOrEqual(6);

  // Verify DEMO bills
  const billRes = await makeRequest("/api/v1/bills", "GET", undefined, token);
  expect(billRes.status).toBe(200);
  const bills = billRes.data?.data ?? [];
  const demoBills = bills.filter((b: any) => b.bill_number?.startsWith("DEMO "));
  console.log(`  Bills: ${bills.length} total, ${demoBills.length} DEMO`);
  expect(demoBills.length).toBeGreaterThanOrEqual(3);

  // Verify DEMO expenses
  const expRes = await makeRequest("/api/v1/expenses", "GET", undefined, token);
  expect(expRes.status).toBe(200);
  const expenses = expRes.data?.data ?? [];
  const demoExpenses = expenses.filter((e: any) => e.title?.startsWith("DEMO "));
  console.log(`  Expenses: ${expenses.length} total, ${demoExpenses.length} DEMO`);
  expect(demoExpenses.length).toBeGreaterThanOrEqual(5);

  // Verify DEMO activity logs
  const logRes = await makeRequest("/api/v1/activity-logs", "GET", undefined, token);
  expect(logRes.status).toBe(200);
  const logs = logRes.data?.data ?? [];
  const demoLogs = logs.filter((l: any) => l.description?.startsWith("DEMO "));
  console.log(`  Activity logs: ${logs.length} total, ${demoLogs.length} DEMO`);
  expect(demoLogs.length).toBeGreaterThanOrEqual(3);

  console.log("\n  All DEMO records are visible via authenticated API");
});
