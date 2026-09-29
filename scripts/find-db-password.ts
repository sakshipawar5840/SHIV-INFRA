import { Client } from "pg";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL) {
  console.error("Missing SUPABASE_URL");
  process.exit(1);
}

const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];

const passwords = [
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY,
  projectRef,
  "postgres",
  "password",
  "supabase",
  `${projectRef}123`,
];

const hosts = [
  `db.${projectRef}.supabase.co`,
  `aws-0-ap-southeast-1.pooler.supabase.com`,
  `aws-0-us-east-1.pooler.supabase.com`,
  `aws-0-eu-west-1.pooler.supabase.com`,
];

async function tryConnect(host: string, password: string): Promise<boolean> {
  const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@${host}:5432/postgres?sslmode=require`;
  const client = new Client({ connectionString });
  try {
    await client.connect();
    await client.query("SELECT 1");
    await client.end();
    console.log(`SUCCESS: ${host} with password length ${password.length}`);
    return true;
  } catch (error: any) {
    return false;
  }
}

async function main() {
  for (const host of hosts) {
    for (const password of passwords) {
      const ok = await tryConnect(host, password);
      if (ok) {
        console.log(`Found working connection: ${host}`);
        process.exit(0);
      }
    }
  }
  console.log("No working connection found with tried passwords.");
  process.exit(1);
}

main();
