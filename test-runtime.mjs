import https from 'https';
import http from 'http';

const BASE = 'http://localhost:3000';
let token = '';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
  } catch (err) {
    console.log(`❌ FAIL: ${name} - ${err.message}`);
  }
}

async function main() {
  // Login
  const loginRes = await request('POST', '/api/v1/auth/login', {
    email: 'test@shivinfra.com',
    password: 'test123',
  });
  if (loginRes.body.success) {
    token = loginRes.body.token;
    console.log('🔑 Logged in as admin');
  } else {
    console.log('❌ Login failed:', loginRes.body);
    return;
  }

  const companyId = '3e9e9ae1-8593-473f-9aa3-9bcee469d795';

  // Test 1: Add Project
  await test('Add Project', async () => {
    const res = await request('POST', '/api/v1/projects', {
      company_id: companyId,
      project_name: 'Test Project Alpha',
      location: 'Baner, Pune',
      city: 'Pune',
      price: 7500000,
      flat_type: '2 BHK',
      status: 'Ongoing',
    });
    if (!res.body.success) throw new Error(res.body.message || 'Project creation failed');
  });

  // Test 2: Search Project
  await test('Search Project', async () => {
    const res = await request('GET', '/api/v1/projects?search=Test Project Alpha');
    if (!res.body.success || !Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error('No projects found');
    }
  });

  // Test 3: Add Customer
  await test('Add Customer', async () => {
    const res = await request('POST', '/api/v1/customers', {
      company_id: companyId,
      full_name: 'Test Customer',
      phone: '+919876543211',
      email: 'customer@test.com',
      city: 'Pune',
    });
    if (!res.body.success) throw new Error(res.body.message || 'Customer creation failed');
  });

  // Test 4: Search Customer
  await test('Search Customer', async () => {
    const res = await request('GET', '/api/v1/customers?search=Test Customer');
    if (!res.body.success || !Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error('No customers found');
    }
  });

  // Test 5: Add Lead
  await test('Add Lead', async () => {
    const res = await request('POST', '/api/v1/leads', {
      company_id: companyId,
      requirement: 'Looking for 3 BHK in Baner',
      budget: 12000000,
      preferred_location: 'Baner',
      status: 'New',
    });
    if (!res.body.success) throw new Error(res.body.message || 'Lead creation failed');
  });

  // Test 6: Search Lead
  await test('Search Lead', async () => {
    const res = await request('GET', '/api/v1/leads?search=Baner');
    if (!res.body.success || !Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error('No leads found');
    }
  });

  // Test 7: Add Expense
  await test('Add Expense', async () => {
    const res = await request('POST', '/api/v1/expenses', {
      company_id: companyId,
      expense_title: 'Test Expense',
      amount: 5000,
      expense_date: '2026-08-18',
      expense_category: 'Material',
      payment_method: 'Cash',
    });
    if (!res.body.success) throw new Error(res.body.message || 'Expense creation failed');
  });

  // Test 8: Search Expense
  await test('Search Expense', async () => {
    const res = await request('GET', '/api/v1/expenses?search=Test Expense');
    if (!res.body.success || !Array.isArray(res.body.data) || res.body.data.length === 0) {
      throw new Error('No expenses found');
    }
  });

  // Test 9: AI General Chat
  await test('AI General Chat', async () => {
    const res = await request('POST', '/api/v1/ai/chat', {
      message: 'What is GST?',
      company_id: companyId,
      role: 'ADMIN',
      channel: 'WEB',
    });
    if (!res.body.success) throw new Error(res.body.message || 'AI chat failed');
  });

  // Test 10: AI Business Question
  await test('AI Business Question (project count)', async () => {
    const res = await request('POST', '/api/v1/ai/chat', {
      message: 'How many projects are there?',
      company_id: companyId,
      role: 'ADMIN',
      channel: 'WEB',
    });
    if (!res.body.success) throw new Error(res.body.message || 'AI business question failed');
  });

  // Test 11: AI Memory (multi-turn)
  await test('AI Memory Multi-turn', async () => {
    const res1 = await request('POST', '/api/v1/ai/chat', {
      message: 'Test Project Alpha',
      company_id: companyId,
      role: 'ADMIN',
      channel: 'WEB',
    });
    if (!res1.body.success) throw new Error('First message failed');

    const res2 = await request('POST', '/api/v1/ai/chat', {
      message: 'What is its price?',
      company_id: companyId,
      role: 'ADMIN',
      channel: 'WEB',
    });
    if (!res2.body.success) throw new Error('Second message failed');
  });

  // Test 12: Generate Report
  await test('Generate Report', async () => {
    const res = await request('GET', '/api/v1/reports/generate?report_type=Finance&file_format=PDF&company_id=' + companyId);
    if (!res.body.success) throw new Error(res.body.message || 'Report generation failed');
  });

  // Test 13: Material Search (Google Places)
  await test('Material Search', async () => {
    const res = await request('POST', '/api/v1/ai/chat', {
      message: 'Find cement suppliers in Baner Pune',
      company_id: companyId,
      role: 'ADMIN',
      channel: 'WEB',
    });
    if (!res.body.success) throw new Error(res.body.message || 'Material search failed');
  });

  // Test 14: Notification routes without auth (should fail)
  await test('Notification route requires auth', async () => {
    const res = await request('GET', '/api/v1/notifications/');
    if (res.status === 200) throw new Error('Notification endpoint should require auth');
  });

  // Test 15: Customer restriction (should be denied for add project)
  // Register customer user
  const custRes = await request('POST', '/api/v1/auth/register', {
    company_id: companyId,
    name: 'Test Customer User',
    email: 'cust@test.com',
    password: 'test123',
    role: 'Customer',
  });
  let custToken = '';
  if (custRes.body.success) {
    const custLogin = await request('POST', '/api/v1/auth/login', {
      email: 'cust@test.com',
      password: 'test123',
    });
    if (custLogin.body.success) {
      custToken = custLogin.body.token;
      token = custToken;

      await test('Customer cannot add project', async () => {
        const res = await request('POST', '/api/v1/projects', {
          company_id: companyId,
          project_name: 'Unauthorized Project',
          location: 'Pune',
        });
        if (res.status === 200 && res.body.success) {
          throw new Error('Customer should not be able to add project');
        }
      });

      await test('Customer can search projects', async () => {
        const res = await request('GET', '/api/v1/projects');
        if (res.status !== 200 || !res.body.success) {
          throw new Error('Customer should be able to search projects');
        }
      });

      // Restore admin token
      token = loginRes.body.token;
    }
  }

  console.log('\n========================================');
  console.log('RUNTIME TESTS COMPLETED');
  console.log('========================================');
}

main().catch(console.error);
