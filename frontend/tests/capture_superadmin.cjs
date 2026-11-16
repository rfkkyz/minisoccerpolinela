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
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'superadmin@polinela.ac.id');
  await page.fill('input[type="password"]', 'superadmin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/superadmin**', { timeout: 10000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'superadmin_dashboard_verified.png') });
  await browser.close();
  console.log('Superadmin captured successfully!');
})().catch(err => {
  console.error(err);
  process.exit(1);
});

