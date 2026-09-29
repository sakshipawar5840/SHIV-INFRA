import http from "http";
import * as dotenv from "dotenv";
dotenv.config();

const BASE = "http://localhost:3000";

function req(path: string, method: string, body?: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const data = body ? JSON.stringify(body) : null;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (data) headers["Content-Length"] = String(Buffer.byteLength(data));
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const r = http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers }, (res) => {
      let b = "";
      res.on("data", (d) => (b += d));
      res.on("end", () => { try { resolve({ status: res.statusCode, data: JSON.parse(b) }); } catch { resolve({ status: res.statusCode, data: b }); } });
    });
    r.on("error", reject);
    if (data) r.write(data);
    r.end();
  });
}

function multipartReq(path: string, fields: Record<string, string>, fileBuffer: Buffer, fileName: string, mimeType: string, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const boundary = "----formdata-boundary-" + Date.now();
    let body = "";
    for (const [key, value] of Object.entries(fields)) {
      body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`;
    }
    body += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const prefix = Buffer.from(body, "utf-8");
    const suffix = Buffer.from(`\r\n--${boundary}--\r\n`, "utf-8");
    const fullBody = Buffer.concat([prefix, fileBuffer, suffix]);

    const headers: Record<string, string> = {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(fullBody.length),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const r = http.request({ hostname: url.hostname, port: url.port, path: url.pathname, method: "POST", headers }, (res) => {
      let b = "";
      res.on("data", (d) => (b += d));
      res.on("end", () => { try { resolve({ status: res.statusCode, data: JSON.parse(b) }); } catch { resolve({ status: res.statusCode, data: b }); } });
    });
    r.on("error", reject);
    r.write(fullBody);
    r.end();
  });
}

async function registerAndLogin(): Promise<string> {
  const ts = Date.now();
  const email = `doc-test-${ts}@shivinfra.com`;
  const password = "DocTest123!";
  await req("/api/v1/auth/register", "POST", {
    company_id: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
    name: "Doc Test",
    email,
    password,
    phone: "91" + String(ts).slice(-8),
    role: "Admin",
  });
  const lr = await req("/api/v1/auth/login", "POST", { email, password });
  return (lr.data?.data?.token ?? lr.data?.token) as string;
}

async function main() {
  const token = await registerAndLogin();
  const results: Record<string, boolean> = {};

  // Create a document via API (multipart upload)
  const pdfBuffer = Buffer.from("%PDF-1.4\n%EOF\n");
  const createRes = await multipartReq("/api/v1/documents", { document_name: "test-doc.pdf", document_type: "application/pdf" }, pdfBuffer, "test-doc.pdf", "application/pdf", token);
  results.CreateViaAPI = createRes.status === 201 && createRes.data?.success === true;
  console.log("Create via API:", results.CreateViaAPI ? "PASS" : "FAIL", createRes.status, createRes.data?.message);

  if (!results.CreateViaAPI || !createRes.data?.data?.id) {
    console.log("Cannot proceed without document ID");
    process.exit(1);
  }

  const docId = createRes.data.data.id;

  // 2. Update existing document
  const updateRes = await req(`/api/v1/documents/${docId}`, "PUT", { document_name: "updated-doc.pdf", document_type: "application/pdf" }, token);
  results.UpdateExisting = updateRes.status === 200 && updateRes.data?.success === true;
  console.log("Update existing:", results.UpdateExisting ? "PASS" : "FAIL", updateRes.status, updateRes.data?.message);

  // 3. Validation failure - no valid fields
  const emptyRes = await req(`/api/v1/documents/${docId}`, "PUT", {}, token);
  results.ValidationFailure = emptyRes.status === 400;
  console.log("Validation failure:", results.ValidationFailure ? "PASS" : "FAIL", emptyRes.status, emptyRes.data?.message);

  // 4. Nonexistent document
  const fakeId = "00000000-0000-0000-0000-000000000000";
  const notFoundRes = await req(`/api/v1/documents/${fakeId}`, "PUT", { document_name: "test" }, token);
  results.NonexistentDocument = notFoundRes.status === 404;
  console.log("Nonexistent document:", results.NonexistentDocument ? "PASS" : "FAIL", notFoundRes.status, notFoundRes.data?.message);

  // 5. Company isolation - use different company token
  const otherEmail = `doc-other-${Date.now()}@shivinfra.com`;
  await req("/api/v1/auth/register", "POST", {
    company_id: "00000000-0000-0000-0000-000000000000",
    name: "Other",
    email: otherEmail,
    password: "OtherTest123!",
    phone: "91" + String(Date.now()).slice(-8),
    role: "Admin",
  });
  const otherLogin = await req("/api/v1/auth/login", "POST", { email: otherEmail, password: "OtherTest123!" });
  const otherToken = (otherLogin.data?.data?.token ?? otherLogin.data?.token) as string;
  const isolationRes = await req(`/api/v1/documents/${docId}`, "PUT", { document_name: "hacked.pdf" }, otherToken);
  results.CompanyIsolation = isolationRes.status === 404 || isolationRes.status === 403;
  console.log("Company isolation:", results.CompanyIsolation ? "PASS" : "FAIL", isolationRes.status, isolationRes.data?.message);

  // 6. Existing CRUD regression - read and delete still work
  const readRes = await req(`/api/v1/documents/${docId}`, "GET", undefined, token);
  results.ReadStillWorks = readRes.status === 200;
  console.log("Read still works:", results.ReadStillWorks ? "PASS" : "FAIL", readRes.status);

  const delRes = await req(`/api/v1/documents/${docId}`, "DELETE", undefined, token);
  results.DeleteStillWorks = delRes.status === 200;
  console.log("Delete still works:", results.DeleteStillWorks ? "PASS" : "FAIL", delRes.status);

  console.log("\n=== RESULTS ===");
  let allPass = true;
  for (const [k, v] of Object.entries(results)) {
    console.log(`  ${k}: ${v ? "PASS" : "FAIL"}`);
    if (!v) allPass = false;
  }
  console.log(allPass ? "\nALL PASS" : "\nSOME FAILED");
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
