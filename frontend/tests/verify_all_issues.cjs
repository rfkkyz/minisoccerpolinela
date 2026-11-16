const { chromium } = require('playwright-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('--- 1. Testing Superadmin Console & Sidebar ---');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'superadmin@polinela.ac.id');
  await page.fill('input[type="password"]', 'superadmin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/superadmin**', { timeout: 10000 });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'superadmin_console_fixed.png'),
    fullPage: false
  });
  console.log('Saved superadmin_console_fixed.png');

  const sidebar = await page.$('aside');
  if (sidebar) {
    await sidebar.screenshot({
      path: path.join(ARTIFACT_DIR, 'superadmin_sidebar_fixed.png')
    });
    console.log('Saved superadmin_sidebar_fixed.png');
  }

  console.log('--- 2. Testing Alias Route Redirects (Prevent 404) ---');
  await page.goto('http://localhost:3000/superadmin/admins', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log('URL for /superadmin/admins:', page.url());

  await page.goto('http://localhost:3000/tiket', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log('URL for /tiket:', page.url());

  console.log('--- 3. Testing User Login, Topbar, & Wizard ---');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'user@polinela.ac.id');
  await page.fill('input[type="password"]', 'user123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  await page.waitForTimeout(2000);

  const topbar = await page.$('header');
  if (topbar) {
    await topbar.screenshot({
      path: path.join(ARTIFACT_DIR, 'user_topbar_avatar_fixed.png')
    });
    console.log('Saved user_topbar_avatar_fixed.png');
  }

  await page.goto('http://localhost:3000/dashboard/booking', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'user_wizard_streamlined_fixed.png'),
    fullPage: false
  });
  console.log('Saved user_wizard_streamlined_fixed.png');

  await browser.close();
  console.log('All verifications completed successfully!');
})().catch(err => {
  console.error('Test error:', err.message);
  process.exit(1);
});
