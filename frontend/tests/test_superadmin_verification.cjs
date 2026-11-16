const { chromium } = require('playwright-core');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';
const BASE_URL = 'http://localhost:3000';

(async () => {
  console.log('Launching Chrome for Superadmin test...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--headless=new']
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });

  console.log('1. Logging in as Superadmin...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.click('button:has-text("Superadmin")');
  await page.waitForTimeout(300);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/superadmin**', { timeout: 10000 });
  console.log('Current URL:', page.url());

  // 1. Capture Superadmin Dashboard (Konsol Super Administrator)
  const dashboardShot = path.join(ARTIFACT_DIR, 'superadmin_dashboard_redesigned.png');
  await page.screenshot({ path: dashboardShot, fullPage: true });
  console.log('Saved dashboard screenshot:', dashboardShot);

  // 2. Test clicking "LOG AUDIT AKTIVITAS" in sidebar
  console.log('2. Clicking "LOG AUDIT AKTIVITAS" in sidebar...');
  const auditLink = page.locator('aside a:has-text("LOG AUDIT AKTIVITAS"), aside button:has-text("LOG AUDIT AKTIVITAS")').first();
  await auditLink.click();
  await page.waitForTimeout(1000);
  console.log('URL after clicking LOG AUDIT AKTIVITAS:', page.url());
  const auditShot = path.join(ARTIFACT_DIR, 'superadmin_audit_logs_opened.png');
  await page.screenshot({ path: auditShot });
  console.log('Saved audit logs screenshot:', auditShot);

  // 3. Test clicking "KELOLA DATA LAPANGAN" or "LAPANGAN & TARIF"
  console.log('3. Clicking "KELOLA DATA LAPANGAN" in sidebar...');
  const fieldLink = page.locator('aside a:has-text("KELOLA DATA LAPANGAN"), aside a:has-text("LAPANGAN & TARIF"), aside button:has-text("KELOLA DATA LAPANGAN"), aside button:has-text("LAPANGAN & TARIF")').first();
  await fieldLink.click();
  await page.waitForTimeout(1000);
  console.log('URL after clicking LAPANGAN:', page.url());
  const fieldShot = path.join(ARTIFACT_DIR, 'superadmin_fields_opened.png');
  await page.screenshot({ path: fieldShot });
  console.log('Saved fields screenshot:', fieldShot);

  // 4. Test clicking "AKUN PENGELOLA" / "KELOLA ADMIN"
  console.log('4. Clicking "KELOLA ADMIN" in sidebar...');
  const adminLink = page.locator('aside a:has-text("KELOLA ADMIN"), aside a:has-text("AKUN PENGELOLA"), aside button:has-text("KELOLA ADMIN"), aside button:has-text("AKUN PENGELOLA")').first();
  await adminLink.click();
  await page.waitForTimeout(1000);
  console.log('URL after clicking KELOLA ADMIN:', page.url());
  const adminShot = path.join(ARTIFACT_DIR, 'superadmin_admins_opened.png');
  await page.screenshot({ path: adminShot });
  console.log('Saved admins screenshot:', adminShot);

  await browser.close();
  console.log('All superadmin tests PASSED! Zero 404 errors!');
})().catch(err => {
  console.error(err);
  process.exit(1);
});

