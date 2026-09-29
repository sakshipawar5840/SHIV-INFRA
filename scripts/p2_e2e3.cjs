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
  const failed = [];
  page.on('requestfailed', r => failed.push(r.url() + ' ' + r.failure()?.errorText));

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
    await page.waitForSelector('input[placeholder="e.g. Skyline Heights"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    const pname = 'SEC-E2E-PROJ-' + Date.now();
    const fills = [
      ['input[placeholder="e.g. Skyline Heights"]', pname],
      ['input[placeholder="e.g. Baner, Pune"]', 'Baner, Pune'],
      ['input[placeholder="e.g. 2 BHK, 3 BHK"]', '2 BHK'],
      ['input[placeholder="e.g. 1000 - 1500 sqft"]', '1100'],
      ['input[placeholder="e.g. 6000000"]', '6500000'],
      ['textarea[placeholder*="luxury"]', 'E2E test project'],
      ['input[placeholder="e.g. Brickwork"]', 'Foundation'],
    ];
    for (const [sel, val] of fills) {
      const el = await page.$(sel);
      if (el) await el.fill(val);
    }
    const dateEl = await page.$('input[type="date"]');
    if (dateEl) await dateEl.fill('2027-06-01');
    const numEl = await page.$('input[type="number"][min="0"]');
    if (numEl) await numEl.fill('5');
    const selEl = await page.$('select');
    if (selEl) await selEl.selectOption({ index: 1 });

    // Inspect form and submit button type
    const formInfo = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return 'NO FORM';
      const btns = Array.from(form.querySelectorAll('button'));
      return {
        formAction: form.action,
        formMethod: form.method,
        buttons: btns.map(b => ({ text: b.textContent.trim(), type: b.type, disabled: b.disabled }))
      };
    });
    console.log('FORM INFO:', JSON.stringify(formInfo));

    // Try native requestSubmit
    const submitResult = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return 'NO FORM';
      try { form.requestSubmit(); return 'REQUESTED'; } catch(e) { return 'ERR: ' + e.message; }
    });
    console.log('REQUEST SUBMIT:', submitResult);
    await page.waitForTimeout(5000);

    const bodyText = await page.textContent('body');
    console.log('PROJECT IN LIST:', bodyText.includes(pname));
  } catch (err) {
    console.log('E2E ERROR:', err.message);
  }
  console.log('FAILED REQS:', failed.slice(0, 10));
  console.log('ERRORS:', errors.slice(0, 8));
  await browser.close();
})();