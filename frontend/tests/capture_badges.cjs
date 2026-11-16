const { chromium } = require('playwright-core');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('Capturing badges and sections screenshots...');
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Hero top & badge
  const heroBadge = await page.$('.hero-zone .inline-flex');
  if (heroBadge) {
    await heroBadge.screenshot({ path: path.join(ARTIFACT_DIR, 'badge_hero_cleaned.png') });
    console.log('Saved badge_hero_cleaned.png');
  }

  // 2. Solusi badge & Carousel header
  const solusiZone = await page.$('#tentang');
  if (solusiZone) {
    await page.evaluate(() => {
      document.querySelector('#tentang').scrollIntoView();
    });
    await page.waitForTimeout(1000);
    const solusiBadge = await page.$('#tentang .inline-flex');
    if (solusiBadge) {
      await solusiBadge.screenshot({ path: path.join(ARTIFACT_DIR, 'badge_solusi_cleaned.png') });
      console.log('Saved badge_solusi_cleaned.png');
    }
    const carouselHeader = await page.$('#tentang .border-b');
    if (carouselHeader) {
      await carouselHeader.screenshot({ path: path.join(ARTIFACT_DIR, 'header_carousel_cleaned.png') });
      console.log('Saved header_carousel_cleaned.png');
    }
  }

  // 3. Pricing section & badge
  await page.evaluate(() => {
    document.querySelector('#tarif').scrollIntoView();
  });
  await page.waitForTimeout(1000);
  const pricingBadge = await page.$('#tarif .inline-flex');
  if (pricingBadge) {
    await pricingBadge.screenshot({ path: path.join(ARTIFACT_DIR, 'badge_pricing_cleaned.png') });
    console.log('Saved badge_pricing_cleaned.png');
  }

  // 4. Schedule section & badge & legend
  await page.evaluate(() => {
    document.querySelector('#jadwal').scrollIntoView();
  });
  await page.waitForTimeout(1000);
  const scheduleHeader = await page.$('#jadwal .space-y-3');
  if (scheduleHeader) {
    await scheduleHeader.screenshot({ path: path.join(ARTIFACT_DIR, 'header_schedule_cleaned.png') });
    console.log('Saved header_schedule_cleaned.png');
  }
  const scheduleLegend = await page.$('#jadwal .rounded-2xl');
  if (scheduleLegend) {
    await scheduleLegend.screenshot({ path: path.join(ARTIFACT_DIR, 'legend_schedule_cleaned.png') });
    console.log('Saved legend_schedule_cleaned.png');
  }

  // 5. News section & badge
  await page.evaluate(() => {
    document.querySelector('#berita').scrollIntoView();
  });
  await page.waitForTimeout(1000);
  const newsHeader = await page.$('#berita .space-y-3');
  if (newsHeader) {
    await newsHeader.screenshot({ path: path.join(ARTIFACT_DIR, 'header_news_cleaned.png') });
    console.log('Saved header_news_cleaned.png');
  }

  // 6. Footer section
  await page.evaluate(() => {
    document.querySelector('footer').scrollIntoView();
  });
  await page.waitForTimeout(1000);
  const footerEl = await page.$('footer');
  if (footerEl) {
    await footerEl.screenshot({ path: path.join(ARTIFACT_DIR, 'footer_cleaned.png') });
    console.log('Saved footer_cleaned.png');
  }

  await browser.close();
  console.log('Done capturing!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

