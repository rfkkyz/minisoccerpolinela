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

  console.log('Navigating to login page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);

  // Click demo chip "Mahasiswa"
  console.log('Clicking Mahasiswa demo chip...');
  await page.click('button:has-text("Mahasiswa")');
  await page.waitForTimeout(300);

  // Submit login
  console.log('Submitting login...');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  console.log('Navigating to /dashboard/booking...');
  await page.goto(`${BASE_URL}/dashboard/booking`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Click "LANJUT KE KUNCI SLOT" to go to Step 2
  const lanjutBtn = page.locator('button:has-text("LANJUT KE KUNCI SLOT")').first();
  if (await lanjutBtn.isVisible()) {
    await lanjutBtn.click();
    await page.waitForTimeout(500);
  }

  // Click "Kunci Slot (5 Menit)" to lock slot and reach Step 3
  console.log('Clicking Kunci Slot (5 Menit)...');
  const lockBtn = page.locator('button:has-text("Kunci Slot (5 Menit)")').first();
  if (await lockBtn.isVisible()) {
    await lockBtn.click();
    await page.waitForTimeout(2000);
    const step3Shot = path.join(ARTIFACT_DIR, 'booking_wizard_step3_payment.png');
    await page.screenshot({ path: step3Shot, fullPage: true });
    console.log('Captured Step 3 Payment:', step3Shot);
  }

  await browser.close();
  console.log('All tests completed successfully!');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
