const { chromium } = require('playwright');
const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { hostname: '127.0.0.1', port: 3000, path, method, headers: { 'Content-Type': 'application/json' } };
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
    const dialogSelects = await page.$$('form select');
    for (const s of dialogSelects) await s.selectOption({ index: 1 });

    const saveBtn = await page.$('form button[type="submit"]');
    await saveBtn.click({ force: true });
    await page.waitForTimeout(3000);
    console.log('STEP1 CREATE:', (await page.textContent('body')).includes(pname));

    // Edit
    const clicked = await page.evaluate((name) => {
      const cards = Array.from(document.querySelectorAll('.rounded-2xl'));
      const card = cards.find(c => c.querySelector('h3')?.textContent?.includes(name));
      if (!card) return 'CARD NOT FOUND';
      const btns = Array.from(card.querySelectorAll('button'));
      if (btns.length === 0) return 'NO BUTTONS';
      btns[0].click();
      return 'CLICKED btn0';
    }, pname);
    console.log('EDIT CLICK:', clicked);
    await page.waitForTimeout(1500);
    console.log('EDIT DIALOG TITLE:', JSON.stringify(await page.textContent('h3')));

    const nameInput = await page.$('input[placeholder="e.g. Skyline Heights"]');
    if (nameInput) {
      await nameInput.select({ force: true });
      await nameInput.press('Backspace');
      await nameInput.type('-EDITED');
    }
    const editSave = await page.$('form button[type="submit"]');
    await editSave.click({ force: true });
    await page.waitForTimeout(3000);
    console.log('STEP4 EDIT:', (await page.textContent('body')).includes(pname + '-EDITED'));

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    console.log('STEP5 RELOAD-EDIT:', (await page.textContent('body')).includes(pname + '-EDITED'));

    // Delete
    const delClicked = await page.evaluate((name) => {
      const cards = Array.from(document.querySelectorAll('.rounded-2xl'));
      const card = cards.find(c => c.querySelector('h3')?.textContent?.includes(name));
      if (!card) return 'CARD NOT FOUND';
      const btns = Array.from(card.querySelectorAll('button'));
      if (btns.length < 2) return 'NO DELETE BTN';
      btns[1].click();
      return 'CLICKED btn1';
    }, pname + '-EDITED');
    console.log('DELETE CLICK:', delClicked);
    await page.waitForTimeout(1500);
    const confirmBtn = await page.$('button:has-text("Delete")');
    if (confirmBtn) {
      await confirmBtn.click({ force: true });
      await page.waitForTimeout(2000);
    }
    console.log('STEP6 DELETE:', !(await page.textContent('body')).includes(pname + '-EDITED'));
  } catch (err) {
    console.log('E2E ERROR:', err.message);
  }
  console.log('ERRORS:', errors.slice(0, 10));
  await browser.close();
})();