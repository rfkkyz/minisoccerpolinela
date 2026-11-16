# POLISOCCER - SISTEM RESERVASI MINI SOCCER POLITEKNIK NEGERI LAMPUNG

Sistem Reservasi, REST API, dan Manajemen Arena Mini Soccer Politeknik Negeri Lampung berbasis 4 Halaman Akun dengan tema visual **Dark Neon Light-Green Tech** (`#7CFFB2` neon green, dark black-green gradient background `#020805`, panel terang `#EEF5F1`, 0% pink/magenta).

---

## 1. Arsitektur 4 Halaman Utama

Aplikasi distrukturkan secara terpadu menjadi 4 halaman berbasis peran akses:

1. **Halaman 1: Landing Page & Publik** (`/`, `/login`, `/daftar`, `/berita/:id`, `/cek-status`)
   - **Section 1: Floating Pill Navbar**: Logo Polinela Mini Soccer, navigasi menu (Home, Tarif dropdown, Jadwal, Berita, Cek Status Tiket), tombol Masuk & Daftar (atau dropdown profil jika sudah login).
   - **Section 2: Hero Section (100vh)**: Background gelap neon-hijau radial, label • POLITEKNIK NEGERI LAMPUNG, heading 2-warna, ringkasan live dari database (`/api/public/summary`), dan marquee fasilitas berstandar FIFA.
   - **Section 3: Tentang Sistem**: Panel terang (`#EEF5F1`) overlap hero -48px, 4 langkah alur sewa (Pilih Jadwal -> Kunci 5 Menit -> Bayar DP/Lunas -> Terima E-Tiket), 3 kartu fitur keunggulan, penjelasan tarif kampus.
   - **Section 4: Tarif & Simulasi (#tarif)**: 3 kartu harga tetap (Tarif Mahasiswa, Tarif Karyawan, Tarif Umum) + kalkulator estimasi biaya interaktif real-time.
   - **Section 5: Kalender Ketersediaan (#jadwal)**: Kalender visual bulanan dengan status warna (hijau tersedia, kuning pending, merah terisi, abu-abu terkunci) + chip jam 06-23 WIB.
   - **Section 6: Berita & Galeri (#berita)**: Tab (Semua, Berita, Kegiatan, Pengumuman) dengan grid kartu dokumentasi dan galeri foto.
   - **Section 7: CTA Section**: Panel gelap + bola 3D interaktif Three.js (`SoccerBall3D.jsx`) + tombol Daftar & Masuk.
   - **Section 8: Footer**: Alamat kampus Polinela, kontak WhatsApp admin, jam operasional 06:00 - 24:00 WIB, hak cipta.

2. **Halaman 2: User Dashboard** (`/dashboard/*`)
   - `/dashboard`: Ringkasan akun, kartu jadwal pertandingan terdekat, banner status verifikasi KTM/KTA (Tarif Mahasiswa/Karyawan), tombol pesan jadwal baru.
   - `/dashboard/booking`: Wizard 4 langkah sewa lapangan, multi-hour selection berturut-turut, kunci slot 5 menit atomik, opsi bayar DP 50% atau Lunas 100%, upload bukti transfer.
   - `/dashboard/bookings`: Daftar pesanan aktif, timer countdown hold, upload bukti transfer, batalkan pesanan (aturan H-1 / 24 jam), modal E-Tiket QR Code.
   - `/dashboard/riwayat`: Riwayat lengkap pertandingan masa lalu, filter status & tanggal, pencarian, ekspor laporan CSV.
   - `/dashboard/profil`: Data profil, formulir verifikasi kartu identitas (NPM/NIP & KTM/KTA), ganti kata sandi.

3. **Halaman 3: Admin Dashboard** (`/admin/*`)
   - `/admin`: Statistik pendapatan bulan ini & hari ini, total booking, grafik tren 7 hari (Recharts), action list antrean verifikasi bukti transfer.
   - `/admin/reservasi`: Manajemen seluruh pesanan, drawer detail 480px, zoom bukti transfer & KTM, konfirmasi DP 50%, konfirmasi lunas, tolak bukti transfer, pindahkan tarif ke umum jika KTM tidak valid, tombol walk-in / booking manual tunai di tempat.
   - `/admin/jadwal`: Jadwal harian & mingguan Lapangan A & B, fitur blokir slot untuk turnamen kampus Polinela / UKM / perawatan rumput.
   - `/admin/berita`: CRUD berita & dokumentasi galeri foto (upload cover & multiple photos).
   - `/admin/pengguna`: Daftar pengguna terdaftar, validasi KTM mahasiswa dan KTA karyawan.
   - `/admin/profil`: Profil admin dan ganti kata sandi.

4. **Halaman 4: Super Admin Dashboard** (`/superadmin/*`)
   - `/superadmin`: Ringkasan eksekutif kesehatan sistem (Database MariaDB, Cron Cleanup, Memory), total revenue, status active locks.
   - `/superadmin/admin`: Kelola akun admin & superadmin (buat akun baru, generator password, reset kata sandi, toggle status aktif/nonaktif dengan proteksi diri sendiri).
   - `/superadmin/pengguna`: Manajemen semua akun, ubah kategori langsung, suspend akun.
   - `/superadmin/aktivitas`: Jejak audit aktivitas server append-only (`activity_logs`), filter tipe aksi, ekspor log CSV.
   - `/superadmin/lapangan`: Kelola 3 tingkat tarif tetap per jam (Umum, Mahasiswa, Karyawan), status operasional lapangan (active/maintenance).
   - `/superadmin/laporan`: Laporan keuangan & utilisasi lapangan, filter rentang tanggal, grafik perbandingan lapangan, rekap kategori, cetak PDF / CSV.
   - `/superadmin/pengaturan`: Pengaturan 11 parameter sistem (nomor WA, rekening bank BSI, hold timer 5 menit, hold pending 30 menit, jam operasional).

---

## 2. Akun Bawaan untuk Pengujian (Seeded Accounts)

Semua akun menggunakan kata sandi: **`Password123!`**

| Peran (Role) | Username / Email | Hak Akses | Kategori Tarif |
|---|---|---|---|
| **Super Admin** | `superadmin` / `superadmin@polinela.ac.id` | `/superadmin/*`, `/admin/*`, `/dashboard/*` | Akses Penuh Sistem |
| **Admin Operasional** | `admin` / `admin@polinela.ac.id` | `/admin/*`, `/dashboard/*` | Operasional Lapangan |
| **User Mahasiswa** | `mahasiswa@polinela.ac.id` | `/dashboard/*` | Tarif Mahasiswa (KTM Terverifikasi) |
| **User Karyawan** | `karyawan@polinela.ac.id` | `/dashboard/*` | Tarif Karyawan (KTA Terverifikasi) |

---

## 3. Cara Menjalankan Aplikasi di Windows

### Cara 1: Sekali Klik Menggunakan File `.bat`
Cukup klik ganda file **`start-all.bat`** di root direktori proyek.
1. Memeriksa & menyalakan MySQL XAMPP (Port 3306).
2. Membuka jendela **`start-backend.bat`** (Port 5000) dan menjalankan migrasi database otomatis.
3. Membuka jendela **`start-frontend.bat`** (Port 3000) dengan Vite dev server.
4. Membuka peramban (browser) otomatis ke `http://localhost:3000`.

### Cara 2: Menjalankan Manual dari Terminal

1. **Jalankan Migrasi & Seeder Database**:
   ```powershell
   node database/migrate.js
   node database/seed_fase2.js
   ```

2. **Jalankan Backend Server**:
   ```powershell
   cd backend
   node server.js
   ```
   *Server berjalan di `http://localhost:5000` dengan cron pembersih otomatis aktif setiap 60 detik.*

3. **Jalankan Frontend Client**:
   ```powershell
   cd frontend
   npm run dev
   ```
   *Aplikasi web dapat dibuka di `http://localhost:3000`.*

---

## 4. Keamanan & Pencegahan Tabrakan Jadwal (Atomic Multi-Hour Collision Prevention)

- **Database Engine Unique Constraint**: 
  Tabel `booking_slots` dilindungi indeks unik:
  `UNIQUE KEY uq_field_date_hour_active (field_id, booking_date, hour, active_flag)`
  `active_flag` bernilai `1` ketika slot aktif, dan bernilai `NULL` saat pesanan kedaluwarsa atau dibatalkan.
- **Pencegahan Race Condition**:
  Pada tingkat milidetik, transaksi beruntun ditangani secara atomik oleh MariaDB InnoDB. Usaha booking jam yang sama akan ditolak secara mutlak dengan kode kesalahan `ER_DUP_ENTRY` dan pesan ramah pengguna: *"Slot waktu tersebut baru saja dikunci atau dipesan oleh pengguna lain"*.
- **Otomatisasi Cron Cleanup**:
  Setiap 60 detik, sistem membersihkan lock sementara yang melebihi 5 menit dan membatalkan pesanan pending hold yang melebihi 30 menit tanpa bukti bayar.
- **Validasi Harga Otoritatif di Server**:
  Harga akhir dihitung murni di backend (`pricing.service.js`). Modifikasi harga di sisi klien (DevTools) diabaikan secara total.
- **Upload File Aman**:
  Menggunakan nama file UUID acak, pemeriksaan magic-bytes header file (JPEG, PNG, WEBP, PDF), batas ukuran 3-5 MB, dan disimpan di direktori privat yang dilindungi otentikasi JWT.
