const { chromium } = require('playwright-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';

async function checkDashboard() {
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Login as mahasiswa
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Mahasiswa")');
  await page.waitForTimeout(300);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  console.log('After login URL:', page.url());
  const bodyText = await page.textContent('body');
  console.log('Contains 404?', bodyText.includes('404'));
  console.log('Contains Halaman Tidak Ditemukan?', bodyText.includes('Halaman Tidak Ditemukan'));

  // What is the title on the page?
  const h1 = await page.$eval('h1, h2', el => el.textContent).catch(() => 'No heading');
  console.log('Heading on page:', h1);

  await browser.close();
}

checkDashboard().catch(console.error);

