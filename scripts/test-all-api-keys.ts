// =====================================================
// FULL API KEY CONNECTIVITY CHECK
// Tests all external services with real API calls
// =====================================================

import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";

console.log("=====================================");
console.log("FULL API KEY CONNECTIVITY CHECK");
console.log("=====================================");
console.log(`Time: ${new Date().toISOString()}`);
console.log("");

const results: Array<{
    service: string;
    keyPresent: string;
    liveCallResult: string;
    status: string;
}> = [];

// =====================================================
// 1. SUPABASE
// =====================================================
async function testSupabase() {
    console.log("=== 1. SUPABASE ===");

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const keyPresent = url && key ? "✓" : "✗";
    console.log(`  URL: ${url ? "Present (" + url.substring(0, 30) + "...)" : "MISSING"}`);
    console.log(`  Key: ${key ? "Present (" + key.substring(0, 20) + "...)" : "MISSING"}`);

    if (!url || !key) {
        results.push({ service: "Supabase", keyPresent, liveCallResult: "SKIPPED (no key)", status: "NOT TESTED" });
        return;
    }

    try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(url, key);

        const { count, error } = await supabase
            .from("projects")
            .select("*", { count: "exact", head: true });

        if (error) {
            console.log(`  Result: ERROR - ${error.message}`);
            results.push({ service: "Supabase", keyPresent, liveCallResult: `ERROR: ${error.message}`, status: "BROKEN" });
        } else {
            console.log(`  Result: OK - projects count = ${count}`);
            results.push({ service: "Supabase", keyPresent, liveCallResult: `OK: projects count = ${count}`, status: "WORKING" });
        }
    } catch (error: any) {
        console.log(`  Result: EXCEPTION - ${error?.message || error}`);
        results.push({ service: "Supabase", keyPresent, liveCallResult: `EXCEPTION: ${error?.message || error}`, status: "BROKEN" });
    }
}

// =====================================================
// 2. GEMINI AI
// =====================================================
async function testGemini() {
    console.log("\n=== 2. GEMINI AI ===");

    const key = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";

    const keyPresent = key ? "✓" : "✗";
    console.log(`  Key: ${key ? "Present (" + key.substring(0, 10) + "...)" : "MISSING"}`);
    console.log(`  Model: ${model}`);

    if (!key) {
        results.push({ service: "Gemini", keyPresent, liveCallResult: "SKIPPED (no key)", status: "NOT TESTED" });
        return;
    }

    try {
        const { GoogleGenAI } = await import("@google/genai");
        const client = new GoogleGenAI({ apiKey: key });

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await Promise.race([
            client.models.generateContent({
                model: model,
                contents: "Return JSON: {\"test\": true}"
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 15000))
        ]);

        clearTimeout(timeout);

        const text = (response as any).text || (response as any).candidates?.[0]?.content?.parts?.[0]?.text || "";

        console.log(`  Result: OK - Response: ${text.substring(0, 100)}`);
        results.push({ service: "Gemini", keyPresent, liveCallResult: `OK: Response received (${text.length} chars)`, status: "WORKING" });
    } catch (error: any) {
        const errorMessage = error?.message || String(error);

        if (errorMessage.includes("429")) {
            console.log(`  Result: QUOTA EXCEEDED (429) - ${errorMessage.substring(0, 200)}`);
            results.push({ service: "Gemini", keyPresent, liveCallResult: `HTTP 429: Quota exceeded`, status: "QUOTA EXCEEDED" });
        } else if (errorMessage.includes("403")) {
            console.log(`  Result: FORBIDDEN (403) - ${errorMessage.substring(0, 200)}`);
            results.push({ service: "Gemini", keyPresent, liveCallResult: `HTTP 403: Forbidden`, status: "BROKEN" });
        } else {
            console.log(`  Result: ERROR - ${errorMessage.substring(0, 200)}`);
            results.push({ service: "Gemini", keyPresent, liveCallResult: `ERROR: ${errorMessage.substring(0, 100)}`, status: "BROKEN" });
        }
    }
}

