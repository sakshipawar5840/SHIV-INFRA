import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEMO_PREFIX = "DEMO ";
const COMPANY_ID = process.env.SEED_COMPANY_ID || "3e9e9ae1-8593-473f-9aa3-9bcee469d795";

const today = new Date();
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const isoTimestamp = (d: Date) => d.toISOString();

const daysFromNow = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return d;
};

const log = (msg: string) => console.log(`[seed:demo] ${msg}`);

async function exists(table: string, field: string, value: string, hasIsDeleted = true): Promise<{ exists: boolean; id: string | null; deleted: boolean }> {
  const selectCols = hasIsDeleted ? "id, is_deleted" : "id";
  let q = supabase
    .from(table)
    .select(selectCols)
    .eq("company_id", COMPANY_ID)
    .eq(field, value);
  const { data, error } = await q.limit(1);
  if (error) {
    log(`  WARN checking ${table}.${field}: ${error.message}`);
    return { exists: false, id: null, deleted: false };
  }
  if (!data || data.length === 0) return { exists: false, id: null, deleted: false };
  const row = data[0] as { id: string; is_deleted?: boolean };
  return { exists: true, id: row.id, deleted: !!row.is_deleted };
}

async function restoreIfDeleted(table: string, id: string): Promise<void> {
  const { error } = await supabase
    .from(table)
    .update({ is_deleted: false, deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    log(`  WARN restoring ${table}: ${error.message}`);
  }
}

async function getIdByField(table: string, field: string, value: string, hasIsDeleted = true, includeDeleted = false): Promise<string | null> {
  let q = supabase
    .from(table)
    .select("id")
    .eq("company_id", COMPANY_ID)
    .eq(field, value);
  if (hasIsDeleted && !includeDeleted) q = q.eq("is_deleted", false);
  const { data } = await q.limit(1).single();
  return (data as { id: string } | null)?.id ?? null;
}

async function insertDemo(table: string, row: Record<string, unknown>, fieldForDedup: string, hasIsDeleted = true): Promise<string | null> {
  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") {
      log(`  ↳ skip duplicate (${table}.${fieldForDedup})`);
      return getIdByField(table, fieldForDedup, String(row[fieldForDedup]), hasIsDeleted, true);
    }
    log(`  ✗ ${table} insert error: ${error.message}`);
    return null;
  }
  return (data as { id: string } | null)?.id ?? null;
}

async function seedProjects() {
  log("Projects...");
  const projects = [
    { project_name: `${DEMO_PREFIX}Skyline Towers`, project_type: "Residential", location: "Wakad", city: "Pune", state: "Maharashtra", area_sqft: 1500, price: 8500000, status: "Ongoing", description: "Premium 3BHK residences in Wakad with modern amenities and river-facing views." },
    { project_name: `${DEMO_PREFIX}Green Valley Villas`, project_type: "Villa", location: "Baner", city: "Pune", state: "Maharashtra", area_sqft: 3000, price: 18000000, status: "Planning", description: "Eco-friendly luxury 4BHK villas with private gardens and clubhouse access." },
    { project_name: `${DEMO_PREFIX}Riverside Heights`, project_type: "Residential", location: "Kharadi", city: "Pune", state: "Maharashtra", area_sqft: 1050, price: 5200000, status: "Ongoing", description: "2BHK riverside apartments with scenic Mula-River views and walking tracks." },
    { project_name: `${DEMO_PREFIX}Urban Nest`, project_type: "Residential", location: "Hinjewadi", city: "Pune", state: "Maharashtra", area_sqft: 625, price: 3200000, status: "Upcoming", description: "Compact smart 1BHK homes for first-time buyers near IT Park." },
  ];
  const ids: Record<string, string> = {};
  for (const p of projects) {
    const check = await exists("projects", "project_name", p.project_name);
    if (check.exists && !check.deleted) {
      if (check.id) ids[p.project_name] = check.id;
      log(`  ↻ exists ${p.project_name}`);
      continue;
    }
    if (check.exists && check.deleted && check.id) {
      await restoreIfDeleted("projects", check.id);
      ids[p.project_name] = check.id;
      log(`  ↻ restored ${p.project_name}`);
      continue;
    }
    const id = await insertDemo("projects", { company_id: COMPANY_ID, ...p }, "project_name");
    if (id) ids[p.project_name] = id;
    log(`  ✓ ${p.project_name}`);
  }
  return ids;
}

