const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots');
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTests() {
  console.log('--- STARTING CAROUSEL AUTOMATED TESTS ---');
  let exitCode = 0;

  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  try {
    // 1. DESKTOP TEST (1440 x 900)
    console.log('\n[1] Testing Desktop Viewport (1440x900)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await desktopContext.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Scroll to #tentang section
    await page.evaluate(() => {
      const el = document.getElementById('tentang');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
    await page.waitForTimeout(1000);

    // Verify Both Carousels exist
    const carousels = await page.locator('[role="region"][aria-roledescription="carousel"]');
    const carouselCount = await carousels.count();
    console.log(`Found ${carouselCount} carousels (expected: 2)`);
    if (carouselCount !== 2) {
      console.error('FAIL: Expected 2 carousels');
      exitCode = 1;
    }

    // Check Section 1 (4 Langkah)
    const carousel1 = carousels.nth(0);
    const counter1 = await carousel1.locator('[aria-live="polite"]').innerText();
    console.log(`Carousel 1 Counter: "${counter1}" (expected "01 / 04")`);
    if (counter1 !== '01 / 04') {
      console.error(`FAIL: Carousel 1 initial counter unexpected: ${counter1}`);
      exitCode = 1;
    }

    // Click Next button on Carousel 1
    const nextBtn1 = carousel1.locator('button[aria-label="Berikutnya"]');
    await nextBtn1.click();
    await page.waitForTimeout(800);

    const counter1AfterNext = await carousel1.locator('[aria-live="polite"]').innerText();
    console.log(`Carousel 1 Counter after click Next: "${counter1AfterNext}" (expected "02 / 04")`);
    if (counter1AfterNext !== '02 / 04') {
      console.error(`FAIL: Carousel 1 counter after Next unexpected: ${counter1AfterNext}`);
      exitCode = 1;
    }

    // Click Prev button on Carousel 1
    const prevBtn1 = carousel1.locator('button[aria-label="Sebelumnya"]');
    await prevBtn1.click();
    await page.waitForTimeout(800);

    const counter1AfterPrev = await carousel1.locator('[aria-live="polite"]').innerText();
    console.log(`Carousel 1 Counter after click Prev: "${counter1AfterPrev}" (expected "01 / 04")`);
    if (counter1AfterPrev !== '01 / 04') {
      console.error(`FAIL: Carousel 1 counter after Prev unexpected: ${counter1AfterPrev}`);
      exitCode = 1;
    }

    // Check Section 2 (Teknologi & Keamanan, initialIndex=1, so "02 / 03")
    const carousel2 = carousels.nth(1);
    const counter2 = await carousel2.locator('[aria-live="polite"]').innerText();
    console.log(`Carousel 2 Counter: "${counter2}" (expected "02 / 03")`);
    if (counter2 !== '02 / 03') {
      console.error(`FAIL: Carousel 2 initial counter unexpected: ${counter2}`);
      exitCode = 1;
    }

    // Check Horizontal Overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    console.log(`ScrollWidth: ${scrollWidth}, ClientWidth: ${clientWidth}`);
    if (scrollWidth > clientWidth) {
      console.error(`FAIL: Page has horizontal overflow (${scrollWidth} > ${clientWidth})`);
      exitCode = 1;
    } else {
      console.log('PASS: No horizontal overflow on desktop!');
    }

    // Capture Desktop Screenshots
    await carousel1.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await page.waitForTimeout(400);
    const desktopShot1 = path.join(SCREENSHOT_DIR, 'carousel_desktop_step.png');
    await carousel1.screenshot({ path: desktopShot1 });
    console.log(`Saved screenshot: ${desktopShot1}`);

    await carousel2.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await page.waitForTimeout(400);
    const desktopShot2 = path.join(SCREENSHOT_DIR, 'carousel_desktop_security.png');
    await carousel2.screenshot({ path: desktopShot2 });
    console.log(`Saved screenshot: ${desktopShot2}`);

    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(desktopShot1, path.join(ARTIFACT_DIR, 'carousel_desktop_step.png'));
      fs.copyFileSync(desktopShot2, path.join(ARTIFACT_DIR, 'carousel_desktop_security.png'));
    }

    await desktopContext.close();

    // 2. MOBILE TEST (375 x 812)
    console.log('\n[2] Testing Mobile Viewport (375x812)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });

    const mCarousels = await mobilePage.locator('[role="region"][aria-roledescription="carousel"]');
    const mCarousel1 = mCarousels.nth(0);
    await mCarousel1.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await mobilePage.waitForTimeout(600);

    const mScrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    const mClientWidth = await mobilePage.evaluate(() => document.documentElement.clientWidth);
    console.log(`Mobile ScrollWidth: ${mScrollWidth}, ClientWidth: ${mClientWidth}`);
    if (mScrollWidth > mClientWidth) {
      console.error(`FAIL: Mobile page has horizontal overflow (${mScrollWidth} > ${mClientWidth})`);
      exitCode = 1;
    } else {
      console.log('PASS: No horizontal overflow on mobile!');
    }

    const mobileShot = path.join(SCREENSHOT_DIR, 'carousel_mobile_step.png');
    await mCarousel1.screenshot({ path: mobileShot });
    console.log(`Saved mobile screenshot: ${mobileShot}`);

    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(mobileShot, path.join(ARTIFACT_DIR, 'carousel_mobile_step.png'));
    }

    await mobileContext.close();

    if (consoleErrors.length > 0) {
      console.warn('Console errors detected:', consoleErrors);
    } else {
      console.log('PASS: 0 console errors detected!');
    }

  } catch (err) {
    console.error('Test execution error:', err);
    exitCode = 1;
  } finally {
    await browser.close();
  }

  console.log(`\n--- ALL TESTS FINISHED with exit code ${exitCode} ---`);
  process.exit(exitCode);
}

runTests();
