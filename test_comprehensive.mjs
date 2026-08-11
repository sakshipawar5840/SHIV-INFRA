import http from 'http';

function sendMessage(type, mediaId, mimeType, filename, text, phone = '9999999999', role = 'ADMIN') {
  const messageObj = {
    from: phone,
    id: 'wamid.test.' + Date.now() + '.' + Math.random().toString(36).substring(7),
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
  console.log('=== SHIVINFRA WHATSAPP AI - COMPREHENSIVE TEST ===\n');

  // Test 1: Admin adds project
  console.log('Test 1: Admin adds project');
  const addProject = await sendMessage('text', undefined, undefined, undefined, 'Create new project called Test Project Alpha with price 50 lakh');
  console.log(addProject);

  // Test 2: Admin searches projects
  console.log('\nTest 2: Admin searches projects');
  const searchProjects = await sendMessage('text', undefined, undefined, undefined, 'Show me all projects');
  console.log(searchProjects);

  // Test 3: Admin updates project price
  console.log('\nTest 3: Admin updates project price');
  const updateProject = await sendMessage('text', undefined, undefined, undefined, 'Test Project Alpha cha price 60 lakh kar');
  console.log(updateProject);

  // Test 4: Admin deletes project
  console.log('\nTest 4: Admin deletes project');
  const deleteProject = await sendMessage('text', undefined, undefined, undefined, 'Delete Test Project Alpha');
  console.log(deleteProject);

  // Test 5: Admin confirms delete
  console.log('\nTest 5: Admin confirms delete with YES');
  const confirmDelete = await sendMessage('text', undefined, undefined, undefined, 'YES');
  console.log(confirmDelete);

  // Test 6: Customer creates lead
  console.log('\nTest 6: Customer creates lead');
  const createLead = await sendMessage('text', undefined, undefined, undefined, 'Baner madhe 3BHK pahije budget 1.5 crore', '919876543210', 'CUSTOMER');
  console.log(createLead);

  // Test 7: Customer restricted operation
  console.log('\nTest 7: Customer tries restricted operation');
  const restricted = await sendMessage('text', undefined, undefined, undefined, 'Create new project called Restricted', '919876543210', 'CUSTOMER');
  console.log(restricted);

  console.log('\n=== ALL TESTS COMPLETED ===');
}

main().catch(console.error);
