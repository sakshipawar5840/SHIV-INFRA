const http = require("http");
const fs = require("fs");

function req(m, p, body, auth) {
  return new Promise(function(res, rej) {
    const data = body ? JSON.stringify(body) : null;
    const headers = {};
    if (data) headers["Content-Type"] = "application/json";
    if (auth) headers["Authorization"] = auth;
    const options = { hostname: "localhost", port: 3000, path: p, method: m, headers: headers };
    const r = http.request(options, function(s) {
      const chunks = [];
      s.on("data", function(c) { chunks.push(c); });
      s.on("end", function() {
        const buf = Buffer.concat(chunks);
        res({ status: s.statusCode, headers: s.headers, body: buf });
      });
    });
    r.on("error", rej);
    if (data) r.write(data);
    r.end();
  });
}

(async function() {
  const login = await req("POST", "/api/v1/auth/login", { email: "verify-admin@shivinfra.com", password: "VerifyAdmin_2026!" }, null);
  const token = login.status === 200 ? JSON.parse(login.body.toString()).token : null;
  if (!token) { console.log("NO TOKEN"); return; }
  const auth = "Bearer " + token;

  console.log("\n=== REPORT PDF ===");
  const rp = await req("GET", "/api/v1/reports/generate?reportType=Project_Report&format=pdf", null, auth);
  console.log("status:", rp.status, "contentType:", rp.headers["content-type"], "bytes:", rp.body.length);
  console.log("valid PDF header:", rp.body.slice(0, 5).toString() === "%PDF-");

  console.log("\n=== REPORTS GET ===");
  for (const p of ["/api/v1/reports/financial-summary", "/api/v1/reports/bills", "/api/v1/reports/expenses"]) {
    const rr = await req("GET", p, null, auth);
    console.log("GET", p, ":", rr.status, rr.body.toString().slice(0, 70));
  }

  console.log("\n=== BILLS ===");
  const gb = await req("GET", "/api/v1/bills", null, auth);
  const bills = JSON.parse(gb.body.toString()).data || [];
  console.log("bills count:", bills.length);
  if (bills.length) {
    const bid = bills[0].id;
    for (const p of ["/api/v1/bills/" + bid + "/pdf", "/api/v1/bills/" + bid + "/download"]) {
      const bp = await req("GET", p, null, auth);
      console.log("GET", p, ":", bp.status, bp.body.toString().slice(0, 70));
    }
  }

  console.log("\n=== BROADCAST ===");
  for (const p of ["/api/v1/broadcast", "/api/v1/broadcasts"]) {
    const br = await req("GET", p, null, auth);
    console.log("GET", p, ":", br.status, br.body.toString().slice(0, 70));
  }
  const cb = await req("POST", "/api/v1/broadcast", { message: "SEC-AUDIT-BROADCAST-" + Date.now(), audience: "all" }, auth);
  console.log("POST broadcast:", cb.status, cb.body.toString().slice(0, 120));

  console.log("\n=== WHATSAPP CENTER ===");
  for (const p of ["/api/v1/whatsapp/config", "/api/v1/whatsapp/status", "/api/v1/whatsapp/messages"]) {
    const ww = await req("GET", p, null, auth);
    console.log("GET", p, ":", ww.status, ww.body.toString().slice(0, 70));
  }
})();