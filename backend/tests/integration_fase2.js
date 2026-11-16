/**
 * POLISOCCER FASE 2 - INTEGRATION & CONCURRENCY TEST SUITE
 * 
 * Tests:
 * 1. Concurrency / Race Condition: 50 concurrent requests locking the exact same slot -> Exactly 1 succeeds (200), 49 rejected (409)
 * 2. Multi-Hour Conflict: User A locks 10-12 (2h). User B tries to lock 11-12 (1h) -> Must return 409 (conflict at 11:00)
 * 3. Price Manipulation: Client attempts to send manipulated total_price in reserve -> Server strictly enforces DB quote
 * 4. Private File Auth: Access private files without JWT -> 401. Access with valid JWT -> 200
 * 5. Auto-Expiry: Simulated booking hold with hold_expires_at in past -> Cron job marks expired_cancelled and frees slot
 */

const http = require('http');
const path = require('path');
const { Op } = require('sequelize');
const { sequelize, Booking, BookingSlot, LockTimer, AuditLog } = require('../models');
const { runCleanupJobs } = require('../jobs/lockCleanupCron');

const BASE_HOST = '127.0.0.1';
const BASE_PORT = 5000;

function sendRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders = { 
      'x-bypass-ratelimit': 'true',
      ...headers 
    };
    if (body) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path,
      method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ status: res.statusCode, data: parsed, raw: data });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('   POLISOCCER FASE 2 - INTEGRATION TEST SUITE');
  console.log('====================================================\n');

  const results = {
    test1_concurrency: false,
    test2_multi_hour: false,
    test3_price_manipulation: false,
    test4_private_file_auth: false,
    test5_auto_expiry: false
  };

  // -------------------------------------------------------------------
  // TEST 1: Concurrency / Race Condition (50 concurrent locks on same slot)
  // -------------------------------------------------------------------
  console.log('▶ [TEST 1] Concurrency Test: 50 concurrent requests locking same slot (2026-12-01 10:00)...');
  const targetDate = '2026-12-01';
  const targetHour = 10;

  // Clean any prior locks on that slot
  await LockTimer.destroy({ where: { booking_date: targetDate, start_hour: targetHour } });

  const promises = [];
  for (let i = 1; i <= 50; i++) {
    const sessId = `concurrency_user_${i}_${Date.now()}`;
    promises.push(
      sendRequest('/api/bookings/lock', 'POST', {
        field_id: 1,
        booking_date: targetDate,
        start_hour: targetHour,
        duration_hours: 1,
        session_id: sessId
      })
    );
  }

  const responses = await Promise.all(promises);
  const status200Count = responses.filter(r => r.status === 200).length;
  const status409Count = responses.filter(r => r.status === 409).length;

  console.log(`   Total requests: 50 | 200 OK: ${status200Count} | 409 Conflict: ${status409Count}`);
  if (status200Count === 1 && status409Count === 49) {
    console.log('   ✅ TEST 1 PASSED: Tepat 1 request berhasil mengunci slot, 49 lainnya ditolak 409 Conflict!\n');
    results.test1_concurrency = true;
  } else {
    console.log(`   ❌ TEST 1 FAILED: Diharapkan 1 sukses dan 49 konflik, diperoleh ${status200Count} sukses dan ${status409Count} konflik.\n`);
  }

  // -------------------------------------------------------------------
  // TEST 2: Multi-Hour Conflict Prevention
  // -------------------------------------------------------------------
  console.log('▶ [TEST 2] Multi-Hour Conflict Test...');
  const multiDate = '2026-12-02';
  await LockTimer.destroy({ where: { booking_date: multiDate } });

  // User A locks 10:00 - 12:00 (duration: 2h)
  const resUserA = await sendRequest('/api/bookings/lock', 'POST', {
    field_id: 1,
    booking_date: multiDate,
    start_hour: 10,
    duration_hours: 2,
    session_id: 'user_a_sess'
  });

  // User B tries to lock 11:00 - 12:00 (duration: 1h) -> Conflicts at hour 11!
  const resUserB = await sendRequest('/api/bookings/lock', 'POST', {
    field_id: 1,
    booking_date: multiDate,
    start_hour: 11,
    duration_hours: 1,
    session_id: 'user_b_sess'
  });

  console.log(`   User A (10:00 - 12:00) Status: ${resUserA.status}`);
  console.log(`   User B (11:00 - 12:00) Status: ${resUserB.status}`);

  if (resUserA.status === 200 && resUserB.status === 409) {
    console.log('   ✅ TEST 2 PASSED: Multi-hour collision terdeteksi secara atomik (User B ditolak 409)!\n');
    results.test2_multi_hour = true;
  } else {
    console.log(`   ❌ TEST 2 FAILED: Diharapkan User A 200 dan User B 409.\n`);
  }

  // -------------------------------------------------------------------
  // TEST 3: Price Manipulation Protection
  // -------------------------------------------------------------------
  console.log('▶ [TEST 3] Price Manipulation Rejection Test...');
  const priceTestDate = '2026-12-10';
  const sessPrice = 'price_manipulator_sess';

  // Clean slot before test
  await BookingSlot.destroy({ where: { booking_date: priceTestDate } });
  await LockTimer.destroy({ where: { booking_date: priceTestDate } });
  await Booking.destroy({ where: { booking_date: priceTestDate } });

  // Acquire lock first
  const resLockPrice = await sendRequest('/api/bookings/lock', 'POST', {
    field_id: 1,
    booking_date: priceTestDate,
    start_hour: 14,
    duration_hours: 2,
    session_id: sessPrice
  });

  // Client attempts to post total_price = 1000 (Rp 1.000) instead of genuine Rp 250.000
  const resManipulate = await sendRequest('/api/bookings/reserve', 'POST', {
    session_id: sessPrice,
    field_id: 1,
    customer_name: 'Hacker Price',
    whatsapp: '081234567890',
    category: 'mahasiswa',
    identity_number: '21753000',
    booking_date: priceTestDate,
    start_hour: 14,
    duration_hours: 2,
    payment_type: 'dp_50',
    total_price: 1000.00 // Injected fake price!
  });

  const bookingCodeManip = resManipulate.data?.data?.booking_code;
  const bookedRecord = bookingCodeManip ? await Booking.findOne({ where: { booking_code: bookingCodeManip } }) : null;
  const serverCalculatedPrice = Number(bookedRecord?.total_price);

  console.log(`   Client submitted price: Rp 1.000`);
  console.log(`   Server recorded price:  Rp ${serverCalculatedPrice.toLocaleString('id-ID')}`);

  // Normal price 250k * 2 = 500k, mahasiswa 50% = 250k
  if (serverCalculatedPrice === 250000) {
    console.log('   ✅ TEST 3 PASSED: Server menolak harga dari client dan menegakkan tarif resmi database (Rp 250.000)!\n');
    results.test3_price_manipulation = true;
  } else {
    console.log(`   ❌ TEST 3 FAILED: Server memakai harga manipulasi client: ${serverCalculatedPrice}\n`);
  }

  // Clean after test
  await BookingSlot.destroy({ where: { booking_date: priceTestDate } });
  await Booking.destroy({ where: { booking_date: priceTestDate } });

  // -------------------------------------------------------------------
  // TEST 4: Private File Auth Security
  // -------------------------------------------------------------------
  console.log('▶ [TEST 4] Private File Security & Auth Test...');

  // 1. Unauthenticated request
  const resNoAuth = await sendRequest('/api/admin/files/receipts/nonexistent.jpg', 'GET');
  console.log(`   Akses tanpa token JWT -> Status: ${resNoAuth.status}`);

  // 2. Authenticated request with Admin JWT
  const loginRes = await sendRequest('/api/admin/auth/login', 'POST', {
    username: 'admin',
    password: 'admin123'
  });
  const token = loginRes.data?.data?.token;

  const resWithAuth = await sendRequest('/api/admin/files/receipts/nonexistent.jpg', 'GET', null, {
    Authorization: `Bearer ${token}`
  });
  console.log(`   Akses dengan token admin valid -> Status: ${resWithAuth.status} (${resWithAuth.status === 404 ? 'File not found, but Auth Passed!' : 'Success'})`);

  if (resNoAuth.status === 401 && (resWithAuth.status === 200 || resWithAuth.status === 404)) {
    console.log('   ✅ TEST 4 PASSED: Endpoint file privat terlindungi otentikasi JWT (401 saat tanpa token)!\n');
    results.test4_private_file_auth = true;
  } else {
    console.log('   ❌ TEST 4 FAILED: Private file protection bocor atau gagal otentikasi.\n');
  }

  // -------------------------------------------------------------------
  // TEST 5: Auto-Expiry Cleanup Job (30m Hold Expiration)
  // -------------------------------------------------------------------
  console.log('▶ [TEST 5] Auto-Expiry & Slot Release Test...');
  const expiryDate = '2026-12-05';
  const pastTime = new Date(Date.now() - 35 * 60 * 1000); // 35 minutes ago

  const testBooking = await Booking.create({
    booking_code: 'POLI-TEST-EXPIRE',
    field_id: 1,
    customer_name: 'Expired Test User',
    whatsapp: '628999999999',
    category: 'umum',
    booking_date: expiryDate,
    start_hour: 8,
    end_hour: 9,
    total_price: 250000.00,
    paid_amount: 0.00,
    payment_status: 'pending_hold',
    status: 'pending_hold',
    hold_expires_at: pastTime
  });

  await BookingSlot.create({
    booking_id: testBooking.id,
    field_id: 1,
    booking_date: expiryDate,
    hour: 8,
    status: 'pending_hold'
  });

  console.log('   Booking pending_hold dibuat dengan hold_expires_at 35 menit lalu...');

  // Run cleanup job
  await runCleanupJobs();

  // Reload booking
  await testBooking.reload();
  const remainingSlot = await BookingSlot.findOne({ where: { booking_id: testBooking.id } });

  console.log(`   Status setelah cleanup: ${testBooking.payment_status}`);
  console.log(`   Alasan pembatalan:      ${testBooking.cancel_reason}`);
  console.log(`   Slot jam terdaftar:     ${remainingSlot ? 'Masih ada' : 'Sudah DIBEBASKAN (NULL)'}`);

  if (testBooking.payment_status === 'expired_cancelled' && !remainingSlot) {
    console.log('   ✅ TEST 5 PASSED: Booking kedaluwarsa otomatis dibatalkan dan slot langsung dibebaskan!\n');
    results.test5_auto_expiry = true;
  } else {
    console.log('   ❌ TEST 5 FAILED: Booking tidak kedaluwarsa atau slot belum dibebaskan.\n');
  }

  // Clean test booking
  await Booking.destroy({ where: { booking_code: 'POLI-TEST-EXPIRE' } });

  console.log('====================================================');
  console.log('              HASIL PENGUJIAN AKHIR');
  console.log('====================================================');
  console.table([
    { Test: '1. Concurrency (50 Concurrent Locks)', Status: results.test1_concurrency ? 'LULUS (100%)' : 'GAGAL' },
    { Test: '2. Multi-Hour Conflict Prevention', Status: results.test2_multi_hour ? 'LULUS (100%)' : 'GAGAL' },
    { Test: '3. Price Manipulation Rejection', Status: results.test3_price_manipulation ? 'LULUS (100%)' : 'GAGAL' },
    { Test: '4. Private File Auth Security', Status: results.test4_private_file_auth ? 'LULUS (100%)' : 'GAGAL' },
    { Test: '5. Auto-Expiry & Slot Release', Status: results.test5_auto_expiry ? 'LULUS (100%)' : 'GAGAL' }
  ]);

  const allPassed = Object.values(results).every(v => v === true);
  if (allPassed) {
    console.log('🎉 SEMUA 5 PENGUJIAN INTEGRASI FASE 2 LULUS DENGAN SEMPURNA!\n');
  } else {
    console.log('⚠️ Ada tes yang belum lulus. Harap periksa log di atas.\n');
  }

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
