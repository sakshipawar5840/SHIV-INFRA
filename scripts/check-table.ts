import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

async function checkTable() {
    const { data, error } = await supabase
        .from("pending_confirmations")
        .select("*")
        .limit(1);

    if (error) {
        console.log("Table does not exist or error:", error.message);
        console.log("Code:", error.code);
    } else {
        console.log("Table exists! Data:", data);
    }
}

checkTable().catch(console.error);