async function seedCustomers() {
  log("Customers...");
  const customers = [
    { full_name: `${DEMO_PREFIX}Aarav Sharma`, phone: "+919876500001", email: "demo.aarav@example.com", city: "Pune", state: "Maharashtra", pincode: "411057", address: "Baner, Pune", budget: 8000000, status: "active", source: "Website" },
    { full_name: `${DEMO_PREFIX}Priya Mehta`, phone: "+919876500002", email: "demo.priya@example.com", city: "Pune", state: "Maharashtra", pincode: "411014", address: "Kharadi, Pune", budget: 5500000, status: "active", source: "Referral" },
    { full_name: `${DEMO_PREFIX}Rohan Iyer`, phone: "+919876500003", email: "demo.rohan@example.com", city: "Pune", state: "Maharashtra", pincode: "411057", address: "Wakad, Pune", budget: 8500000, status: "active", source: "Walk-in" },
    { full_name: `${DEMO_PREFIX}Sneha Kapoor`, phone: "+919876500004", email: "demo.sneha@example.com", city: "Pune", state: "Maharashtra", pincode: "411057", address: "Hinjewadi, Pune", budget: 3500000, status: "active", source: "Meta Ad" },
    { full_name: `${DEMO_PREFIX}Vikram Desai`, phone: "+919876500005", email: "demo.vikram@example.com", city: "Pune", state: "Maharashtra", pincode: "411045", address: "Baner, Pune", budget: 17500000, status: "inactive", source: "Broker" },
  ];
  const ids: Record<string, string> = {};
  for (const c of customers) {
    const check = await exists("customers", "full_name", c.full_name);
    if (check.exists && !check.deleted) {
      if (check.id) ids[c.full_name] = check.id;
      log(`  ↻ exists ${c.full_name}`);
      continue;
    }
    if (check.exists && check.deleted && check.id) {
      await restoreIfDeleted("customers", check.id);
      ids[c.full_name] = check.id;
      log(`  ↻ restored ${c.full_name}`);
      continue;
    }
    const id = await insertDemo("customers", { company_id: COMPANY_ID, ...c }, "full_name");
    if (id) ids[c.full_name] = id;
    log(`  ✓ ${c.full_name}`);
  }
  return ids;
}

async function seedLeads(projectIds: Record<string, string>, customerIds: Record<string, string>) {
  log("Leads...");
  const projectList = Object.keys(projectIds);
  const customerList = Object.keys(customerIds);
  if (projectList.length === 0 || customerList.length === 0) {
    log("  ✗ cannot seed leads without projects/customers");
    return;
  }
  const leads = [
    { requirement: `${DEMO_PREFIX}3BHK in Wakad, budget 80L-90L`, budget: 8500000, preferred_location: "Wakad", status: "New", lead_source: "Website", remarks: "Demo lead - hot prospect", proj: projectList[0], cust: customerList[0] },
    { requirement: `${DEMO_PREFIX}2BHK in Kharadi under 55L`, budget: 5500000, preferred_location: "Kharadi", status: "Follow Up", lead_source: "Referral", remarks: "Demo lead - negotiation phase", proj: projectList[2], cust: customerList[1] },
    { requirement: `${DEMO_PREFIX}1BHK investment in Hinjewadi`, budget: 3500000, preferred_location: "Hinjewadi", status: "New", lead_source: "Meta Ad", remarks: "Demo lead - investor", proj: projectList[3], cust: customerList[3] },
    { requirement: `${DEMO_PREFIX}4BHK Villa in Baner, premium`, budget: 17500000, preferred_location: "Baner", status: "New", lead_source: "Broker", remarks: "Demo lead - high value", proj: projectList[1], cust: customerList[4] },
    { requirement: `${DEMO_PREFIX}3BHK in Wakad, immediate possession`, budget: 9000000, preferred_location: "Wakad", status: "Lost", lead_source: "Walk-in", remarks: "Demo lead - lost to competitor", proj: projectList[0], cust: customerList[2] },
    { requirement: `${DEMO_PREFIX}2BHK in Kharadi for end-use`, budget: 5200000, preferred_location: "Kharadi", status: "Closed", lead_source: "Website", remarks: "Demo lead - closed won", proj: projectList[2], cust: customerList[1] },
  ];
  for (const l of leads) {
    if (await exists("leads", "requirement", l.requirement, false).then(r => r.exists)) {
      log(`  ↻ exists ${l.requirement}`);
      continue;
    }
    const row = {
      company_id: COMPANY_ID,
      customer_id: customerIds[l.cust] ?? null,
      project_id: projectIds[l.proj] ?? null,
      lead_source: l.lead_source,
      requirement: l.requirement,
      budget: l.budget,
      preferred_location: l.preferred_location,
      status: l.status,
      remarks: l.remarks,
    };
    await insertDemo("leads", row, "requirement", false);
    log(`  ✓ ${l.requirement}`);
  }
}

