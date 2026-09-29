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
    await page.waitForTimeout(500);

    await page.goto('http://localhost:3000/projects', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const buttons = await page.$$('button');
    const texts = [];
    for (const b of buttons) {
      const t = await b.textContent();
      if (t && t.trim()) texts.push(t.trim());
    }
    console.log('BUTTONS:', JSON.stringify(texts.slice(0, 30)));

    const h2s = await page.$$('h2');
    const h2texts = [];
    for (const h of h2s) { const t = await h.textContent(); if (t) h2texts.push(t.trim()); }
    console.log('H2S:', JSON.stringify(h2texts.slice(0, 10)));
  } catch (err) {
    console.log('E2E ERROR:', err.message);
  }
  console.log('ERRORS:', errors.slice(0, 5));
  await browser.close();
})();