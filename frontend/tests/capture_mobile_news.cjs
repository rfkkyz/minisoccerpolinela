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

  await page.goto(`${BASE_URL}/#berita`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Scroll to #berita
  const beritaEl = page.locator('#berita');
  if (await beritaEl.count() > 0) {
    await beritaEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_news_section_after.png') });
  console.log('Captured mobile_news_section_after.png');

  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
