const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots');
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTests() {
  console.log('========================================================');
  console.log('   AUTOMATED TEST: NAVBAR & PUBLIC LAYOUT OVERHAUL      ');
  console.log('========================================================\n');

  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // ========================================================
    // 1. DESKTOP VIEWPORT (1440 x 900)
    // ========================================================
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    console.log('1. Menguji Landing Page & Public Navbar (1440x900)...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Screenshot 1: / di atas
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop_landing_top.png') });
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(path.join(SCREENSHOT_DIR, 'desktop_landing_top.png'), path.join(ARTIFACT_DIR, 'desktop_landing_top.png'));
    }

    // 1.1 Bar dimensions & sticky
    const navbar = page.locator('header').first();
    const navBox = await navbar.boundingBox();
    assert(Math.abs(navBox.width - 1440) <= 2, `Lebar navbar (${navBox.width}px) sama dengan viewport 1440px`);
    assert(Math.abs(navBox.height - 74) <= 2, `Tinggi navbar saat di atas (${navBox.height}px) adalah 74px (+-2)`);

    // 1.2 Grid alignment: Middle menu strictly centered (+-8px)
    const menuNav = page.locator('header nav').first();
    const menuBox = await menuNav.boundingBox();
    const menuCenter = menuBox.x + menuBox.width / 2;
    const viewportCenter = 1440 / 2; // 720
    assert(Math.abs(menuCenter - viewportCenter) <= 8, `Pusat grup menu (${menuCenter.toFixed(1)}px) berada di tengah viewport (${viewportCenter}px, selisih ${Math.abs(menuCenter - viewportCenter).toFixed(1)}px <= 8px)`);

    // 1.3 Logo & Right Button positioning
    const logo = page.locator('header a[aria-label="Polisoccer, beranda"]');
    const logoBox = await logo.boundingBox();
    assert(logoBox.x >= 20 && logoBox.x <= 40, `Logo di tepi kiri container (${logoBox.x}px dari tepi)`);

    const bookingBtn = page.locator('header a:has-text("Booking Sekarang")').first();
    const bookingBox = await bookingBtn.boundingBox();
    const distRight = 1440 - (bookingBox.x + bookingBox.width);
    assert(distRight >= 20 && distRight <= 40, `Tombol Booking Sekarang di sisi kanan (${distRight.toFixed(1)}px dari tepi kanan)`);

    // 1.4 Booking button height & chip
    assert(Math.abs(bookingBox.height - 44) <= 2, `Tinggi tombol Booking Sekarang (${bookingBox.height}px) adalah 44px (+-1)`);
    const chip = bookingBtn.locator('div').first();
    const chipBox = await chip.boundingBox();
    assert(Math.abs(chipBox.width - 34) <= 2 && Math.abs(chipBox.height - 30) <= 2, `Chip panah hijau berukuran 34x30 (${chipBox.width}x${chipBox.height})`);

    // Screenshot 2: Hover tombol Booking Sekarang
    await bookingBtn.hover();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop_hover_booking.png') });
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(path.join(SCREENSHOT_DIR, 'desktop_hover_booking.png'), path.join(ARTIFACT_DIR, 'desktop_hover_booking.png'));
    }

    // 1.5 Scroll test (> 8px)
    console.log('\n2. Menguji Scroll State (> 8px)...');
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(600);

    const scrolledNavBox = await navbar.boundingBox();
    assert(Math.abs(scrolledNavBox.height - 64) <= 2, `Tinggi navbar setelah scroll (${scrolledNavBox.height}px) mengecil ke 64px (+-2)`);
    assert(scrolledNavBox.y === 0, `Navbar tetap sticky di y=0 setelah scroll (y=${scrolledNavBox.y})`);

    // Screenshot 3: / setelah scroll
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop_landing_scrolled.png') });
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(path.join(SCREENSHOT_DIR, 'desktop_landing_scrolled.png'), path.join(ARTIFACT_DIR, 'desktop_landing_scrolled.png'));
    }

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // ========================================================
    // 3. DROPDOWNS: TENTANG & TARIF
    // ========================================================
    console.log('\n3. Menguji Dropdown Tentang & Tarif...');
    const tentangBtn = page.locator('header button:has-text("Tentang")');
    await tentangBtn.click();
    await page.waitForTimeout(300);

    const tentangMenu = page.locator('[role="menu"]');
    assert(await tentangMenu.isVisible(), 'Dropdown Tentang terbuka saat diklik');
    const tentangItems = await tentangMenu.locator('[role="menuitem"]').count();
    assert(tentangItems >= 3, `Dropdown Tentang memiliki ${tentangItems} baris opsi`);

    // Screenshot 4: Dropdown Tentang terbuka
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop_dropdown_tentang.png') });
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(path.join(SCREENSHOT_DIR, 'desktop_dropdown_tentang.png'), path.join(ARTIFACT_DIR, 'desktop_dropdown_tentang.png'));
    }

    // Test row hover: icon box becomes black (#0B0F0D / rgb(11, 15, 13))
    const firstTentangRow = tentangMenu.locator('[role="menuitem"]').first();
    const iconBox = firstTentangRow.locator('div').first();
    await firstTentangRow.hover();
    await page.waitForTimeout(500);

    const iconBgColor = await iconBox.evaluate(el => window.getComputedStyle(el).backgroundColor);
    // rgb(11, 15, 13) is #0B0F0D
    assert(iconBgColor === 'rgb(11, 15, 13)' || iconBgColor.includes('11, 15, 13'), `Hover baris mengubah kotak ikon menjadi HITAM #0B0F0D (actual: ${iconBgColor})`);

    // Test Esc closes dropdown
    await page.keyboard.press('Escape');
    await page.waitForTimeout(350);
    assert((await page.locator('[role="menu"]').count()) === 0, 'Menekan Esc menutup dropdown Tentang');

    // Test Dropdown Tarif
    const tarifBtn = page.locator('header button:has-text("Tarif")');
    await tarifBtn.click();
    await page.waitForTimeout(300);

    const tarifMenu = page.locator('[role="menu"]');
    assert(await tarifMenu.isVisible(), 'Dropdown Tarif terbuka saat diklik');
    const tarifItems = await tarifMenu.locator('[role="menuitem"]').count();
    assert(tarifItems >= 1, `Dropdown Tarif memuat ${tarifItems} baris lapangan`);

    // Screenshot 5: Dropdown Tarif terbuka
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop_dropdown_tarif.png') });
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(path.join(SCREENSHOT_DIR, 'desktop_dropdown_tarif.png'), path.join(ARTIFACT_DIR, 'desktop_dropdown_tarif.png'));
    }

    // Click outside closes dropdown
    await page.mouse.click(50, 400);
    await page.waitForTimeout(350);
    assert((await page.locator('[role="menu"]').count()) === 0, 'Klik di luar menutup dropdown Tarif');

    // ========================================================
    // 4. ANNOUNCEMENT BAR DISMISS & SESSION STORAGE PERSISTENCE
    // ========================================================
    console.log('\n4. Menguji AnnouncementBar (Dismiss & Persistence)...');
    const announcement = page.locator('[role="region"][aria-label="Pengumuman"]');
    assert(await announcement.isVisible(), 'AnnouncementBar tampil di paling atas');

    const closeBtn = announcement.locator('button[aria-label="Tutup pengumuman"]');
    await closeBtn.click();
    await page.waitForTimeout(400);
    assert(!(await announcement.isVisible()), 'AnnouncementBar menghilang setelah tombol tutup diklik');

    // Check persistence across page navigation in same session
    await page.goto('http://localhost:3000/cek-tiket', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const announcementAfterNav = page.locator('[role="region"][aria-label="Pengumuman"]');
    assert(!(await announcementAfterNav.isVisible()), 'AnnouncementBar tetap tertutup setelah berpindah halaman (sessionStorage)');

    // Screenshot 6: /cek-tiket
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop_cektiket.png') });
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(path.join(SCREENSHOT_DIR, 'desktop_cektiket.png'), path.join(ARTIFACT_DIR, 'desktop_cektiket.png'));
    }

    // Verify /cek-tiket has header & main content
    const cektiketMain = page.locator('main#main-content');
    assert(await cektiketMain.isVisible(), 'Halaman /cek-tiket memiliki <main id="main-content">');
    assert(consoleErrors.length === 0, `Tidak ada console error (errors: ${consoleErrors.length})`);

    await context.close();

    // ========================================================
    // 5. MOBILE VIEWPORT (375 x 812)
    // ========================================================
    console.log('\n5. Menguji Tampilan Mobile (375x812)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 812 }
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    // Screenshot 7: Mobile Landing
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile_landing.png') });
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(path.join(SCREENSHOT_DIR, 'mobile_landing.png'), path.join(ARTIFACT_DIR, 'mobile_landing.png'));
    }

    // Hamburger button
    const hamburger = mobilePage.locator('header button[aria-label="Buka menu"]');
    assert(await hamburger.isVisible(), 'Tombol hamburger 44x44 tampil di mobile');

    await hamburger.click();
    await mobilePage.waitForTimeout(400);

    // Mobile Sheet is open
    const mobileSheet = mobilePage.locator('header ~ div.fixed');
    assert(await mobileSheet.isVisible(), 'Mobile menu sheet terbuka penuh di bawah navbar');

    // Body scroll lock
    const bodyOverflow = await mobilePage.evaluate(() => document.body.style.overflow);
    assert(bodyOverflow === 'hidden', `Scroll body terkunci saat sheet terbuka (overflow=${bodyOverflow})`);

    // Screenshot 8: Mobile Sheet Open
    await mobilePage.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile_sheet_open.png') });
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.copyFileSync(path.join(SCREENSHOT_DIR, 'mobile_sheet_open.png'), path.join(ARTIFACT_DIR, 'mobile_sheet_open.png'));
    }

    // Close hamburger
    const closeHamburger = mobilePage.locator('header button[aria-label="Tutup menu"]');
    await closeHamburger.click();
    await mobilePage.waitForTimeout(400);

    const bodyOverflowAfterClose = await mobilePage.evaluate(() => document.body.style.overflow);
    assert(bodyOverflowAfterClose !== 'hidden', `Scroll body dipulihkan setelah sheet ditutup (overflow='${bodyOverflowAfterClose}')`);

    // Horizontal overflow check
    const scrollWidth = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    assert(scrollWidth <= 375, `Tidak ada overflow horizontal di mobile (scrollWidth: ${scrollWidth}px <= 375px)`);

    await mobileContext.close();

    console.log('\n========================================================');
    console.log(`HASIL TEST: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
