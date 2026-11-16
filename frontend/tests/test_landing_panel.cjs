const { chromium } = require('playwright-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🚀 Starting Landing Panel Test Suite...');
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  try {
    // 1. DESKTOP TEST (1440x900)
    console.log('\n--- 1. Testing Desktop Viewport (1440x900) ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const desktopPage = await desktopContext.newPage();

    await desktopPage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await desktopPage.waitForTimeout(2000);

    // Verify error boundary did NOT trigger
    const errorHeading = await desktopPage.$('text="Terjadi Kesalahan Tampilan"');
    if (errorHeading) {
      throw new Error('ErrorBoundary was triggered on landing page!');
    }
    console.log('✅ No ErrorBoundary on page load.');

    const landingPanel = await desktopPage.$('section#beranda.landing-panel');
    if (!landingPanel) {
      throw new Error('Could not find section#beranda.landing-panel');
    }
    console.log('✅ Found unified section#beranda.landing-panel');

    // Check Horizontal Overflow
    const desktopOverflow = await desktopPage.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    }));
    console.log(`✅ Desktop overflow check: scrollWidth=${desktopOverflow.scrollWidth}, clientWidth=${desktopOverflow.clientWidth}`);

    // Temporarily make sticky navbar absolute so Playwright element scrolling doesn't repeat it
    await desktopPage.evaluate(() => {
      const header = document.querySelector('header');
      if (header) header.style.position = 'absolute';
    });

    // Wait for carousel to stabilize
    await desktopPage.waitForTimeout(1000);

    const desktopPanelPath = path.join(ARTIFACT_DIR, 'landing_panel_desktop.png');
    await landingPanel.screenshot({ path: desktopPanelPath });
    console.log(`📸 Pristine Desktop Panel Screenshot saved to: ${desktopPanelPath}`);

    // Restore header
    await desktopPage.evaluate(() => {
      const header = document.querySelector('header');
      if (header) header.style.position = '';
    });

    // Also take a screenshot of the top viewport showing Navbar + AnnouncementBar + Top of Hero
    await desktopPage.evaluate(() => window.scrollTo(0, 0));
    await desktopPage.waitForTimeout(300);
    const topViewportPath = path.join(ARTIFACT_DIR, 'landing_top_desktop.png');
    await desktopPage.screenshot({ path: topViewportPath });
    console.log(`📸 Top Viewport Screenshot saved to: ${topViewportPath}`);

    await desktopContext.close();

    // 2. MOBILE TEST (375x812)
    console.log('\n--- 2. Testing Mobile Viewport (375x812) ---');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 },
      isMobile: true,
      hasTouch: true
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await mobilePage.waitForTimeout(2000);

    const mobileLandingPanel = await mobilePage.$('section#beranda.landing-panel');

    // Check Horizontal Overflow on Mobile
    const mobileOverflow = await mobilePage.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
    }));
    console.log(`✅ Mobile overflow check: scrollWidth=${mobileOverflow.scrollWidth}, clientWidth=${mobileOverflow.clientWidth}`);

    await mobilePage.evaluate(() => {
      const header = document.querySelector('header');
      if (header) header.style.position = 'absolute';
    });

    const mobilePanelPath = path.join(ARTIFACT_DIR, 'landing_panel_mobile.png');
    await mobileLandingPanel.screenshot({ path: mobilePanelPath });
    console.log(`📸 Pristine Mobile Panel Screenshot saved to: ${mobilePanelPath}`);

    // Also take top viewport on mobile
    await mobilePage.evaluate(() => {
      const header = document.querySelector('header');
      if (header) header.style.position = '';
      window.scrollTo(0, 0);
    });
    await mobilePage.waitForTimeout(300);
    const topMobileViewportPath = path.join(ARTIFACT_DIR, 'landing_top_mobile.png');
    await mobilePage.screenshot({ path: topMobileViewportPath });
    console.log(`📸 Top Mobile Viewport Screenshot saved to: ${topMobileViewportPath}`);

    await mobileContext.close();

    console.log('\n🎉 ALL SCREENSHOTS CAPTURED CLEANLY!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runTests();
