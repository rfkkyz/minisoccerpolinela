const { chromium } = require('playwright-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('Capturing redesigned CTA section...');
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Scroll to CTA section
  const ctaSection = await page.$('section:has-text("Siap Bertanding di Arena")');
  if (ctaSection) {
    await ctaSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await ctaSection.screenshot({ path: path.join(ARTIFACT_DIR, 'cta_section_modern.png') });
    console.log('Saved cta_section_modern.png');

    // Test hover on primary button
    const btnDaftar = await ctaSection.$('button:has-text("DAFTAR AKUN GRATIS")');
    if (btnDaftar) {
      await btnDaftar.hover();
      await page.waitForTimeout(300);
      await ctaSection.screenshot({ path: path.join(ARTIFACT_DIR, 'cta_section_btn_hover.png') });
      console.log('Saved cta_section_btn_hover.png');
    }
  } else {
    console.log('CTA section not found');
  }

  await browser.close();
  console.log('Done capturing CTA!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
