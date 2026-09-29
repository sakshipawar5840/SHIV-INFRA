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

  const tests = [
    ["What is RCC?", null],
    ["Show projects", null],
    ["Search project Green Valley", null],
    ["Add customer", null],
    ["Add site visit", null],
    ["Add project", null],
    ["Add task", null],
    ["Add expense", null],
    ["Add bill", null],
    ["Delete project", null],
    ["What is RERA?", null],
    ["What is carpet area?", null],
  ];
  for (const [msg, _] of tests) {
    const rr = await r("POST", "/api/v1/ai/chat", { message: msg, channel: "DASHBOARD" }, auth);
    let parsed = null;
    try { parsed = JSON.parse(rr.body); } catch (e) { parsed = null; }
    const intent = parsed && parsed.intent ? parsed.intent.name : (parsed && parsed.action ? parsed.action : "n/a");
    const resp = parsed && parsed.response ? parsed.response.slice(0, 80) : rr.body.slice(0, 80);
    console.log("AI [" + msg + "] =>", rr.status, "intent:", intent, "| resp:", resp);
  }

  console.log("\n=== AI health/status ===");
  for (const p of ["/api/v1/ai/health", "/api/v1/ai/status", "/api/v1/ai/gemini-status"]) {
    const rr = await r("GET", p, null, auth);
    console.log("GET", p, ":", rr.status, rr.body.slice(0, 100));
  }
})();