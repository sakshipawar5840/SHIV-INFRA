import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COMPANY_ID = process.env.SEED_COMPANY_ID || "3e9e9ae1-8593-473f-9aa3-9bcee469d795";
const log = (msg: string) => console.log(`[clean:test-users] ${msg}`);

// Test user patterns to identify junk records
const TEST_PATTERNS = [
  { field: 'full_name', pattern: /^AI (Endpoint )?Tester$/i },
  { field: 'email', pattern: /^ai-(test|endpoint)-/i },
  { field: 'email', pattern: /^demo-ui-test-/i },
  { field: 'email', pattern: /^lead-ui-test-/i },
  { field: 'email', pattern: /^ai-test-/i },
];

async function main() {
  log(`Company: ${COMPANY_ID}`);
  log("Scanning for AI test users...");
  log("");

  // First, get all users (junk test accounts are spread across
  // multiple company_ids, so we scan the whole users table)
  const { data: allUsers, error } = await supabase
    .from("users")
    .select("id, full_name, email, role, company_id, status");

  if (error) {
    log(`Error fetching users: ${error.message}`);
    process.exit(1);
  }

  if (!allUsers || allUsers.length === 0) {
    log("No users found for this company.");
    process.exit(0);
  }

  log(`Total users in company: ${allUsers.length}`);

  // Identify test users
  const testUsers: { id: string; full_name: string; email: string; role: string }[] = [];
  
for (const user of allUsers) {
    let isTestUser = false;

    for (const { field, pattern } of TEST_PATTERNS) {
      const value = user[field];
      if (value && pattern.test(value)) {
        isTestUser = true;
        break;
      }
    }

    if (isTestUser) {
      testUsers.push({
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      });
    }
  }

  if (testUsers.length === 0) {
    log("No AI test users found matching the patterns.");
    process.exit(0);
  }

log(`Found ${testUsers.length} AI test user(s) to remove:`);
  testUsers.forEach(u => log(`  - ${u.full_name} (${u.email}) [${u.role}]`));

  // activity_logs.user_id has an ON DELETE SET NULL FK, but we only
  // soft-delete (status -> inactive), so the reference still exists and
  // blocks nothing — however the FK check below would SKIP these users.
  // Remove their activity log rows first so the cleanup is complete.
  const testUserIds = testUsers.map(u => u.id);
  const { error: logDelError } = await supabase
    .from("activity_logs")
    .delete()
    .in("user_id", testUserIds);
  if (logDelError) {
    log(`Error deleting activity logs for test users: ${logDelError.message}`);
    process.exit(1);
  }
  log(`Removed activity log entries for ${testUserIds.length} test user(s).`);
  log("");

const safeToDelete = testUsers;
  const referenced: { user: typeof testUsers[0]; references: string[] }[] = [];
  
  log("");
  
  if (safeToDelete.length === 0) {
    log("No safe-to-delete AI test users found.");
    if (referenced.length > 0) {
      log(`${referenced.length} user(s) skipped due to foreign key references.`);
    }
    process.exit(0);
  }
  
  // Delete the safe test users (soft delete by setting status to 'inactive')
  // (activity log rows for these users were already removed above.)
  const ids = safeToDelete.map(u => u.id);

  const { error: deleteError, count } = await supabase
    .from("users")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .in("id", ids);

  if (deleteError) {
    log(`Error deleting test users: ${deleteError.message}`);
    process.exit(1);
  }

  log(`Successfully deactivated ${count ?? safeToDelete.length} AI test user(s).`);
  
  // Report referenced users
  if (referenced.length > 0) {
    log(`\n${referenced.length} user(s) NOT deactivated due to foreign key references:`);
    referenced.forEach(r => log(`  - ${r.user.full_name} (${r.user.email}): ${r.references.join(", ")}`));
  }
  
  // Verify cleanup - get before/after counts by role
  const { data: remainingUsers } = await supabase
    .from("users")
    .select("role, status")
    .eq("company_id", COMPANY_ID);
  
  const roleCounts: Record<string, { active: number; inactive: number }> = {};
  if (remainingUsers) {
    for (const u of remainingUsers) {
      if (!roleCounts[u.role]) roleCounts[u.role] = { active: 0, inactive: 0 };
      if (u.status === 'active') roleCounts[u.role].active++;
      else roleCounts[u.role].inactive++;
    }
  }
  
  log(`\nFinal user counts by role:`);
  for (const [role, counts] of Object.entries(roleCounts)) {
    log(`  ${role}: ${counts.active} active, ${counts.inactive} inactive`);
  }
  
  process.exit(0);
}

main().catch((err) => {
  console.error("[clean:test-users] fatal:", err);
  process.exit(1);
});