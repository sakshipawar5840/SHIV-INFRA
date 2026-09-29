import customerService from "./backend/services/customerService.ts";
import dotenv from "dotenv";

dotenv.config();

const COMPANY = process.env.DEFAULT_COMPANY_ID || "";
const ID = "3fab7a26-d7cb-4fd0-a1ad-fcdd48b9db2a";

async function run() {
  console.log("Calling updateCustomer with existing id:", ID);
  try {
    const result = await customerService.updateCustomer(ID, COMPANY, {
      phone: "91234567124",
      email: "shivinfra_verify_updated@example.com",
    });
    console.log("UPDATE RESULT:", JSON.stringify(result).slice(0, 300));
  } catch (e: any) {
    console.log("UPDATE THREW:", e.message);
  }
}

run().then(() => process.exit(0)).catch((e) => { console.error("TEST ERROR:", e.message); process.exit(1); });
