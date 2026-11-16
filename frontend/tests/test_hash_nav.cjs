const { chromium } = require('playwright-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';

async function testHashNav() {
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  // Go to /login first
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  console.log('Initial page:', page.url());

  // Click on "Tentang" -> "Cara Kerja"
  await page.hover('header button:has-text("Tentang")');
  await page.waitForTimeout(300);
  await page.click('button:has-text("Cara Kerja")');
  await page.waitForTimeout(1000);

  console.log('URL after clicking Cara Kerja from /login:', page.url());
  const is404 = await page.textContent('body').then(t => t.includes('404'));
  console.log('Did it hit 404?:', is404);

  // Click on "Booking Lapangan" button
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.click('header button:has-text("Booking Lapangan")');
  await page.waitForTimeout(1000);

  console.log('URL after clicking Booking Lapangan from /login:', page.url());
  const is404Booking = await page.textContent('body').then(t => t.includes('404'));
  console.log('Did Booking Lapangan hit 404?:', is404Booking);

  await browser.close();
}

testHashNav().catch(console.error);

