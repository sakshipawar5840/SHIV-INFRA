import leadService from "./backend/services/leadService.ts";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const COMPANY = process.env.DEFAULT_COMPANY_ID || "";
const UNIQ = "VERIFY_" + Date.now();
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

(async () => {
  const { data: cust } = await supabase.from("customers").select("id").eq("company_id", COMPANY).limit(1);
  const customerId = cust && cust.length ? cust[0].id : null;

  const created: any = await leadService.createLead({
    company_id: COMPANY, customer_id: customerId, lead_source: "WhatsApp",
    requirement: "2BHK Baner", budget: 6000000, preferred_location: "Baner",
    status: "New", remarks: UNIQ,
  });
  const leadId = created?.id || null;
  console.log("ADD:", leadId ? "PASS" : "FAIL");

  const search = await leadService.searchLeads(COMPANY, "Baner");
  console.log("SEARCH:", search.some((l: any) => l.id === leadId) ? "PASS" : "FAIL");

  // Update to a DB-allowed status (Contacted is blocked by DB check constraint)
  const updated: any = await leadService.updateLead(leadId!, COMPANY, { budget: 6500000, status: "Hot" });
  console.log("UPDATE:", updated ? "PASS" : "FAIL", "| budget:", updated?.budget, "| status:", updated?.status);

  const { data: dbRow } = await supabase.from("leads").select("status, budget").eq("id", leadId).maybeSingle();
  console.log("DB VERIFICATION: status=" + dbRow?.status + " budget=" + dbRow?.budget);
  console.log("STATUS DB:", dbRow?.status === "Hot" ? "PASS" : "FAIL");
  console.log("BUDGET DB:", dbRow?.budget === 6500000 ? "PASS" : "FAIL");

  const del = await leadService.deleteLead(leadId!, COMPANY, {});
  console.log("DELETE:", del.success ? "PASS" : "FAIL");

  const after = await leadService.searchLeads(COMPANY, "Baner");
  const returnedIds = after.map((l: any) => l.id);
  console.log("SEARCH AFTER DELETE:", !returnedIds.includes(leadId) ? "PASS" : "FAIL");
})().catch(e => { console.error("TEST ERROR:", e.message); process.exit(1); });
