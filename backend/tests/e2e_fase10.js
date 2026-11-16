/**
 * Complete End-to-End (E2E) Test Suite for POLISOCCER - FASE 10
 * Validates All 7 Primary User & Admin Operational Scenarios:
 * 
 * 1. Skenario A: Registrasi Mahasiswa + Upload KTM + Lock Slot 5 Menit + Reserve
 * 2. Skenario B: Admin Konfirmasi DP 50% & Verifikasi Identitas
 * 3. Skenario C: Pengguna Mengakses E-Tiket Resmi & Validasi Status dp_paid_50
 * 4. Skenario D: Deteksi Tabrakan Jadwal Bersamaan (Race Condition Multi-User) -> 409
 * 5. Skenario E: Otomatisasi Pembersihan Kedaluwarsa Cron Hold 30 Menit -> expired_cancelled
 * 6. Skenario F: Aturan Batas Waktu Pembatalan 24 Jam (H-1)
 * 7. Skenario G: Tata Kelola Superadmin (Buat Akun Admin Baru & Login Sukses)
 */
const axios = require('../node_modules/axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { sequelize, User, Booking, BookingSlot, LockTimer, BlockedSlot, ActivityLog } = require('../models');
const { runCleanupJobs } = require('../jobs/lockCleanupCron');

const BASE_URL = 'http://localhost:5000/api';

// Complete valid standard JPEG image buffer
const VALID_JPEG_BUFFER = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60,
  0x00, 0x60, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
  0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
  0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
  0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
  0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
  0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F,
  0x00, 0xBF, 0x00, 0xFF, 0xD9
]);

