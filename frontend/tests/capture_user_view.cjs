const { chromium } = require('playwright-core');
const path = require('path');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\Rifki Rangga Saputra\\.gemini\\antigravity\\brain\\48d85bef-56f7-425f-b018-144e37315d74';

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: u.hostname,
      port: u.port,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-bypass-ratelimit': 'true'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

(async () => {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const rand = Math.floor(1000 + Math.random() * 9000);
  const email = `rf_user_${rand}@gmail.com`;
  console.log('Registering user via API:', email);
  const regRes = await postJson('http://localhost:5000/api/auth/register', {
    full_name: 'RF Kurniawan',
    email: email,
    phone: `0812${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'Password123#',
    category: 'umum'
  });

  const token = regRes.data?.data?.token || regRes.data?.token;
  const user = regRes.data?.data?.user || regRes.data?.user;
  console.log('User registered, token received:', Boolean(token));

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('polisoccer_token', token);
    localStorage.setItem('polisoccer_user', JSON.stringify(user));
  }, { token, user });

  console.log('--- 1. Capturing User Topbar ---');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const topbar = await page.$('header');
  if (topbar) {
    await topbar.screenshot({
      path: path.join(ARTIFACT_DIR, 'user_topbar_avatar_fixed.png')
    });
    console.log('Saved user_topbar_avatar_fixed.png');
  }

  console.log('--- 2. Capturing User Booking Wizard ---');
  await page.goto('http://localhost:3000/dashboard/booking', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'user_wizard_streamlined_fixed.png'),
    fullPage: false
  });
  console.log('Saved user_wizard_streamlined_fixed.png');

  await browser.close();
  console.log('All user captures successfully completed!');
})().catch(err => {
  console.error('Error in capture_user_view:', err.message);
  process.exit(1);
});
