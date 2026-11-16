const { chromium } = require('playwright-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

async function testButtons() {
  console.log('🚀 Testing Arrow Buttons...');
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Scroll to carousel controls
  const nextBtn = await page.$('button[aria-label="Langkah Berikutnya"]');
  if (!nextBtn) throw new Error('Could not find Langkah Berikutnya button');

  await nextBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  // Select outer control block containing both the buttons and the indicator below them
  const controlBlock = await page.$('div:has(> div > button[aria-label="Langkah Berikutnya"])');
  const normalPath = path.join(ARTIFACT_DIR, 'arrow_buttons_normal.png');
  await (controlBlock || nextBtn).screenshot({ path: normalPath });
  console.log('📸 Arrow Buttons Normal Screenshot saved to:', normalPath);

  // 2. Hover state screenshot
  await nextBtn.hover();
  await page.waitForTimeout(250);
  const hoverPath = path.join(ARTIFACT_DIR, 'arrow_buttons_hover.png');
  await (controlBlock || nextBtn).screenshot({ path: hoverPath });
  console.log('📸 Arrow Buttons Hover Screenshot saved to:', hoverPath);

  // 3. Pressed state screenshot
  const btnBox = await nextBtn.boundingBox();
  await page.mouse.move(btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);

  const pressedPath = path.join(ARTIFACT_DIR, 'arrow_buttons_pressed.png');
  await (controlBlock || nextBtn).screenshot({ path: pressedPath });
  console.log('📸 Arrow Buttons Pressed Screenshot saved to:', pressedPath);

  await page.mouse.up();
  await browser.close();
  console.log('🎉 Done testing arrow buttons!');
}

testButtons().catch(console.error);

