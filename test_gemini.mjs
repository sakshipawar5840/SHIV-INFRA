
// ============================================================
// SHIVINFRA GEMINI / WHATSAPP AI TEST RUNNER
// Production AI Pipeline Diagnostic Test
//
// FILE:
// test_gemini.mjs
//
// PURPOSE:
// 1. Test WhatsApp webhook
// 2. Test Gemini AI intent detection
// 3. Test project search
// 4. Test active project query
// 5. Test exact project search
// 6. Test Marathi / Hindi / English natural language
//
// SERVER:
// http://127.0.0.1:3000
// WEBHOOK:
// /api/v1/whatsapp/webhook
// ============================================================

import http from "http";

const SERVER_HOST = "127.0.0.1";
const SERVER_PORT = 3000;
const WEBHOOK_PATH = "/api/v1/whatsapp/webhook";

const DEFAULT_PHONE = "9999999999";
const DEFAULT_ROLE = "ADMIN";

// ============================================================
// SEND WHATSAPP TEST MESSAGE
// ============================================================

function sendMessage(
  text,
  messageId,
  phone = DEFAULT_PHONE,
  role = DEFAULT_ROLE
) {
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
                display_phone_number: "+15551234567",
                phone_number_id: "111111111111111"
              },

              contacts: [
                {
                  profile: {
                    name:
                      role === "ADMIN"
                        ? "Admin User"
                        : "Customer User"
                  },

                  wa_id: phone
                }
              ],

              messages: [
                {
                  from: phone,
                  id: messageId,

                  timestamp: String(
                    Math.floor(Date.now() / 1000)
                  ),

                  text: {
                    body: text
                  },

                  type: "text"
                }
              ]
            }
          }
        ]
      }
    ]
  };

  const data = JSON.stringify(payload);

  const options = {
    hostname: SERVER_HOST,
    port: SERVER_PORT,
    path: WEBHOOK_PATH,
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const request = http.request(options, (response) => {
      let body = "";

      response.setEncoding("utf8");

      response.on("data", (chunk) => {
        body += chunk;
      });

      response.on("end", () => {
        resolve({
          statusCode: response.statusCode,
          body
        });
      });
    });

    request.on("error", (error) => {
      reject(error);
    });

    request.write(data);
    request.end();
  });
}

// ============================================================
// PRETTY PRINT RESULT
// ============================================================

function printResult(testName, result) {
  console.log("\n--------------------------------------------");
  console.log(testName);
  console.log("--------------------------------------------");

  console.log("HTTP Status:", result.statusCode);

  try {
    const parsed = JSON.parse(result.body);

    console.log(
      JSON.stringify(parsed, null, 2)
    );
  } catch {
    console.log(result.body);
  }
}

// ============================================================
// RUN SINGLE TEST
// ============================================================

async function runTest(
  testNumber,
  description,
  message,
  timestamp
) {
  const messageId =
    `wamid.shivinfra.test.${timestamp}.${testNumber}`;

  console.log("\n");
  console.log("============================================");
  console.log(`TEST ${testNumber}`);
  console.log("============================================");
  console.log("User Message:");
  console.log(message);

  try {
    const result = await sendMessage(
      message,
      messageId
    );

    printResult(description, result);

    return result;
  } catch (error) {
    console.error("\n❌ TEST FAILED");
    console.error("Message:", error.message);

    return {
      statusCode: 0,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
}

// ============================================================
// MAIN TEST SUITE
// ============================================================

async function main() {
  console.log("");
  console.log("================================================");
  console.log("🚀 SHIVINFRA AI / GEMINI TEST SUITE");
  console.log("================================================");
  console.log("");
  console.log(`Server: http://${SERVER_HOST}:${SERVER_PORT}`);
  console.log(`Webhook: ${WEBHOOK_PATH}`);
  console.log("");

  const timestamp = Date.now();

  // ==========================================================
  // TEST 1
  // Basic AI project search
  // ==========================================================

  await runTest(
    1,
    "Marathi Project Search",
    "Hadapsar madhe 2BHK projects dakhav",
    timestamp
  );

  // ==========================================================
  // TEST 2
  // General conversation
  // ==========================================================

  await runTest(
    2,
    "General Question",
    "GST mhanje kay?",
    timestamp
  );

  // ==========================================================
  // TEST 3
  // Database aggregation query
  // ==========================================================

  await runTest(
    3,
    "Active Project Count",
    "Apalyakade kiti active projects ahet?",
    timestamp
  );

  // ==========================================================
  // TEST 4
  // Exact project search
  //
  // IMPORTANT:
  // If Green Valley exists in Supabase,
  // this should ideally find it.
  // ==========================================================

  await runTest(
    4,
    "Exact Project Search",
    "Green Valley project dakhav",
    timestamp
  );

  // ==========================================================
  // TEST 5
  // Location only
  // ==========================================================

  await runTest(
    5,
    "Location Project Search",
    "Hadapsar madhle sagle projects dakhav",
    timestamp
  );

  // ==========================================================
  // TEST 6
  // Flat type only
  // ==========================================================

  await runTest(
    6,
    "Flat Type Project Search",
    "2 BHK projects dakhav",
    timestamp
  );

  // ==========================================================
  // TEST 7
  // English
  // ==========================================================

  await runTest(
    7,
    "English Project Search",
    "Show me 2 BHK projects in Hadapsar",
    timestamp
  );

  // ==========================================================
  // TEST 8
  // Hindi / Marathi mixed
  // ==========================================================

  await runTest(
    8,
    "Mixed Language Project Search",
    "Hadapsar mein 2 BHK ke projects dikhao",
    timestamp
  );

  // ==========================================================
  // TEST 9
  // Active projects
  // ==========================================================

  await runTest(
    9,
    "Active Projects",
    "Active projects dakhav",
    timestamp
  );

  // ==========================================================
  // TEST 10
  // Price related project search
  // ==========================================================

  await runTest(
    10,
    "Budget Project Search",
    "50 lakh budget madhye projects dakhav",
    timestamp
  );

  // ==========================================================
  // FINAL
  // ==========================================================

  console.log("");
  console.log("================================================");
  console.log("✅ SHIVINFRA TEST SUITE COMPLETED");
  console.log("================================================");
  console.log("");
  console.log("IMPORTANT:");
  console.log(
    "Check TEST 1, TEST 4 and TEST 7 first."
  );
  console.log("");
}

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

main().catch((error) => {
  console.error("");
  console.error("================================================");
  console.error("❌ SHIVINFRA TEST SUITE ERROR");
  console.error("================================================");
  console.error(error);
  console.error("");
});
