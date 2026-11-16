const { chromium } = require('playwright-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

(async () => {
  console.log('Launching Chrome...');
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

  // 1. Click Notification Bell
  console.log('1. Clicking notification bell...');
  const bell = page.locator('header button[title="Notifikasi"]');
  await bell.click();
  await page.waitForTimeout(600);

  const notifShot = path.join(ARTIFACT_DIR, 'topbar_notification_opened.png');
  await page.screenshot({ path: notifShot });
  console.log('Saved notification screenshot:', notifShot);

  // Click "Tandai dibaca"
  const markReadBtn = page.locator('button:has-text("Tandai dibaca")');
  if (await markReadBtn.isVisible()) {
    await markReadBtn.click();
    await page.waitForTimeout(300);
  }

  // 2. Click User Profile Pill
  console.log('2. Clicking user profile dropdown pill...');
  const userBtn = page.locator('header button[title="Menu Pengguna"]');
  await userBtn.click();
  await page.waitForTimeout(600);

  const profileShot = path.join(ARTIFACT_DIR, 'topbar_user_dropdown_opened.png');
  await page.screenshot({ path: profileShot });
  console.log('Saved profile dropdown screenshot:', profileShot);

  await browser.close();
  console.log('All topbar tests PASSED!');
})().catch(err => {
  console.error(err);
  process.exit(1);
});

