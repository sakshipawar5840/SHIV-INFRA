import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const url = process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const companyId = process.env.DEFAULT_COMPANY_ID || "";

console.log("SUPABASE_URL set:", !!url);
console.log("SERVICE_ROLE set:", !!key);

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
    // 1) connectivity
    const { data: ping, error: pingErr } = await supabase
        .from("users")
        .select("count")
        .limit(1);
    console.log("CONNECTIVITY users:", pingErr ? "ERROR " + pingErr.message : "OK", JSON.stringify(ping));

    // 2) admin test phone from mock-simulation
    const adminPhone = "91999920260816104158";
    const custPhone = "9199991234";
    const { data: admin, error: aErr } = await supabase
        .from("users")
        .select("id, role, status, phone")
        .eq("phone", adminPhone)
        .eq("company_id", companyId)
        .maybeSingle();
    console.log("ADMIN phone lookup:", aErr ? "ERR " + aErr.message : JSON.stringify(admin));

    const { data: cust, error: cErr } = await supabase
        .from("users")
        .select("id, role, status, phone")
        .eq("phone", custPhone)
        .eq("company_id", companyId)
        .maybeSingle();
    console.log("CUSTOMER phone lookup (users):", cErr ? "ERR " + cErr.message : JSON.stringify(cust));

    // 3) any existing Green Valley project
    const { data: gv, error: gvErr } = await supabase
        .from("projects")
        .select("id, project_name, location, flat_types, price")
        .eq("company_id", companyId)
        .ilike("project_name", "%Green Valley%")
        .limit(5);
    console.log("Existing Green Valley projects:", gvErr ? "ERR " + gvErr.message : JSON.stringify(gv));
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
