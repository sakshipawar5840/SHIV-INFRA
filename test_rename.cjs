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
  const token = JSON.parse(login.body).token;
  const a = { Authorization: "Bearer " + token };
  const T = "RENAME-TEST-" + Date.now();

  // 1. Create test project
  const c = await r("POST", "/api/v1/projects", { project_name: T + " Original", location: "Wakad", flat_type: "2BHK", sqft: "1000", price: 6000000, status: "Planning", description: "test", progress: 0, completion_status: "Foundation", possession_date: "2026-12-31" }, a);
  const projId = JSON.parse(c.body).data?.id;
  console.log("CREATE:", c.status, projId);

  // 2. Admin UI PUT with project_name change
  const put = await r("PUT", `/api/v1/projects/${projId}`, { project_name: T + " Renamed", location: "Wakad", flat_type: "2BHK", sqft: "1000", price: 6000000, status: "Planning", description: "test", progress: 0, completion_status: "Foundation", possession_date: "2026-12-31" }, a);
  console.log("PUT (rename):", put.status, put.body.slice(0, 100));

  // 3. Verify Supabase value
  const g = await r("GET", `/api/v1/projects/${projId}`, null, a);
  const p = JSON.parse(g.body).data;
  console.log("RELOAD name:", p?.project_name);
  console.log("PERSIST:", p?.project_name === T + " Renamed" ? "PASS" : "FAIL");

  // 4. Verify another project not changed
  const all = await r("GET", "/api/v1/projects", null, a);
  const list = JSON.parse(all.body).data || [];
  const others = list.filter(x => x.id !== projId && x.project_name?.includes(T));
  console.log("OTHER TEST PROJECTS:", others.length, "should be 0");

  // 5. AI path (id=null) - project_name should be ignored
  const ai = await r("POST", "/api/v1/ai/update-project", { project_id: projId, project_name: T + " AI-GARBAGE", price: 7000000 }, a);
  console.log("AI update:", ai.status, ai.body.slice(0, 120));

  // 6. Verify AI did NOT change name
  const g2 = await r("GET", `/api/v1/projects/${projId}`, null, a);
  const p2 = JSON.parse(g2.body).data;
  console.log("AI name unchanged:", p2?.project_name === T + " Renamed" ? "PASS" : "FAIL");
  console.log("AI price changed:", p2?.price === 7000000 ? "PASS" : "FAIL");

  // 7. Cleanup
  await r("DELETE", `/api/v1/projects/${projId}`, null, a);
  console.log("CLEANED");
  process.exit(0);
})().catch(e => { console.error("ERR", e); process.exit(1); });