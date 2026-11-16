const { chromium } = require('playwright-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--headless=new']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  console.log('Logging in as Mahasiswa...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Mahasiswa")');
  await page.waitForTimeout(300);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**');

  // Find the exact user dropdown button in header
  const userBtn = page.locator('header button:has([class*="chevron-down"]), header button:has([class*="ChevronDown"])').first();
  console.log('User button found count:', await userBtn.count());
  
  await userBtn.click();
  await page.waitForTimeout(500);

  const menuVisible = await page.locator('[role="menu"]').isVisible();
  console.log('Is menu visible after click?', menuVisible);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_user_dropdown_opened.png') });
  console.log('Screenshot saved to test_user_dropdown_opened.png');

  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});

