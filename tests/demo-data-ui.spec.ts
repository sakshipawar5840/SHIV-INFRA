import { test, expect } from "@playwright/test";
import http from "http";

const BASE_URL = "http://localhost:3000";

function makeRequest(path: string, method: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const data = body ? JSON.stringify(body) : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (data) headers["Content-Length"] = String(Buffer.byteLength(data));
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

async function registerTestUser(): Promise<{ email: string; password: string }> {
  const timestamp = Date.now();
  const email = `demo-ui-test-${timestamp}@shivinfra.com`;
  const password = "DemoUITest123!";
  const res = await makeRequest("/api/v1/auth/register", "POST", {
    company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
    name: "Demo UI Tester",
    email,
    password,
    phone: "91" + String(timestamp).slice(-8),
    role: "Admin",
  });
  if (res.status !== 201) throw new Error("Register failed: " + res.status);
  return { email, password };
}

test("demo data appears across pages", async ({ page }) => {
  const errors: string[] = [];
  const failures: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  page.on("response", (res) => {
    if (res.url().includes("/api/") && res.status() >= 500) {
      failures.push(`${res.request().method()} ${res.url()} -> ${res.status()}`);
    }
  });

  const cred = await registerTestUser();
  console.log("Test user:", cred.email);

  await page.goto(`${BASE_URL}/`);
  await page.evaluate((e) => localStorage.setItem("admin_email", JSON.stringify(e)), cred.email);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.locator('input[type="password"]').fill(cred.password);
  await page.click('button[type="submit"]');
  await page.waitForSelector("text=Enterprise Dashboard", { timeout: 15000 });
  console.log("OK logged in");

  const pages: { path: string; expectText: string }[] = [
    { path: "/projects", expectText: "DEMO Skyline Towers" },
    { path: "/leads", expectText: "DEMO" },
    { path: "/customers", expectText: "DEMO" },
    { path: "/bills", expectText: "DEMO" },
    { path: "/expenses", expectText: "DEMO" },
    { path: "/activity-logs", expectText: "DEMO" },
  ];

  for (const p of pages) {
    await page.goto(`${BASE_URL}${p.path}`, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2500);
    const bodyText = await page.locator("body").innerText();
    const hasText = bodyText.includes(p.expectText);
    console.log(`  ${p.path}: ${hasText ? "OK demo data visible" : "MISS"}`);
    if (!hasText) {
      console.log(`  body snippet: ${bodyText.slice(0, 300)}`);
      await page.screenshot({ path: `test-results/miss-${p.path.replace(/\//g, "_")}.png`, fullPage: false });
    }
    expect(hasText, `Expected demo data on ${p.path}`).toBe(true);
  }

  expect(errors.length, `Console errors:\n${errors.join("\n")}`).toBe(0);
  expect(failures.length, `Failed requests:\n${failures.join("\n")}`).toBe(0);
});
