const { chromium } = require('playwright-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';

async function testRF() {
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Login as RF
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'wedfcd@email.com');
  // Wait, what password was used for wedfcd@email.com?
  // Let's test User123456# or User12345
  await page.fill('input[type="password"]', 'User12345');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1000);

  console.log('URL 1:', page.url());

  await browser.close();
}

testRF().catch(console.error);

