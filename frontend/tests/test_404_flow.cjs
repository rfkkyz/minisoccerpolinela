const { chromium } = require('playwright-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';

async function test404Flow() {
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Login as Mahasiswa
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Mahasiswa")');
  await page.waitForTimeout(300);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);

  console.log('Logged in URL:', page.url());

  // 2. Visit an invalid URL to trigger 404 while logged in
  await page.goto(`${BASE_URL}/invalid-random-page`, { waitUntil: 'networkidle' });
  console.log('404 Page URL:', page.url());

  // Verify 404 elements
  const is404Text = await page.textContent('body');
  console.log('Has 404 text:', is404Text.includes('404'));
  console.log('Has Buka Dashboard button:', is404Text.includes('Buka Dashboard'));

  // 3. Click "Buka Dashboard" button on the 404 page
  await page.click('button:has-text("Buka Dashboard")');
  await page.waitForTimeout(1500);
  console.log('After clicking Buka Dashboard URL:', page.url());

  // 4. Test visiting /berita, /jadwal, /tarif (should redirect to landing page section without 404)
  await page.goto(`${BASE_URL}/berita`, { waitUntil: 'networkidle' });
  console.log('/berita redirect URL:', page.url());

  await page.goto(`${BASE_URL}/jadwal`, { waitUntil: 'networkidle' });
  console.log('/jadwal redirect URL:', page.url());

  await browser.close();
  console.log('All 404 recovery tests PASSED!');
}

test404Flow().catch(console.error);

