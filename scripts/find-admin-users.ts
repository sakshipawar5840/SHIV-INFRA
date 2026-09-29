import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE = "http://localhost:3000/api/v1";

async function main() {
  // Find existing admin users (case-insensitive status match)
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "Admin")
    .ilike("status", "active")
    .limit(5);
  
  console.log("Admin users:", users);
  console.log("Error:", error?.message);
  
  if (users && users.length > 0) {
    for (const user of users) {
      console.log(`Found admin: ${user.email} (${user.id})`);
    }
  } else {
    console.log("No admin users found");
  }
  
  // Also check all users
  const { data: allUsers } = await supabase.from("users").select("id, email, role, status").limit(10);
  console.log("All users (sample):", allUsers);
}

main().catch((e) => { console.error(e); process.exit(1); });