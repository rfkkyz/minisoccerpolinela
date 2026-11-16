const { chromium } = require('playwright-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('Capturing redesigned Navbar...');
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // 1. Screenshot standard header
  const header = await page.$('header');
  if (header) {
    await header.screenshot({ path: path.join(ARTIFACT_DIR, 'navbar_redesigned.png') });
    console.log('Saved navbar_redesigned.png');

    // 2. Hover over "Tentang" to show dropdown
    const btnTentang = await header.$('button:has-text("Tentang")');
    if (btnTentang) {
      await btnTentang.hover();
      await page.waitForTimeout(400);
      await page.screenshot({ 
        path: path.join(ARTIFACT_DIR, 'navbar_dropdown_open.png'),
        clip: { x: 0, y: 0, width: 1440, height: 350 }
      });
      console.log('Saved navbar_dropdown_open.png');
    }
  }

  await browser.close();
  console.log('Done capturing redesigned navbar!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
