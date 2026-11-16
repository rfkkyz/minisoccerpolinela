const { chromium } = require('playwright-core');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function check() {
  const browser = await chromium.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  const html = await page.content();
  console.log('HAS TENTANG:', html.includes('tentang'));
  console.log('HAS CAROUSEL:', html.includes('carousel'));
  console.log('HAS KESALAHAN:', html.includes('Terjadi Kesalahan'));

  const tentangEl = await page.$('#tentang');
  console.log('TENTANG ELEMENT FOUND:', !!tentangEl);
  if (tentangEl) {
    const text = await page.evaluate(el => el.innerText, tentangEl);
    console.log('TENTANG TEXT SNIPPET:', text.slice(0, 300));
  }

  await page.screenshot({ path: 'screenshots/debug_page.png' });
  await browser.close();
}

check().catch(console.error);

