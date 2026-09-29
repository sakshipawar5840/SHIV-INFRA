// ============================================
// SHIVINFRA GEMINI + GOOGLE API CONNECTIVITY TEST
// ============================================
// Minimal connectivity test - does NOT expose API keys

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

async function testGemini() {
  console.log("========================================");
  console.log("GEMINI API CONNECTIVITY TEST");
  console.log("========================================\n");

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

  // Configuration check
  console.log("CONFIGURATION:");
  console.log(`  API Key: ${apiKey ? "CONFIGURED" : "MISSING"}`);
  console.log(`  Model: ${model}`);

  if (!apiKey) {
    console.log("\nSTATUS: MISSING - GEMINI_API_KEY not configured");
    return "MISSING";
  }

  // Connectivity test
  console.log("\nCONNECTIVITY TEST:");

  try {
    const genAI = new GoogleGenAI({ apiKey });

    const result = await genAI.models.generateContent({
      model,
      contents: "Reply with exactly: OK",
    });
    const text = result.text;

    console.log(`  Response: "${text.trim()}"`);
    console.log("\nSTATUS: PASS - Gemini API is accessible");
    return "PASS";

  } catch (error: any) {
    const status = error?.status || error?.code || "UNKNOWN";
    const message = error?.message || "Unknown error";

    console.log(`  Error Status: ${status}`);
    console.log(`  Error Message: ${message}`);

    if (status === 429 || message.includes("quota") || message.includes("RESOURCE_EXHAUSTED")) {
      console.log("\nSTATUS: BLOCKED - Quota/rate limit exceeded");
      return "QUOTA_BLOCKED";
    } else if (status === 401 || status === 403) {
      console.log("\nSTATUS: INVALID - API key invalid or unauthorized");
      return "INVALID";
    } else if (status === 503 || message.includes("high demand") || message.includes("UNAVAILABLE")) {
      console.log("\nSTATUS: BLOCKED - Service temporarily unavailable");
      return "SERVICE_UNAVAILABLE";
    } else {
      console.log(`\nSTATUS: BLOCKED - Error ${status}`);
      return `ERROR_${status}`;
    }
  }
}

async function testGooglePlaces() {
  console.log("\n========================================");
  console.log("GOOGLE PLACES API CONNECTIVITY TEST");
  console.log("========================================\n");

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  // Configuration check
  console.log("CONFIGURATION:");
  console.log(`  API Key: ${apiKey ? "CONFIGURED" : "MISSING"}`);

  if (!apiKey) {
    console.log("\nSTATUS: MISSING - GOOGLE_MAPS_API_KEY not configured");
    return "MISSING";
  }

  // Connectivity test
  console.log("\nCONNECTIVITY TEST:");

  try {
    const url = "https://places.googleapis.com/v1/places:searchText";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName",
      },
      body: JSON.stringify({
        textQuery: "cement shop Pune",
        maxResultCount: 1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorText = JSON.stringify(data);
      console.log(`  HTTP Status: ${response.status}`);

      if (response.status === 403) {
        if (errorText.includes("PERMISSION_DENIED") || errorText.includes("API_KEY_SERVICE_BLOCKED")) {
          console.log("\nSTATUS: BLOCKED - Places API disabled or not enabled in GCP project");
          return "API_DISABLED";
        }
      }

      console.log(`  Error: ${errorText.substring(0, 200)}`);
      console.log(`\nSTATUS: BLOCKED - HTTP ${response.status}`);
      return `ERROR_${response.status}`;
    }

    const places = data.places || [];
    console.log(`  Results: ${places.length} place(s) found`);

    if (places.length > 0) {
      console.log(`  First result: ${places[0]?.displayName?.text || "N/A"}`);
    }

    console.log("\nSTATUS: PASS - Google Places API is accessible");
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

async function testGoogleOAuth() {
  console.log("\n========================================");
  console.log("GOOGLE OAUTH CONFIGURATION CHECK");
  console.log("========================================\n");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  console.log("CONFIGURATION:");
  console.log(`  Client ID: ${clientId ? "CONFIGURED" : "MISSING"}`);
  console.log(`  Client Secret: ${clientSecret ? "CONFIGURED" : "MISSING"}`);
  console.log(`  Refresh Token: ${refreshToken ? "CONFIGURED" : "MISSING"}`);
  console.log(`  Redirect URI: ${redirectUri || "NOT SET"}`);

  if (clientId && clientSecret && refreshToken) {
    console.log("\nSTATUS: PASS - Google OAuth fully configured");
    return "PASS";
  } else if (clientId && clientSecret) {
    console.log("\nSTATUS: PARTIAL - OAuth configured but refresh token missing");
    return "PARTIAL";
  } else {
    console.log("\nSTATUS: MISSING - Google OAuth not configured");
    return "MISSING";
  }
}

async function main() {
  const geminiStatus = await testGemini();
  const placesStatus = await testGooglePlaces();
  const oauthStatus = await testGoogleOAuth();

  console.log("\n========================================");
  console.log("SUMMARY");
  console.log("========================================");
  console.log(`  Gemini: ${geminiStatus}`);
  console.log(`  Google Places: ${placesStatus}`);
  console.log(`  Google OAuth: ${oauthStatus}`);
  console.log("========================================\n");

  return { geminiStatus, placesStatus, oauthStatus };
}

main().catch(console.error);
