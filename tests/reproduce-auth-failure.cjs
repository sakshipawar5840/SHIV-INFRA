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

async function reproduceFailure() {
  await waitForServer(BASE_URL);
  
  const timestamp = Date.now();
  const email = `browser-auth-test-${timestamp}@shivinfra.local`;
  const password = 'BrowserTest123!';
  
  console.log('=== REPRODUCING AUTH FAILURE ===');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  
  // Step 1: Register
  console.log('\n--- Step 1: Register ---');
  const registerRes = await makeRequest('/api/v1/auth/register', 'POST', {
    company_id: '3e9e9ae1-8593-473f-9aa3-9bcee469d795',
    name: 'Auth Test Admin',
    email,
    password,
    phone: '919999' + timestamp,
    role: 'admin'
  });
  
  console.log(`Status: ${registerRes.status}`);
  console.log(`Body: ${JSON.stringify(registerRes.data).substring(0, 300)}`);
  
  if (registerRes.status !== 201) {
    console.log('\nRegistration failed, cannot reproduce');
    return;
  }
  
  // Step 2: Immediate login with SAME credentials
  console.log('\n--- Step 2: Login (same credentials) ---');
  const loginRes = await makeRequest('/api/v1/auth/login', 'POST', {
    email,
    password
  });
  
  console.log(`Status: ${loginRes.status}`);
  console.log(`Body: ${JSON.stringify(loginRes.data).substring(0, 300)}`);
  
  if (loginRes.status === 200) {
    console.log('\n=== RESULT: LOGIN SUCCEEDED (no mismatch) ===');
  } else {
    console.log('\n=== RESULT: LOGIN FAILED (mismatch confirmed) ===');
  }
}

reproduceFailure();
