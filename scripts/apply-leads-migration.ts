import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

const COMPANY_ID = "3e9e9ae1-8593-473f-9aa3-9bcee469d795";

async function applyMigration() {
    console.log("=== APPLYING LEADS MIGRATION ===\n");

    // Check if column exists
    console.log("Step 1: Checking if is_deleted column exists...");
    const { data: testQuery, error: testError } = await supabase
        .from("leads")
        .select("id")
        .eq("is_deleted", false)
        .limit(1);

    if (testError) {
        console.log("  ✗ Column does not exist:", testError.message);
        console.log("  → Need to apply migration")
    } else {
        console.log("  ✓ Column already exists");
        return;
    }

    // Apply migration using raw SQL
    console.log("\nStep 2: Applying migration...");

    // We need to use the service role to run DDL
    // Let's try using the rpc or direct SQL
    const { data: migrationResult, error: migrationError } = await supabase.rpc(
        'execute_sql',
        {
            query: `
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'leads' AND column_name = 'is_deleted'
                    ) THEN
                        ALTER TABLE public.leads
                        ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL;
                    END IF;
                END $$;
            `
        }
    );

    if (migrationError) {
        console.log("  ✗ Migration via RPC failed:", migrationError.message);
        console.log("  → Trying alternative approach...");

        // Alternative: Try using the service role to run DDL directly
        // This might not work with Supabase's JS client
        console.log("  ⚠ Cannot apply migration via JS client.");
        console.log("  → Please run the following SQL in Supabase SQL Editor:");
        console.log("");
        console.log("    ALTER TABLE public.leads");
        console.log("    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false NOT NULL;");
        console.log("");
        console.log("    ALTER TABLE public.leads");
        console.log("    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;");
        console.log("");
    } else {
        console.log("  ✓ Migration applied successfully");
    }
}

async function verifyMigration() {
    console.log("\n=== VERIFYING MIGRATION ===\n");

    const { data, error } = await supabase
        .from("leads")
        .select("id, is_deleted")
        .limit(5);

    if (error) {
        console.log("  ✗ Verification failed:", error.message);
    } else {
        console.log("  ✓ Verification successful");
        console.log("  Sample data:", JSON.stringify(data, null, 2));
    }
}

async function main() {
    await applyMigration();
    await verifyMigration();
}

main().catch(console.error);
