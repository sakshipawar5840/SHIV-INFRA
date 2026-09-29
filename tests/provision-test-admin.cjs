const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'browser-test-admin@shivinfra.local';
const TEST_PASSWORD = 'BrowserTest123!';

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

async function provisionTestAdmin() {
  console.log('Provisioning test admin account...');
  
  // Try to register
  try {
    const registerRes = await makeRequest('/api/v1/auth/register', 'POST', {
      company_id: '3e9e9ae1-8593-473f-9aa3-9bcee469d795',
      name: 'Browser Test Admin',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      phone: '9199990000000',
      role: 'admin'
    });
    
    console.log(`Register response: ${registerRes.status}`);
    
    if (registerRes.status === 201) {
      console.log('Test admin account created successfully');
      return { email: TEST_EMAIL, password: TEST_PASSWORD };
    }
    
    if (registerRes.status === 400 && registerRes.data.message === 'Email already exists') {
      console.log('Test admin account already exists');
      return { email: TEST_EMAIL, password: TEST_PASSWORD };
    }
  } catch (e) {
    console.log(`Registration error: ${e}`);
  }
  
  // Try to login to verify credentials work
  try {
    const loginRes = await makeRequest('/api/v1/auth/login', 'POST', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    console.log(`Login test response: ${loginRes.status}`);
    
    if (loginRes.status === 200 && loginRes.data.success) {
      console.log('Test admin credentials verified');
      return { email: TEST_EMAIL, password: TEST_PASSWORD };
    }
  } catch (e) {
    console.log(`Login test error: ${e}`);
  }
  
  throw new Error('Failed to provision test admin account');
}

async function runProvisioning() {
  console.log('Starting test admin provisioning...');
  await waitForServer(BASE_URL);
  
  try {
    const credentials = await provisionTestAdmin();
    console.log('\n=== TEST CREDENTIALS ===');
    console.log(`Email: ${credentials.email}`);
    console.log(`Password: ${credentials.password}`);
    console.log('\nUse these in Playwright tests:');
    console.log(`$env:TEST_ADMIN_EMAIL="${credentials.email}"`);
    console.log(`$env:TEST_ADMIN_PASSWORD="${credentials.password}"`);
  } catch (e) {
    console.log(`Provisioning FAIL: ${e}`);
    process.exit(1);
  }
}

runProvisioning();
