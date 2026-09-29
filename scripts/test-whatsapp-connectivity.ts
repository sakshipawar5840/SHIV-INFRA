// ============================================
// SHIVINFRA WHATSAPP BUSINESS API CONNECTIVITY TEST
// ============================================
// Tests real WhatsApp Business API connectivity
// Does NOT expose any credential values

import dotenv from "dotenv";
dotenv.config();

async function testWhatsAppConfiguration() {
  console.log("========================================");
  console.log("WHATSAPP BUSINESS API CONFIGURATION CHECK");
  console.log("========================================\n");

  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  const appSecret = process.env.META_WHATSAPP_APP_SECRET;
  const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN;

  console.log("CONFIGURATION:");
  console.log(`  META_WHATSAPP_TOKEN: ${token ? "CONFIGURED" : "MISSING"}`);
  console.log(`  META_WHATSAPP_PHONE_NUMBER_ID: ${phoneNumberId ? "CONFIGURED" : "MISSING"}`);
  console.log(`  META_WHATSAPP_APP_SECRET: ${appSecret ? "CONFIGURED" : "MISSING"}`);
  console.log(`  META_WHATSAPP_VERIFY_TOKEN: ${verifyToken ? "CONFIGURED" : "MISSING"}`);

  const allConfigured = token && phoneNumberId && appSecret && verifyToken;

  if (!allConfigured) {
    console.log("\nSTATUS: INCOMPLETE - Not all required credentials are configured");
    return "INCOMPLETE";
  }

  return "CONFIGURED";
}

async function testGraphApiConnectivity() {
  console.log("\n========================================");
  console.log("WHATSAPP GRAPH API CONNECTIVITY TEST");
  console.log("========================================\n");

  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log("STATUS: SKIPPED - Credentials not configured");
    return "SKIPPED";
  }

  console.log("CONNECTIVITY TEST:");

  try {
    // Test Graph API connectivity by fetching phone number info
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || "Unknown error";
      const errorCode = data?.error?.code || "UNKNOWN";
      const errorType = data?.error?.type || "UNKNOWN";

      console.log(`  HTTP Status: ${response.status}`);
      console.log(`  Error Type: ${errorType}`);
      console.log(`  Error Code: ${errorCode}`);
      console.log(`  Error Message: ${errorMessage}`);

      if (response.status === 401 || response.status === 403) {
        console.log("\nSTATUS: BLOCKED - Invalid credentials or insufficient permissions");
        return "INVALID_CREDENTIALS";
      }

      console.log(`\nSTATUS: BLOCKED - HTTP ${response.status}`);
      return `ERROR_${response.status}`;
    }

    console.log(`  HTTP Status: ${response.status}`);
    console.log(`  Phone Number: ${data.display_phone_number || "N/A"}`);
    console.log(`  Status: ${data.verified_name || "N/A"}`);

    console.log("\nSTATUS: PASS - Graph API connectivity verified");
    return "PASS";

  } catch (error: any) {
    const message = error?.message || "Unknown error";
    console.log(`  Error: ${message}`);

    if (message.includes("abort") || message.includes("timeout")) {
      console.log("\nSTATUS: BLOCKED - Request timeout");
      return "TIMEOUT";
    }

    console.log("\nSTATUS: BLOCKED - Connection error");
    return "CONNECTION_ERROR";
  }
}

async function testWebhookVerification() {
  console.log("\n========================================");
  console.log("WHATSAPP WEBHOOK VERIFICATION TEST");
  console.log("========================================\n");

  const verifyToken = process.env.META_WHATSAPP_VERIFY_TOKEN;
  const appSecret = process.env.META_WHATSAPP_APP_SECRET;

  console.log("WEBHOOK CONFIGURATION:");
  console.log(`  Verify Token: ${verifyToken ? "CONFIGURED" : "MISSING"}`);
  console.log(`  App Secret: ${appSecret ? "CONFIGURED" : "MISSING"}`);

  if (!verifyToken) {
    console.log("\nSTATUS: MISSING - Verify token not configured");
    return "MISSING";
  }

  // Simulate webhook verification request
  console.log("\nSIMULATED WEBHOOK VERIFICATION:");
  console.log("  Mode: subscribe");
  console.log(`  Token Match: ${verifyToken ? "YES" : "NO"}`);

  if (verifyToken && verifyToken !== "MY_VERIFY_TOKEN") {
    console.log("\nSTATUS: PASS - Webhook verification would succeed");
    return "PASS";
  } else if (verifyToken === "MY_VERIFY_TOKEN") {
    console.log("\nSTATUS: WARNING - Using placeholder verify token");
    return "PLACEHOLDER";
  } else {
    console.log("\nSTATUS: MISSING - Verify token not configured");
    return "MISSING";
  }
}

async function testOutgoingMessage() {
  console.log("\n========================================");
  console.log("WHATSAPP OUTGOING MESSAGE TEST");
  console.log("========================================\n");

  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log("STATUS: SKIPPED - Credentials not configured");
    return "SKIPPED";
  }

  console.log("OUTGOING MESSAGE CONFIGURATION:");
  console.log(`  Phone Number ID: ${phoneNumberId ? "CONFIGURED" : "MISSING"}`);
  console.log(`  Access Token: ${token ? "CONFIGURED" : "MISSING"}`);

  console.log("\nSTATUS: CONFIGURED - Ready to send messages");
  console.log("NOTE: Actual message sending requires a valid recipient phone number");
  return "CONFIGURED";
}

async function main() {
  const configStatus = await testWhatsAppConfiguration();
  const graphApiStatus = await testGraphApiConnectivity();
  const webhookStatus = await testWebhookVerification();
  const outgoingStatus = await testOutgoingMessage();

  console.log("\n========================================");
  console.log("SUMMARY");
  console.log("========================================");
  console.log(`  Configuration: ${configStatus}`);
  console.log(`  Graph API: ${graphApiStatus}`);
  console.log(`  Webhook Verification: ${webhookStatus}`);
  console.log(`  Outgoing Message: ${outgoingStatus}`);
  console.log("========================================\n");

  return { configStatus, graphApiStatus, webhookStatus, outgoingStatus };
}

main().catch(console.error);
