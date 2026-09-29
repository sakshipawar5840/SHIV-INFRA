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

  console.log("\n=== SITE VISIT (project_id UUID) ===");
  const gp = await r("GET", "/api/v1/projects?query=SEC-AUDIT-PROJECT", null, a);
  const pList = JSON.parse(gp.body).data || [];
  const proj = pList.find(p => p.project_name && p.project_name.indexOf("SEC-AUDIT-PROJECT") >= 0);
  console.log("found SEC-AUDIT project:", !!proj, proj ? proj.id : "none");
  const svPayload = { project_id: proj ? proj.id : null, visit_date: "2026-09-28T10:00:00Z", notes: "audit visit with real project_id" };
  const csv = await r("POST", "/api/v1/site-visits", svPayload, a);
  console.log("POST site-visit:", csv.status, csv.body.slice(0, 200));

  console.log("\n=== BILLS ===");
  const gb = await r("GET", "/api/v1/bills", null, a);
  console.log("GET bills:", gb.status, JSON.parse(gb.body).count);
  const cb = await r("POST", "/api/v1/bills", { bill_number: "BILL-" + ts, vendor_name: "Audit Vendor", material_name: "Steel", amount: 1000, bill_date: "2026-09-28", payment_status: "Pending" }, a);
  console.log("POST bill:", cb.status, cb.body.slice(0, 200));

  console.log("\n=== EXPENSES ===");
  const ge = await r("GET", "/api/v1/expenses", null, a);
  console.log("GET expenses:", ge.status, JSON.parse(ge.body).count);
  const ce = await r("POST", "/api/v1/expenses", { expense_date: "2026-09-28", amount: 500, category: "Materials", description: "audit expense" }, a);
  console.log("POST expense:", ce.status, ce.body.slice(0, 200));

  console.log("\n=== TASKS ===");
  const gt = await r("GET", "/api/v1/tasks", null, a);
  console.log("GET tasks:", gt.status, gt.body.slice(0, 150));
  const ct = await r("POST", "/api/v1/tasks", { title: "SEC-AUDIT-TASK-" + ts, description: "audit", status: "Pending", priority: "Medium" }, a);
  console.log("POST task:", ct.status, ct.body.slice(0, 200));

  console.log("\n=== INVENTORY ===");
  const gi = await r("GET", "/api/v1/inventory", null, a);
  console.log("GET inventory:", gi.status, gi.body.slice(0, 150));
  const ci = await r("POST", "/api/v1/inventory", { material_name: "SEC-AUDIT-MAT-" + ts, quantity: 100, unit: "TONS", minimum_stock: 10, price: 50000 }, a);
  console.log("POST inventory:", ci.status, ci.body.slice(0, 200));

  console.log("\n=== VENDORS ===");
  const gv = await r("GET", "/api/v1/vendors", null, a);
  console.log("GET vendors:", gv.status, gv.body.slice(0, 150));
  const cv = await r("POST", "/api/v1/vendors", { vendor_name: "SEC-AUDIT-VENDOR-" + ts, contact_person: "Audit", phone: "919999000001", email: "v" + ts + "@test.com" }, a);
  console.log("POST vendor:", cv.status, cv.body.slice(0, 200));

  console.log("\n=== DOCUMENTS ===");
  const gd2 = await r("GET", "/api/v1/documents", null, a);
  console.log("GET documents:", gd2.status, gd2.body.slice(0, 150));

  console.log("\n=== USERS ===");
  const gu = await r("GET", "/api/v1/users", null, a);
  console.log("GET users:", gu.status, gu.body.slice(0, 150));
})();