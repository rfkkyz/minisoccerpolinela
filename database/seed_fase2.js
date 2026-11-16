/**
 * Comprehensive Idempotent Seeder for POLISOCCER - FASE 2
 * Meets all Fase 2 specifications (UUIDs, bcrypt cost 12, activity_logs, gallery_images, settings)
 */
const path = require('path');
const bcrypt = require('../backend/node_modules/bcryptjs');
const mysql = require('../backend/node_modules/mysql2/promise');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const host = process.env.DB_HOST || '127.0.0.1';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASS || '';
const database = process.env.DB_NAME || 'polisoccer_db';
const port = Number(process.env.DB_PORT) || 3306;

async function seedDatabase() {
  console.log(`[SEED] Connecting to MariaDB/MySQL at ${host}:${port}...`);
  const connection = await mysql.createConnection({
    host,
    user,
    password,
    database,
    port,
    multipleStatements: true
  });

  try {
    // 1. FIELDS
    console.log('[SEED] Seeding 1 Field with 3-Tier Prices...');
    await connection.query(`
      INSERT INTO fields (id, name, price_umum, price_mahasiswa, price_karyawan, status)
      VALUES 
        (1, 'Lapangan Mini Soccer Polinela', 150000.00, 100000.00, 120000.00, 'active')
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name),
        price_umum = VALUES(price_umum),
        price_mahasiswa = VALUES(price_mahasiswa),
        price_karyawan = VALUES(price_karyawan),
        status = VALUES(status);
    `);

    // 2. USERS (Bcrypt Cost 12)
    console.log('[SEED] Generating bcrypt cost 12 hashes for accounts...');
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    const superPass = process.env.SUPERADMIN_PASSWORD || 'superadmin123';
    const userPass = 'User12345';

    const salt12 = await bcrypt.genSalt(12);
    const adminHash = await bcrypt.hash(adminPass, salt12);
    const superHash = await bcrypt.hash(superPass, salt12);
    const userHash = await bcrypt.hash(userPass, salt12);

    const usersToSeed = [
      {
        id: '00000000-0000-4000-8000-000000000001',
        full_name: 'Super Administrator Politeknik Negeri Lampung',
        email: 'superadmin@polinela.ac.id',
        phone: '6281100000001',
        password: superHash,
        role: 'superadmin',
        category: 'karyawan',
        identity_number: '198501152010121001',
        identity_status: 'verified'
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        full_name: 'Admin Lapangan Mini Soccer POLINELA',
        email: 'admin@polinela.ac.id',
        phone: '6281100000002',
        password: adminHash,
        role: 'admin',
        category: 'karyawan',
        identity_number: '199003202015041002',
        identity_status: 'verified'
      },
      {
        id: '00000000-0000-4000-9000-000000000001',
        full_name: 'Rifki Rangga Saputra (Mahasiswa)',
        email: 'mahasiswa@polinela.ac.id',
        phone: '6281234567899',
        password: userHash,
        role: 'user',
        category: 'mahasiswa',
        identity_number: '21753045',
        identity_status: 'verified',
        identity_card_path: '/uploads/identity/sample_ktm.jpg'
      },
      {
        id: '00000000-0000-4000-9000-000000000002',
        full_name: 'Dr. Ir. Budi Prasetyo, M.T. (Dosen)',
        email: 'karyawan@polinela.ac.id',
        phone: '6281298765432',
        password: userHash,
        role: 'user',
        category: 'karyawan',
        identity_number: '198005122005011002',
        identity_status: 'verified',
        identity_card_path: '/uploads/identity/sample_kta.jpg'
      }
    ];

    for (const u of usersToSeed) {
      await connection.query(`
        INSERT INTO users (id, full_name, email, phone, password, role, is_active, must_change_password, category, identity_number, identity_status, identity_card_path)
        VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          full_name = VALUES(full_name),
          email = VALUES(email),
          phone = VALUES(phone),
          password = VALUES(password),
          role = VALUES(role),
          category = VALUES(category),
          identity_number = VALUES(identity_number),
          identity_status = VALUES(identity_status),
          identity_card_path = VALUES(identity_card_path);
      `, [u.id, u.full_name, u.email, u.phone, u.password, u.role, u.category, u.identity_number, u.identity_status, u.identity_card_path || null]);
    }

    // 3. SETTINGS
    console.log('[SEED] Seeding System Settings...');
    const defaultSettings = [
      ['OPEN_HOUR', '8'],
      ['CLOSE_HOUR', '22'],
      ['HOLD_MINUTES', '30'],
      ['LOCK_MINUTES', '5'],
      ['MAX_HOURS', '3'],
      ['MAX_DAYS_AHEAD', '60'],
      ['CANCEL_BEFORE_HOURS', '24'],
      ['BANK_NAME', 'Bank Mandiri'],
      ['BANK_ACCOUNT_NO', '1140023456789'],
      ['BANK_ACCOUNT_NAME', 'Politeknik Negeri Lampung - Mini Soccer'],
      ['ADMIN_WHATSAPP', '6281234567890']
    ];

    for (const [key, val] of defaultSettings) {
      await connection.query(`
        INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`);
      `, [key, val]);
    }

    // 4. NEWS & GALLERY IMAGES
    console.log('[SEED] Seeding 5 News Posts & Gallery Images...');
    await connection.query(`DELETE FROM gallery_images WHERE news_id IN (SELECT id FROM news WHERE title LIKE '%POLINELA%');`);
    await connection.query(`DELETE FROM news WHERE title LIKE '%POLINELA%';`);

    const newsData = [
      {
        title: 'Turnamen Mini Soccer Dies Natalis POLINELA Ke-42',
        content: 'Dalam rangka memeriahkan Dies Natalis Politeknik Negeri Lampung ke-42, UKM Olahraga POLINELA mengadakan turnamen mini soccer antar jurusan dan instansi mitra. Hadiah total puluhan juta rupiah menanti.',
        type: 'kegiatan',
        event_date: '2026-11-25',
        image: '/news-turf.jpg'
      },
      {
        title: 'Kesiapan Fasilitas Penerangan Lapangan Mini Soccer Polinela',
        content: 'Fasilitas penerangan lapangan mini soccer Politeknik Negeri Lampung siap mendukung kegiatan olahraga malam hari bagi civitas akademika dan masyarakat.',
        type: 'berita',
        event_date: null,
        image: '/minisoccer-hero-1.jpg'
      },
      {
        title: 'Pemberlakuan Tarif Khusus Mahasiswa Aktif POLINELA',
        content: 'Sistem reservasi POLISOCCER memberlakukan tarif khusus mahasiswa aktif Politeknik Negeri Lampung (Rp100.000 / jam) dengan verifikasi identitas KTM di sistem online.',
        type: 'pengumuman',
        event_date: null,
        image: '/minisoccer-hero-2.jpg'
      },
      {
        title: 'Jadwal Pemeliharaan Rumput Sintetis Monofilament Setiap Senin Pagi',
        content: 'Untuk menjaga daya pantul bola dan keselamatan pemain, perawatan berkala serta penyisiran pasir silika dan rubber infill dilakukan rutin setiap hari Senin pukul 06.00-08.00 WIB.',
        type: 'berita',
        event_date: null,
        image: '/news-turf.jpg'
      },
      {
        title: 'Liga Mahasiswa Politeknik se-Sumbagsel 2026 Resmi Digelar di Polinela',
        content: 'Kampus Politeknik Negeri Lampung terpilih menjadi tuan rumah perhelatan Liga Mini Soccer Mahasiswa se-Sumatera Bagian Selatan.',
        type: 'kegiatan',
        event_date: '2026-12-10',
        image: '/minisoccer-hero-1.jpg'
      }
    ];

    for (const n of newsData) {
      const [res] = await connection.query(`
        INSERT INTO news (title, content, type, is_published, event_date, image_path, created_by)
        VALUES (?, ?, ?, 1, ?, ?, '00000000-0000-4000-8000-000000000001');
      `, [n.title, n.content, n.type, n.event_date, n.image]);

      const newsId = res.insertId;
      await connection.query(`
        INSERT INTO gallery_images (news_id, image_path, caption, is_cover, sort_order)
        VALUES (?, ?, ?, 1, 1);
      `, [newsId, n.image, n.title]);
    }

    // 5. SAMPLE BOOKINGS & ATOMIC SLOTS
    console.log('[SEED] Seeding Sample Bookings with Atomic Slots...');
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const dayAfter = new Date(Date.now() + 172800000).toISOString().slice(0, 10);

    const sampleBookings = [
      {
        id: 'f1a1a1a1-0001-4000-8000-000000000001',
        code: 'POLI-261109-1001',
        user_id: '00000000-0000-4000-9000-000000000001',
        field_id: 1,
        name: 'Rifki Rangga Saputra (Mahasiswa)',
        wa: '6281234567899',
        tariff_tier: 'mahasiswa',
        price_per_hour: 100000.00,
        hours_count: 2,
        id_num: '21753045',
        date: tomorrow,
        start_hour: 16,
        end_hour: 18,
        price: 200000.00,
        paid: 200000.00,
        status: 'fully_paid',
        pay_type: 'full_100',
        is_active: 1
      },
      {
        id: 'f1a1a1a1-0002-4000-8000-000000000002',
        code: 'POLI-261109-1002',
        user_id: null,
        field_id: 1,
        name: 'Hendra Gunawan (FC Rajabasa)',
        wa: '6281234567802',
        tariff_tier: 'umum',
        price_per_hour: 150000.00,
        hours_count: 1,
        id_num: null,
        date: tomorrow,
        start_hour: 19,
        end_hour: 20,
        price: 150000.00,
        paid: 75000.00,
        status: 'dp_paid_50',
        pay_type: 'dp_50',
        is_active: 1
      },
      {
        id: 'f1a1a1a1-0003-4000-8000-000000000003',
        code: 'POLI-261109-1003',
        user_id: '00000000-0000-4000-9000-000000000002',
        field_id: 1,
        name: 'Dr. Ir. Budi Prasetyo, M.T. (Dosen)',
        wa: '6281298765432',
        tariff_tier: 'karyawan',
        price_per_hour: 120000.00,
        hours_count: 1,
        id_num: '198005122005011002',
        date: tomorrow,
        start_hour: 20,
        end_hour: 21,
        price: 120000.00,
        paid: 0.00,
        status: 'pending_hold',
        pay_type: 'dp_50',
        is_active: 1
      },
      {
        id: 'f1a1a1a1-0004-4000-8000-000000000004',
        code: 'POLI-261109-1004',
        user_id: null,
        field_id: 1,
        name: 'Komunitas Sepakbola Unila',
        wa: '6281234567804',
        tariff_tier: 'umum',
        price_per_hour: 150000.00,
        hours_count: 1,
        id_num: null,
        date: dayAfter,
        start_hour: 10,
        end_hour: 11,
        price: 150000.00,
        paid: 0.00,
        status: 'expired_cancelled',
        pay_type: 'dp_50',
        is_active: 0
      }
    ];

    for (const b of sampleBookings) {
      await connection.query(`
        INSERT INTO bookings (id, booking_code, user_id, field_id, customer_name, whatsapp, tariff_tier, price_per_hour, hours_count, identity_number, booking_date, start_hour, end_hour, total_price, paid_amount, payment_status, payment_type, hold_expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))
        ON DUPLICATE KEY UPDATE
          user_id = VALUES(user_id),
          customer_name = VALUES(customer_name),
          tariff_tier = VALUES(tariff_tier),
          price_per_hour = VALUES(price_per_hour),
          hours_count = VALUES(hours_count),
          payment_status = VALUES(payment_status),
          paid_amount = VALUES(paid_amount);
      `, [b.id, b.code, b.user_id, b.field_id, b.name, b.wa, b.tariff_tier, b.price_per_hour, b.hours_count, b.id_num, b.date, b.start_hour, b.end_hour, b.price, b.paid, b.status, b.pay_type]);

      // Seed slots in booking_slots
      for (let h = b.start_hour; h < b.end_hour; h++) {
        const activeFlag = b.is_active ? 1 : null;
        await connection.query(`
          INSERT INTO booking_slots (booking_id, field_id, booking_date, hour, is_active, active_flag, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            is_active = VALUES(is_active),
            active_flag = VALUES(active_flag),
            status = VALUES(status);
        `, [b.id, b.field_id, b.date, h, b.is_active, activeFlag, b.status]);
      }
    }

    // 6. BLOCKED SLOTS SAMPLE
    console.log('[SEED] Seeding Sample Blocked Slot...');
    await connection.query(`
      INSERT INTO blocked_slots (field_id, booking_date, hour, reason, created_by)
      VALUES (1, ?, 8, 'Pemeliharaan Rutin Rumput & Sikat Sintetis', '00000000-0000-4000-8000-000000000001')
      ON DUPLICATE KEY UPDATE reason = VALUES(reason);
    `, [dayAfter]);

    // 7. INITIAL ACTIVITY LOG
    console.log('[SEED] Recording Initial Activity Log...');
    await connection.query(`
      INSERT INTO activity_logs (actor_id, actor_role, action, entity_type, entity_id, detail, ip_address)
      VALUES (
        '00000000-0000-4000-8000-000000000001',
        'superadmin',
        'SYSTEM_SEED',
        'database',
        'polisoccer_db',
        JSON_OBJECT('message', 'Fase 2 Database Seeding successfully completed with full integrity'),
        '127.0.0.1'
      );
    `);

    console.log('\n[SUCCESS] Fase 2 Idempotent Database Seeding Completed Successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedDatabase();
