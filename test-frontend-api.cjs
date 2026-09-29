const http = require('http');

const BASE = 'http://localhost:3000/api/v1';

function request(method, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + urlPath);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
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

async function main() {
  // Login to get fresh token
  const login = await request('POST', '/auth/login', {
    email: 'projecttest@shivinfra.com',
    password: 'testpass123'
  });
  const token = login.body.token;
  console.log('Login:', login.status, login.body.success);
  if (!token) {
    console.log('No token received, aborting');
    return;
  }

  // Test Dashboard
  console.log('\n=== Dashboard ===');
  const dashRes = await request('GET', '/dashboard', null, token);
  console.log('Status:', dashRes.status);
  if (dashRes.status !== 200) {
    console.log('Error:', JSON.stringify(dashRes.body));
  } else {
    console.log('Projects:', dashRes.body?.data?.projects);
    console.log('Customers:', dashRes.body?.data?.customers);
    console.log('Leads:', dashRes.body?.data?.leads);
    console.log('Bills:', dashRes.body?.data?.bills);
    console.log('Bills Total:', dashRes.body?.data?.bills_total);
    console.log('Expenses:', dashRes.body?.data?.expenses);
    console.log('Expenses Total:', dashRes.body?.data?.expenses_total);
    console.log('Total Outflow:', dashRes.body?.data?.total_outflow);
  }

  // Test Reports - Financial Summary
  console.log('\n=== Reports Financial Summary ===');
  const finRes = await request('GET', '/reports/financial-summary', null, token);
  console.log('Status:', finRes.status);
  if (finRes.status !== 200) {
    console.log('Error:', JSON.stringify(finRes.body));
  } else {
    console.log('Has summary:', !!finRes.body?.data?.summary);
    console.log('Summary count:', finRes.body?.data?.summary?.length);
  }

  // Test Reports - Bills
  console.log('\n=== Reports Bills ===');
  const billsRes = await request('GET', '/reports/bills', null, token);
  console.log('Status:', billsRes.status);
  if (billsRes.status !== 200) {
    console.log('Error:', JSON.stringify(billsRes.body));
  } else {
    console.log('Has bills:', !!billsRes.body?.data?.bills);
    console.log('Bills count:', billsRes.body?.data?.bills?.length);
  }

  // Test Reports - Expenses
  console.log('\n=== Reports Expenses ===');
  const expRes = await request('GET', '/reports/expenses', null, token);
  console.log('Status:', expRes.status);
  if (expRes.status !== 200) {
    console.log('Error:', JSON.stringify(expRes.body));
  } else {
    console.log('Has expenses:', !!expRes.body?.data?.expenses);
    console.log('Expenses count:', expRes.body?.data?.expenses?.length);
  }

  // Test Reports - Project Financial (use first project from financial summary)
  if (finRes.body?.data?.summary?.length > 0) {
    const projectId = finRes.body.data.summary[0].project_id;
    console.log('\n=== Reports Project Financial ===');
    const projRes = await request('GET', `/reports/project/${projectId}`, null, token);
    console.log('Status:', projRes.status);
    if (projRes.status !== 200) {
      console.log('Error:', JSON.stringify(projRes.body));
    } else {
      console.log('Project:', projRes.body?.data?.project?.project_name);
      console.log('Combined total:', projRes.body?.data?.combined_total);
    }
  }

  // Test Reports - Excel Export
  console.log('\n=== Reports Excel Export ===');
  const excelRes = await request('GET', '/reports/generate?type=FinancialSummary&format=Excel', null, token);
  console.log('Status:', excelRes.status);
  if (excelRes.status !== 200) {
    console.log('Error:', JSON.stringify(excelRes.body));
  } else {
    console.log('Content-Type:', excelRes.headers?.['content-type']);
  }

  // Test Reports - PDF Export
  console.log('\n=== Reports PDF Export ===');
  const pdfRes = await request('GET', '/reports/generate?type=FinancialSummary&format=PDF', null, token);
  console.log('Status:', pdfRes.status);
  if (pdfRes.status !== 200) {
    console.log('Error:', JSON.stringify(pdfRes.body));
  } else {
    console.log('Content-Type:', pdfRes.headers?.['content-type']);
  }
}

main().catch(console.error);
