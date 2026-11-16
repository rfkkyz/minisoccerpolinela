const { chromium } = require('playwright-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('Capturing modernized Schedule and Calendar section...');
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2500);

  // Scroll to #jadwal
  await page.evaluate(() => {
    document.querySelector('#jadwal').scrollIntoView();
  });
  await page.waitForTimeout(1000);

  // 1. Full Schedule Section screenshot
  const jadwalSection = await page.$('#jadwal');
  if (jadwalSection) {
    await jadwalSection.screenshot({ path: path.join(ARTIFACT_DIR, 'schedule_section_full.png') });
    console.log('Saved schedule_section_full.png');
  }

  // 2. Calendar panel (Left)
  const calendarPanel = await page.$('#jadwal .grid.grid-cols-1.lg\\:grid-cols-12 > div:first-child');
  if (calendarPanel) {
    await calendarPanel.screenshot({ path: path.join(ARTIFACT_DIR, 'calendar_panel_modern.png') });
    console.log('Saved calendar_panel_modern.png');
  }

  // 3. Slot Grid panel (Right)
  const slotGridPanel = await page.$('#jadwal .grid.grid-cols-1.lg\\:grid-cols-12 > div:last-child');
  if (slotGridPanel) {
    await slotGridPanel.screenshot({ path: path.join(ARTIFACT_DIR, 'slot_grid_panel_modern.png') });
    console.log('Saved slot_grid_panel_modern.png');
  }

  // 4. Hover over an available slot
  const availableBtn = await page.$('#jadwal button:has-text("Tersedia")');
  if (availableBtn) {
    await availableBtn.hover();
    await page.waitForTimeout(400);
    if (slotGridPanel) {
      await slotGridPanel.screenshot({ path: path.join(ARTIFACT_DIR, 'slot_grid_hover.png') });
      console.log('Saved slot_grid_hover.png');
    }
  }

  await browser.close();
  console.log('Done capturing schedule!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