async function seedBills(projectIds: Record<string, string>) {
  log("Bills...");
  const projectList = Object.keys(projectIds);
  if (projectList.length === 0) {
    log("  ✗ cannot seed bills without projects");
    return;
  }
  const bills = [
    { bill_number: `${DEMO_PREFIX}INV-2025-0001`, vendor_name: "Shree Cement Suppliers", material_name: "Cement - 200 bags", amount: 185000, gst_amount: 33300, bill_date: isoDate(daysFromNow(-15)), quantity: 200, unit: "Bags", remarks: "Demo bill - cement order", payment_status: "Pending", proj: projectList[0] },
    { bill_number: `${DEMO_PREFIX}INV-2025-0002`, vendor_name: "Bharat Steel Co", material_name: "TMT Steel Bars", amount: 480000, gst_amount: 86400, bill_date: isoDate(daysFromNow(-10)), quantity: 2000, unit: "Kg", remarks: "Demo bill - steel order", payment_status: "Paid", proj: projectList[2] },
    { bill_number: `${DEMO_PREFIX}INV-2025-0003`, vendor_name: "Maharashtra Bricks & Blocks", material_name: "Fly-ash Bricks", amount: 95000, gst_amount: 17100, bill_date: isoDate(daysFromNow(-5)), quantity: 5000, unit: "Nos", remarks: "Demo bill - bricks order", payment_status: "Pending", proj: projectList[0] },
  ];
  for (const b of bills) {
    if (await exists("bills", "bill_number", b.bill_number, false).then(r => r.exists)) {
      log(`  ↻ exists ${b.bill_number}`);
      continue;
    }
    const row = {
      company_id: COMPANY_ID,
      project_id: projectIds[b.proj] ?? null,
      vendor_name: b.vendor_name,
      material_name: b.material_name,
      amount: b.amount,
      gst_amount: b.gst_amount,
      bill_number: b.bill_number,
      bill_date: b.bill_date,
      quantity: b.quantity,
      unit: b.unit,
      remarks: b.remarks,
      payment_status: b.payment_status,
    };
    await insertDemo("bills", row, "bill_number", false);
    log(`  ✓ ${b.bill_number}`);
  }
}

async function seedExpenses(projectIds: Record<string, string>) {
  log("Expenses...");
  const projectList = Object.keys(projectIds);
  if (projectList.length === 0) return;
  const expenses = [
    { title: `${DEMO_PREFIX}Site Labour - Oct Week 1`, category: "Labour", amount: 125000, expense_date: isoDate(daysFromNow(-12)), payment_method: "Bank Transfer", remarks: "Demo expense - weekly labour payout" },
    { title: `${DEMO_PREFIX}Equipment Rental - JCB`, category: "Equipment", amount: 45000, expense_date: isoDate(daysFromNow(-8)), payment_method: "UPI", remarks: "Demo expense - JCB 3-day rental" },
    { title: `${DEMO_PREFIX}Site Office Rent`, category: "Overhead", amount: 25000, expense_date: isoDate(daysFromNow(-5)), payment_method: "Bank Transfer", remarks: "Demo expense - monthly rent" },
    { title: `${DEMO_PREFIX}Electricity Bill - Site`, category: "Utilities", amount: 18500, expense_date: isoDate(daysFromNow(-3)), payment_method: "UPI", remarks: "Demo expense - electricity" },
    { title: `${DEMO_PREFIX}Site Security - Monthly`, category: "Labour", amount: 22000, expense_date: isoDate(daysFromNow(-1)), payment_method: "Cash", remarks: "Demo expense - security guard" },
  ];
  for (const e of expenses) {
    if (await exists("expenses", "title", e.title, false).then(r => r.exists)) {
      log(`  ↻ exists ${e.title}`);
      continue;
    }
    const row = {
      company_id: COMPANY_ID,
      project_id: projectIds[projectList[0]] ?? null,
      title: e.title,
      expense_title: e.title,
      category: e.category,
      expense_category: e.category,
      amount: e.amount,
      expense_date: e.expense_date,
      payment_method: e.payment_method,
      remarks: e.remarks,
    };
    await insertDemo("expenses", row, "title", false);
    log(`  ✓ ${e.title}`);
  }
}

