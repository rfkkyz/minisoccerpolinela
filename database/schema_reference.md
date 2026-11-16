# ARSITEKTUR DATABASE & SISTEM BACKEND POLISOCCER
**MINI SOCCER POLITEKNIK NEGERI LAMPUNG**

Repositori ini berisi fondasi database dan sistem backend REST API untuk manajemen fasilitas lapangan mini soccer Politeknik Negeri Lampung.

---

## 1. Arsitektur Database (13 Tabel Utama)

Database yang digunakan: **MySQL / MariaDB** (Database Name: `polisoccer_db`), dikelola via ORM **Sequelize** dengan strict foreign key constraints, cascade rules, indexing, dan locking mechanism.

### Relasi & Tabel:
1. **`roles`**:
   - `id` (PK, INT AUTO_INCREMENT)
   - `role_name` (`super_admin`, `admin_lapangan`, `manajer`) UNIQUE
2. **`users`**:
   - `id` (PK, INT AUTO_INCREMENT)
   - `email` (VARCHAR(191), UNIQUE, NOT NULL)
   - `password` (VARCHAR(255), bcrypt hashed)
   - `role_id` (FK -> `roles.id`)
   - `status` (`aktif`, `nonaktif`)
   - `created_at` (TIMESTAMP)
3. **`admins`**:
   - `id` (PK, INT AUTO_INCREMENT)
   - `user_id` (FK -> `users.id` ON DELETE CASCADE, UNIQUE)
   - `nama` (VARCHAR(150))
   - `nip` (VARCHAR(50), UNIQUE, NULLABLE)
   - `whatsapp` (VARCHAR(30))
   - `created_at` (TIMESTAMP)
4. **`fields`**:
   - `id` (PK, INT AUTO_INCREMENT)
   - `nama` (VARCHAR(100))
   - `jenis_rumput` (VARCHAR(100), e.g. Monofilament FIFA 50mm)
   - `status` (`aktif`, `perawatan`)
   - `created_at` (TIMESTAMP)
5. **`pricing_categories`**:
   - `id` (PK, INT AUTO_INCREMENT)
   - `name` (`Umum`, `Mahasiswa POLINELA`, `Karyawan POLINELA`) UNIQUE
   - `created_at` (TIMESTAMP)
6. **`schedules`**:
   - `id` (PK, INT AUTO_INCREMENT)
   - `field_id` (FK -> `fields.id` ON DELETE CASCADE)
   - `day_of_week` (TINYINT: 0=Minggu, 1=Senin, ..., 6=Sabtu)
   - `open_time` (TIME, e.g. 06:00:00)
   - `close_time` (TIME, e.g. 23:00:00)
   - `is_active` (BOOLEAN DEFAULT TRUE)
   - Constraint UNIQUE (`field_id`, `day_of_week`)
7. **`schedule_slots`**:
   - `id` (PK, INT AUTO_INCREMENT)
   - `schedule_id` (FK -> `schedules.id` ON DELETE CASCADE)
   - `start_time` (TIME, e.g. 19:00:00)
   - `end_time` (TIME, e.g. 20:00:00)
   - `price_modifier` (DECIMAL(12,2), tarif dasar per jam, e.g. Rp 150.000 - Rp 250.000)
   - `is_active` (BOOLEAN DEFAULT TRUE)
   - `created_at` (TIMESTAMP)
8. **`bookings`**:
   - `id` (PK CHAR(36), UUID v4)
   - `booking_code` (VARCHAR(50), UNIQUE, Format: `POLI-YYMMDD-XXXX`)
   - `customer_name` (VARCHAR(150))
   - `whatsapp` (VARCHAR(30))
   - `category_id` (FK -> `pricing_categories.id`)
   - `identify_number` (VARCHAR(50), NPM / NIP)
   - `identity_card_path` (VARCHAR(255), file KTM / KTA)
   - `booking_date` (DATE)
   - `total_amount` (DECIMAL(12,2))
   - `paid_amount` (DECIMAL(12,2) DEFAULT 0.00)
   - `status` (`pending_hold`, `dp_paid_50`, `fully_paid`, `cancelled`)
   - `payment_type` (`dp_50`, `full_100`)
   - `created_at` (TIMESTAMP)
9. **`booking_details`**:
   - `id` (PK, INT AUTO_INCREMENT)
   - `booking_id` (FK -> `bookings.id` ON DELETE CASCADE)
   - `slot_id` (FK -> `schedule_slots.id`)
   - `price_applied` (DECIMAL(12,2), tarif snapshot per jam sesuai kategori tarif)
   - `created_at` (TIMESTAMP)
   - Constraint UNIQUE (`booking_id`, `slot_id`)
