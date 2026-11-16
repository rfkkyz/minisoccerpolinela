const { chromium } = require('playwright-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('Testing and capturing Tarif Cards...');
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Scroll to #tarif
  await page.evaluate(() => {
    document.querySelector('#tarif').scrollIntoView();
  });
  await page.waitForTimeout(1000);

  // 1. Capture the entire tarif section
  const tarifSection = await page.$('#tarif');
  if (tarifSection) {
    await tarifSection.screenshot({ path: path.join(ARTIFACT_DIR, 'tarif_section_full.png') });
    console.log('Saved tarif_section_full.png');
  }

  // 1b. Capture the 3 cards
  const tarifCardsContainer = await page.$('#tarif .grid.grid-cols-1.md\\:grid-cols-3');
  if (tarifCardsContainer) {
    await tarifCardsContainer.screenshot({ path: path.join(ARTIFACT_DIR, 'tarif_cards_normal.png') });
    console.log('Saved tarif_cards_normal.png');
  }

  // 2. Hover on Mahasiswa card
  const cards = await page.$$('#tarif .grid.grid-cols-1.md\\:grid-cols-3 > div');
  if (cards.length >= 2) {
    await cards[1].hover();
    await page.waitForTimeout(600);
    if (tarifCardsContainer) {
      await tarifCardsContainer.screenshot({ path: path.join(ARTIFACT_DIR, 'tarif_cards_hover_mahasiswa.png') });
      console.log('Saved tarif_cards_hover_mahasiswa.png');
    }
  }

  // 3. Hover on button of Mahasiswa card
  const mahasiswaBtn = await page.$('#tarif .grid.grid-cols-1.md\\:grid-cols-3 > div:nth-child(2) button');
  if (mahasiswaBtn) {
    await mahasiswaBtn.hover();
    await page.waitForTimeout(500);
    if (tarifCardsContainer) {
      await tarifCardsContainer.screenshot({ path: path.join(ARTIFACT_DIR, 'tarif_cards_btn_hover.png') });
      console.log('Saved tarif_cards_btn_hover.png');
    }
  }

  await browser.close();
  console.log('Done capturing tarif cards!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
