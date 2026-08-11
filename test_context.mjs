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
    hostname: 'localhost',
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
  console.log('=== Chat Memory End-to-End Test ===\n');

  const ts = Date.now();
  console.log('Step 1: Admin asks for project list');
  const step1 = await sendMessage('Green Valley dakhav', 'wamid.context.' + ts);
  console.log(step1);

  console.log('\nStep 2: Admin asks follow-up about price');
  const step2 = await sendMessage('tyacha price kay?', 'wamid.context.' + (ts+1));
  console.log(step2);
}

main().catch(console.error);
