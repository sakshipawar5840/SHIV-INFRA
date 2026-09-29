const http = require("http");
function r(m, p, b, auth) {
  return new Promise(function(res, rej) {
    const d = b ? JSON.stringify(b) : null;
    const headers = { "Content-Type": "application/json" };
    if (auth) headers["Authorization"] = auth;
    const opts = { hostname: "localhost", port: 3000, path: p, method: m, headers: headers };
    const req = http.request(opts, function(s) {
      let buf = "";
      s.on("data", function(c) { buf += c; });
      s.on("end", function() { res({ status: s.statusCode, body: buf }); });
    });
    req.on("error", rej);
    if (d) req.write(d);
    req.end();
  });
}
(async function() {
  const login = await r("POST", "/api/v1/auth/login", { email: "verify-admin@shivinfra.com", password: "VerifyAdmin_2026!" });
  const token = login.status === 200 ? JSON.parse(login.body).token : null;
  if (!token) { console.log("NO TOKEN"); return; }
  const auth = "Bearer " + token;
  const ts = Date.now().toString();
  const gp = await r("GET", "/api/v1/projects", null, auth);
  const pList = JSON.parse(gp.body).data || [];
  const realProj = pList.find(function(p) { return p.id; });
  console.log("real project id:", realProj ? realProj.id : "none");
  console.log("\n=== SITE VISIT (real project_id) ===");
  const svPayload = { project_id: realProj ? realProj.id : null, visit_date: "2026-09-28T10:00:00Z", notes: "audit visit real project" };
  const csv = await r("POST", "/api/v1/site-visits", svPayload, auth);
  console.log("POST site-visit:", csv.status, csv.body.slice(0, 250));
  console.log("\n=== INVENTORY columns ===");
  const gi = await r("GET", "/api/v1/inventory", null, auth);
  const invData = JSON.parse(gi.body).data || [];
  if (invData.length > 0) console.log("inventory keys:", Object.keys(invData[0]).join(", "));
  const invTests = [
    { material_name: "SEC-AUDIT-MAT-" + ts, quantity: 100, unit: "TONS", minimum_stock: 10, price: 50000 },
    { material_name: "SEC-AUDIT-MAT-B-" + ts, quantity: 100, unit: "TONS", minimum_stock: 10 },
    { material_name: "SEC-AUDIT-MAT-C-" + ts, quantity: 100, unit: "TONS" },
    { material_name: "SEC-AUDIT-MAT-D-" + ts },
  ];
  for (const payload of invTests) {
    const ci = await r("POST", "/api/v1/inventory", payload, auth);
    console.log("POST inv", JSON.stringify(payload).slice(0, 50), "=>", ci.status, ci.body.slice(0, 100));
  }
  console.log("\n=== SETTINGS routes ===");
  for (const m of ["GET", "POST", "PUT", "PATCH"]) {
    const rr = await r(m, "/api/v1/settings", m === "GET" ? null : { key: "k", value: "v" }, auth);
    console.log(m, "/settings:", rr.status, rr.body.slice(0, 70));
  }
  console.log("\n=== REPORTS ===");
  const grr = await r("GET", "/api/v1/reports", null, auth);
  console.log("GET reports:", grr.status, grr.body.slice(0, 150));
})();