10. **`booking_attachments`**:
    - `id` (PK, INT AUTO_INCREMENT)
    - `booking_id` (FK -> `bookings.id` ON DELETE CASCADE)
    - `file_path` (VARCHAR(255))
    - `doc_type` (`ktm`, `kta`, `bukti_tf`)
    - `created_at` (TIMESTAMP)
11. **`payments`**:
    - `id` (PK, INT AUTO_INCREMENT)
    - `booking_id` (FK -> `bookings.id` ON DELETE CASCADE)
    - `payment_type` (`dp_50`, `pelunasan_50`, `lunas_100`)
    - `amount` (DECIMAL(12,2))
    - `payment_method` (VARCHAR(50))
    - `proof_file` (VARCHAR(255))
    - `status` (`pending`, `verified`, `rejected`)
    - `created_at` (TIMESTAMP)
12. **`lock_timers`**:
    - `id` (PK, INT AUTO_INCREMENT)
    - `date` (DATE)
    - `slot_id` (FK -> `schedule_slots.id` ON DELETE CASCADE)
    - `session_id` (VARCHAR(100))
    - `expires_at` (TIMESTAMP)
    - Mencegah race-condition & double-booking pada saat user memilih slot (durasi 5 menit).
13. **`news`**:
    - `id` (PK, INT AUTO_INCREMENT)
    - `title` (VARCHAR(255))
    - `content` (TEXT)
    - `image_path` (VARCHAR(255), NULLABLE)
    - `category` (`event`, `berita`, `promo`)
    - `created_at` (TIMESTAMP)
    - *(Sesuai spesifikasi: TANPA kolom komentar)*

---

## 2. Logika Sistem Backend & Concurrency Protection

### A. Mekanisme Pencegahan Double-Booking (`/api/bookings/lock`)
1. Setiap transaksi query lock dijalankan di dalam Database Transaction (`transaction.LOCK.UPDATE`).
2. Server membersihkan lock expired secara berkala via cron job (`lockCleanupCron.js`) dan pembersihan proaktif di level query.
3. Cek apakah slot sudah dipesan di tabel `booking_details` dengan status `dp_paid_50` atau `fully_paid`. Jika sudah ada -> **Tolak dengan status 409 Conflict**.
4. Cek apakah slot sedang di-hold di `lock_timers` oleh `session_id` yang berbeda dengan `expires_at > NOW()`. Jika ada -> **Tolak dengan status 409 Conflict**.
5. Jika slot tersedia, server menyimpan data hold di `lock_timers` selama 5 menit (`expires_at = NOW() + 5 MINUTES`).

### B. Hitung Harga Otomatis & Reservasi (`/api/bookings/reserve`)
1. Validasi sesi lock aktif di `lock_timers`.
2. Validasi Kategori:
   - **Umum**: Tarif umum tetap per jam, tanpa syarat kartu identitas.
   - **Mahasiswa POLINELA**: Tarif mahasiswa tetap per jam, wajib mengisi NPM dan mengunggah KTM via Multer.
   - **Karyawan POLINELA**: Tarif karyawan tetap per jam, wajib mengisi NIP dan mengunggah KTA via Multer.
3. Total harga dihitung berdasarkan tarif snapshot per jam dikalikan durasi jam main.
4. Generate kode booking unik dengan format: `POLI-[YYMMDD]-[4 RANDOM CHARS]`.
5. Transaksi disimpan dengan status `pending_hold`.

### C. Konfirmasi DP 50% & Penerbitan e-Ticket (`/api/bookings/confirm-dp`)
1. Pengguna mengunggah foto bukti transfer bank menggunakan `multer`.
2. Sistem mencatat pembayaran ke tabel `payments` dan attachment bukti ke `booking_attachments`.
3. Menghapus baris lock dari `lock_timers` sehingga slot secara permanen menjadi milik booking ini.
4. Memperbarui status booking menjadi `dp_paid_50` (atau `fully_paid` jika pembayaran 100%).
5. Menerbitkan nomor e-Ticket resmi `TKT-POLI-YYMMDD-XXXX` beserta rincian jadwal, lapangan, dan sisa pelunasan.

---

## 3. Akun Default Seeder

- **Super Admin**: `superadmin@polinela.ac.id` / `admin123`
- **Admin Lapangan**: `adminlapangan@polinela.ac.id` / `admin123`
- **Manajer Fasilitas**: `manajer@polinela.ac.id` / `admin123`
