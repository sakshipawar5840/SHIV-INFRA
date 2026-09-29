// =====================================================
// SHIVINFRA RUN MIGRATION - PENDING CONFIRMATIONS
// Creates the pending_confirmations table in Supabase
// =====================================================

import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

async function runMigration() {
    console.log("Creating pending_confirmations table...");

    // Create table using raw SQL
    const { error } = await supabase.rpc("exec_sql", {
        sql: `
            CREATE TABLE IF NOT EXISTS public.pending_confirmations (
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
            );

            CREATE INDEX IF NOT EXISTS idx_pending_confirmations_company_phone ON public.pending_confirmations(company_id, phone);
            CREATE INDEX IF NOT EXISTS idx_pending_confirmations_status ON public.pending_confirmations(status);
            CREATE INDEX IF NOT EXISTS idx_pending_confirmations_expires ON public.pending_confirmations(expires_at);
        `,
    });

    if (error) {
        console.error("Migration failed:", error);
        console.log("\nPlease run the migration manually in Supabase SQL Editor:");
        console.log("backend/database/migrations/20240101_create_pending_confirmations.sql");
    } else {
        console.log("✓ Migration completed successfully");
    }
}

runMigration().catch(console.error);
