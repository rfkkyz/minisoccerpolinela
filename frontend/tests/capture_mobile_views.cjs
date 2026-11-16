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

  // Mobile viewport (iPhone 14 / modern Android: 390 x 844)
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });

  console.log('1. Capturing Landing Page on Mobile...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_landing_hero.png') });

  // Scroll down a bit
  await page.evaluate(() => window.scrollBy(0, 750));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_landing_sections.png') });

  // 2. Login Page on Mobile
  console.log('2. Capturing Login Page on Mobile...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_login.png') });

  // 3. User Dashboard & Booking on Mobile
  console.log('3. Capturing User Dashboard & Booking on Mobile...');
  await page.fill('input[type="text"]', 'mahasiswa@polinela.ac.id');
  await page.fill('input[type="password"]', 'User12345');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_user_dashboard.png'), fullPage: true });

  // Go to booking wizard
  await page.goto(`${BASE_URL}/dashboard/booking`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_booking_wizard.png'), fullPage: true });

  // 4. Superadmin Dashboard on Mobile
  console.log('4. Capturing Superadmin on Mobile...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'superadmin@polinela.ac.id');
  await page.fill('input[type="password"]', 'superadmin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/superadmin**', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_superadmin.png'), fullPage: true });

  await browser.close();
  console.log('Mobile screenshots captured successfully!');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
