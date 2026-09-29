import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
const connectionString = `postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@db.${projectRef}.supabase.co:5432/postgres`;

const client = new Client({ connectionString });

async function main() {
    await client.connect();
    console.log("Connected to Supabase PostgreSQL\n");

    const statements = [
        // Add is_deleted column to leads table
        `DO $$
         BEGIN
             IF NOT EXISTS (
                 SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'leads' AND column_name = 'is_deleted'
             ) THEN
                 ALTER TABLE public.leads
                 ADD COLUMN is_deleted BOOLEAN DEFAULT false NOT NULL;
             END IF;
         END $$;`,

        // Add deleted_at column to leads table
        `DO $$
         BEGIN
             IF NOT EXISTS (
                 SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'leads' AND column_name = 'deleted_at'
             ) THEN
                 ALTER TABLE public.leads
                 ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
             END IF;
         END $$;`,
    ];

    for (const sql of statements) {
        try {
            await client.query(sql);
            console.log("OK: Applied migration");
        } catch (error: any) {
            console.error("FAIL:", error.message);
        }
    }

    // Verify the column exists
    console.log("\nVerifying migration...");
    const { rows } = await client.query(`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'leads'
        ORDER BY ordinal_position;
    `);

    console.log("\nLeads table columns:");
    for (const row of rows) {
        console.log(`  ${row.column_name}: ${row.data_type} (default: ${row.column_default}, nullable: ${row.is_nullable})`);
    }

    await client.end();
    console.log("\nMigration complete");
}

main().catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
});
