import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import bcrypt from "bcryptjs";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE = "http://localhost:3000/api/v1";

async function main() {
  const email = "ai-test-1788460465464@shivinfra.com";
  const password = "TestPass123!";
  const hashed = await bcrypt.hash(password, 10);
  
  console.log("Generated hash:", hashed);

  // Use raw SQL to update password and status
  const { error: updateError } = await supabase.rpc('exec_sql', {
    sql: `UPDATE public.users SET password = $1, status = 'Active', role = 'Admin' WHERE email = $2`,
    params: [hashed, email]
  });
  
  if (updateError) {
    console.log("RPC error:", updateError.message);
    // Try direct PostgREST with different approach
    console.log("Trying alternative update...");
  } else {
    console.log("Updated via RPC");
  }

  // Verify user in DB
  const { data: verifyUser } = await supabase.from("users").select("*").eq("email", email).single();
  console.log("Verified user:", verifyUser);
  
  if (verifyUser && verifyUser.password) {
    // Test bcrypt compare
    const match = await bcrypt.compare(password, verifyUser.password);
    console.log("Bcrypt compare result:", match);
  }

  // Now login
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginJson = await loginRes.json();
  console.log("Login result:", loginJson);
  console.log("Login status:", loginRes.status);

  if (loginJson.token) {
    const auth = { Authorization: `Bearer ${loginJson.token}`, "Content-Type": "application/json" };

    // Test projects API
    const projectsRes = await fetch(`${BASE}/projects`, { headers: auth });
    const projectsJson = await projectsRes.json();
    console.log("Projects status:", projectsRes.status);
    console.log("Projects count:", projectsJson.count);
    console.log("Projects data sample:", projectsJson.data ? projectsJson.data.slice(0, 2) : "none");
    
    // Check data shape
    if (projectsJson.data && projectsJson.data.length > 0) {
      const firstProject = projectsJson.data[0];
      console.log("First project keys:", Object.keys(firstProject));
      console.log("First project flat_type:", firstProject.flat_type);
      console.log("First project sqft:", firstProject.sqft);
      console.log("First project price:", firstProject.price);
    }
  } else {
    console.log("Login failed, cannot test projects API");
  }
}

main().catch((e) => { console.error(e); process.exit(1); });