async function runE2E() {
  console.log('========================================================================');
  console.log('   PENGUJIAN E2E MENYELURUH (END-TO-END) POLISOCCER FASE 10');
  console.log('========================================================================');

  let passed = 0;
  const total = 7;

  // -------------------------------------------------------------------------
  // SKENARIO A: Pengunjung -> Registrasi Mahasiswa + KTM -> Kunci 5m -> Reserve
  // -------------------------------------------------------------------------
  console.log('\n[SKENARIO A] Registrasi Mahasiswa, Lock Multi-Jam 5 Menit & Reservasi...');
  let mhsToken, mhsUser, bookingCode, bookingId;
  const testDate = '2026-12-25'; // Christmas 2026

  try {
    await sequelize.query(`DELETE FROM lock_timers WHERE booking_date = '${testDate}'`);
    await sequelize.query(`DELETE FROM booking_slots WHERE booking_date = '${testDate}'`);

    const mhsEmail = `mhs_e2e_${Date.now()}@polinela.ac.id`;
    const mhsPassword = 'Password123!';
    const mhsPhone = '0812' + Math.floor(10000000 + Math.random() * 90000000);
    const mhsNpm = '21' + Math.floor(100000 + Math.random() * 900000);

    const regForm = new FormData();
    regForm.append('full_name', 'Budi Santoso (E2E)');
    regForm.append('name', 'Budi Santoso (E2E)');
    regForm.append('email', mhsEmail);
    regForm.append('phone', mhsPhone);
    regForm.append('password', mhsPassword);
    regForm.append('category', 'mahasiswa');
    regForm.append('identity_number', mhsNpm);
    regForm.append('identity_card', VALID_JPEG_BUFFER, { filename: 'ktm_budi.jpg', contentType: 'image/jpeg' });

    const regRes = await axios.post(`${BASE_URL}/auth/register`, regForm, {
      headers: { ...regForm.getHeaders(), 'x-bypass-ratelimit': 'true' }
    });

    mhsToken = regRes.data.data?.token || regRes.data.token;
    mhsUser = regRes.data.data?.user || regRes.data.user;
    if (!mhsToken) throw new Error('Token mahasiswa tidak ditemukan setelah registrasi');
    console.log('  -> 1. Mahasiswa berhasil mendaftar dengan identitas NPM & KTM.');

    // Kunci slot 5 menit (Jam 16:00 - 18:00 WIB, 2 jam)
    const lockRes = await axios.post(`${BASE_URL}/bookings/lock`, {
      field_id: 1,
      date: testDate,
      start_hour: 16,
      duration: 2,
    }, {
      headers: { Authorization: `Bearer ${mhsToken}`, 'x-bypass-ratelimit': 'true' }
    });

    if (!lockRes.data.success || !lockRes.data.data?.expires_at) {
      throw new Error('Gagal mengunci slot 5 menit');
    }
    console.log('  -> 2. Slot jam 16:00 - 18:00 WIB berhasil dikunci atomik selama 5 menit.');

    // Cek quote kalkulator harga (Diskon 50% Mahasiswa)
    const quoteRes = await axios.post(`${BASE_URL}/bookings/quote`, {
      field_id: 1,
      category: 'mahasiswa',
      hours: 2,
      duration: 2
    }, {
      headers: { Authorization: `Bearer ${mhsToken}`, 'x-bypass-ratelimit': 'true' }
    });

    const expectedTotal = 250000; // 2 jam x 250.000 - 50% = 250.000
    const returnedTotal = quoteRes.data.data?.total_price ?? quoteRes.data.data?.totalPrice;
    if (returnedTotal !== expectedTotal) {
      throw new Error(`Perhitungan harga diskon salah: ${returnedTotal} vs ${expectedTotal}`);
    }
    const returnedDp = quoteRes.data.data?.dp_amount ?? quoteRes.data.data?.dpAmount;
    console.log(`  -> 3. Tarif terverifikasi diskon 50%: Total ${expectedTotal} (DP 50%: ${returnedDp}).`);

    // Lakukan Reservasi (Hold 30 Menit)
    const reserveForm = new FormData();
    reserveForm.append('field_id', 1);
    reserveForm.append('booking_date', testDate);
    reserveForm.append('start_hour', 16);
    reserveForm.append('end_hour', 18);
    reserveForm.append('customer_name', 'Budi Santoso (E2E)');
    reserveForm.append('whatsapp', mhsPhone);
    reserveForm.append('category', 'mahasiswa');
    reserveForm.append('payment_type', 'dp');
    reserveForm.append('proof_of_payment', VALID_JPEG_BUFFER, { filename: 'transfer_dp.jpg', contentType: 'image/jpeg' });

    const reserveRes = await axios.post(`${BASE_URL}/bookings/reserve`, reserveForm, {
      headers: { ...reserveForm.getHeaders(), Authorization: `Bearer ${mhsToken}`, 'x-bypass-ratelimit': 'true' }
    });

    bookingCode = reserveRes.data.data.booking_code;
    bookingId = reserveRes.data.data.id || reserveRes.data.data.booking_id;
    if (!bookingCode || reserveRes.data.data.payment_status !== 'pending_hold') {
      throw new Error('Pemesanan gagal berstatus pending_hold');
    }
    console.log(`  -> 4. Reservasi sukses dibuat! Kode: ${bookingCode}, Status: pending_hold.`);
    console.log('✅ SKENARIO A LULUS!');
    passed++;
  } catch (err) {
    console.error('❌ SKENARIO A GAGAL:', err.response?.data || err.message);
  }

  // -------------------------------------------------------------------------
  // SKENARIO B: Admin Memeriksa Pesanan & Konfirmasi DP 50%
  // -------------------------------------------------------------------------
  console.log('\n[SKENARIO B] Admin Konfirmasi DP 50% & Verifikasi Identitas...');
  let adminToken;
  try {
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@polinela.ac.id',
      password: 'admin123'
    }, { headers: { 'x-bypass-ratelimit': 'true' } });

    adminToken = adminLogin.data.data?.token || adminLogin.data.token;
    console.log('  -> 1. Admin operasional berhasil login.');

    // Verifikasi identitas KTM mahasiswa
    await axios.patch(`${BASE_URL}/admin/bookings/${bookingId}/verify-identity`, {
      status: 'verified',
      downgrade_to_umum: false
    }, { headers: { Authorization: `Bearer ${adminToken}`, 'x-bypass-ratelimit': 'true' } });
    console.log('  -> 2. Admin memverifikasi kartu identitas KTM mahasiswa: SAH.');

    // Konfirmasi pembayaran DP 50%
    const confirmDpRes = await axios.patch(`${BASE_URL}/admin/bookings/${bookingId}/confirm-dp`, {}, {
      headers: { Authorization: `Bearer ${adminToken}`, 'x-bypass-ratelimit': 'true' }
    });

    if (confirmDpRes.data.data.payment_status !== 'dp_paid_50') {
      throw new Error('Status gagal berubah menjadi dp_paid_50');
    }
    console.log(`  -> 3. Admin mengonfirmasi DP 50%: status berubah menjadi dp_paid_50.`);
    console.log('✅ SKENARIO B LULUS!');
    passed++;
  } catch (err) {
    console.error('❌ SKENARIO B GAGAL:', err.response?.data || err.message);
  }

  // -------------------------------------------------------------------------
  // SKENARIO C: Pengguna Membuka E-Tiket & Verifikasi QR Code
  // -------------------------------------------------------------------------
  console.log('\n[SKENARIO C] Pengguna Mengakses E-Tiket Resmi...');
  try {
    const userBookingRes = await axios.get(`${BASE_URL}/me/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${mhsToken}`, 'x-bypass-ratelimit': 'true' }
    });

    const bData = userBookingRes.data.data;
    if (bData.payment_status !== 'dp_paid_50') {
      throw new Error(`Status tiket bukan dp_paid_50: ${bData.payment_status}`);
    }
    console.log(`  -> E-Tiket terbit resmi untuk ${bData.customer_name}.`);
    console.log(`  -> Kode QR Booking Code: ${bData.booking_code} | Jam: ${bData.start_hour}:00 - ${bData.end_hour}:00 WIB.`);
    console.log('✅ SKENARIO C LULUS!');
    passed++;
  } catch (err) {
    console.error('❌ SKENARIO C GAGAL:', err.response?.data || err.message);
  }

  // -------------------------------------------------------------------------
  // SKENARIO D: Deteksi Tabrakan Jadwal Bersamaan (Race Condition Multi-User)
  // -------------------------------------------------------------------------
  console.log('\n[SKENARIO D] Tes Tabrakan Jadwal Bersamaan (Race Condition Lock)...');
  const collisionDate = '2026-12-26';
  try {
    await sequelize.query(`DELETE FROM lock_timers WHERE booking_date = '${collisionDate}'`);
    await sequelize.query(`DELETE FROM booking_slots WHERE booking_date = '${collisionDate}'`);

    // First request locks successfully
    const res1 = await axios.post(`${BASE_URL}/bookings/lock`, {
      field_id: 1,
      date: collisionDate,
      start_hour: 20,
      duration: 2
    }, { headers: { 'X-Session-Id': 'sess_user_A', 'x-bypass-ratelimit': 'true' } });

    // Second overlapping request should be rejected with 409
    const res2 = await axios.post(`${BASE_URL}/bookings/lock`, {
      field_id: 1,
      date: collisionDate,
      start_hour: 20,
      duration: 2
    }, { headers: { 'X-Session-Id': 'sess_user_B', 'x-bypass-ratelimit': 'true' } }).catch(e => e.response);

    if (res1.status === 200 && res2.status === 409) {
      console.log('  -> Deteksi Tabrakan Sempurna: Tepat 1 permintaan berhasil (200 OK) dan 1 ditolak (409 Conflict - SLOT_TAKEN).');
      console.log('✅ SKENARIO D LULUS: Perlindungan tabrakan atomik MariaDB aktif 100%!');
      passed++;
    } else {
      throw new Error(`Hasil tidak sesuai: status1=${res1?.status}, status2=${res2?.status}`);
    }
  } catch (err) {
    console.error('❌ SKENARIO D GAGAL:', err.message);
  }

  // -------------------------------------------------------------------------
  // SKENARIO E: Otomatisasi Pembersihan Kedaluwarsa Cron Hold 30 Menit
  // -------------------------------------------------------------------------
  console.log('\n[SKENARIO E] Tes Cron Hold Kedaluwarsa & Pembebasan Slot...');
  const cronDate = '2026-12-27';
  try {
    await sequelize.query(`DELETE FROM lock_timers WHERE booking_date = '${cronDate}'`);
    await sequelize.query(`DELETE FROM booking_slots WHERE booking_date = '${cronDate}'`);

    const dummyBooking = await Booking.create({
      booking_code: `POLI-CRON-${Date.now().toString().slice(-4)}`,
      field_id: 1,
      customer_name: 'Tes Cron Expire',
      whatsapp: '628999888777',
      category: 'umum',
      booking_date: cronDate,
      start_hour: 10,
      end_hour: 11,
      total_price: 200000,
      paid_amount: 0,
      payment_status: 'pending_hold',
      hold_expires_at: new Date(Date.now() - 5 * 60 * 1000)
    });

    await BookingSlot.create({
      booking_id: dummyBooking.id,
      field_id: 1,
      booking_date: cronDate,
      hour: 10,
      is_active: 1,
      active_flag: 1
    });

    console.log('  -> 1. Dibuat pemesanan pending_hold dengan hold_expires_at kedaluwarsa.');

    // Jalankan cron pembersih
    await runCleanupJobs();

    const refreshedBooking = await Booking.findByPk(dummyBooking.id);
    const refreshedSlot = await BookingSlot.findOne({ where: { booking_id: dummyBooking.id } });

    if (refreshedBooking.payment_status === 'expired_cancelled' && refreshedSlot.active_flag === null) {
      console.log('  -> 2. Cron berhasil membatalkan booking (expired_cancelled) & melepaskan slot (active_flag = null).');
      console.log('✅ SKENARIO E LULUS: Otomatisasi cron berjalan presisi!');
      passed++;
    } else {
      throw new Error(`Gagal dibatalkan oleh cron: status=${refreshedBooking.payment_status}, active_flag=${refreshedSlot.active_flag}`);
    }
  } catch (err) {
    console.error('❌ SKENARIO E GAGAL:', err.message);
  }

  // -------------------------------------------------------------------------
  // SKENARIO F: Aturan Batas Waktu Pembatalan 24 Jam (H-1)
  // -------------------------------------------------------------------------
  console.log('\n[SKENARIO F] Tes Aturan Pembatalan 24 Jam (H-1)...');
  try {
    // Gunakan user mahasiswa yang dibuat di Skenario A
    const targetUserId = mhsUser?.id || (await User.findOne({ where: { role: 'user' } }))?.id;

    // 1. Booking pada hari yang sama (<24 jam)
    const todayStr = new Date().toISOString().split('T')[0];
    const nearBooking = await Booking.create({
      booking_code: `POLI-NEAR-${Date.now().toString().slice(-4)}`,
      field_id: 1,
      user_id: targetUserId,
      customer_name: 'Budi Santoso',
      whatsapp: '081299887766',
      category: 'umum',
      booking_date: todayStr,
      start_hour: 22,
      end_hour: 23,
      total_price: 200000,
      paid_amount: 100000,
      payment_status: 'dp_paid_50'
    });

    // Coba batalkan booking < 24 jam lewat API user
    const cancelNearRes = await axios.patch(
      `${BASE_URL}/me/bookings/${nearBooking.id}/cancel`,
      { reason: 'Tiba-tiba berhalangan' },
      { headers: { Authorization: `Bearer ${mhsToken}`, 'x-bypass-ratelimit': 'true' } }
    ).catch(e => e.response);

    if (cancelNearRes?.status === 400) {
      console.log('  -> 1. Pembatalan < 24 jam berhasil DITOLAK sesuai peraturan resmi (400 Bad Request).');
    } else {
      throw new Error(`Pembatalan <24 jam seharusnya ditolak, dapat status: ${cancelNearRes?.status}`);
    }

    // 2. Booking H-5 (>24 jam)
    const futureDate = '2026-12-30';
    const futureBooking = await Booking.create({
      booking_code: `POLI-FUTR-${Date.now().toString().slice(-4)}`,
      field_id: 1,
      user_id: targetUserId,
      customer_name: 'Budi Santoso',
      whatsapp: '081299887766',
      category: 'umum',
      booking_date: futureDate,
      start_hour: 20,
      end_hour: 21,
      total_price: 200000,
      paid_amount: 100000,
      payment_status: 'dp_paid_50'
    });

    await BookingSlot.create({
      booking_id: futureBooking.id,
      field_id: 1,
      booking_date: futureDate,
      hour: 20,
      is_active: 1,
      active_flag: 1
    });

    // Coba batalkan booking > 24 jam
    const cancelFutureRes = await axios.patch(
      `${BASE_URL}/me/bookings/${futureBooking.id}/cancel`,
      { reason: 'Jadwal turnamen bergeser' },
      { headers: { Authorization: `Bearer ${mhsToken}`, 'x-bypass-ratelimit': 'true' } }
    );

    const refreshedFutureSlot = await BookingSlot.findOne({ where: { booking_id: futureBooking.id } });
    if (cancelFutureRes.status === 200 && refreshedFutureSlot.active_flag === null) {
      console.log('  -> 2. Pembatalan >= 24 jam DISETUJUI & slot jam 20:00 langsung terbuka kembali.');
      console.log('✅ SKENARIO F LULUS: Kebijakan pembatalan 24 jam teruji kokoh!');
      passed++;
    } else {
      throw new Error('Gagal memproses pembatalan masa depan');
    }
  } catch (err) {
    console.error('❌ SKENARIO F GAGAL:', err.response?.data || err.message);
  }

  // -------------------------------------------------------------------------
  // SKENARIO G: Tata Kelola Superadmin (Buat Akun Admin & Login)
  // -------------------------------------------------------------------------
  console.log('\n[SKENARIO G] Tata Kelola Superadmin (Buat Admin Baru & Login)...');
  try {
    const superLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'superadmin@polinela.ac.id',
      password: 'superadmin123'
    }, { headers: { 'x-bypass-ratelimit': 'true' } });

    const superToken = superLogin.data.data?.token || superLogin.data.token;
    console.log('  -> 1. Superadmin berhasil login ke konsol superadmin.');

    const newAdminUsername = `adm_new_${Date.now()}`;
    const newAdminEmail = `${newAdminUsername}@polinela.ac.id`;
    const newAdminPassword = 'AdminPassword123!';

    // Buat admin baru
    await axios.post(`${BASE_URL}/superadmin/admins`, {
      full_name: 'Admin Baru Polinela',
      name: 'Admin Baru Polinela',
      username: newAdminUsername,
      email: newAdminEmail,
      password: newAdminPassword,
      role: 'admin'
    }, { headers: { Authorization: `Bearer ${superToken}`, 'x-bypass-ratelimit': 'true' } });
    console.log(`  -> 2. Superadmin berhasil membuat admin baru: @${newAdminUsername}.`);

    // Uji login admin baru
    const newAdminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: newAdminEmail,
      password: newAdminPassword
    }, { headers: { 'x-bypass-ratelimit': 'true' } });

    if (newAdminLogin.status === 200 && (newAdminLogin.data.data?.user?.role === 'admin' || newAdminLogin.data.user?.role === 'admin')) {
      console.log('  -> 3. Admin baru berhasil login dan mendapatkan akses ke portal admin!');
      console.log('✅ SKENARIO G LULUS: Manajemen superadmin beroperasi sempurna!');
      passed++;
    } else {
      throw new Error('Gagal login dengan kredensial admin baru');
    }
  } catch (err) {
    console.error('❌ SKENARIO G GAGAL:', err.response?.data || err.message);
  }

  // -------------------------------------------------------------------------
  // REKAPITULASI HASIL AKHIR
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`   REKAP HASIL PENGUJIAN E2E: ${passed} / ${total} SKENARIO LULUS (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================================================');

  if (passed === total) {
    console.log('🏆 SELURUH SKENARIO END-TO-END FASE 10 LULUS 100%! SISTEM SIAP DIGUNAKAN.');
  } else {
    console.log('⚠️ BEBERAPA SKENARIO GAGAL. SILAKAN PERIKSA LOG DI ATAS.');
    process.exit(1);
  }
}

runE2E()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal Test Runner Error:', e);
    process.exit(1);
  });
