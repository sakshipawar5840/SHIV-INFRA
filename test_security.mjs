import http from 'http';

function sendMessage(text, messageId, phone = '9999999998', role = 'CUSTOMER') {
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
  console.log('=== Security Test: Customer Restricted Operation ===\n');
  
  const result = await sendMessage('Create project called Restricted', 'wamid.security.' + Date.now(), '9876543210', 'CUSTOMER');
  console.log(result);
}

main().catch(console.error);
