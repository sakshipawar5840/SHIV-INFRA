import { supabaseAdmin as supabase } from "../backend/config/supabase.ts";

async function checkBroadcastTables() {
    console.log("=== CHECKING BROADCAST TABLES ===\n");

    // Check broadcasts table
    const { data: broadcasts, error: broadcastsError } = await supabase
        .from("broadcasts")
        .select("*")
        .limit(1);

    if (broadcastsError) {
        console.log("broadcasts:", broadcastsError.message);
    } else {
        console.log("broadcasts: EXISTS (", broadcasts?.length || 0, "rows)");
    }

    // Check broadcast_recipients table
    const { data: recipients, error: recipientsError } = await supabase
        .from("broadcast_recipients")
        .select("*")
        .limit(1);

    if (recipientsError) {
        console.log("broadcast_recipients:", recipientsError.message);
    } else {
        console.log("broadcast_recipients: EXISTS (", recipients?.length || 0, "rows)");
    }
}

checkBroadcastTables().catch(console.error);
