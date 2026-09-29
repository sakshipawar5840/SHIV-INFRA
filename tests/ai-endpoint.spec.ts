import { chromium } from "playwright";
import http from "http";

const BASE = "http://localhost:3000";

function makeRequest(path: string, method: string, body?: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const data = body ? JSON.stringify(body) : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (data) headers["Content-Length"] = String(Buffer.byteLength(data));
    if (token) headers.Authorization = `Bearer ${token}`;
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
  console.log("=== AI ENDPOINT TESTS (auth, no Gemini quota needed) ===");
  await waitForServer(BASE);
  const ts = Date.now();
  const email = `ai-endpoint-${ts}@shivinfra.com`;
  const password = "AITest123!";
  await makeRequest("/api/v1/auth/register", "POST", {
    company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
    name: "AI Endpoint Tester", email, password,
    phone: "91" + String(ts).slice(-8),
    role: "Admin",
  });

  const login = await makeRequest("/api/v1/auth/login", "POST", { email, password });
  if (!login.data?.token) { console.log("LOGIN FAIL"); process.exit(1); }
  const token = login.data.token;
  console.log("Login OK, token length:", token.length);

  // 1. Test AI gemini-status
  const status = await makeRequest("/api/v1/ai/gemini-status", "GET", null, token);
  console.log("GET /ai/gemini-status:", status.status, status.data.success ? "OK" : "FAIL");
  if (status.data?.ai) {
    console.log("  activeProvider:", status.data.ai.activeProvider);
    console.log("  gemini.degradedMode:", status.data.ai.gemini?.degradedMode);
    console.log("  gemini.callsToday:", status.data.ai.gemini?.callsToday);
  }

  // 2. Test AI chat with simple message
  const chat = await makeRequest("/api/v1/ai/chat", "POST", {
    message: "show projects",
    session_id: "test_" + ts,
    channel: "WEB"
  }, token);
  console.log("\nPOST /ai/chat:", chat.status, chat.data?.success ? "OK" : "FAIL");
  if (chat.data) {
    console.log("  response (first 200):", String(chat.data.response || chat.data.message || "").slice(0, 200));
    console.log("  intent:", chat.data.intent?.intent);
  }

  // 3. Test AI status
  const aiStatus = await makeRequest("/api/v1/ai/status", "GET", null, token);
  console.log("\nGET /ai/status:", aiStatus.status, aiStatus.data?.success ? "OK" : "FAIL");

  process.exit(0);
}

run().catch((e) => { console.error("FATAL:", e); process.exit(1); });
