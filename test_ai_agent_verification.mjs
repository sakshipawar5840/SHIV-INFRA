import http from "http";

const SERVER_HOST = "127.0.0.1";
const SERVER_PORT = 3000;
const WEBHOOK_PATH = "/api/v1/whatsapp/webhook";

function sendMessage(text, phone = "9999999999", role = "ADMIN") {
  return new Promise((resolve, reject) => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "shivinfra-test-account",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "919876543210",
                },
                contacts: [
                  {
                    profile: { name: "Test User" },
                    wa_id: phone,
                  },
                ],
                messages: [
                  {
                    from: phone,
                    id: "test-" + Date.now(),
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    type: "text",
                    text: {
                      body: text,
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const body = JSON.stringify(payload);

    const options = {
      hostname: SERVER_HOST,
      port: SERVER_PORT,
      path: WEBHOOK_PATH,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "X-Test-Role": role,
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function runTest(name, message, expectedIntent, role = "ADMIN") {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`TEST: ${name}`);
  console.log(`Message: "${message}"`);
  console.log(`Expected: ${expectedIntent}`);
  console.log("-".repeat(60));

  const result = await sendMessage(message, "9999999999", role);
  console.log(`Status: ${result.status}`);
  console.log(`Response: ${JSON.stringify(result.body, null, 2)}`);

  const actualIntent = result.body?.data?.intent || result.body?.intent || "UNKNOWN";
  const pass = actualIntent === expectedIntent;
  console.log(`Actual: ${actualIntent}`);
  console.log(`Result: ${pass ? "PASS" : "FAIL"}`);
  return { name, pass, result, actualIntent };
}

async function main() {
  console.log("=".repeat(60));
  console.log("SHIVINFRA REAL AI AGENT VERIFICATION");
  console.log("=".repeat(60));

  let passed = 0;
  let failed = 0;
  const results = [];

  // TEST 1: General AI
  const t1 = await runTest(
    "General AI - GST question",
    "GST mhanje kay?",
    "GENERAL_CHAT"
  );
  results.push(t1);
  if (t1.pass) passed++;
  else failed++;

  // TEST 2: Natural database question
  const t2 = await runTest(
    "Natural DB question - active projects count",
    "Apalyakade kiti active projects ahet?",
    "SEARCH_PROJECTS"
  );
  results.push(t2);
  if (t2.pass) passed++;
  else failed++;

  // TEST 3: Project search
  const t3 = await runTest(
    "Project search - Hadapsar 2BHK",
    "Hadapsar madhe 2BHK projects dakhav",
    "SEARCH_PROJECTS"
  );
  results.push(t3);
  if (t3.pass) passed++;
  else failed++;

  // TEST 4: Multi-turn memory - Message 1
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST 4: Multi-turn memory - Message 1");
  console.log("Message: \"Green Valley dakhav\"");
  console.log("-".repeat(60));
  const t4a = await sendMessage("Green Valley dakhav", "9999999999", "ADMIN");
  console.log(`Status: ${t4a.status}`);
  console.log(`Response: ${JSON.stringify(t4a.body, null, 2)}`);
  const t4aPass = t4a.body?.data?.intent === "SEARCH_PROJECTS";
  console.log(`Result: ${t4aPass ? "PASS" : "FAIL"}`);
  results.push({ name: "Memory - Message 1", pass: t4aPass, result: t4a });
  if (t4aPass) passed++;
  else failed++;

  // Wait a bit then send follow-up
  await new Promise(r => setTimeout(r, 2000));

  // TEST 4: Multi-turn memory - Message 2
  console.log(`\n${"=".repeat(60)}`);
  console.log("TEST 4: Multi-turn memory - Message 2");
  console.log("Message: \"tyacha price kay?\"");
  console.log("-".repeat(60));
  const t4b = await sendMessage("tyacha price kay?", "9999999999", "ADMIN");
  console.log(`Status: ${t4b.status}`);
  console.log(`Response: ${JSON.stringify(t4b.body, null, 2)}`);
  const t4bPass = t4b.body?.data?.intent === "SEARCH_PROJECTS" || t4b.body?.data?.intent === "UPDATE_PROJECT";
  console.log(`Result: ${t4bPass ? "PASS" : "FAIL"}`);
  results.push({ name: "Memory - Message 2", pass: t4bPass, result: t4b });
  if (t4bPass) passed++;
  else failed++;

  // TEST 5: Admin CRUD - Update project price
  const t5a = await runTest(
    "Admin CRUD - Update project price",
    "Green Valley cha price 90 lakh kar",
    "UPDATE_PROJECT"
  );
  results.push(t5a);
  if (t5a.pass) passed++;
  else failed++;

  // TEST 5: Admin CRUD - Delete project
  const t5b = await runTest(
    "Admin CRUD - Delete project",
    "Green Valley delete kar",
    "DELETE_PROJECT"
  );
  results.push(t5b);
  if (t5b.pass) passed++;
  else failed++;

  // TEST 6: Customer security
  const t6 = await runTest(
    "Customer security - Delete project",
    "Green Valley delete kar",
    "GENERAL_CHAT",
    "CUSTOMER"
  );
  results.push(t6);
  // For customer, we expect permission denied, which might come as GENERAL_CHAT or error
  const t6Pass = t6.result.body?.message?.includes("permission") || 
                  t6.result.body?.message?.includes("cannot") ||
                  t6.actualIntent === "GENERAL_CHAT";
  console.log(`Security check: ${t6Pass ? "PASS" : "FAIL"}`);
  if (t6Pass) passed++;
  else failed++;

  // TEST 7: Lead creation
  const t7 = await runTest(
    "Lead creation - Baner 2BHK",
    "mala Baner madhe 2BHK pahije",
    "ADD_LEAD"
  );
  results.push(t7);
  if (t7.pass) passed++;
  else failed++;

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log(`SUMMARY: ${passed} passed, ${failed} failed out of ${results.length} tests`);
  console.log("=".repeat(60));

  // Detailed results
  console.log("\nDETAILED RESULTS:");
  for (const r of results) {
    console.log(`  ${r.pass ? "PASS" : "FAIL"}: ${r.name} (${r.actualIntent || r.result.body?.data?.intent || "UNKNOWN"})`);
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
