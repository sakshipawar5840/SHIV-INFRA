import http from 'http';

function sendMessage(text, messageId, phone = '9999999999', role = 'ADMIN') {
  const payload = {
    object: "whatsapp_business_account",
    entry: [{
      id: "test",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "+15551234567",
            phone_number_id: "111111111111111"
          },
          contacts: [{
            profile: {
              name: role === 'ADMIN' ? 'Admin User' : 'Customer User'
            },
            wa_id: phone
          }],
          messages: [{
            from: phone,
            id: messageId,
            timestamp: String(Math.floor(Date.now() / 1000)),
            text: {
              body: text
            },
            type: "text"
          }]
        }
      }]
    }]
  };

  const data = JSON.stringify(payload);

  const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/v1/whatsapp/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => resolve(body));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== LLM Conversation Test ===\n');

  const ts = Date.now();
  
  console.log('Test 1: General greeting');
  const r1 = await sendMessage('Hello', 'wamid.llm.' + ts + '.1');
  console.log(r1);

  console.log('\nTest 2: What can you do?');
  const r2 = await sendMessage('What can you do?', 'wamid.llm.' + ts + '.2');
  console.log(r2);

  console.log('\nTest 3: General question');
  const r3 = await sendMessage('Explain home loan', 'wamid.llm.' + ts + '.3');
  console.log(r3);
}

main().catch(console.error);
