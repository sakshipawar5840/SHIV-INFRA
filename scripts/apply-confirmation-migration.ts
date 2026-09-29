// =====================================================
// Apply pending_confirmations migration via Supabase API
// =====================================================

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env manually
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex === -1) continue;
        const key = trimmed.substring(0, eqIndex).trim();
        let value = trimmed.substring(eqIndex + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        process.env[key] = value;
    }
}

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function applyMigration() {
    if (!SUPABASE_SERVICE_KEY || !SUPABASE_URL) {
        console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
        return;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log("Applying migration to Supabase...");

    // SQL statements to execute
    const sqlStatements = [
        `CREATE TABLE IF NOT EXISTS public.pending_confirmations (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
            phone VARCHAR(50) NOT NULL,
            intent VARCHAR(100) NOT NULL,
            payload JSONB NOT NULL DEFAULT '{}'::jsonb,
            status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            confirmed_at TIMESTAMP WITH TIME ZONE,
            cancelled_at TIMESTAMP WITH TIME ZONE,
            UNIQUE(company_id, phone, status)
        )`,
        `CREATE INDEX IF NOT EXISTS idx_pending_confirmations_company_phone ON public.pending_confirmations(company_id, phone)`,
        `CREATE INDEX IF NOT EXISTS idx_pending_confirmations_status ON public.pending_confirmations(status)`,
        `CREATE INDEX IF NOT EXISTS idx_pending_confirmations_expires ON public.pending_confirmations(expires_at)`,
        `ALTER TABLE public.pending_confirmations ENABLE ROW LEVEL SECURITY`,
        `DROP POLICY IF EXISTS pending_confirmations_admin ON public.pending_confirmations`,
        `CREATE POLICY pending_confirmations_admin ON public.pending_confirmations
            FOR ALL
            USING (company_id = current_setting('request.jwt.claims', true)::json->>'company_id'::uuid)
            WITH CHECK (company_id = current_setting('request.jwt.claims', true)::json->>'company_id'::uuid)`,
    ];

    // Try using the Management API endpoint
    for (const sql of sqlStatements) {
        try {
            const response = await fetch(`${SUPABASE_URL}/v1/projects/default/database/query`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
                },
                body: JSON.stringify({ query: sql }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Statement failed (${response.status}):`, errorText.substring(0, 200));
            } else {
                console.log("✓ Statement executed successfully");
            }
        } catch (error: any) {
            console.error("Request error:", error.message);
        }
    }

    console.log("\n⚠ If errors occurred above, please run the SQL manually in Supabase SQL Editor:");
    console.log("URL: https://supabase.com/dashboard/project/wiyakkkuvcwikukmvwol/sql/new");
    console.log("\n--- SQL START ---");
    console.log(sqlStatements.join(";\n\n"));
    console.log("\n--- SQL END ---\n");
}

applyMigration().catch(console.error);
