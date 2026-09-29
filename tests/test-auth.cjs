const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // ignore
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`);
}

function makeRequest(path, method, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const data = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (data) {
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function testAuth() {
  await waitForServer(BASE_URL);
  
  const timestamp = Date.now();
  const email = `testadmin${timestamp}@shivinfra.com`;
  const password = 'TestPass123!';
  
  console.log('Registering test user...');
  const registerRes = await makeRequest('/api/v1/auth/register', 'POST', {
    company_id: '3e9e9ae1-8593-473f-9aa3-9bcee469d795',
    name: 'Test Admin',
    email,
    password,
    phone: '919999' + timestamp,
    role: 'admin'
  });
  
  console.log(`Register status: ${registerRes.status}`);
  if (registerRes.status === 201) {
    console.log('Registration successful');
  } else {
    console.log('Registration failed:', registerRes.data);
  }
  
  console.log('\nTesting login...');
  const loginRes = await makeRequest('/api/v1/auth/login', 'POST', {
    email,
    password
  });
  
  console.log(`Login status: ${loginRes.status}`);
  if (loginRes.status === 200) {
    console.log('Login successful');
    console.log('Token:', loginRes.data.token ? loginRes.data.token.substring(0, 50) + '...' : 'N/A');
  } else {
    console.log('Login failed:', loginRes.data);
  }
}

testAuth();
