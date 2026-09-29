import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEMO_PREFIX = "DEMO ";
const COMPANY_ID = process.env.SEED_COMPANY_ID || "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
const log = (msg: string) => console.log(`[clean:demo] ${msg}`);

interface TableDef {
  name: string;
  dedupField: string;
  hasIsDeleted: boolean;
}

const TABLES: TableDef[] = [
  { name: "activity_logs", dedupField: "description", hasIsDeleted: false },
  { name: "expenses", dedupField: "title", hasIsDeleted: false },
  { name: "bills", dedupField: "bill_number", hasIsDeleted: false },
  { name: "leads", dedupField: "requirement", hasIsDeleted: false },
  { name: "customers", dedupField: "full_name", hasIsDeleted: true },
  { name: "projects", dedupField: "project_name", hasIsDeleted: true },
];

async function findDemoIds(table: string, field: string, hasIsDeleted: boolean): Promise<{ id: string; value: string }[]> {
  const results: { id: string; value: string }[] = [];
  let from = 0;
  const pageSize = 500;
  while (true) {
    let q = supabase
      .from(table)
      .select(`id, ${field}`)
      .eq("company_id", COMPANY_ID);
    if (hasIsDeleted) q = q.eq("is_deleted", false);
    const { data, error } = await q.range(from, from + pageSize - 1);
    if (error) {
      log(`  WARN scan ${table}: ${error.message}`);
      return results;
    }
    if (!data || data.length === 0) break;
    for (const row of data) {
      const v = (row as Record<string, string>)[field];
      if (typeof v === "string" && v.startsWith(DEMO_PREFIX)) {
        results.push({ id: (row as { id: string }).id, value: v });
      }
    }
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return results;
}

async function main() {
  log(`Company: ${COMPANY_ID}`);
  log("Scanning for DEMO records (those with field starting with 'DEMO ')...");
  log("");

  let totalScanned = 0;
  let totalSoftDeleted = 0;
  let totalHardDeleted = 0;

  for (const t of TABLES) {
    const demoRows = await findDemoIds(t.name, t.dedupField, t.hasIsDeleted);
    totalScanned += demoRows.length;
    if (demoRows.length === 0) {
      log(`  ${t.name}: 0 DEMO records found`);
      continue;
    }
    log(`  ${t.name}: found ${demoRows.length} DEMO record(s) — soft-deleting...`);
    const ids = demoRows.map((r) => r.id);

    if (t.hasIsDeleted) {
      const now = new Date().toISOString();
      const { error: softErr, count: softCount } = await supabase
        .from(t.name)
        .update({ is_deleted: true, deleted_at: now, updated_at: now })
        .in("id", ids)
        .eq("company_id", COMPANY_ID);
      if (softErr) {
        log(`    ✗ soft-delete error: ${softErr.message}`);
        continue;
      }
      totalSoftDeleted += softCount ?? demoRows.length;
      log(`    ✓ soft-deleted ${softCount ?? demoRows.length} (recoverable; pass --hard to permanently remove)`);
    } else {
      log(`    ↳ no is_deleted column; skipping soft-delete`);
    }

    if (process.argv.includes("--hard")) {
      const { error: hardErr, count: hardCount } = await supabase
        .from(t.name)
        .delete()
        .in("id", ids)
        .eq("company_id", COMPANY_ID);
      if (hardErr) {
        log(`    ✗ hard-delete error: ${hardErr.message}`);
        continue;
      }
      totalHardDeleted += hardCount ?? demoRows.length;
      log(`    ✓ hard-deleted ${hardCount ?? demoRows.length}`);
    }
  }

  log("");
  log(`Summary:`);
  log(`  Total DEMO records scanned: ${totalScanned}`);
  log(`  Total soft-deleted: ${totalSoftDeleted}`);
  log(`  Total hard-deleted: ${totalHardDeleted}`);
  log("");
  log("Real (non-DEMO) records were never touched.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[clean:demo] fatal:", err);
  process.exit(1);
});