// =====================================================
// 3. OPENAI
// =====================================================
async function testOpenAI() {
    console.log("\n=== 3. OPENAI ===");

    const key = process.env.OPENAI_API_KEY;

    const keyPresent = key ? "✓" : "✗";
    console.log(`  Key: ${key ? "Present (" + key.substring(0, 10) + "...)" : "MISSING"}`);

    // Check if OpenAI is actually used in code
    console.log(`  Code usage: Checking...`);

    if (!key) {
        results.push({ service: "OpenAI", keyPresent, liveCallResult: "SKIPPED (no key)", status: "NOT TESTED" });
        return;
    }

    try {
        const response = await fetch("https://api.openai.com/v1/models", {
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok) {
            const modelCount = data?.data?.length || 0;
            console.log(`  Result: OK - ${modelCount} models accessible`);
            results.push({ service: "OpenAI", keyPresent, liveCallResult: `OK: ${modelCount} models accessible`, status: "WORKING" });
        } else {
            const errorMsg = data?.error?.message || `HTTP ${response.status}`;
            console.log(`  Result: ERROR - ${errorMsg}`);
            results.push({ service: "OpenAI", keyPresent, liveCallResult: `ERROR: ${errorMsg}`, status: "BROKEN" });
        }
    } catch (error: any) {
        console.log(`  Result: EXCEPTION - ${error?.message || error}`);
        results.push({ service: "OpenAI", keyPresent, liveCallResult: `EXCEPTION: ${error?.message || error}`, status: "BROKEN" });
    }
}

// =====================================================
// 4. META WHATSAPP
// =====================================================
async function testMetaWhatsApp() {
    console.log("\n=== 4. META WHATSAPP ===");

    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    const appSecret = process.env.META_WHATSAPP_APP_SECRET;

    const keyPresent = token && phoneNumberId ? "✓" : "✗";
    console.log(`  Token: ${token ? "Present (" + token.substring(0, 10) + "...)" : "MISSING"}`);
    console.log(`  Phone Number ID: ${phoneNumberId ? "Present" : "MISSING"}`);
    console.log(`  App Secret: ${appSecret ? "Present" : "EMPTY (webhook signature verify disabled)"}`);

    if (!token || !phoneNumberId) {
        results.push({ service: "Meta WhatsApp", keyPresent, liveCallResult: "SKIPPED (no token/phoneId)", status: "NOT TESTED" });
        return;
    }

    try {
        const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            console.log(`  Result: OK - Phone: ${data.display_phone_number || "N/A"}, Status: ${data.verified_name || "N/A"}`);
            results.push({ service: "Meta WhatsApp", keyPresent, liveCallResult: `OK: Phone ${data.display_phone_number || "valid"}`, status: "WORKING" });
        } else {
            const errorMsg = data?.error?.message || `HTTP ${response.status}`;
            console.log(`  Result: ERROR - ${errorMsg}`);
            results.push({ service: "Meta WhatsApp", keyPresent, liveCallResult: `ERROR: ${errorMsg}`, status: "BROKEN" });
        }
    } catch (error: any) {
        console.log(`  Result: EXCEPTION - ${error?.message || error}`);
        results.push({ service: "Meta WhatsApp", keyPresent, liveCallResult: `EXCEPTION: ${error?.message || error}`, status: "BROKEN" });
    }
}

// =====================================================
// 5. GOOGLE MAPS/PLACES API
// =====================================================
async function testGooglePlaces() {
    console.log("\n=== 5. GOOGLE MAPS/PLACES API ===");

    const key = process.env.GOOGLE_MAPS_API_KEY;

    const keyPresent = key ? "✓" : "✗";
    console.log(`  Key: ${key ? "Present (" + key.substring(0, 10) + "...)" : "MISSING"}`);

    if (!key) {
        results.push({ service: "Google Places", keyPresent, liveCallResult: "SKIPPED (no key)", status: "NOT TESTED" });
        return;
    }

    try {
        const response = await fetch(
            `https://places.googleapis.com/v1/places:searchText`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": key,
                    "X-Goog-FieldMask": "places.displayName,places.formattedAddress"
                },
                body: JSON.stringify({
                    textQuery: "cement shop Pune",
                    maxResultCount: 1
                })
            }
        );

        const data = await response.json();

        if (response.ok && data.places) {
            console.log(`  Result: OK - ${data.places.length} result(s) found`);
            results.push({ service: "Google Places", keyPresent, liveCallResult: `OK: ${data.places.length} result(s)`, status: "WORKING" });
        } else {
            const errorMsg = data?.error?.message || `HTTP ${response.status}`;
            console.log(`  Result: ERROR - ${errorMsg.substring(0, 200)}`);
            if (errorMsg.includes("disabled") || errorMsg.includes("403")) {
                results.push({ service: "Google Places", keyPresent, liveCallResult: `HTTP 403: API disabled`, status: "API DISABLED" });
            } else {
                results.push({ service: "Google Places", keyPresent, liveCallResult: `ERROR: ${errorMsg.substring(0, 100)}`, status: "BROKEN" });
            }
        }
    } catch (error: any) {
        console.log(`  Result: EXCEPTION - ${error?.message || error}`);
        results.push({ service: "Google Places", keyPresent, liveCallResult: `EXCEPTION: ${error?.message || error}`, status: "BROKEN" });
    }
}

