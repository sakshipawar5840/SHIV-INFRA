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
  console.log(`Result: ${pass ? "✅ PASS" : "❌ FAIL"}`);
  return pass;
}

async function main() {
  console.log("========================================");
  console.log("SHIVINFRA AI INTENT TEST SUITE");
  console.log("========================================");

  let passed = 0;
  let failed = 0;

  const tests = [
    { name: "Add customer", message: "Add customer Amit Sharma, phone 9876543210", expected: "ADD_CUSTOMER" },
    { name: "Update customer budget", message: "Update Rahul Patil budget to 7000000", expected: "UPDATE_CUSTOMER" },
    { name: "Change customer phone", message: "Change Rahul Patil phone to 9876543210", expected: "UPDATE_CUSTOMER" },
    { name: "Delete customer", message: "Delete Rahul Patil", expected: "DELETE_CUSTOMER" },
    { name: "Show customer", message: "Show Rahul Patil", expected: "SEARCH_CUSTOMERS" },
    { name: "Update project price", message: "Update Green Valley project price to 7000000", expected: "UPDATE_PROJECT" },
    { name: "Change project status", message: "Change Green Valley project status to active", expected: "UPDATE_PROJECT" },
    { name: "Delete project", message: "Delete Green Valley project", expected: "DELETE_PROJECT" },
    { name: "Show all projects", message: "Show all projects", expected: "SEARCH_PROJECTS" },
    { name: "Show all customers", message: "Show all customers", expected: "SEARCH_CUSTOMERS" },
  ];

  for (const test of tests) {
    const pass = await runTest(test.name, test.message, test.expected);
    if (pass) passed++;
    else failed++;
  }

  console.log("\n========================================");
  console.log(`SUMMARY: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
  console.log("========================================");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
