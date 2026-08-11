// ============================================
// SHIVINFRA AI ERP
// SUPABASE CONFIG
// ============================================

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl =
    process.env.SUPABASE_URL || "";

const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || "";

const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || "";

console.log(
    "CONNECTED SUPABASE URL:",
    supabaseUrl
);

export const isSupabaseConfigured = !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://")
);

let supabaseInstance:any = null;

let supabaseAdminInstance:any = null;

if(isSupabaseConfigured){
    try{
        supabaseInstance = createClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                auth:{
                    persistSession:false
                }
            }
        );

        console.log(
            "[SHIVINFRA BACKEND] Supabase anon client initialized successfully."
        );

    }
    catch(error){
        console.error(
            "[SUPABASE INIT ERROR]",
            error
        );
    }
}

if(
    supabaseUrl &&
    supabaseServiceRoleKey &&
    supabaseUrl.startsWith("https://")
){
    try{
        supabaseAdminInstance = createClient(
            supabaseUrl,
            supabaseServiceRoleKey,
            {
                auth:{
                    persistSession:false
                }
            }
        );

        console.log(
            "[SHIVINFRA BACKEND] Supabase service-role client initialized successfully."
        );

    }
    catch(error){
        console.error(
            "[SUPABASE SERVICE ROLE INIT ERROR]",
            error
        );
    }
}
else{
    console.log(
        "[SHIVINFRA BACKEND] Supabase service-role key missing"
    );
}

// Named export (anon client - kept for backward compatibility)
export const supabase = supabaseInstance;

// Service-role client for backend operations (bypasses RLS)
export const supabaseAdmin = supabaseAdminInstance;

// Default export: service-role client for backend services
export default supabaseAdminInstance;
