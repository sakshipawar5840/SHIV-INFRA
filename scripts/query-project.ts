import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const s = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);
const cid = process.env.DEFAULT_COMPANY_ID!;
const id = process.argv[2];
s.from("projects")
    .select("id, project_name, price, status, updated_at, is_deleted")
    .eq("company_id", cid)
    .eq("id", id)
    .then(({ data, error }) => {
        console.log(error ? "ERR " + error.message : JSON.stringify(data));
    });
