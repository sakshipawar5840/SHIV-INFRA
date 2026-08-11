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

async function runTest(name, message, expectedIntent) {
  console.log(`\n========================================`);
  console.log(`TEST: ${name}`);
  console.log(`Message: "${message}"`);
  console.log(`Expected: ${expectedIntent}`);
  console.log(`----------------------------------------`);

  const result = await sendMessage(message);
  console.log(`Status: ${result.status}`);
  console.log(`Response: ${JSON.stringify(result.body, null, 2)}`);

  const actualIntent = result.body?.data?.intent || result.body?.intent || "UNKNOWN";
  const pass = actualIntent === expectedIntent;
  console.log(`Actual: ${actualIntent}`);
  console.log(`Result: ${pass ? "PASS" : "FAIL"}`);
  return { name, pass, result };
}

async function main() {
  console.log("========================================");
  console.log("SHIVINFRA CUSTOMER CRUD TEST SUITE");
  console.log("========================================");

  let passed = 0;
  let failed = 0;
  const results = [];

  const tests = [
    { name: "ADD_CUSTOMER", message: "Add customer Test Customer One, phone 9000000001", expected: "ADD_CUSTOMER" },
    { name: "SEARCH_CUSTOMERS", message: "Show Test Customer One", expected: "SEARCH_CUSTOMERS" },
    { name: "UPDATE_CUSTOMER budget", message: "Update Test Customer One budget to 7500000", expected: "UPDATE_CUSTOMER" },
    { name: "UPDATE_CUSTOMER phone", message: "Change Test Customer One phone to 9000000002", expected: "UPDATE_CUSTOMER" },
    { name: "DELETE_CUSTOMER", message: "Delete Test Customer One", expected: "DELETE_CUSTOMER" },
  ];

  for (const test of tests) {
    const r = await runTest(test.name, test.message, test.expected);
    results.push(r);
    if (r.pass) passed++;
    else failed++;
  }

  // Test 6: DELETE confirmation
  console.log(`\n========================================`);
  console.log(`TEST: DELETE confirmation`);
  console.log(`Message: "YES"`);
  console.log(`Expected: DELETE_CUSTOMER with success`);
  console.log(`----------------------------------------`);
  const confirmResult = await sendMessage("YES");
  console.log(`Status: ${confirmResult.status}`);
  console.log(`Response: ${JSON.stringify(confirmResult.body, null, 2)}`);
  const confirmPass = confirmResult.body?.data?.intent === "DELETE_CUSTOMER" && confirmResult.body?.success === true;
  console.log(`Actual: ${confirmResult.body?.data?.intent || confirmResult.body?.intent || "UNKNOWN"}`);
  console.log(`Result: ${confirmPass ? "PASS" : "FAIL"}`);
  results.push({ name: "DELETE confirmation", pass: confirmPass, result: confirmResult });
  if (confirmPass) passed++;
  else failed++;

  console.log("\n========================================");
  console.log(`SUMMARY: ${passed} passed, ${failed} failed out of ${results.length} tests`);
  console.log("========================================");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
