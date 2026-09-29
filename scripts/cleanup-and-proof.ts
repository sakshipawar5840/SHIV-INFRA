import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const s = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);
const cid = process.env.DEFAULT_COMPANY_ID!;

async function main() {
    const { data: row } = await s
        .from("projects")
        .select("id, project_name, location, flat_types, area_sqft, price, status, created_at")
        .eq("company_id", cid)
        .ilike("project_name", "%Shiv Test Tower Alpha%")
        .order("created_at", { ascending: false })
        .limit(1);
    console.log("ADD PROOF ROW:", JSON.stringify(row));

    const { data: del, error } = await s
        .from("projects")
        .delete()
        .eq("company_id", cid)
        .ilike("project_name", "%Green Valley%");
    console.log("GREEN VALLEY DELETED:", error ? "ERR " + error.message : (del ? del.length + " rows" : "ok"));

    const { count } = await s
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("company_id", cid);
    console.log("TOTAL PROJECTS AFTER CLEANUP:", count);
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
