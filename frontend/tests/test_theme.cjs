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

async function runThemeTests() {
  console.log('--- STARTING MINT GLASS GRID THEME TESTS ---');
  let exitCode = 0;

  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  try {
    // 1. DESKTOP VIEWPORT (1440 x 900)
    console.log('\n[1] Testing Desktop Viewport (1440x900)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await desktopContext.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verify Hero is rendered in mint
    const heroSection = page.locator('#hero');
    await heroSection.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await page.waitForTimeout(500);

    const heroScreenshot = path.join(SCREENSHOT_DIR, 'theme_desktop_hero.png');
    await heroSection.screenshot({ path: heroScreenshot });
    console.log(`Saved screenshot: ${heroScreenshot}`);

    // Verify Carousel / WhySection
    const carouselSection = page.locator('#tentang');
    await carouselSection.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await page.waitForTimeout(500);

    const carouselScreenshot = path.join(SCREENSHOT_DIR, 'theme_desktop_carousel.png');
    await carouselSection.screenshot({ path: carouselScreenshot });
    console.log(`Saved screenshot: ${carouselScreenshot}`);

    // Verify Pricing Section
    const pricingSection = page.locator('#tarif');
    await pricingSection.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
    await page.waitForTimeout(500);

    const pricingScreenshot = path.join(SCREENSHOT_DIR, 'theme_desktop_pricing.png');
    await pricingSection.screenshot({ path: pricingScreenshot });
    console.log(`Saved screenshot: ${pricingScreenshot}`);

    // Verify CTA Section with 3D ball
    const ctaSection = page.locator('section').filter({ hasText: 'Siap Bertanding di Arena' });
    await ctaSection.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await page.waitForTimeout(800);

    const ctaScreenshot = path.join(SCREENSHOT_DIR, 'theme_desktop_cta.png');
    await ctaSection.screenshot({ path: ctaScreenshot });
    console.log(`Saved screenshot: ${ctaScreenshot}`);

    // Verify Footer
    const footerEl = page.locator('footer');
    await footerEl.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await page.waitForTimeout(500);

    const footerScreenshot = path.join(SCREENSHOT_DIR, 'theme_desktop_footer.png');
    await footerEl.screenshot({ path: footerScreenshot });
    console.log(`Saved screenshot: ${footerScreenshot}`);

    // Verify Login Page (AuthLayout)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);

    const loginScreenshot = path.join(SCREENSHOT_DIR, 'theme_desktop_login.png');
    await page.screenshot({ path: loginScreenshot });
    console.log(`Saved screenshot: ${loginScreenshot}`);

    // Copy to ARTIFACT_DIR
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(heroScreenshot, path.join(ARTIFACT_DIR, 'theme_desktop_hero.png'));
      fs.copyFileSync(carouselScreenshot, path.join(ARTIFACT_DIR, 'theme_desktop_carousel.png'));
      fs.copyFileSync(ctaScreenshot, path.join(ARTIFACT_DIR, 'theme_desktop_cta.png'));
      fs.copyFileSync(footerScreenshot, path.join(ARTIFACT_DIR, 'theme_desktop_footer.png'));
      fs.copyFileSync(loginScreenshot, path.join(ARTIFACT_DIR, 'theme_desktop_login.png'));
    }

    await desktopContext.close();

    // 2. MOBILE VIEWPORT (375 x 812)
    console.log('\n[2] Testing Mobile Viewport (375x812)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    const mHero = mobilePage.locator('#hero');
    const mHeroShot = path.join(SCREENSHOT_DIR, 'theme_mobile_hero.png');
    await mHero.screenshot({ path: mHeroShot });
    console.log(`Saved mobile screenshot: ${mHeroShot}`);

    const mCta = mobilePage.locator('section').filter({ hasText: 'Siap Bertanding di Arena' });
    await mCta.evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await mobilePage.waitForTimeout(500);
    const mCtaShot = path.join(SCREENSHOT_DIR, 'theme_mobile_cta.png');
    await mCta.screenshot({ path: mCtaShot });
    console.log(`Saved mobile CTA screenshot: ${mCtaShot}`);

    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(mHeroShot, path.join(ARTIFACT_DIR, 'theme_mobile_hero.png'));
      fs.copyFileSync(mCtaShot, path.join(ARTIFACT_DIR, 'theme_mobile_cta.png'));
    }

    await mobileContext.close();

    if (consoleErrors.length > 0) {
      console.warn('Console warnings/errors:', consoleErrors);
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

runThemeTests();

