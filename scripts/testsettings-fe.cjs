const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message));
  try {
    await page.goto('http://localhost:5173/settings', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('text=System & Account Settings', { timeout: 15000 });
    console.log('PAGE LOADED OK');
    // Click Company tab and try Save
    await page.click('text=Company Profile');
    await page.waitForTimeout(500);
    const editBtn = await page.$('text=Edit');
    if (editBtn) await editBtn.click();
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) {
      await emailInput.fill('audit@shivinfra.com');
    }
    const saveBtn = await page.$('text=Save Changes');
    if (saveBtn) await saveBtn.click();
    await page.waitForTimeout(1000);
    const saved = await page.$('text=saved to database');
    console.log('SAVE SUCCESS VISUAL:', !!saved);
    // Reload
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    const emailAfter = await page.$('input[type="email"]');
    const val = await emailAfter.inputValue();
    console.log('RELOAD EMAIL:', val);
  } catch (err) {
    console.log('NAV ERROR:', err.message);
  }
  console.log('CONSOLE ERRORS:', errors.slice(0, 5));
  await browser.close();
})();