async function seedActivityLogs() {
  log("Activity Logs...");
  const logs = [
    { action: "PROJECT_CREATED", module: "Projects", description: `${DEMO_PREFIX}Created project Skyline Towers (demo seed)` },
    { action: "LEAD_CREATED", module: "Leads", description: `${DEMO_PREFIX}Created lead for Aarav Sharma (demo seed)` },
    { action: "BILL_UPLOADED", module: "Bills", description: `${DEMO_PREFIX}Uploaded bill INV-2025-0001 (demo seed)` },
  ];
  for (const l of logs) {
    const { data: existing } = await supabase
      .from("activity_logs")
      .select("id")
      .eq("company_id", COMPANY_ID)
      .eq("description", l.description)
      .limit(1);
    if (existing && existing.length > 0) {
      log(`  ↻ exists activity log`);
      continue;
    }
    const row = {
      company_id: COMPANY_ID,
      action: l.action,
      module: l.module,
      description: l.description,
    };
    const { error } = await supabase.from("activity_logs").insert(row);
    if (error) log(`  ✗ activity_logs: ${error.message}`);
    else log(`  ✓ ${l.action}`);
  }
}

async function printSummary() {
  log("");
  log("Summary (active/non-deleted counts):");
  const checks: { table: string; field: string; hasIsDeleted: boolean }[] = [
    { table: "projects", field: "project_name", hasIsDeleted: true },
    { table: "customers", field: "full_name", hasIsDeleted: true },
    { table: "leads", field: "requirement", hasIsDeleted: false },
    { table: "bills", field: "bill_number", hasIsDeleted: false },
    { table: "expenses", field: "title", hasIsDeleted: false },
  ];

  for (const c of checks) {
    let q = supabase.from(c.table).select(c.field).eq("company_id", COMPANY_ID);
    if (c.hasIsDeleted) q = q.eq("is_deleted", false);
    const { data } = await q;
    const all = data ?? [];
    let demoCount = 0;
    for (const row of all) {
      const v = (row as Record<string, string>)[c.field];
      if (typeof v === "string" && v.startsWith(DEMO_PREFIX)) demoCount++;
    }
    log(`  ${c.table}: ${demoCount} DEMO / ${all.length} total`);
  }

  const { data: logs } = await supabase.from("activity_logs").select("description").eq("company_id", COMPANY_ID);
  const allLogs = logs ?? [];
  const demoLogs = allLogs.filter((r) => typeof (r as Record<string, string>).description === "string" && ((r as Record<string, string>).description).startsWith(DEMO_PREFIX));
  log(`  activity_logs: ${demoLogs.length} DEMO / ${allLogs.length} total`);
}

async function main() {
  log(`Company: ${COMPANY_ID}`);
  log(`Timestamp: ${new Date().toISOString()}`);
  log("");

  const projectIds = await seedProjects();
  const customerIds = await seedCustomers();
  await seedLeads(projectIds, customerIds);
  await seedBills(projectIds);
  await seedExpenses(projectIds);
  await seedActivityLogs();

  await printSummary();
  log("");
  log("Done. Run `npm run clean:demo` to remove DEMO records only.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed:demo] fatal:", err);
  process.exit(1);
});
