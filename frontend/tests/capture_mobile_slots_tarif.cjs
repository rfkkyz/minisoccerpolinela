const { chromium } = require('playwright-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--headless=new']
  });

  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });

  // 1. Landing Page - Tarif Section (3 Cards)
  console.log('1. Capturing Tarif Section on Mobile...');
  await page.goto(`${BASE_URL}/#tarif`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const tarifEl = page.locator('#tarif');
  if (await tarifEl.count() > 0) {
    await tarifEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_tarif_cards.png') });
  console.log('Captured mobile_tarif_cards.png');

  // 2. Landing Page - Jadwal Section (3 Columns Slot Grid)
  console.log('2. Capturing Schedule Slots on Mobile...');
  const jadwalEl = page.locator('#jadwal');
  if (await jadwalEl.count() > 0) {
    await jadwalEl.scrollIntoViewIfNeeded();
    // Scroll down a bit to see the slots clearly
    await page.evaluate(() => window.scrollBy(0, 350));
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_schedule_slots.png') });
  console.log('Captured mobile_schedule_slots.png');

  // 3. User Booking Wizard - Step 1 Slots Grid
  console.log('3. Capturing User Booking Wizard Slots on Mobile...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="text"]', 'mahasiswa@polinela.ac.id');
  await page.fill('input[type="password"]', 'User12345');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  await page.waitForTimeout(500);

  await page.goto(`${BASE_URL}/dashboard/booking`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  // Select a slot to see selected state
  const firstSlot = page.locator('button:has-text("06:00")').first();
  if (await firstSlot.count() > 0) {
    await firstSlot.click();
    await page.waitForTimeout(400);
  }

  // Scroll to the slots area
  const slotHeading = page.locator('text=PILIH SLOT JAM');
  if (await slotHeading.count() > 0) {
    await slotHeading.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  } else {
    await page.evaluate(() => window.scrollBy(0, 500));
  }
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_wizard_slots.png') });
  console.log('Captured mobile_wizard_slots.png');

  await browser.close();
  console.log('All mobile screenshots captured successfully!');
})().catch(err => {
  console.error(err);
  process.exit(1);
});

