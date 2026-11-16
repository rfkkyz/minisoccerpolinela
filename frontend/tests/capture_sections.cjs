const { chromium } = require('playwright-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Scroll to tarif
  const tarif = await page.$('#tarif');
  if (tarif) {
    await tarif.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/Rifki Rangga Saputra/.gemini/antigravity/brain/48d85bef-56f7-425f-b018-144e37315d74/landing_tarif.png' });
  }

  // Scroll to jadwal
  const jadwal = await page.$('#jadwal');
  if (jadwal) {
    await jadwal.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/Rifki Rangga Saputra/.gemini/antigravity/brain/48d85bef-56f7-425f-b018-144e37315d74/landing_jadwal.png' });
  }

  // Scroll to berita
  const berita = await page.$('#berita');
  if (berita) {
    await berita.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/Rifki Rangga Saputra/.gemini/antigravity/brain/48d85bef-56f7-425f-b018-144e37315d74/landing_berita.png' });
  }

  console.log('All section screenshots captured successfully!');
  await browser.close();
})();

