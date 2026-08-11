import http from 'http';

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
            name: "Admin User"
          },
          wa_id: "9999999999"
        }],
        messages: [{
          from: "9999999999",
          id: "wamid.mem.test",
          timestamp: String(Math.floor(Date.now() / 1000)),
          text: {
            body: "Show me all projects"
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

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => console.log(body));
});
req.on('error', (e) => console.error(e));
req.write(data);
req.end();
