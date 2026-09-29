const http = require("http");
function r(m, p, b, x) {
  return new Promise((res, rej) => {
    const d = b ? JSON.stringify(b) : null;
    const req = http.request({ hostname: "localhost", port: 3000, path: p, method: m, headers: { "Content-Type": "application/json", ...(x || {}) } }, s => {
      let buf = ""; s.on("data", c => buf += c); s.on("end", () => res({ status: s.statusCode, body: buf }));
    });
    req.on("error", rej); if (d) req.write(d); req.end();
  });
}
(async () => {
  const login = await r("POST", "/api/v1/auth/login", { email: "verify-admin@shivinfra.com", password: "VerifyAdmin_2026!" });
  console.log("LOGIN:", login.status);
  const token = login.status === 200 ? JSON.parse(login.body).token : null;
  if (!token) { console.log("NO TOKEN"); return; }
  const a = { Authorization: "Bearer " + token };
  const ts = Date.now().toString();
  console.log("\n=== LEADS ===");
  const gl = await r("GET", "/api/v1/leads", null, a);
  console.log("GET leads:", gl.status, JSON.parse(gl.body).count);
  const leadPayload = { name: "SEC-AUDIT-LEAD-" + ts, phone: "919999" + ts.slice(-8), email: "lead" + ts + "@test.com", requirement: "2BHK", status: "New", source: "Audit", location: "Pune", budget: "80 Lakhs", notes: "audit test" };
  const cl = await r("POST", "/api/v1/leads", leadPayload, a);
  console.log("POST lead:", cl.status, cl.body.slice(0, 200));
  console.log("\n=== SITE VISITS ===");
  const gsv = await r("GET", "/api/v1/site-visits", null, a);
  console.log("GET site-visits:", gsv.status, gsv.body.slice(0, 150));
  const svPayload = { customer_name: "SEC-AUDIT-CUSTOMER-" + ts, phone: "918888" + ts.slice(-7), project_name: "SEC-AUDIT-PROJECT-" + ts, visit_date: "2026-09-28", visit_time: "10:00", notes: "audit visit" };
  const csv = await r("POST", "/api/v1/site-visits", svPayload, a);
  console.log("POST site-visit:", csv.status, csv.body.slice(0, 200));
  console.log("\n=== CUSTOMERS ===");
  const gc = await r("GET", "/api/v1/customers", null, a);
  console.log("GET customers:", gc.status, JSON.parse(gc.body).count);
  const custPayload = { full_name: "SEC-AUDIT-CUSTOMER-" + ts, phone: "917777" + ts.slice(-7), email: "cust" + ts + "@test.com", address: "Pune", city: "Pune", status: "New", notes: "audit" };
  const cc = await r("POST", "/api/v1/customers", custPayload, a);
  console.log("POST customer:", cc.status, cc.body.slice(0, 200));
  console.log("\n=== DASHBOARD ===");
  const gd = await r("GET", "/api/v1/dashboard", null, a);
  console.log("GET dashboard:", gd.status, gd.body.slice(0, 300));
  console.log("\n=== SETTINGS ===");
  const gset = await r("GET", "/api/v1/settings", null, a);
  console.log("GET settings:", gset.status, gset.body.slice(0, 200));
  const cset = await r("POST", "/api/v1/settings", { key: "test_setting_" + ts, value: "audit_value" }, a);
  console.log("POST settings:", cset.status, cset.body.slice(0, 200));
})();