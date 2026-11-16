const { chromium } = require('playwright-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';

async function testLogin() {
  console.log('Testing login flow with fixes...');
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });

  // 1. Test clicking quick fill "Mahasiswa"
  const mhsBtn = await page.$('button:has-text("Mahasiswa")');
  if (mhsBtn) {
    await mhsBtn.click();
    await page.waitForTimeout(400);
    const emailVal = await page.inputValue('input[type="text"]');
    console.log('Quick fill Mahasiswa email value:', emailVal);
  }

  // 2. Submit login as Mahasiswa
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  console.log('Successfully navigated to Mahasiswa Dashboard:', page.url());

  // 3. Logout and test Superadmin
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  const superBtn = await page.$('button:has-text("Superadmin")');
  if (superBtn) {
    await superBtn.click();
    await page.waitForTimeout(400);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/superadmin**', { timeout: 10000 });
    console.log('Successfully navigated to Superadmin Dashboard:', page.url());
  }

  // Screenshot superadmin dashboard to be sure
  await page.screenshot({ path: 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74\\login_success_superadmin.png' });
  console.log('Saved login_success_superadmin.png');

  await browser.close();
  console.log('All login tests PASSED!');
}

testLogin().catch(err => {
  console.error(err);
  process.exit(1);
});
