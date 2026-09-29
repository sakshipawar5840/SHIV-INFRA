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
  page.on('console', m => { errors.push('CONSOLE: ' + m.type() + ': ' + m.text()); });

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

    // Dump the outerHTML of the form and its ancestors
    const formHtml = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return 'NO FORM';
      // Walk up to find the dialog
      let el = form;
      const chain = [];
      while (el && chain.length < 6) {
        chain.push({ tag: el.tagName, id: el.id, class: el.className?.slice(0, 60), role: el.getAttribute('role') });
        el = el.parentElement;
      }
      return { chain, formOuter: form.outerHTML.slice(0, 600) };
    });
    console.log('FORM CHAIN:', JSON.stringify(formHtml, null, 2));

    // Check computed style of the form's parent (overlay?)
    const overlayCheck = await page.evaluate(() => {
      const form = document.querySelector('form');
      const parent = form?.parentElement;
      const style = parent ? getComputedStyle(parent) : null;
      return { pointerEvents: style?.pointerEvents, position: style?.position, zIndex: style?.zIndex, display: style?.display };
    });
    console.log('PARENT STYLE:', JSON.stringify(overlayCheck));
  } catch (err) {
    console.log('E2E ERROR:', err.message);
  }
  console.log('ERRORS:', errors.slice(0, 10));
  await browser.close();
})();