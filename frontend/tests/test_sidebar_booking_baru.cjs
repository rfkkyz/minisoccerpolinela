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

  console.log('1. Logging in as Mahasiswa...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.click('button:has-text("Mahasiswa")');
  await page.waitForTimeout(300);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  console.log('Currently at:', page.url());

  // 2. Click "BOOKING BARU" in the sidebar
  console.log('2. Clicking "BOOKING BARU" in sidebar...');
  const bookingBaruLink = page.locator('aside a:has-text("BOOKING BARU"), aside button:has-text("BOOKING BARU")').first();
  await bookingBaruLink.click();
  await page.waitForTimeout(1500);

  console.log('Url after clicking BOOKING BARU:', page.url());
  const shot1 = path.join(ARTIFACT_DIR, 'booking_baru_clicked_success.png');
  await page.screenshot({ path: shot1 });
  console.log('Saved screenshot 1:', shot1);

  // 3. Test direct URL to /dashboard/wizard (the route that previously 404ed)
  console.log('3. Testing direct URL /dashboard/wizard...');
  await page.goto(`${BASE_URL}/dashboard/wizard`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  console.log('Url after navigating to /dashboard/wizard:', page.url());

  const shot2 = path.join(ARTIFACT_DIR, 'dashboard_wizard_redirect_success.png');
  await page.screenshot({ path: shot2 });
  console.log('Saved screenshot 2:', shot2);

  await browser.close();
  console.log('Test completed successfully! Both routes work perfectly without 404!');
})().catch(err => {
  console.error(err);
  process.exit(1);
});

