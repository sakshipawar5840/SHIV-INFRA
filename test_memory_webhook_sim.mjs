import { saveConversation, getConversationHistory } from './backend/ai-engine/memory.ts';

async function test() {
  console.log('Testing saveConversation with valid UUID...');
  await saveConversation({
    userId: '40d7f92f-29fc-4661-baeb-61eadbbd1739',
    companyId: '3e9e9ae1-8593-473f-9aa3-9bcee469d795',
    phone: '9999999999',
    role: 'USER',
    message: 'Webhook simulation test at ' + new Date().toISOString(),
    channel: 'WHATSAPP'
  });

  console.log('Testing getConversationHistory...');
  const history = await getConversationHistory('3e9e9ae1-8593-473f-9aa3-9bcee469d795', 5);
  console.log('History count:', history.length);
  console.log('Latest:', JSON.stringify(history[0], null, 2));
}

test().catch(console.error);
