import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BASE_URL = "http://localhost:3000";

function uniqueId(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
}

async function webhook(payload: any) {
  const res = await fetch(`${BASE_URL}/api/v1/whatsapp/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

async function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function main() {
  const log: string[] = [];
  log.push("=== TASK 5: MOCK-MODE END-TO-END SIMULATION ===");

  // TEST 1: Admin adds project
  log.push("\n--- Test 1: Admin sends 'Add project' ---");
  const test1Payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "entry1",
        changes: [
          {
            value: {
              messages: [
                {
                  from: "91999920260816104158",
                  id: uniqueId("wamid.admin"),
                  type: "text",
                  text: { body: "Add project Green Valley in Hadapsar Pune, 2BHK and 3BHK, 1200 sqft, 85 lakh" },
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const test1Result = await webhook(test1Payload);
  log.push(`Webhook response: ${test1Result.status} ${test1Result.body}`);
  await sleep(30);

  const { data: projectsAfter } = await supabase
    .from("projects")
    .select("*")
    .eq("company_id", "3e9e9ae1-8593-473f-9aa3-9bcee469d795")
    .ilike("project_name", "%Green Valley%")
    .order("created_at", { ascending: false })
    .limit(3);

  log.push(`Projects after add: ${JSON.stringify(projectsAfter)}`);

  // TEST 2: Customer sends "2BHK Baner pahije"
  log.push("\n--- Test 2: Customer sends '2BHK Baner pahije' ---");
  const test2Payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "entry2",
        changes: [
          {
            value: {
              messages: [
                {
                  from: "9199991234",
                  id: uniqueId("wamid.customer"),
                  type: "text",
                  text: { body: "2BHK Baner pahije" },
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const test2Result = await webhook(test2Payload);
  log.push(`Webhook response: ${test2Result.status} ${test2Result.body}`);
  await sleep(30);

  const { data: leadsAfter } = await supabase
    .from("leads")
    .select("*")
    .eq("company_id", "3e9e9ae1-8593-473f-9aa3-9bcee469d795")
    .ilike("name", "%Baner%")
    .order("created_at", { ascending: false })
    .limit(3);

  log.push(`Leads after customer request: ${JSON.stringify(leadsAfter)}`);

  // TEST 3: Engineer sends bill photo
  log.push("\n--- Test 3: Engineer sends bill photo ---");
  const test3Payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "entry3",
        changes: [
          {
            value: {
              messages: [
                {
                  from: "919876543299",
                  id: uniqueId("wamid.engineer"),
                  type: "document",
                  document: {
                    id: "media-doc-test",
                    mime_type: "application/pdf",
                    filename: "bill-test.pdf",
                  },
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const test3Result = await webhook(test3Payload);
  log.push(`Webhook response: ${test3Result.status} ${test3Result.body}`);
  await sleep(30);

  const { data: billsAfter } = await supabase
    .from("bills")
    .select("*")
    .eq("company_id", "3e9e9ae1-8593-473f-9aa3-9bcee469d795")
    .order("created_at", { ascending: false })
    .limit(3);

  log.push(`Bills after engineer upload: ${JSON.stringify(billsAfter)}`);

  // TEST 4: Customer tries "Delete project"
  log.push("\n--- Test 4: Customer tries 'Delete project' ---");
  const test4Payload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "entry4",
        changes: [
          {
            value: {
              messages: [
                {
                  from: "9199991234",
                  id: uniqueId("wamid.customer.delete"),
                  type: "text",
                  text: { body: "Delete project" },
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const test4Result = await webhook(test4Payload);
  log.push(`Webhook response: ${test4Result.status} ${test4Result.body}`);
  await sleep(30);

  const { data: chatHistory } = await supabase
    .from("chat_history")
    .select("*")
    .eq("phone", "9199991234")
    .order("created_at", { ascending: false })
    .limit(3);

  log.push(`Customer chat history: ${JSON.stringify(chatHistory)}`);

  log.push("\n=== SIMULATION COMPLETE ===");
  console.log(log.join("\n"));
}

main().catch((e) => {
  console.error("Simulation failed:", e);
  process.exit(1);
});
