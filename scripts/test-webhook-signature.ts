// =====================================================
// WHATSAPP WEBHOOK SIGNATURE VERIFICATION TEST
// Tests the X-Hub-Signature-256 verification
// =====================================================

import dotenv from "dotenv";
dotenv.config();

import crypto from "crypto";
import http from "http";
import express from "express";

const APP_SECRET = "test_secret_key_123";
const TEST_PORT = 3999;

process.env.META_WHATSAPP_APP_SECRET = APP_SECRET;

console.log("=====================================");
console.log("WEBHOOK SIGNATURE VERIFICATION TEST");
console.log("=====================================");

function computeSignature(payload: string, secret: string): string {
    return "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function makeRequest(
    port: number,
    path: string,
    payload: string,
    signature?: string
): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
        const options: http.RequestOptions = {
            hostname: "localhost",
            port,
            path,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
            },
        };

        if (signature) {
            options.headers!["X-Hub-Signature-256"] = signature;
        }

        const req = http.request(options, (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => resolve({ status: res.statusCode || 0, body }));
        });

        req.on("error", reject);
        req.write(payload);
        req.end();
    });
}

async function runTests() {
    const app = express();
    app.use(express.json({
        verify: (_req: any, _res, buf) => {
            if (buf && buf.length) {
                (_req as any).rawBody = buf;
            }
        },
    }));

    app.post("/webhook", (req: any, res: any) => {
        const signature = req.headers["x-hub-signature-256"] as string | undefined;

        if (!signature) {
            return res.status(403).json({ success: false, message: "Missing X-Hub-Signature" });
        }

        const payload = req.rawBody && Buffer.isBuffer(req.rawBody)
            ? req.rawBody
            : Buffer.from(JSON.stringify(req.body));

        const expectedSignature = "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(payload).digest("hex");

        const sigA = Buffer.from(signature);
        const sigB = Buffer.from(expectedSignature);

        if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
            return res.status(403).json({ success: false, message: "Invalid signature" });
        }

        return res.status(200).json({ success: true, message: "OK" });
    });

    const server = app.listen(TEST_PORT, () => {
        console.log(`Test server listening on port ${TEST_PORT}`);
    });

    let passCount = 0;
    let failCount = 0;

    try {
        const testPayload = JSON.stringify({ object: "whatsapp_business_account", entry: [] });

        // Test 1: Valid signature
        console.log("\n=== TEST 1: Valid signature ===");
        const validSig = computeSignature(testPayload, APP_SECRET);
        const result1 = await makeRequest(TEST_PORT, "/webhook", testPayload, validSig);
        console.log(`  Status: ${result1.status}`);
        console.log(`  Body: ${result1.body}`);
        if (result1.status === 200) {
            console.log("  ✓ PASS: Valid signature accepted");
            passCount++;
        } else {
            console.log("  ✗ FAIL: Valid signature rejected");
            failCount++;
        }

        // Test 2: Invalid signature
        console.log("\n=== TEST 2: Invalid signature ===");
        const invalidSig = "sha256=" + crypto.createHmac("sha256", "wrong_secret").update(testPayload).digest("hex");
        const result2 = await makeRequest(TEST_PORT, "/webhook", testPayload, invalidSig);
        console.log(`  Status: ${result2.status}`);
        console.log(`  Body: ${result2.body}`);
        if (result2.status === 403) {
            console.log("  ✓ PASS: Invalid signature rejected");
            passCount++;
        } else {
            console.log("  ✗ FAIL: Invalid signature accepted");
            failCount++;
        }

        // Test 3: Missing signature
        console.log("\n=== TEST 3: Missing signature ===");
        const result3 = await makeRequest(TEST_PORT, "/webhook", testPayload);
        console.log(`  Status: ${result3.status}`);
        console.log(`  Body: ${result3.body}`);
        if (result3.status === 403) {
            console.log("  ✓ PASS: Missing signature rejected");
            passCount++;
        } else {
            console.log("  ✗ FAIL: Missing signature accepted");
            failCount++;
        }

        // Test 4: Tampered payload
        console.log("\n=== TEST 4: Tampered payload ===");
        const tamperedPayload = JSON.stringify({ object: "whatsapp_business_account", entry: [{ tampered: true }] });
        const result4 = await makeRequest(TEST_PORT, "/webhook", tamperedPayload, validSig);
        console.log(`  Status: ${result4.status}`);
        console.log(`  Body: ${result4.body}`);
        if (result4.status === 403) {
            console.log("  ✓ PASS: Tampered payload rejected");
            passCount++;
        } else {
            console.log("  ✗ FAIL: Tampered payload accepted");
            failCount++;
        }

    } finally {
        server.close();
    }

    console.log("\n=== SUMMARY ===");
    console.log(`Passed: ${passCount}/4`);
    console.log(`Failed: ${failCount}/4`);

    if (failCount === 0) {
        console.log("\nSTATUS: SIGNATURE VERIFICATION PASS");
    } else {
        console.log("\nSTATUS: SIGNATURE VERIFICATION FAIL");
    }
}

runTests().catch(console.error);
