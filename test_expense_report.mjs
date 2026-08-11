import http from 'http';

function callAPI(path, method, body, token) {
  const data = body ? JSON.stringify(body) : null;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path,
    method,
    headers
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getAdminToken() {
  const res = await callAPI('/api/v1/auth/login', 'POST', {
    email: 'admin@test.com',
    password: 'admin123'
  });
  const parsed = JSON.parse(res.body);
  return parsed.data && parsed.data.token ? parsed.data.token : parsed.token;
}

async function main() {
  console.log('=== Test Expense & Report API ===\n');
  const token = await getAdminToken();
  console.log('Admin token obtained:', !!token);

  // Test 1: Create expense
  console.log('\nTest 1: Create expense');
  const createRes = await callAPI('/api/v1/expenses', 'POST', {
    expense_category: 'Material',
    expense_title: 'Test Expense',
    amount: 5000,
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash'
  }, token);
  console.log('Create expense status:', createRes.status);
  console.log('Create expense body:', createRes.body.substring(0, 300));

  // Test 2: Get expenses
  console.log('\nTest 2: Get expenses');
  const getRes = await callAPI('/api/v1/expenses?company_id=3e9e9ae1-8593-473f-9aa3-9bcee469d795', 'GET', null, token);
  console.log('Get expenses status:', getRes.status);
  console.log('Get expenses body:', getRes.body.substring(0, 300));

  // Test 3: Generate report
  console.log('\nTest 3: Generate Finance report (PDF)');
  const reportRes = await callAPI('/api/v1/reports/generate?type=Finance&format=PDF', 'GET', null, token);
  console.log('Report status:', reportRes.status);
  if (reportRes.status === 200) {
    console.log('Report generated successfully');
  } else {
    console.log('Report body:', reportRes.body.substring(0, 300));
  }
}

main().catch(console.error);
