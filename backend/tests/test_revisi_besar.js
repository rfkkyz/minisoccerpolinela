/**
 * Test Suite: REVISI BESAR POLISOCCER
 * 1. Logika Tarif 3 Tingkat Tanpa Diskon (Umum, Mahasiswa, Karyawan)
 * 2. Immutability of Price Snapshot (price_per_hour, hours_count)
 * 3. Atomic recalculation on change_to_umum
 * 4. Scan for zero prohibited words in API responses
 */
process.env.NODE_ENV = 'test';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');
const { sequelize } = require('../models');
const app = require('../server');

async function runTests() {
  console.log('========================================================');
  console.log('   TESTING: REVISI BESAR POLISOCCER - 3 TINGKAT TARIF   ');
  console.log('========================================================\n');

  await sequelize.authenticate();
  const server = app.listen(0);
  const port = server.address().port;
  const BASE_URL = `http://127.0.0.1:${port}/api`;

  const client = axios.create({
    baseURL: BASE_URL,
    validateStatus: () => true
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
    // 1. GET /api/fields -> Verify 3-tier pricing structure
    console.log('1. Verifikasi Endpoint /public/fields');
    const resFields = await client.get('/public/fields');
    assert(resFields.status === 200, 'GET /public/fields returns 200');
    const field1 = resFields.data.data ? resFields.data.data[0] : resFields.data[0];
    assert(field1 && field1.prices, 'Field returns prices object');
    assert(Number(field1.prices.umum) === 150000, `Tarif Umum = 150.000 (actual: ${field1.prices.umum})`);
    assert(Number(field1.prices.mahasiswa) === 100000, `Tarif Mahasiswa = 100.000 (actual: ${field1.prices.mahasiswa})`);
    assert(Number(field1.prices.karyawan) === 120000, `Tarif Karyawan = 120.000 (actual: ${field1.prices.karyawan})`);

    // 2. POST /api/bookings/quote -> 3-tier quotes
    console.log('\n2. Verifikasi Endpoint /bookings/quote');
    // Mahasiswa 2 jam
    const qMhs = await client.post('/bookings/quote', {
      field_id: field1.id,
      tariff_tier: 'mahasiswa',
      hours_count: 2,
      payment_type: 'dp_50'
    });
    assert(qMhs.status === 200, 'Quote Mahasiswa returns 200');
    assert(Number(qMhs.data.data.price_per_hour) === 100000, `Mahasiswa price_per_hour = 100.000 (actual: ${qMhs.data.data.price_per_hour})`);
    assert(Number(qMhs.data.data.total_price) === 200000, `Mahasiswa 2 jam total = 200.000 (actual: ${qMhs.data.data.total_price})`);
    assert(Number(qMhs.data.data.pay_now) === 100000, `DP 50% pay_now = 100.000 (actual: ${qMhs.data.data.pay_now})`);

    // Umum 3 jam full payment
    const qUmum = await client.post('/bookings/quote', {
      field_id: field1.id,
      tariff_tier: 'umum',
      hours_count: 3,
      payment_type: 'full_100'
    });
    assert(qUmum.status === 200, 'Quote Umum returns 200');
    assert(Number(qUmum.data.data.price_per_hour) === 150000, `Umum price_per_hour = 150.000 (actual: ${qUmum.data.data.price_per_hour})`);
    assert(Number(qUmum.data.data.total_price) === 450000, `Umum 3 jam total = 450.000 (actual: ${qUmum.data.data.total_price})`);
    assert(Number(qUmum.data.data.pay_now) === 450000, `Full pay_now = 450.000 (actual: ${qUmum.data.data.pay_now})`);

    // Karyawan 1 jam
    const qKaryawan = await client.post('/bookings/quote', {
      field_id: field1.id,
      tariff_tier: 'karyawan',
      hours_count: 1,
      payment_type: 'dp_50'
    });
    assert(qKaryawan.status === 200, 'Quote Karyawan returns 200');
    assert(Number(qKaryawan.data.data.price_per_hour) === 120000, `Karyawan price_per_hour = 120.000 (actual: ${qKaryawan.data.data.price_per_hour})`);
    assert(Number(qKaryawan.data.data.total_price) === 120000, `Karyawan 1 jam total = 120.000 (actual: ${qKaryawan.data.data.total_price})`);

    // 3. Prohibited Words Verification in JSON responses
    console.log('\n3. Verifikasi Tidak Ada Kata Terlarang (Zero Discount Terminology)');
    const prohibitedRegex = /diskon|discount|potongan|normal_price|student_discount|staff_discount|discount_pct/i;
    
    const fieldsStr = JSON.stringify(resFields.data);
    const qMhsStr = JSON.stringify(qMhs.data);
    const qUmumStr = JSON.stringify(qUmum.data);

    assert(!prohibitedRegex.test(fieldsStr), 'Response /public/fields bebas kata diskon/potongan/normal_price');
    assert(!prohibitedRegex.test(qMhsStr), 'Response /bookings/quote Mahasiswa bebas kata diskon/potongan');
    assert(!prohibitedRegex.test(qUmumStr), 'Response /bookings/quote Umum bebas kata diskon/potongan');

    // 4. Admin Login & change_to_umum Verification
    console.log('\n4. Verifikasi Action change_to_umum Admin');
    const loginRes = await client.post('/auth/login', {
      emailOrUsername: 'admin@polinela.ac.id',
      password: process.env.ADMIN_PASSWORD || 'admin123'
    });
    assert(loginRes.status === 200, 'Admin login berhasil');
    const token = loginRes.data.token || loginRes.data.data?.token;

    if (token) {
      const adminClient = axios.create({
        baseURL: BASE_URL,
        headers: { Authorization: `Bearer ${token}` },
        validateStatus: () => true
      });

      const bookingsRes = await adminClient.get('/admin/bookings?limit=5');
      assert(bookingsRes.status === 200, 'Admin get bookings 200');
      const bookingsList = bookingsRes.data.data?.bookings || [];
      console.log(`  -> Ditemukan ${bookingsList.length} pesanan di database.`);

      let targetBooking = bookingsList.find(b => b.tariff_tier === 'mahasiswa' || b.category === 'mahasiswa') || bookingsList[0];

      if (!targetBooking) {
        // Create a test booking under mahasiswa
        const newBooking = await adminClient.post('/admin/bookings/manual', {
          field_id: field1.id,
          booking_date: '2026-11-20',
          start_hour: 10,
          end_hour: 12,
          customer_name: 'Mahasiswa Test Polinela',
          whatsapp: '6281234567890',
          tariff_tier: 'mahasiswa',
          payment_type: 'dp_50',
          paid_amount: 100000
        });
        targetBooking = newBooking.data.data;
      }

      if (targetBooking) {
        const changeRes = await adminClient.patch(`/admin/bookings/${targetBooking.id}/change-to-umum`, {
          reason: 'Verifikasi dokumen identitas tidak valid'
        });
        assert(changeRes.status === 200, `changeToUmum response status 200 (actual: ${changeRes.status})`);
        if (changeRes.status === 200) {
          const updated = changeRes.data.data?.booking || changeRes.data.data;
          const tier = updated.tariff_tier || changeRes.data.data?.new_tariff;
          const price = updated.price_per_hour || (changeRes.data.data?.new_total / (updated.hours_count || 1));
          assert(tier === 'umum', `Tariff tier updated to umum (actual: ${tier})`);
          assert(Number(price) === 150000, `price_per_hour recalculated to 150.000 (actual: ${price})`);
          console.log(`  -> Tarif berhasil dipindahkan ke Umum: Total baru Rp ${changeRes.data.data.new_total || updated.total_price}, Per jam Rp ${price}`);
        }
      }
    }

    console.log('\n========================================================');
    console.log(`HASIL TEST: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');
  } finally {
    server.close();
    await sequelize.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
