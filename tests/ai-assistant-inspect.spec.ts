import { chromium } from "playwright";
import http from "http";

const BASE = "http://localhost:3000";

function makeRequest(path: string, method: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
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

async function waitForServer(url: string, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const r = await fetch(url); if (r.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("not ready");
}

async function run() {
  await waitForServer(BASE);
  const ts = Date.now();
  const email = `ai-test-${ts}@shivinfra.com`;
  const password = "AITest123!";
  await makeRequest("/api/v1/auth/register", "POST", {
    company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
    name: "AI Tester", email, password,
    phone: "91" + String(ts).slice(-8),
    role: "Admin",
  });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 30000 });
  await page.evaluate((e) => localStorage.setItem("admin_email", JSON.stringify(e)), email);
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.locator('input[type="password"]').fill(password);
  await page.click('button[type="submit"]');
  await page.waitForSelector("text=Enterprise Dashboard", { timeout: 15000 });

  // Navigate to AI Assistant
  await page.locator('aside button:has-text("AI Assistant")').first().click();
  await page.waitForTimeout(3000);

  // Capture all visible text
  const bodyText = await page.locator("body").innerText();
  console.log("=== AI ASSISTANT VISIBLE TEXT ===");
  console.log(bodyText.slice(0, 3000));
  console.log("=== END ===");

  // Check for problematic strings
  const found: string[] = [];
  for (const s of ["svg", "PART 1", "PART 2", "PART 3", "PART 4", "CHAT WINDOW", "INPUT + FOOTER"]) {
    if (bodyText.includes(s)) found.push(s);
  }
  console.log("\nProblematic strings found:", found);

  // Check for icons
  const svgCount = await page.locator("svg").count();
  console.log("SVG icons on page:", svgCount);

  // Test send
  const input = page.locator('input[placeholder*="Ask SHIVINFRA AI"]');
  console.log("Input exists:", (await input.count()) > 0);

  // Console errors
  console.log("\nConsole errors:", consoleErrors.length);
  consoleErrors.slice(0, 5).forEach((e) => console.log("  -", e.slice(0, 150)));

  await browser.close();
  process.exit(0);
}

run().catch((e) => { console.error("FATAL:", e); process.exit(1); });
