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

  for (const rt of ["Bills", "Expenses", "Financial"]) {
    const rp = await req("GET", "/api/v1/reports/generate?reportType=" + rt + "&format=pdf", null, auth);
    const isPdf = rp.body.slice(0, 5).toString() === "%PDF-";
    console.log("PDF " + rt + ":", rp.status, "contentType:", rp.headers["content-type"], "bytes:", rp.body.length, "validPDF:", isPdf);
  }

  console.log("\n=== BROADCAST routes ===");
  const br = await req("GET", "/api/v1/broadcasts", null, auth);
  console.log("GET broadcasts:", br.status, br.body.toString().slice(0, 100));
  const b2 = await req("GET", "/api/v1/broadcast/list", null, auth);
  console.log("GET broadcast/list:", b2.status, b2.body.toString().slice(0, 100));

  console.log("\n=== WHATSAPP routes ===");
  for (const p of ["/api/v1/whatsapp", "/api/v1/whatsapp/config", "/api/v1/whatsapp/status"]) {
    const ww = await req("GET", p, null, auth);
    console.log("GET", p, ":", ww.status, ww.body.toString().slice(0, 70));
  }

  console.log("\n=== USERS ===");
  const gu = await req("GET", "/api/v1/users", null, auth);
  const ud = JSON.parse(gu.body.toString());
  console.log("GET users:", gu.status, "count:", ud.count, "len:", (ud.data || []).length);
})();