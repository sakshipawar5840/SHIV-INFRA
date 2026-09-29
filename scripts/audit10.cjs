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

  for (const rt of ["FinancialSummary", "Bills", "Expenses"]) {
    const rp = await req("GET", "/api/v1/reports/generate?type=" + rt + "&format=pdf", null, auth);
    const isPdf = rp.body.slice(0, 5).toString() === "%PDF-";
    console.log("PDF type=" + rt + ":", rp.status, "contentType:", rp.headers["content-type"], "bytes:", rp.body.length, "validPDF:", isPdf);
    if (isPdf) {
      const txt = rp.body.toString("latin1");
      console.log("  pages:", (txt.match(/\/Type\s*\/Page[^s]/g) || []).length, "fonts:", txt.includes("/Font"), "streams:", (txt.match(/\/Filter/g)||[]).length);
    }
  }
})();