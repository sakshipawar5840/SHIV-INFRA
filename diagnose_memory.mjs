import { saveConversation, getConversationHistory } from "./backend/ai-engine/memory.ts";

async function test() {
  console.log("Testing saveConversation...");
  await saveConversation({
    userId: "test-user",
    companyId: "3e9e9ae1-8593-473f-9aa3-9bcee469d795",
    phone: "9999999999",
    role: "USER",
    message: "Test message from memory diagnostic at " + new Date().toISOString(),
    channel: "WHATSAPP"
  });

  console.log("Testing getConversationHistory...");
  const history = await getConversationHistory("3e9e9ae1-8593-473f-9aa3-9bcee469d795", 10);
  console.log("History count:", history.length);
  console.log("History:", JSON.stringify(history, null, 2));
}

test().catch(console.error);
