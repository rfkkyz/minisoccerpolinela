const { chromium } = require('playwright-core');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BASE_URL = 'http://localhost:3000';

async function testNavbar() {
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Test clicking Tarif
  const tarifBtn = await page.$('header button:has-text("Tarif")');
  if (tarifBtn) {
    await tarifBtn.click();
    await page.waitForTimeout(500);
  }

  // Test clicking Jadwal link
  const jadwalBtn = await page.$('header button:has-text("Jadwal")');
  if (jadwalBtn) {
    await jadwalBtn.click();
    await page.waitForTimeout(500);
  }

  console.log('Console errors found:', errors.length);
  if (errors.length > 0) {
    console.error(errors);
  }

  await browser.close();
}

testNavbar().catch(err => {
  console.error(err);
  process.exit(1);
});