// =====================================================
// 6. GOOGLE OAUTH (Sheets/Drive/Calendar)
// =====================================================
async function testGoogleOAuth() {
    console.log("\n=== 6. GOOGLE OAUTH (Sheets/Drive/Calendar) ===");

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    const keyPresent = clientId && clientSecret && refreshToken ? "✓" : "✗";
    console.log(`  Client ID: ${clientId ? "Present" : "MISSING"}`);
    console.log(`  Client Secret: ${clientSecret ? "Present" : "MISSING"}`);
    console.log(`  Refresh Token: ${refreshToken ? "Present" : "MISSING"}`);

    if (!clientId || !clientSecret || !refreshToken) {
        results.push({ service: "Google OAuth", keyPresent, liveCallResult: "SKIPPED (incomplete creds)", status: "NOT TESTED" });
        return;
    }

    try {
        // Step 1: Refresh token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token"
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok || !tokenData.access_token) {
            console.log(`  Result: TOKEN REFRESH FAILED - ${tokenData.error_description || tokenData.error || "Unknown"}`);
            results.push({ service: "Google OAuth", keyPresent, liveCallResult: `TOKEN REFRESH FAILED: ${tokenData.error || "Unknown"}`, status: "BROKEN" });
            return;
        }

        console.log(`  Token Refresh: OK`);

        // Step 2: Test Drive API (list files)
        const driveResponse = await fetch("https://www.googleapis.com/drive/v3/files?pageSize=1", {
            headers: { "Authorization": `Bearer ${tokenData.access_token}` }
        });

        const driveData = await driveResponse.json();

        if (driveResponse.ok) {
            console.log(`  Drive API: OK - ${driveData.files?.length || 0} file(s) accessible`);
            results.push({ service: "Google OAuth", keyPresent, liveCallResult: `OK: Token refresh + Drive access working`, status: "WORKING" });
        } else {
            const errorMsg = driveData?.error?.message || `HTTP ${driveResponse.status}`;
            console.log(`  Drive API: ERROR - ${errorMsg}`);
            results.push({ service: "Google OAuth", keyPresent, liveCallResult: `DRIVE ERROR: ${errorMsg}`, status: "BROKEN" });
        }
    } catch (error: any) {
        console.log(`  Result: EXCEPTION - ${error?.message || error}`);
        results.push({ service: "Google OAuth", keyPresent, liveCallResult: `EXCEPTION: ${error?.message || error}`, status: "BROKEN" });
    }
}

// =====================================================
// 7. JWT SECRETS
// =====================================================
async function testJWTSecrets() {
    console.log("\n=== 7. JWT SECRETS ===");

    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    const keyPresent = jwtSecret && jwtRefreshSecret ? "✓" : "✗";
    console.log(`  JWT_SECRET: ${jwtSecret ? `Present (${jwtSecret.length} chars)` : "MISSING"}`);
    console.log(`  JWT_REFRESH_SECRET: ${jwtRefreshSecret ? `Present (${jwtRefreshSecret.length} chars)` : "MISSING"}`);

    const jwtOk = jwtSecret && jwtSecret.length >= 32;
    const refreshOk = jwtRefreshSecret && jwtRefreshSecret.length >= 32;

    if (jwtOk && refreshOk) {
        console.log(`  Result: OK - Both secrets present and >= 32 chars`);
        results.push({ service: "JWT Secrets", keyPresent, liveCallResult: `OK: Both secrets >= 32 chars`, status: "WORKING" });
    } else {
        const issues: string[] = [];
        if (!jwtSecret) issues.push("JWT_SECRET missing");
        else if (jwtSecret.length < 32) issues.push(`JWT_SECRET too short (${jwtSecret.length} chars)`);
        if (!jwtRefreshSecret) issues.push("JWT_REFRESH_SECRET missing");
        else if (jwtRefreshSecret.length < 32) issues.push(`JWT_REFRESH_SECRET too short (${jwtRefreshSecret.length} chars)`);

        console.log(`  Result: ISSUES - ${issues.join(", ")}`);
        results.push({ service: "JWT Secrets", keyPresent, liveCallResult: `ISSUES: ${issues.join(", ")}`, status: "ISSUES" });
    }
}

// =====================================================
// MAIN
// =====================================================
async function main() {
    await testSupabase();
    await testGemini();
    await testOpenAI();
    await testMetaWhatsApp();
    await testGooglePlaces();
    await testGoogleOAuth();
    await testJWTSecrets();

    // Print summary table
    console.log("\n=====================================");
    console.log("SUMMARY TABLE");
    console.log("=====================================");
    console.log("");
    console.log("| Service | Key Present | Live Call Result | Status |");
    console.log("|---|---|---|---|");

    for (const r of results) {
        console.log(`| ${r.service} | ${r.keyPresent} | ${r.liveCallResult} | ${r.status} |`);
    }

    console.log("");
}

main().catch(console.error);
