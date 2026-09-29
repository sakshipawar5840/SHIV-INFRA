import { chromium } from 'playwright';
import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
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

function makeRequest(path: string, method: string, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const data = body ? JSON.stringify(body) : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (data) {
      headers['Content-Length'] = String(Buffer.byteLength(data));
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

async function registerTestUser(): Promise<{email: string, password: string}> {
  const timestamp = Date.now();
  const email = `browser-test-${timestamp}@shivinfra.com`;
  const password = 'BrowserTest123!';
  
  console.log(`  Registering test user: ${email}`);
  const res = await makeRequest('/api/v1/auth/register', 'POST', {
    company_id: '3e9e9ae1-8593-473f-9aa3-9bcee469d795',
    name: 'Browser Test Admin',
    email,
    password,
    phone: '919999' + timestamp,
    role: 'admin'
  });
  
  if (res.status === 201) {
    console.log('  Registration successful');
    return { email, password };
  }
  
  console.log(`  Registration failed: ${res.status} - ${JSON.stringify(res.data).substring(0, 200)}`);
  throw new Error(`Registration failed: ${res.status}`);
}

async function login(page: any, email: string, password: string): Promise<boolean> {
  console.log(`\n--- Browser Login ---`);
  console.log(`  Email: ${email}`);
  
  console.log(`  Verifying API login...`);
  const apiLoginRes = await makeRequest('/api/v1/auth/login', 'POST', {
    email,
    password
  });
  console.log(`  API login status: ${apiLoginRes.status}`);
  
  console.log(`  Setting admin email in localStorage...`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate((e) => {
    localStorage.setItem('admin_email', JSON.stringify(e));
  }, email);
  
  console.log(`  Reloading page...`);
  await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
  
  let loginSuccess = false;
  page.on('response', async (response) => {
    if (response.url().includes('/api/v1/auth/login')) {
      try {
        const data = await response.json();
        if (data.success) {
          loginSuccess = true;
          console.log(`  Playwright login API: SUCCESS`);
        } else {
          console.log(`  Playwright login API: FAIL - ${data.message || data.error}`);
        }
      } catch {
        console.log(`  Playwright login API: non-JSON response`);
      }
    }
  });
  
  const passwordInput = await page.locator('input[type="password"]').first();
  const inputCount = await passwordInput.count();
  console.log(`  Password input count: ${inputCount}`);
  
  if (inputCount === 0) {
    console.log('  No password input found on page');
    return false;
  }
  
  console.log(`  Filling password...`);
  await passwordInput.fill(password);
  
  console.log(`  Clicking submit...`);
  await page.click('button[type="submit"]');
  
  console.log(`  Waiting for dashboard to load...`);
  await page.waitForSelector('text=Enterprise Dashboard', { timeout: 10000 });
  
  const dashboardVisible = await page.locator('text=Enterprise Dashboard').count() > 0;
  const sidebarVisible = await page.locator('text=SHIV INFRA AI').count() > 0;
  
  console.log(`  Dashboard visible: ${dashboardVisible}`);
  console.log(`  Sidebar visible: ${sidebarVisible}`);
  
  return dashboardVisible && sidebarVisible;
}

async function closeModal(page: any) {
  try {
    await page.locator('button:has-text("Cancel")').last().click({ timeout: 3000 });
  } catch {
    await page.evaluate(() => {
      const modals = document.querySelectorAll('.fixed.inset-0.z-50');
      modals.forEach(el => el.remove());
    });
  }
  await page.waitForTimeout(500);
}

async function testProjectEmptyValidation(page: any, apiRequests: string[]): Promise<boolean> {
  console.log('\n--- Test: Project Empty Validation ---');
  apiRequests.length = 0;
  
  await page.click('text=Projects');
  await page.waitForTimeout(2000);
  await page.click('button:has-text("Add Project")');
  await page.waitForTimeout(2000);

  const modalVisible = await page.locator('text=Register Construction Project').count() > 0;
  console.log(`  Modal opened: ${modalVisible}`);

  if (modalVisible) {
    const nameInput = await page.locator('input[placeholder*="Skyline"]').first();
    const nameValue = await nameInput.inputValue();
    console.log(`  Project Name empty: ${nameValue === ''}`);

    await page.click('button:has-text("Save Project")');
    await page.waitForTimeout(2000);

    const validationVisible = await page.locator('text=Project name is required').count() > 0;
    const postRequests = apiRequests.filter(r => r.startsWith('POST'));
    
    console.log(`  Validation visible: ${validationVisible}`);
    console.log(`  POST requests: ${postRequests.length}`);
    
    // Close modal before returning
    await closeModal(page);
    
    return validationVisible && postRequests.length === 0 && nameValue === '';
  }
  return false;
}

async function testLeadEmptyValidation(page: any, apiRequests: string[]): Promise<boolean> {
  console.log('\n--- Test: Lead Empty Validation ---');
  apiRequests.length = 0;
  
  await page.click('text=Leads');
  await page.waitForTimeout(2000);
  await page.click('text=Add CRM Lead');
  await page.waitForTimeout(2000);

  const modalVisible = await page.locator('text=Register CRM Lead').count() > 0;
  console.log(`  Modal opened: ${modalVisible}`);

  if (modalVisible) {
    await page.click('button:has-text("Capture Lead")');
    await page.waitForTimeout(2000);

    const validationVisible = await page.locator('text=Prospect name is required').count() > 0;
    const postRequests = apiRequests.filter(r => r.startsWith('POST'));
    
    console.log(`  Validation visible: ${validationVisible}`);
    console.log(`  POST requests: ${postRequests.length}`);
    
    await closeModal(page);
    
    return validationVisible && postRequests.length === 0;
  }
  return false;
}

async function testDocumentsValidation(page: any, apiRequests: string[]): Promise<boolean> {
  console.log('\n--- Test: Documents Validation ---');
  apiRequests.length = 0;
  
  await page.click('text=Documents');
  await page.waitForTimeout(2000);
  await page.click('text=Upload Document');
  await page.waitForTimeout(2000);

  const modalVisible = await page.locator('text=Upload PDF Legal Approval / Blueprint').count() > 0;
  console.log(`  Modal opened: ${modalVisible}`);

  if (modalVisible) {
    await page.click('button:has-text("Secure Upload")');
    await page.waitForTimeout(2000);

    const validationVisible = await page.locator('text=required').count() > 0;
    const postRequests = apiRequests.filter(r => r.startsWith('POST'));
    
    console.log(`  Validation visible: ${validationVisible}`);
    console.log(`  POST requests: ${postRequests.length}`);
    
    await closeModal(page);
    
    return validationVisible && postRequests.length === 0;
  }
  return false;
}

async function testBillsValidation(page: any, apiRequests: string[]): Promise<boolean> {
  console.log('\n--- Test: Bills Validation ---');
  apiRequests.length = 0;
  
  await page.click('text=Bills');
  await page.waitForTimeout(2000);
  await page.click('text=Upload Bill');
  await page.waitForTimeout(2000);

  const modalVisible = await page.locator('text=Upload Materials Receipt').count() > 0;
  console.log(`  Modal opened: ${modalVisible}`);

  if (modalVisible) {
    await page.click('button:has-text("Confirm Invoice Approval")');
    await page.waitForTimeout(2000);

    const validationVisible = await page.locator('text=required').count() > 0;
    const postRequests = apiRequests.filter(r => r.startsWith('POST'));
    
    console.log(`  Validation visible: ${validationVisible}`);
    console.log(`  POST requests: ${postRequests.length}`);
    
    await closeModal(page);
    
    return validationVisible && postRequests.length === 0;
  }
  return false;
}

async function testVendorsValidation(page: any, apiRequests: string[]): Promise<boolean> {
  console.log('\n--- Test: Vendors Validation ---');
  apiRequests.length = 0;
  
  await page.click('text=Vendors');
  await page.waitForTimeout(2000);
  await page.click('text=Add Vendor');
  await page.waitForTimeout(2000);

  const modalVisible = await page.locator('text=Register Supplier/Vendor Profile').count() > 0;
  console.log(`  Modal opened: ${modalVisible}`);

  if (modalVisible) {
    await page.click('button:has-text("Register Supplier")');
    await page.waitForTimeout(2000);

    const validationVisible = await page.locator('text=required').count() > 0;
    const postRequests = apiRequests.filter(r => r.startsWith('POST'));
    
    console.log(`  Validation visible: ${validationVisible}`);
    console.log(`  POST requests: ${postRequests.length}`);
    
    await closeModal(page);
    
    return validationVisible && postRequests.length === 0;
  }
  return false;
}

async function testInventoryValidation(page: any, apiRequests: string[]): Promise<boolean> {
  console.log('\n--- Test: Inventory Validation ---');
  apiRequests.length = 0;
  
  await page.click('text=Inventory');
  await page.waitForTimeout(2000);
  await page.click('text=Record Shipment');
  await page.waitForTimeout(2000);

  const modalVisible = await page.locator('text=Record Incoming Shipment').count() > 0;
  console.log(`  Modal opened: ${modalVisible}`);

  if (modalVisible) {
    await page.click('button:has-text("Log Entry")');
    await page.waitForTimeout(2000);

    const validationVisible = await page.locator('text=required').count() > 0;
    const postRequests = apiRequests.filter(r => r.startsWith('POST'));
    
    console.log(`  Validation visible: ${validationVisible}`);
    console.log(`  POST requests: ${postRequests.length}`);
    
    await closeModal(page);
    
    return validationVisible && postRequests.length === 0;
  }
  return false;
}

async function testTasksValidation(page: any, apiRequests: string[]): Promise<boolean> {
  console.log('\n--- Test: Tasks Validation ---');
  apiRequests.length = 0;
  
  await page.click('text=Tasks');
  await page.waitForTimeout(2000);
  await page.click('text=New Task');
  await page.waitForTimeout(2000);

  const modalVisible = await page.locator('text=Log Task Milestone').count() > 0;
  console.log(`  Modal opened: ${modalVisible}`);

  if (modalVisible) {
    await page.click('button:has-text("Record Task")');
    await page.waitForTimeout(2000);

    const validationVisible = await page.locator('text=required').count() > 0;
    const postRequests = apiRequests.filter(r => r.startsWith('POST'));
    
    console.log(`  Validation visible: ${validationVisible}`);
    console.log(`  POST requests: ${postRequests.length}`);
    
    await closeModal(page);
    
    return validationVisible && postRequests.length === 0;
  }
  return false;
}

async function testSiteVisitsValidation(page: any, apiRequests: string[]): Promise<boolean> {
  console.log('\n--- Test: Site Visits Validation ---');
  apiRequests.length = 0;
  
  await page.click('text=Site Visits');
  await page.waitForTimeout(2000);
  await page.click('text=Book Walkthrough');
  await page.waitForTimeout(2000);

  const modalVisible = await page.locator('text=Book Site Inspection Visit').count() > 0;
  console.log(`  Modal opened: ${modalVisible}`);

  if (modalVisible) {
    await page.locator('button:has-text("Book Walkthrough")').last().click({ force: true });
    await page.waitForTimeout(2000);

    const validationVisible = await page.locator('text=required').count() > 0;
    const postRequests = apiRequests.filter(r => r.startsWith('POST'));
    
    console.log(`  Validation visible: ${validationVisible}`);
    console.log(`  POST requests: ${postRequests.length}`);
    
    await closeModal(page);
    
    return validationVisible && postRequests.length === 0;
  }
  return false;
}

async function testCustomersValidation(page: any, apiRequests: string[]): Promise<boolean> {
  console.log('\n--- Test: Customers Validation ---');
  apiRequests.length = 0;
  
  await page.click('text=Customers');
  await page.waitForTimeout(2000);
  await page.click('text=Add Customer');
  await page.waitForTimeout(2000);

  const modalVisible = await page.locator('text=Register Customer Profile').count() > 0;
  console.log(`  Modal opened: ${modalVisible}`);

  if (modalVisible) {
    await page.click('button:has-text("Save Customer")');
    await page.waitForTimeout(2000);

    const validationVisible = await page.locator('text=required').count() > 0;
    const postRequests = apiRequests.filter(r => r.startsWith('POST'));
    
    console.log(`  Validation visible: ${validationVisible}`);
    console.log(`  POST requests: ${postRequests.length}`);
    
    await closeModal(page);
    
    return validationVisible && postRequests.length === 0;
  }
  return false;
}

async function testUsersValidation(page: any, apiRequests: string[]): Promise<boolean> {
  console.log('\n--- Test: Users Validation ---');
  apiRequests.length = 0;
  
  await page.click('text=Users');
  await page.waitForTimeout(2000);
  await page.click('text=Invite Member');
  await page.waitForTimeout(2000);

  const modalVisible = await page.locator('text=Add Executive Employee Access').count() > 0;
  console.log(`  Modal opened: ${modalVisible}`);

  if (modalVisible) {
    await page.click('button:has-text("Grant Access")');
    await page.waitForTimeout(2000);

    const validationVisible = await page.locator('text=required').count() > 0;
    const postRequests = apiRequests.filter(r => r.startsWith('POST'));
    
    console.log(`  Validation visible: ${validationVisible}`);
    console.log(`  POST requests: ${postRequests.length}`);
    
    await closeModal(page);
    
    return validationVisible && postRequests.length === 0;
  }
  return false;
}

async function runTests() {
  console.log('Starting SHIVINFRA authenticated browser verification...');
  await waitForServer(BASE_URL);

  let testCredentials;
  try {
    console.log('\n--- Registering Test User ---');
    testCredentials = await registerTestUser();
  } catch (e) {
    console.log(`Registration FAIL: ${e}`);
    console.log('Cannot proceed without valid credentials');
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results: Record<string, boolean> = {};
  const apiRequests: string[] = [];

  page.on('request', (request) => {
    const url = request.url();
    if (url.includes('/api/') || url.includes('/auth/') || url.includes('/projects') || url.includes('/leads') || url.includes('/customers') || url.includes('/bills') || url.includes('/documents') || url.includes('/tasks') || url.includes('/site-visits') || url.includes('/inventory') || url.includes('/vendors')) {
      apiRequests.push(`${request.method()} ${url}`);
    }
  });

  const loggedIn = await login(page, testCredentials.email, testCredentials.password);
  console.log(`\nAuthenticated login: ${loggedIn ? 'PASS' : 'FAIL'}`);
  results.authenticatedLogin = loggedIn;

  if (!loggedIn) {
    console.log('Cannot proceed with form tests - login failed');
    await browser.close();
    console.log('\n=== SUMMARY ===');
    console.log('authenticatedLogin: FAIL');
    return;
  }

  // Project
  results.projectValidation = await testProjectEmptyValidation(page, apiRequests);
  console.log(`Project: ${results.projectValidation ? 'PASS' : 'FAIL'}`);

  // Lead
  results.leadValidation = await testLeadEmptyValidation(page, apiRequests);
  console.log(`Lead: ${results.leadValidation ? 'PASS' : 'FAIL'}`);

  // Documents
  results.documentsValidation = await testDocumentsValidation(page, apiRequests);
  console.log(`Documents: ${results.documentsValidation ? 'PASS' : 'FAIL'}`);

  // Bills
  results.billsValidation = await testBillsValidation(page, apiRequests);
  console.log(`Bills: ${results.billsValidation ? 'PASS' : 'FAIL'}`);

  // Vendors
  results.vendorsValidation = await testVendorsValidation(page, apiRequests);
  console.log(`Vendors: ${results.vendorsValidation ? 'PASS' : 'FAIL'}`);

  // Inventory
  results.inventoryValidation = await testInventoryValidation(page, apiRequests);
  console.log(`Inventory: ${results.inventoryValidation ? 'PASS' : 'FAIL'}`);

  // Tasks
  results.tasksValidation = await testTasksValidation(page, apiRequests);
  console.log(`Tasks: ${results.tasksValidation ? 'PASS' : 'FAIL'}`);

  // Site Visits
  results.siteVisitsValidation = await testSiteVisitsValidation(page, apiRequests);
  console.log(`Site Visits: ${results.siteVisitsValidation ? 'PASS' : 'FAIL'}`);

  // Customers
  results.customersValidation = await testCustomersValidation(page, apiRequests);
  console.log(`Customers: ${results.customersValidation ? 'PASS' : 'FAIL'}`);

  // Users
  results.usersValidation = await testUsersValidation(page, apiRequests);
  console.log(`Users: ${results.usersValidation ? 'PASS' : 'FAIL'}`);

  await browser.close();

  console.log('\n=== SUMMARY ===');
  for (const [test, result] of Object.entries(results)) {
    console.log(`${test}: ${result ? 'PASS' : 'FAIL'}`);
  }

  const allPassed = Object.values(results).every(v => v);
  console.log(`\nFINAL: ${allPassed ? 'ALL PASS' : 'SOME FAILED'}`);
}

runTests().catch(e => {
  console.error('Test runner failed:', e);
  process.exit(1);
});
