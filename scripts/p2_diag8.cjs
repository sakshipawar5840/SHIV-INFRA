const { chromium } = require('playwright');
const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { hostname: 'localhost', port: 3000, path, method, headers: { 'Content-Type': 'application/json' } };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

(async () => {
  const login = await req('POST', '/api/v1/auth/login', { email: 'verify-admin@shivinfra.com', password: 'VerifyAdmin_2026!' });
  const token = JSON.parse(login.body).token;
  const user = JSON.parse(login.body).user;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
  const allRequests = [];
  page.on('request', r => { allRequests.push(r.method() + ' ' + r.url()); });
  page.on('requestfailed', r => { errors.push('REQFAIL: ' + r.url() + ' ' + r.failure()?.errorText); });

  try {
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('shiv_infra_active_user', JSON.stringify(user));
      localStorage.setItem('admin_email', JSON.stringify(user.email));
    }, { token, user });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await page.click('button:has-text("Projects")');
    await page.waitForTimeout(1500);

    const addBtn = await page.$('button:has-text("Add Project")');
    await addBtn.click();
    await page.waitForTimeout(1500);

    const pname = 'SEC-E2E-PROJ-' + Date.now();
    const phVals = [
      ['Skyline', pname],
      ['Baner', 'Baner, Pune'],
      ['2 BHK', '2 BHK'],
      ['1000', '1100'],
      ['6000000', '6500000'],
      ['luxury', 'E2E test project'],
      ['Brickwork', 'Foundation'],
    ];
    for (const [ph, val] of phVals) {
      const el = await page.$('input[placeholder*="' + ph + '"]');
      if (el) await el.fill(val);
    }
    const dateEl = await page.$('input[type="date"]');
    if (dateEl) await dateEl.fill('2027-06-01');
    const numEl = await page.$('input[type="number"][min="0"]');
    if (numEl) await numEl.fill('5');
    const sel = await page.$('select');
    if (sel) await sel.selectOption({ index: 1 });

    // Inspect form element
    const formInfo = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return 'NO FORM';
      return {
        action: form.action,
        method: form.method,
        children: form.children.length,
        hasOnSubmit: form.getAttribute('onsubmit') !== null
      };
    });
    console.log('FORM INFO:', JSON.stringify(formInfo));

    // Try clicking Save via Playwright mouse at button center
    const saveBtn = await page.$('button:has-text("Save Project")');
    const box = await saveBtn.boundingBox();
    await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
    await page.waitForTimeout(5000);

    const apiReqs = allRequests.filter(r => r.includes('/api/'));
    console.log('API REQUESTS:', JSON.stringify(apiReqs, null, 2));
  } catch (err) {
    console.log('E2E ERROR:', err.message);
  }
  console.log('ERRORS:', errors.slice(0, 10));
  await browser.close();
})();