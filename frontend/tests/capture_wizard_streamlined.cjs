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

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'mahasiswa@polinela.ac.id');
  await page.fill('input[type="password"]', 'User12345');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  await page.waitForTimeout(500);

  // Click tomorrow on calendar to have plenty of available daytime slots
  console.log('Navigating to /dashboard/booking...');
  await page.goto('http://localhost:3000/dashboard/booking', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Click day 11 on calendar
  const day11 = page.locator('button:has-text("11")').first();
  if (await day11.count() > 0) {
    await day11.click();
    await page.waitForTimeout(800);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'wizard_step1_streamlined.png'), fullPage: true });

  // Click "Lanjut ke Pembayaran"
  console.log('Clicking Lanjut ke Pembayaran...');
  const nextBtn = page.locator('button:has-text("LANJUT KE PEMBAYARAN")').first();
  if (await nextBtn.count() > 0) {
    await nextBtn.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'wizard_step2_streamlined.png'), fullPage: true });
  }

  await browser.close();
  console.log('Captured wizard screenshots!');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
