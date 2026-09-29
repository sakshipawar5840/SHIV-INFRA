// ============================================
// SHIVINFRA PRODUCTION CONFIGURATION CHECK
// ============================================
// Reports which required environment variables are configured.
// NEVER prints secret values.

import dotenv from "dotenv";
dotenv.config();

interface ConfigCheck {
  name: string;
  required: boolean;
  description: string;
}

const CONFIG_CHECKS: ConfigCheck[] = [
  // Application
  { name: "NODE_ENV", required: false, description: "Environment (development/production)" },
  { name: "PORT", required: false, description: "Server port" },
  { name: "APP_URL", required: false, description: "Application URL" },
  { name: "FRONTEND_URL", required: false, description: "Frontend URL for CORS" },

  // JWT (REQUIRED)
  { name: "JWT_SECRET", required: true, description: "JWT signing secret" },
  { name: "JWT_REFRESH_SECRET", required: false, description: "JWT refresh token secret" },

  // Supabase (REQUIRED)
  { name: "SUPABASE_URL", required: true, description: "Supabase project URL" },
  { name: "SUPABASE_ANON_KEY", required: true, description: "Supabase anonymous key" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: true, description: "Supabase service role key" },

  // Gemini AI (REQUIRED FOR AI)
  { name: "GEMINI_API_KEY", required: true, description: "Gemini AI API key" },

  // OpenAI (OPTIONAL)
  { name: "OPENAI_API_KEY", required: false, description: "OpenAI API key (optional)" },

  // WhatsApp (REQUIRED FOR WHATSAPP)
  { name: "META_WHATSAPP_TOKEN", required: true, description: "WhatsApp Business API access token" },
  { name: "META_WHATSAPP_PHONE_NUMBER_ID", required: true, description: "WhatsApp phone number ID" },
  { name: "META_WHATSAPP_VERIFY_TOKEN", required: true, description: "WhatsApp webhook verification token" },
  { name: "META_WHATSAPP_APP_SECRET", required: true, description: "WhatsApp app secret for signature verification" },
  { name: "WHATSAPP_MOCK_MODE", required: false, description: "Enable WhatsApp mock mode" },
  { name: "WHATSAPP_ALLOW_UNREGISTERED", required: false, description: "Allow unregistered WhatsApp users" },

  // Default Company
  { name: "DEFAULT_COMPANY_ID", required: false, description: "Default company ID for WhatsApp resolution" },

  // Google OAuth
  { name: "GOOGLE_CLIENT_ID", required: false, description: "Google OAuth client ID" },
  { name: "GOOGLE_CLIENT_SECRET", required: false, description: "Google OAuth client secret" },
  { name: "GOOGLE_REDIRECT_URI", required: false, description: "Google OAuth redirect URI" },
  { name: "GOOGLE_REFRESH_TOKEN", required: false, description: "Google OAuth refresh token" },

  // Google Services
  { name: "GOOGLE_MAPS_API_KEY", required: false, description: "Google Maps/Places API key" },
  { name: "GOOGLE_CALENDAR_ID", required: false, description: "Google Calendar ID" },
  { name: "GOOGLE_DRIVE_FOLDER_ID", required: false, description: "Google Drive folder ID" },
  { name: "GOOGLE_SHEETS_BILLS_SPREADSHEET_ID", required: false, description: "Google Sheets bills spreadsheet ID" },
];

function checkConfig() {
  console.log("========================================");
  console.log("SHIVINFRA PRODUCTION CONFIGURATION CHECK");
  console.log("========================================\n");

  let requiredConfigured = 0;
  let requiredMissing = 0;
  let optionalConfigured = 0;
  let optionalMissing = 0;

  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  console.log("REQUIRED VARIABLES:");
  console.log("------------------");

  for (const check of CONFIG_CHECKS.filter(c => c.required)) {
    const value = process.env[check.name];
    const isConfigured = value !== undefined && value.trim() !== "";

    if (isConfigured) {
      console.log(`  ✓ ${check.name} — configured`);
      requiredConfigured++;
    } else {
      console.log(`  ✗ ${check.name} — MISSING (${check.description})`);
      requiredMissing++;
      missingRequired.push(check.name);
    }
  }

  console.log("\nOPTIONAL VARIABLES:");
  console.log("-------------------");

  for (const check of CONFIG_CHECKS.filter(c => !c.required)) {
    const value = process.env[check.name];
    const isConfigured = value !== undefined && value.trim() !== "";

    if (isConfigured) {
      console.log(`  ✓ ${check.name} — configured`);
      optionalConfigured++;
    } else {
      console.log(`  ○ ${check.name} — not set (${check.description})`);
      optionalMissing++;
      missingOptional.push(check.name);
    }
  }

  console.log("\n========================================");
  console.log("SUMMARY");
  console.log("========================================");
  console.log(`Required: ${requiredConfigured} configured, ${requiredMissing} missing`);
  console.log(`Optional: ${optionalConfigured} configured, ${optionalMissing} missing`);

  if (missingRequired.length > 0) {
    console.log("\nMISSING REQUIRED:");
    missingRequired.forEach(name => console.log(`  - ${name}`));
  }

  if (missingOptional.length > 0) {
    console.log("\nMISSING OPTIONAL:");
    missingOptional.forEach(name => console.log(`  - ${name}`));
  }

  console.log("\n========================================");

  if (requiredMissing > 0) {
    console.log("STATUS: NOT READY — Missing required configuration");
    process.exit(1);
  } else {
    console.log("STATUS: READY — All required configuration present");
    process.exit(0);
  }
}

checkConfig();
