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

    // Dump all input/select values
    const values = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('input, select, textarea'));
      return els.map(e => ({ tag: e.tagName, ph: e.placeholder, val: e.value, name: e.name }));
    });
    console.log('FIELD VALUES:', JSON.stringify(values, null, 2));

    // Click Save and capture toast/error
    const saveBtn = await page.$('button:has-text("Save Project")');
    await saveBtn.click({ force: true });
    await page.waitForTimeout(3000);

    const toastText = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*'));
      const matches = els.filter(e => e.textContent && (e.textContent.includes('required') || e.textContent.includes('Please fill') || e.textContent.includes('created successfully') || e.textContent.includes('Failed')));
      return matches.slice(0, 5).map(e => e.textContent.trim().slice(0, 120));
    });
    console.log('TOAST/ERRORS:', JSON.stringify(toastText, null, 2));
  } catch (err) {
    console.log('E2E ERROR:', err.message);
  }
  console.log('ERRORS:', errors.slice(0, 10));
  await browser.close();
})();