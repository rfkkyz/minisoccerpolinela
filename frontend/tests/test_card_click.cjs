const { chromium } = require('playwright-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

async function testCardClick() {
  console.log('🚀 Testing Card Click Animation...');
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Scroll to carousel
  const carousel = await page.$('div[aria-roledescription="carousel"]');
  if (carousel) {
    await carousel.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }

  // Find the first card
  const card = await page.$('h4:has-text("CEK JADWAL LAPANGAN")');
  if (!card) {
    throw new Error('Card CEK JADWAL LAPANGAN not found');
  }

  const cardBox = await card.boundingBox();
  console.log('Found card at:', cardBox);

  // Click card
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);

  // Capture screenshot during mouse down / press
  const pressedPath = path.join(ARTIFACT_DIR, 'card_pressed.png');
  await page.screenshot({ path: pressedPath });
  console.log('📸 Card Pressed Screenshot saved to:', pressedPath);

  // Release mouse and capture ripple/sheen
  await page.mouse.up();
  await page.waitForTimeout(150);

  const clickedPath = path.join(ARTIFACT_DIR, 'card_clicked_ripple.png');
  await page.screenshot({ path: clickedPath });
  console.log('📸 Card Clicked Ripple Screenshot saved to:', clickedPath);

  await browser.close();
}

testCardClick().catch(console.error);
