const { chromium } = require('playwright-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('Capturing Quantico font verification...');
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  // 1. Check font loading
  const fontLoaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return document.fonts.check('bold 24px Quantico');
  });
  console.log(`Quantico font check: ${fontLoaded ? 'LOADED' : 'NOT LOADED'}`);

  // 2. Solusi H2
  const solusiH2 = await page.$('#tentang h2');
  if (solusiH2) {
    const computedFont = await page.evaluate(el => window.getComputedStyle(el).fontFamily, solusiH2);
    console.log(`Solusi H2 font-family: ${computedFont}`);
    await solusiH2.screenshot({ path: path.join(ARTIFACT_DIR, 'quantico_solusi_title.png') });
    console.log('Saved quantico_solusi_title.png');
  }

  // 3. Tarif H2
  const tarifH2 = await page.$('#tarif h2');
  if (tarifH2) {
    const computedFont = await page.evaluate(el => window.getComputedStyle(el).fontFamily, tarifH2);
    console.log(`Tarif H2 font-family: ${computedFont}`);
    await tarifH2.screenshot({ path: path.join(ARTIFACT_DIR, 'quantico_tarif_title.png') });
    console.log('Saved quantico_tarif_title.png');
  }

  // 4. Card Titles ("Umum", "Mahasiswa", "Karyawan")
  const cardsContainer = await page.$('#tarif .grid.grid-cols-1.md\\:grid-cols-3');
  if (cardsContainer) {
    const firstCardTitle = await page.$('#tarif .grid.grid-cols-1.md\\:grid-cols-3 h3');
    if (firstCardTitle) {
      const computedFont = await page.evaluate(el => window.getComputedStyle(el).fontFamily, firstCardTitle);
      console.log(`Card H3 font-family: ${computedFont}`);
      await firstCardTitle.screenshot({ path: path.join(ARTIFACT_DIR, 'quantico_card_title_umum.png') });
      console.log('Saved quantico_card_title_umum.png');
    }
    await cardsContainer.screenshot({ path: path.join(ARTIFACT_DIR, 'quantico_all_cards.png') });
    console.log('Saved quantico_all_cards.png');
  }

  // 5. Jadwal H2
  const jadwalH2 = await page.$('#jadwal h2');
  if (jadwalH2) {
    const computedFont = await page.evaluate(el => window.getComputedStyle(el).fontFamily, jadwalH2);
    console.log(`Jadwal H2 font-family: ${computedFont}`);
    await jadwalH2.screenshot({ path: path.join(ARTIFACT_DIR, 'quantico_jadwal_title.png') });
    console.log('Saved quantico_jadwal_title.png');
  }

  await browser.close();
  console.log('Done capturing Quantico test!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

