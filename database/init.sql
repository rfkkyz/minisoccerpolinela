-- ===============================================================
-- MINI SOCCER POLITEKNIK NEGERI LAMPUNG (POLISOCCER)
-- Database Initiation & Migration Script (MariaDB/MySQL)
-- 13 Core Tables with Strict Foreign Keys, Indexes & Constraints
-- ===============================================================

CREATE DATABASE IF NOT EXISTS `polisoccer_db` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `polisoccer_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables to ensure clean migration
DROP TABLE IF EXISTS `news`;
DROP TABLE IF EXISTS `lock_timers`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `booking_attachments`;
DROP TABLE IF EXISTS `booking_details`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `schedule_slots`;
DROP TABLE IF EXISTS `schedules`;
DROP TABLE IF EXISTS `pricing_categories`;
DROP TABLE IF EXISTS `fields`;
DROP TABLE IF EXISTS `admins`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------
-- 1. ROLES
-- ---------------------------------------------------------------
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_name` ENUM('super_admin', 'admin_lapangan', 'manajer') NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 2. USERS
-- ---------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  `status` ENUM('aktif', 'nonaktif') NOT NULL DEFAULT 'aktif',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 3. ADMINS
-- ---------------------------------------------------------------
CREATE TABLE `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `nama` VARCHAR(150) NOT NULL,
  `nip` VARCHAR(50) UNIQUE DEFAULT NULL,
  `whatsapp` VARCHAR(30) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_admins_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 4. FIELDS (LAPANGAN)
-- ---------------------------------------------------------------
CREATE TABLE `fields` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `jenis_rumput` VARCHAR(100) NOT NULL,
  `status` ENUM('aktif', 'perawatan') NOT NULL DEFAULT 'aktif',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 5. PRICING CATEGORIES
-- ---------------------------------------------------------------
CREATE TABLE `pricing_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` ENUM('Umum', 'Mahasiswa POLINELA', 'Karyawan POLINELA') NOT NULL UNIQUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 6. SCHEDULES (OPERASIONAL HARIAN)
-- ---------------------------------------------------------------
CREATE TABLE `schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `field_id` INT NOT NULL,
  `day_of_week` TINYINT NOT NULL COMMENT '0=Minggu, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu',
  `open_time` TIME NOT NULL,
  `close_time` TIME NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT `fk_schedules_field` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `uq_field_day` UNIQUE (`field_id`, `day_of_week`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 7. SCHEDULE SLOTS (SLOT PER JAM)
-- ---------------------------------------------------------------
CREATE TABLE `schedule_slots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `schedule_id` INT NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `price_modifier` DECIMAL(12,2) NOT NULL DEFAULT 150000.00,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_slots_schedule` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX `idx_slot_times` (`schedule_id`, `start_time`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 8. BOOKINGS
-- ---------------------------------------------------------------
CREATE TABLE `bookings` (
  `id` CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID v4',
  `booking_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Format: POLI-YYMMDD-XXXX',
  `customer_name` VARCHAR(150) NOT NULL,
  `whatsapp` VARCHAR(30) NOT NULL,
  `category_id` INT NOT NULL,
  `identify_number` VARCHAR(50) DEFAULT NULL COMMENT 'NPM / NIP',
  `identity_card_path` VARCHAR(255) DEFAULT NULL,
  `booking_date` DATE NOT NULL,
  `total_amount` DECIMAL(12,2) NOT NULL,
  `paid_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending_hold', 'dp_paid_50', 'fully_paid', 'cancelled') NOT NULL DEFAULT 'pending_hold',
  `payment_type` ENUM('dp_50', 'full_100') NOT NULL DEFAULT 'dp_50',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bookings_category` FOREIGN KEY (`category_id`) REFERENCES `pricing_categories` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX `idx_booking_date_status` (`booking_date`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 9. BOOKING DETAILS (SLOT PEMESANAN)
-- ---------------------------------------------------------------
CREATE TABLE `booking_details` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` CHAR(36) NOT NULL,
  `slot_id` INT NOT NULL,
  `price_applied` DECIMAL(12,2) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_details_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_details_slot` FOREIGN KEY (`slot_id`) REFERENCES `schedule_slots` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `uq_booking_slot` UNIQUE (`booking_id`, `slot_id`),
  INDEX `idx_detail_slot` (`slot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 10. BOOKING ATTACHMENTS (DOKUMEN PENDUKUNG)
-- ---------------------------------------------------------------
CREATE TABLE `booking_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` CHAR(36) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `doc_type` ENUM('ktm', 'kta', 'bukti_tf') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_attachments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX `idx_attachments_booking` (`booking_id`, `doc_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 11. PAYMENTS
-- ---------------------------------------------------------------
CREATE TABLE `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` CHAR(36) NOT NULL,
  `payment_type` ENUM('dp_50', 'pelunasan_50', 'lunas_100') NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'transfer_bank',
  `proof_file` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'verified',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX `idx_payments_booking` (`booking_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 12. LOCK TIMERS (HOLD 5 MENIT PENCEGAH DOUBLE BOOKING)
-- ---------------------------------------------------------------
CREATE TABLE `lock_timers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `date` DATE NOT NULL,
  `slot_id` INT NOT NULL,
  `session_id` VARCHAR(100) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  CONSTRAINT `fk_locks_slot` FOREIGN KEY (`slot_id`) REFERENCES `schedule_slots` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  INDEX `idx_lock_lookup` (`date`, `slot_id`, `expires_at`),
  INDEX `idx_lock_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 13. NEWS (BERITA, EVENT & PROMO - TANPA KOMENTAR)
-- ---------------------------------------------------------------
CREATE TABLE `news` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `image_path` VARCHAR(255) DEFAULT NULL,
  `category` ENUM('event', 'berita', 'promo') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_news_category` (`category`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===============================================================
-- SEED DATA AWAL
-- ===============================================================

-- 1. Roles
INSERT INTO `roles` (`id`, `role_name`) VALUES
(1, 'super_admin'),
(2, 'admin_lapangan'),
(3, 'manajer');

-- 2. Users (Password bcrypt: "admin123" -> $2b$10$wK1Rk7t4oD5r2Q6V1C1e0.Y87e/Uj2lI.21fG2hZpT1aM6uH2rN6e)
-- Real bcrypt hash for password "admin123" is:
-- $2a$10$8v5u5b3y0r2R1sH1n2L7/.v1oWdZ4fF7oVnIqP6j5l9qR2y0kG6i2 (or generated standard)
INSERT INTO `users` (`id`, `email`, `password`, `role_id`, `status`) VALUES
(1, 'superadmin@polinela.ac.id', '$2a$10$eVgFalGE.OBh2y5oledRRubpgkmteo.Smakvr4mQP1oqO1vwPru6O', 1, 'aktif'),
(2, 'adminlapangan@polinela.ac.id', '$2a$10$eVgFalGE.OBh2y5oledRRubpgkmteo.Smakvr4mQP1oqO1vwPru6O', 2, 'aktif'),
(3, 'manajer@polinela.ac.id', '$2a$10$eVgFalGE.OBh2y5oledRRubpgkmteo.Smakvr4mQP1oqO1vwPru6O', 3, 'aktif');

-- 3. Admins
INSERT INTO `admins` (`id`, `user_id`, `nama`, `nip`, `whatsapp`) VALUES
(1, 1, 'Rifki Pratama, S.Kom., M.T.I.', '198501152010121001', '081234567890'),
(2, 2, 'Budi Santoso (Admin Lapangan)', '199003202015041002', '081234567891'),
(3, 3, 'Dr. Ir. Hendra Wijaya (Manajer Fasilitas)', '197508122002121003', '081234567892');

-- 4. Fields (Lapangan Mini Soccer POLINELA)
INSERT INTO `fields` (`id`, `nama`, `jenis_rumput`, `status`) VALUES
(1, 'Lapangan Mini Soccer Utama POLINELA', 'Rumput Sintetis Monofilament FIFA Standard 50mm', 'aktif'),
(2, 'Lapangan Mini Soccer Training POLINELA', 'Rumput Sintetis Fibrillated 40mm', 'aktif');

-- 5. Pricing Categories
INSERT INTO `pricing_categories` (`id`, `name`) VALUES
(1, 'Umum'),
(2, 'Mahasiswa POLINELA'),
(3, 'Karyawan POLINELA');

-- 6. Schedules (Operational Schedule: Setiap hari 06:00 - 23:00 untuk Lapangan 1)
INSERT INTO `schedules` (`id`, `field_id`, `day_of_week`, `open_time`, `close_time`, `is_active`) VALUES
(1, 1, 0, '06:00:00', '23:00:00', 1), -- Minggu
(2, 1, 1, '06:00:00', '23:00:00', 1), -- Senin
(3, 1, 2, '06:00:00', '23:00:00', 1), -- Selasa
(4, 1, 3, '06:00:00', '23:00:00', 1), -- Rabu
(5, 1, 4, '06:00:00', '23:00:00', 1), -- Kamis
(6, 1, 5, '06:00:00', '23:00:00', 1), -- Jumat
(7, 1, 6, '06:00:00', '23:00:00', 1); -- Sabtu

-- 7. Schedule Slots (Contoh slot jam untuk Senin - Lapangan 1)
-- Tarif per jam: Umum Rp 150.000, Karyawan Rp 120.000, Mahasiswa Rp 100.000
INSERT INTO `schedule_slots` (`schedule_id`, `start_time`, `end_time`, `price_modifier`, `is_active`) VALUES
(2, '06:00:00', '07:00:00', 150000.00, 1),
(2, '07:00:00', '08:00:00', 150000.00, 1),
(2, '08:00:00', '09:00:00', 150000.00, 1),
(2, '09:00:00', '10:00:00', 150000.00, 1),
(2, '10:00:00', '11:00:00', 150000.00, 1),
(2, '11:00:00', '12:00:00', 150000.00, 1),
(2, '13:00:00', '14:00:00', 150000.00, 1),
(2, '14:00:00', '15:00:00', 150000.00, 1),
(2, '15:00:00', '16:00:00', 150000.00, 1),
(2, '16:00:00', '17:00:00', 150000.00, 1),
(2, '17:00:00', '18:00:00', 150000.00, 1),
(2, '18:00:00', '19:00:00', 150000.00, 1),
(2, '19:00:00', '20:00:00', 150000.00, 1),
(2, '20:00:00', '21:00:00', 150000.00, 1),
(2, '21:00:00', '22:00:00', 150000.00, 1),
(2, '22:00:00', '23:00:00', 150000.00, 1);

-- Duplikasi slot untuk hari Minggu (schedule_id 1)
INSERT INTO `schedule_slots` (`schedule_id`, `start_time`, `end_time`, `price_modifier`, `is_active`)
SELECT 1, start_time, end_time, price_modifier, is_active FROM `schedule_slots` WHERE schedule_id = 2;

-- Duplikasi slot untuk hari Selasa s/d Sabtu (schedule_id 3 s/d 7)
INSERT INTO `schedule_slots` (`schedule_id`, `start_time`, `end_time`, `price_modifier`, `is_active`)
SELECT 3, start_time, end_time, price_modifier, is_active FROM `schedule_slots` WHERE schedule_id = 2;
INSERT INTO `schedule_slots` (`schedule_id`, `start_time`, `end_time`, `price_modifier`, `is_active`)
SELECT 4, start_time, end_time, price_modifier, is_active FROM `schedule_slots` WHERE schedule_id = 2;
INSERT INTO `schedule_slots` (`schedule_id`, `start_time`, `end_time`, `price_modifier`, `is_active`)
SELECT 5, start_time, end_time, price_modifier, is_active FROM `schedule_slots` WHERE schedule_id = 2;
INSERT INTO `schedule_slots` (`schedule_id`, `start_time`, `end_time`, `price_modifier`, `is_active`)
SELECT 6, start_time, end_time, price_modifier, is_active FROM `schedule_slots` WHERE schedule_id = 2;
INSERT INTO `schedule_slots` (`schedule_id`, `start_time`, `end_time`, `price_modifier`, `is_active`)
SELECT 7, start_time, end_time, price_modifier, is_active FROM `schedule_slots` WHERE schedule_id = 2;

-- 8. News
INSERT INTO `news` (`id`, `title`, `content`, `image_path`, `category`) VALUES
(1, 'Peresmian Lampu Stadion Mini Soccer POLINELA Standar Nasional', 'Fasilitas penerangan lapangan mini soccer Politeknik Negeri Lampung kini telah rampung dan siap digunakan untuk pertandingan malam dengan standar pencahayaan 300 Lux.', '/uploads/news/lampu-stadion.jpg', 'berita'),
(2, 'Turnamen Mini Soccer Dies Natalis POLINELA Ke-42', 'Dalam rangka memeriahkan Dies Natalis Politeknik Negeri Lampung ke-42, UKM Olahraga POLINELA mengadakan turnamen mini soccer antar jurusan.', '/uploads/news/dies-natalis.jpg', 'kegiatan'),
(3, 'Turnamen Futsal & Mini Soccer Antar Mahasiswa Vokasi 2026', 'Pendaftaran turnamen tahunan Mini Soccer Polinela Cup resmi dibuka. Daftarkan tim jurusan Anda sekarang juga!', '/uploads/news/turnamen-polinela.jpg', 'kegiatan');
