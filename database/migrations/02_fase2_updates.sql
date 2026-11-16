-- ====================================================
-- POLISOCCER FASE 2 MIGRATION SCRIPT
-- Idempotent schema upgrade for Dark Neon Light-Green Tech
-- ====================================================

-- 1. UPGRADE FIELDS TABLE
ALTER TABLE `fields`
  ADD COLUMN IF NOT EXISTS `name` VARCHAR(150) NULL AFTER `nama`,
  ADD COLUMN IF NOT EXISTS `normal_price` DECIMAL(12,2) NOT NULL DEFAULT 250000.00 AFTER `jenis_rumput`,
  ADD COLUMN IF NOT EXISTS `student_discount_pct` INT NOT NULL DEFAULT 50 AFTER `normal_price`,
  ADD COLUMN IF NOT EXISTS `staff_discount_pct` INT NOT NULL DEFAULT 30 AFTER `student_discount_pct`;

ALTER TABLE `fields` MODIFY COLUMN `status` ENUM('aktif','perawatan','active','maintenance') NOT NULL DEFAULT 'active';

UPDATE `fields` SET `name` = `nama` WHERE `name` IS NULL OR `name` = '';
UPDATE `fields` SET `status` = 'active' WHERE `status` = 'aktif';
UPDATE `fields` SET `status` = 'maintenance' WHERE `status` = 'perawatan';

-- 2. UPGRADE USERS TABLE
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `username` VARCHAR(100) NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `role` ENUM('admin','superadmin') NOT NULL DEFAULT 'admin' AFTER `password`,
  ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `role`;

UPDATE `users` SET `username` = SUBSTRING_INDEX(`email`, '@', 1) WHERE `username` IS NULL OR `username` = '';
UPDATE `users` SET `role` = CASE WHEN `role_id` = 1 THEN 'superadmin' ELSE 'admin' END;

-- 3. UPGRADE BOOKINGS TABLE
ALTER TABLE `bookings`
  MODIFY COLUMN `category_id` INT NULL,
  ADD COLUMN IF NOT EXISTS `field_id` INT NULL AFTER `booking_code`,
  ADD COLUMN IF NOT EXISTS `start_hour` INT NOT NULL DEFAULT 8 AFTER `booking_date`,
  ADD COLUMN IF NOT EXISTS `end_hour` INT NOT NULL DEFAULT 9 AFTER `start_hour`,
  ADD COLUMN IF NOT EXISTS `total_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `end_hour`,
  ADD COLUMN IF NOT EXISTS `category` ENUM('umum','mahasiswa','karyawan') NOT NULL DEFAULT 'umum' AFTER `whatsapp`,
  ADD COLUMN IF NOT EXISTS `identity_number` VARCHAR(50) NULL AFTER `category`,
  ADD COLUMN IF NOT EXISTS `payment_status` ENUM('pending_hold','dp_paid_50','fully_paid','expired_cancelled') NOT NULL DEFAULT 'pending_hold' AFTER `status`,
  ADD COLUMN IF NOT EXISTS `proof_of_payment` VARCHAR(255) NULL AFTER `paid_amount`,
  ADD COLUMN IF NOT EXISTS `hold_expires_at` TIMESTAMP NULL AFTER `proof_of_payment`,
  ADD COLUMN IF NOT EXISTS `cancel_reason` TEXT NULL AFTER `hold_expires_at`,
  ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Backfill bookings data
UPDATE `bookings` SET `field_id` = 1 WHERE `field_id` IS NULL;
UPDATE `bookings` SET `identity_number` = `identify_number` WHERE `identity_number` IS NULL AND `identify_number` IS NOT NULL;
UPDATE `bookings` SET `total_price` = `total_amount` WHERE (`total_price` = 0.00 OR `total_price` IS NULL) AND `total_amount` IS NOT NULL;
UPDATE `bookings` SET `payment_status` = CASE 
  WHEN `status` = 'cancelled' THEN 'expired_cancelled'
  WHEN `status` = 'dp_paid_50' THEN 'dp_paid_50'
  WHEN `status` = 'fully_paid' THEN 'fully_paid'
  ELSE 'pending_hold' 
END;
UPDATE `bookings` SET `category` = CASE 
  WHEN `category_id` = 2 THEN 'mahasiswa'
  WHEN `category_id` = 3 THEN 'karyawan'
  ELSE 'umum'
END;

-- 4. ATOMIC COLLISION PREVENTION TABLE (booking_slots)
CREATE TABLE IF NOT EXISTS `booking_slots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` CHAR(36) NOT NULL,
  `field_id` INT NOT NULL,
  `booking_date` DATE NOT NULL,
  `hour` INT NOT NULL,
  `status` ENUM('pending_hold','dp_paid_50','fully_paid','expired_cancelled') NOT NULL DEFAULT 'pending_hold',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_slot_field_date_hour` (`field_id`, `booking_date`, `hour`),
  INDEX `idx_slots_booking` (`booking_id`),
  CONSTRAINT `fk_slots_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_slots_field` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backfill booking_slots for existing active bookings
INSERT IGNORE INTO `booking_slots` (`booking_id`, `field_id`, `booking_date`, `hour`, `status`)
SELECT `id`, `field_id`, `booking_date`, `start_hour`, `payment_status`
FROM `bookings`
WHERE `payment_status` IN ('pending_hold', 'dp_paid_50', 'fully_paid');

-- 5. UPGRADE LOCK_TIMERS TABLE
ALTER TABLE `lock_timers`
  MODIFY COLUMN `slot_id` INT NULL,
  ADD COLUMN IF NOT EXISTS `field_id` INT NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `booking_date` DATE NULL AFTER `field_id`,
  ADD COLUMN IF NOT EXISTS `start_hour` INT NULL AFTER `booking_date`,
  ADD COLUMN IF NOT EXISTS `locked_by_session` VARCHAR(100) NULL AFTER `start_hour`;

UPDATE `lock_timers` SET `field_id` = 1 WHERE `field_id` IS NULL;
UPDATE `lock_timers` SET `booking_date` = `date` WHERE `booking_date` IS NULL AND `date` IS NOT NULL;
UPDATE `lock_timers` SET `locked_by_session` = `session_id` WHERE `locked_by_session` IS NULL AND `session_id` IS NOT NULL;
DELETE FROM `lock_timers` WHERE `expires_at` < NOW();

-- 6. UPGRADE NEWS TABLE
ALTER TABLE `news` MODIFY COLUMN `category` ENUM('event','news','promo','berita') NOT NULL DEFAULT 'news';
UPDATE `news` SET `category` = 'news' WHERE `category` = 'berita';

-- 7. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `booking_id` CHAR(36) NULL,
  `detail` LONGTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_admin` (`admin_id`),
  INDEX `idx_audit_booking` (`booking_id`),
  INDEX `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. INDEXES & CONSTRAINTS
-- Check indexes and add if missing
ALTER TABLE `bookings` ADD INDEX IF NOT EXISTS `idx_bookings_payment_status` (`payment_status`);
ALTER TABLE `bookings` ADD INDEX IF NOT EXISTS `idx_bookings_whatsapp` (`whatsapp`);
ALTER TABLE `bookings` ADD INDEX IF NOT EXISTS `idx_bookings_booking_date` (`booking_date`);
ALTER TABLE `news` ADD INDEX IF NOT EXISTS `idx_news_category_created` (`category`, `created_at`);
