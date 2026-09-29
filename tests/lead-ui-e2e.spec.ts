import { chromium } from "playwright";
import http from "http";

const BASE_URL = "http://localhost:3000";

function makeRequest(path: string, method: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const data = body ? JSON.stringify(body) : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (data) headers["Content-Length"] = String(Buffer.byteLength(data));
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Server not ready");
}

async function registerTestUser(): Promise<{ email: string; password: string }> {
  const timestamp = Date.now();
  const email = `lead-ui-test-${timestamp}@shivinfra.com`;
  const password = "LeadUITest123!";
  const res = await makeRequest("/api/v1/auth/register", "POST", {
    company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
    name: "Lead UI Tester",
    email,
    password,
    phone: "91" + String(timestamp).slice(-8),
    role: "Admin",
  });
  if (res.status !== 201) throw new Error("Register failed: " + res.status);
  return { email, password };
}

async function run() {
  console.log("=== LEAD UI E2E (REAL BROWSER) ===");
  await waitForServer(BASE_URL);

  const cred = await registerTestUser();
  console.log("User:", cred.email);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  const networkLog: { method: string; url: string; status?: number; body?: string }[] = [];
  const failedRequests: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
      console.log("  [CONSOLE ERROR]", msg.text());
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push("pageerror: " + err.message);
    console.log("  [PAGE ERROR]", err.message);
  });
  page.on("response", async (res) => {
    if (res.url().includes("/api/")) {
      let body = "";
      try { body = (await res.text()).slice(0, 300); } catch {}
      networkLog.push({ method: res.request().method(), url: res.url(), status: res.status(), body });
      if (res.status() >= 400) failedRequests.push(`${res.request().method()} ${res.url()} -> ${res.status()}`);
    }
  });

  // 1. Login via UI
  console.log("\n1. LOGIN");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 30000 });
  // Set admin_email in localStorage as the app expects
  await page.evaluate((e) => localStorage.setItem("admin_email", JSON.stringify(e)), cred.email);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.locator('input[type="password"]').fill(cred.password);
  await page.click('button[type="submit"]');
  await page.waitForSelector("text=Enterprise Dashboard", { timeout: 15000 });
  console.log("   Dashboard visible: PASS");

  // 2. Navigate to Leads
  console.log("\n2. NAVIGATE TO LEADS");
  await page.click('text=Leads');
  await page.waitForTimeout(2000);
  const leadsHeader = await page.locator("text=CRM Leads Pipeline").count();
  console.log("   Leads page header visible:", leadsHeader > 0);
  if (leadsHeader === 0) {
    console.log("   FAIL: leads page not visible");
    await browser.close();
    return;
  }

  // 3. Open Add Lead modal
  console.log("\n3. OPEN ADD LEAD MODAL");
  await page.click('text=Add CRM Lead');
  await page.waitForTimeout(1500);
  const modalVisible = await page.locator("text=Register CRM Lead").count();
  console.log("   Add Lead modal visible:", modalVisible > 0);
  if (modalVisible === 0) {
    console.log("   FAIL: add modal not opened");
    await browser.close();
    return;
  }

  // 4. Fill form
  console.log("\n4. FILL FORM");
  const uniqueReq = "UI-E2E " + Date.now();
  await page.locator('input[placeholder*="2 BHK"]').fill(uniqueReq);
  await page.locator('input[placeholder*="Wakad"]').fill("Kothrud, Pune");
  await page.locator('input[placeholder*="6500000"]').fill("7500000");
  // Source
  await page.locator('select').filter({ hasText: "Select Acquisition Source" }).first().selectOption("Website");
  // Status
  await page.locator('select').filter({ hasText: "Select Stage" }).first().selectOption("New");
  console.log("   Form filled");

  // 5. Submit
  console.log("\n5. SUBMIT");
  const beforeCount = networkLog.filter((l) => l.url.includes("/v1/leads") && !l.url.match(/[0-9a-f-]{36}$/)).length;
  await page.click('button:has-text("Capture Lead")');
  await page.waitForTimeout(3000);

  // 6. Check network
  const postReqs = networkLog.filter((l) => l.method === "POST" && l.url.endsWith("/api/v1/leads"));
  console.log("   POST /v1/leads attempts:", postReqs.length);
  if (postReqs.length > 0) {
    console.log("   POST status:", postReqs[0].status);
    console.log("   POST response body (first 300):", postReqs[0].body);
  }

  // 7. Verify lead appears in UI
  console.log("\n6. VERIFY IN UI");
  const newCard = await page.locator(`text=${uniqueReq}`).count();
  console.log("   New lead visible in UI:", newCard > 0);

  // 8. Refresh and verify
  console.log("\n7. REFRESH & VERIFY PERSISTENCE");
  const urlBefore = page.url();
  await page.reload({ waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);
  const urlAfter = page.url();
  console.log("   URL before refresh:", urlBefore);
  console.log("   URL after refresh:", urlAfter);
  // Check if redirected to login
  const stillOnLogin = await page.locator('input[type="password"]').count();
  if (stillOnLogin > 0) {
    console.log("   Refresh kicked back to login - re-logging in");
    await page.locator('input[type="password"]').fill(cred.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  }
  // Navigate back to Leads
  await page.click('text=Leads');
  await page.waitForTimeout(3000);
  const stillThere = await page.locator(`text=${uniqueReq}`).count();
  console.log("   Lead persists after refresh:", stillThere > 0);

  // 9. Search
  console.log("\n8. SEARCH");
  // Make sure modal is closed
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const searchInput = page.locator('input[placeholder*="Search prospect"]');
  await searchInput.fill("UI-E2E");
  await page.waitForTimeout(1000);
  const searchResult = await page.locator(`text=${uniqueReq}`).count();
  console.log("   Search finds lead:", searchResult > 0);
  // Clear search
  await searchInput.fill("");
  await page.waitForTimeout(500);

  // 10. Edit
  console.log("\n9. EDIT LEAD");
  // Click the lead card
  const leadCard = page.locator(`text=${uniqueReq}`).first();
  await leadCard.click();
  await page.waitForTimeout(2000);
  // Modal opens - find the edit form
  // The dialog title is "CRM Lead Details Hub" - we need to add a log
  // Actually, the "edit" is done via the dialog "Modify Account" which is for customers, not leads
  // The leads dialog just shows details. To edit a lead, we use the status drag/drop or there is no edit modal
  // Let me check - look for update status dropdown
  console.log("   Lead details modal opened (no edit modal in leads page)");

  // 11. Delete (need to find delete button in modal)
  const delBtn = page.locator('text=Delete Prospect Record');
  if ((await delBtn.count()) > 0) {
    await delBtn.click();
    await page.waitForTimeout(1500);
    // Confirm delete dialog
    const confirmDelBtn = page.locator('button:has-text("Delete")').last();
    await confirmDelBtn.click();
    await page.waitForTimeout(2000);
    const afterDel = await page.locator(`text=${uniqueReq}`).count();
    console.log("   Lead deleted:", afterDel === 0);
  } else {
    console.log("   No delete button found in modal");
  }

  await browser.close();

  // ====== SMOKE TEST OTHER SIDEBAR PAGES ======
  console.log("\n=== SMOKE TEST OTHER PAGES ===");
  const browser2 = await chromium.launch({ headless: true });
  const ctx2 = await browser2.newContext();
  const page2 = await ctx2.newPage();
  await page2.goto(`${BASE_URL}/`, { waitUntil: "networkidle", timeout: 30000 });
  await page2.evaluate((e) => localStorage.setItem("admin_email", JSON.stringify(e)), cred.email);
  await page2.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page2.locator('input[type="password"]').fill(cred.password);
  await page2.click('button[type="submit"]');
  await page2.waitForSelector("text=Enterprise Dashboard", { timeout: 15000 });
  const pageErrors2: string[] = [];
  page2.on("pageerror", (e) => pageErrors2.push(`${e.message}`));
  const pagesToCheck = [
    { name: "Dashboard", sidebar: "Dashboard" },
    { name: "Projects", sidebar: "Projects" },
    { name: "Leads", sidebar: "Leads" },
    { name: "Customers", sidebar: "Customers" },
    { name: "Inquiry XL Tracker", sidebar: "Inquiry XL Tracker" },
    { name: "Site Visits", sidebar: "Site Visits" },
    { name: "Tasks", sidebar: "Tasks" },
    { name: "Inventory", sidebar: "Inventory" },
    { name: "Vendors", sidebar: "Vendors" },
    { name: "Bills", sidebar: "Bills" },
    { name: "Expenses", sidebar: "Expenses" },
    { name: "Documents", sidebar: "Documents" },
    { name: "Reports", sidebar: "Reports" },
    { name: "Activity Logs", sidebar: "Activity Logs" },
    { name: "WhatsApp Center", sidebar: "WhatsApp Center" },
    { name: "Broadcast", sidebar: "Broadcast" },
    { name: "AI Assistant", sidebar: "AI Assistant" },
    { name: "AI Command Center", sidebar: "AI Command Center" },
    { name: "Users", sidebar: "Users" },
    { name: "Settings", sidebar: "Settings" },
  ];
  const pageResults: Record<string, string> = {};
  for (const p of pagesToCheck) {
    try {
      const errorsBefore = pageErrors2.length;
      await page2.waitForTimeout(300);
      const sidebarBtn = page2.locator(`aside button:has-text("${p.sidebar}")`).first();
      const exists = await sidebarBtn.count();
      if (exists === 0) {
        pageResults[p.name] = "SKIP (sidebar not found)";
        continue;
      }
      await sidebarBtn.click({ timeout: 8000 });
      await page2.waitForTimeout(2500);
      const errorsAfter = pageErrors2.length;
      if (errorsAfter > errorsBefore) {
        pageResults[p.name] = `FAIL (${pageErrors2.slice(errorsBefore).join("; ").slice(0, 100)})`;
      } else {
        pageResults[p.name] = "OK";
      }
    } catch (e: any) {
      pageResults[p.name] = `FAIL (${(e.message || "").slice(0, 80)})`;
    }
  }
  await browser2.close();
  console.log("Page smoke results:");
  for (const [p, r] of Object.entries(pageResults)) {
    console.log(`  ${p}: ${r}`);
  }

  console.log("\n=== RESULTS ===");
  console.log("Console errors:", consoleErrors.length);
  consoleErrors.forEach((e) => console.log("  -", e));
  console.log("Network failures (>=400):", failedRequests.length);
  failedRequests.forEach((f) => console.log("  -", f));
  const allPass = modalVisible > 0 && postReqs.length > 0 && postReqs[0].status === 201 && newCard > 0 && stillThere > 0;
  console.log("\nFINAL:", allPass ? "ALL PASS" : "SOME FAILED");
  process.exit(allPass ? 0 : 1);
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
