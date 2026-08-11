import http from 'http';
import https from 'https';

function sendMessage(type, mediaId, mimeType, filename, text, phone = '9999999999', role = 'ADMIN') {
  const messageObj = {
    from: phone,
    id: 'wamid.media.' + Date.now(),
    timestamp: String(Math.floor(Date.now() / 1000)),
    type: type
  };

  if (text) {
    messageObj.text = { body: text };
  }

  if (type === 'image' || type === 'document') {
    const mediaObj = {
      id: mediaId,
      mime_type: mimeType
    };
    if (filename) {
      mediaObj.filename = filename;
    }
    messageObj[type] = mediaObj;
  }

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
          messages: [messageObj]
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
  console.log('=== Test 1: Admin uploads bill image ===');
  const billResult = await sendMessage('image', 'media-bill-123', 'image/jpeg', 'bill.jpg', null);
  console.log(billResult);

  console.log('\n=== Test 2: Admin confirms with YES ===');
  const confirmResult = await sendMessage('text', undefined, undefined, undefined, 'YES');
  console.log(confirmResult);

  console.log('\n=== Test 3: Verify bill in database ===');
  const options = {
    hostname: 'wiyakkkuvcwikukmvwol.supabase.co',
    path: '/rest/v1/bills?select=*&order=created_at.desc&limit=1',
    method: 'GET',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpeWFra2t1dmN3aWt1a212d29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzkwMDgsImV4cCI6MjA5ODY1NTAwOH0.oRwuCe8-6F3S-dnNa6R8SLeWtEY5QELejuDL_ADSUQI',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpeWFra2t1dmN3aWt1a212d29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNzkwMDgsImV4cCI6MjA5ODY1NTAwOH0.oRwuCe8-6F3S-dnNa6R8SLeWtEY5QELejuDL_ADSUQI'
    }
  };
  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => console.log(body));
  });
  req.on('error', (e) => console.error(e));
  req.end();
}

main().catch(console.error);
