import { Client } from "pg";

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

  const sql = await import("fs").then((fs) => fs.readFileSync("backend/database/migrations/20240101_add_missing_erp_tables.sql", "utf8"));

  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let created = 0;
  let failed = 0;

  for (const statement of statements) {
    const upper = statement.toUpperCase();
    if (upper.startsWith("CREATE TABLE") || upper.startsWith("CREATE INDEX") || upper.startsWith("CREATE TRIGGER") || upper.startsWith("CREATE POLICY")) {
      try {
        await client.query(statement);
        const nameMatch = statement.match(/CREATE\s+(TABLE|INDEX|TRIGGER|POLICY)\s+(IF\s+NOT\s+EXISTS\s+)?(?:ON\s+\w+\.)?(\w+)/i);
        const name = nameMatch ? nameMatch[3] : "unknown";
        console.log(`OK: ${name}`);
        created++;
      } catch (error: any) {
        failed++;
        console.error(`FAIL: ${error.message}\nSQL: ${statement.slice(0, 200)}...\n`);
      }
    }
  }

  await client.end();
  console.log(`\nSummary: ${created} succeeded, ${failed} failed`);
}

main().catch((error) => {
  console.error("Migration runner failed:", error);
  process.exit(1);
});
