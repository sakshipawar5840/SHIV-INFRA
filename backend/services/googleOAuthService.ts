// ============================================
// SHIVINFRA GOOGLE OAUTH SERVICE
// ============================================

import { google } from "googleapis";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  "http://localhost:3000/api/v1/google/oauth/callback";

const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/calendar",
];

const isOAuthConfigured = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

function updateEnvFile(key: string, value: string) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split("\n");
  const updated = lines.map((line) => {
    if (line.startsWith(`${key}=`)) {
      return `${key}="${value}"`;
    }
    return line;
  });

  fs.writeFileSync(envPath, updated.join("\n") + "\n", "utf8");
}

export class GoogleOAuthService {
  static getStatus() {
    const hasRefreshToken = !!process.env.GOOGLE_REFRESH_TOKEN;
    return {
      configured: isOAuthConfigured,
      connected: isOAuthConfigured && hasRefreshToken,
      drive: isOAuthConfigured && hasRefreshToken,
      calendar: isOAuthConfigured && hasRefreshToken,
      sheets: isOAuthConfigured && hasRefreshToken,
      redirectUri: GOOGLE_REDIRECT_URI,
    };
  }

  static getAuthorizationUrl() {
    if (!isOAuthConfigured) {
      throw new Error("Google OAuth is not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: REQUIRED_SCOPES,
    });

    return url;
  }

  static async exchangeCode(code: string) {
    if (!isOAuthConfigured) {
      throw new Error("Google OAuth is not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
    }

    if (!code) {
      throw new Error("Missing authorization code.");
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
      );

      const { tokens } = await oauth2Client.getToken(code);

      return {
        access_token: tokens.access_token || null,
        refresh_token: tokens.refresh_token || null,
        expiry_date: tokens.expiry_date || null,
        scope: tokens.scope || null,
        token_type: tokens.token_type || null,
      };
    } catch (error: any) {
      console.error("[SHIVINFRA OAUTH] Token exchange failed:", error.message);
      throw new Error(error.message || "OAuth token exchange failed.");
    }
  }

  static persistRefreshToken(refreshToken: string | null | undefined) {
    if (!refreshToken) return;

    process.env.GOOGLE_REFRESH_TOKEN = refreshToken;
    updateEnvFile("GOOGLE_REFRESH_TOKEN", refreshToken);
  }
}

export default GoogleOAuthService;
