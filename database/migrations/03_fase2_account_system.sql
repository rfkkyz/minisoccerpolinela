-- ===============================================================
-- POLISOCCER FASE 2: UNIFIED ACCOUNT SYSTEM & INTEGRITY MIGRATION
-- Migration 03: Unified users (UUID), activity_logs, settings,
-- blocked_slots, gallery_images, atomic active slots
-- ===============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------
-- 1. UNIFIED USERS TABLE WITH UUID
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users_unified` (
  `id` VARCHAR(36) PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin', 'superadmin') NOT NULL DEFAULT 'user',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
  `category` ENUM('umum', 'mahasiswa', 'karyawan') NOT NULL DEFAULT 'umum',
  `identity_number` VARCHAR(50) NULL,
  `identity_card_path` VARCHAR(255) NULL,
  `identity_status` ENUM('none', 'pending', 'verified', 'rejected') NOT NULL DEFAULT 'none',
  `identity_verified_at` TIMESTAMP NULL,
  `last_login_at` TIMESTAMP NULL,
  `created_by` VARCHAR(36) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_category` (`category`),
  INDEX `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate existing admins to users_unified
INSERT IGNORE INTO `users_unified` (
  `id`, `full_name`, `email`, `phone`, `password`, `role`, `is_active`, `must_change_password`, `category`, `identity_number`, `created_at`
)
SELECT 
  CASE 
    WHEN u.email = 'superadmin@polinela.ac.id' THEN '00000000-0000-4000-8000-000000000001'
    WHEN u.email = 'admin@polinela.ac.id' THEN '00000000-0000-4000-8000-000000000002'
    WHEN u.email = 'adminlapangan@polinela.ac.id' THEN '00000000-0000-4000-8000-000000000003'
    WHEN u.email = 'manajer@polinela.ac.id' THEN '00000000-0000-4000-8000-000000000004'
    ELSE CONCAT('00000000-0000-4000-8000-', LPAD(u.id, 12, '0'))
  END AS `id`,
  COALESCE(a.nama, u.username, 'Admin Polinela') AS `full_name`,
  u.email,
  COALESCE(a.whatsapp, CONCAT('628120000000', u.id)) AS `phone`,
  u.password,
  CASE WHEN u.role = 'superadmin' OR u.role_id = 1 THEN 'superadmin' ELSE 'admin' END AS `role`,
  u.is_active,
  0,
  'karyawan',
  a.nip,
  u.created_at
FROM `users` u
LEFT JOIN `admins` a ON a.user_id = u.id;

-- Migrate existing customers to users_unified
INSERT IGNORE INTO `users_unified` (
  `id`, `full_name`, `email`, `phone`, `password`, `role`, `is_active`, `must_change_password`, `category`, `identity_number`, `created_at`
)
SELECT 
  CONCAT('00000000-0000-4000-9000-', LPAD(c.id, 12, '0')) AS `id`,
  COALESCE(c.nama, 'Pengguna Polisoccer') AS `full_name`,
  c.email,
  c.whatsapp AS `phone`,
  c.password,
  'user' AS `role`,
  CASE WHEN c.status = 'aktif' THEN 1 ELSE 0 END AS `is_active`,
  0,
  CASE 
    WHEN c.category_id = 2 THEN 'mahasiswa'
    WHEN c.category_id = 3 THEN 'karyawan'
    ELSE 'umum'
  END AS `category`,
  c.identify_number,
  c.created_at
FROM `customers` c;

-- Drop foreign keys referencing old users table
ALTER TABLE `admins` DROP FOREIGN KEY IF EXISTS `fk_admins_user`;

-- Swap users_unified to users
DROP TABLE IF EXISTS `users_legacy_backup`;
RENAME TABLE `users` TO `users_legacy_backup`, `users_unified` TO `users`;

-- ---------------------------------------------------------------
-- 2. UPGRADE BOOKINGS TABLE
-- ---------------------------------------------------------------
ALTER TABLE `bookings`
  ADD COLUMN IF NOT EXISTS `user_id` VARCHAR(36) NULL AFTER `booking_code`,
  ADD COLUMN IF NOT EXISTS `is_manual` TINYINT(1) NOT NULL DEFAULT 0 AFTER `proof_of_payment`,
  ADD COLUMN IF NOT EXISTS `cancelled_by` VARCHAR(36) NULL AFTER `cancel_reason`,
  ADD COLUMN IF NOT EXISTS `confirmed_by` VARCHAR(36) NULL AFTER `cancelled_by`,
  ADD COLUMN IF NOT EXISTS `confirmed_at` TIMESTAMP NULL AFTER `confirmed_by`;

-- Link existing bookings to user_id if customer_id matches
UPDATE `bookings` b
JOIN `customers` c ON b.customer_id = c.id
JOIN `users` u ON u.email = c.email
SET b.user_id = u.id
WHERE b.user_id IS NULL;

-- ---------------------------------------------------------------
-- 3. UPGRADE BOOKING_SLOTS WITH ACTIVE_FLAG UNIQUE CONSTRAINT
-- ---------------------------------------------------------------
ALTER TABLE `booking_slots`
  ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `hour`,
  ADD COLUMN IF NOT EXISTS `active_flag` TINYINT NULL DEFAULT 1 AFTER `is_active`;

-- Update active_flag: 1 if active, NULL if cancelled/expired
UPDATE `booking_slots` SET 
  `is_active` = CASE WHEN `status` IN ('pending_hold', 'dp_paid_50', 'fully_paid') THEN 1 ELSE 0 END,
  `active_flag` = CASE WHEN `status` IN ('pending_hold', 'dp_paid_50', 'fully_paid') THEN 1 ELSE NULL END;

-- Drop old unique key if present and add active-flag unique key
ALTER TABLE `booking_slots` DROP INDEX IF EXISTS `uq_slot_field_date_hour`;
ALTER TABLE `booking_slots` DROP INDEX IF EXISTS `uq_slot_field_date_hour_active`;
ALTER TABLE `booking_slots` ADD UNIQUE KEY `uq_slot_field_date_hour_active` (`field_id`, `booking_date`, `hour`, `active_flag`);

-- ---------------------------------------------------------------
-- 4. UPGRADE LOCK_TIMERS
-- ---------------------------------------------------------------
ALTER TABLE `lock_timers`
  ADD COLUMN IF NOT EXISTS `user_id` VARCHAR(36) NULL AFTER `start_hour`,
  ADD COLUMN IF NOT EXISTS `hour` INT NULL AFTER `booking_date`;

UPDATE `lock_timers` SET `hour` = `start_hour` WHERE `hour` IS NULL AND `start_hour` IS NOT NULL;
ALTER TABLE `lock_timers` MODIFY COLUMN `hour` INT NOT NULL DEFAULT 8;

-- Unique key on lock_timers
ALTER TABLE `lock_timers` DROP INDEX IF EXISTS `uq_lock_field_date_hour`;
ALTER TABLE `lock_timers` ADD UNIQUE KEY `uq_lock_field_date_hour` (`field_id`, `booking_date`, `hour`);

-- ---------------------------------------------------------------
-- 5. BLOCKED_SLOTS TABLE
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `blocked_slots` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `field_id` INT NOT NULL,
  `booking_date` DATE NOT NULL,
  `hour` INT NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `created_by` VARCHAR(36) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_blocked_field_date_hour` (`field_id`, `booking_date`, `hour`),
  INDEX `idx_blocked_field_date` (`field_id`, `booking_date`),
  CONSTRAINT `fk_blocked_field` FOREIGN KEY (`field_id`) REFERENCES `fields` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 6. UPGRADE NEWS TABLE
-- ---------------------------------------------------------------
ALTER TABLE `news`
  ADD COLUMN IF NOT EXISTS `type` ENUM('berita', 'kegiatan', 'promo') NOT NULL DEFAULT 'berita' AFTER `content`,
  ADD COLUMN IF NOT EXISTS `is_published` TINYINT(1) NOT NULL DEFAULT 1 AFTER `type`,
  ADD COLUMN IF NOT EXISTS `event_date` DATE NULL AFTER `is_published`,
  ADD COLUMN IF NOT EXISTS `created_by` VARCHAR(36) NULL AFTER `image_path`,
  ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

UPDATE `news` SET `type` = 'berita' WHERE `type` IS NULL;
UPDATE `news` SET `type` = 'kegiatan' WHERE `category` = 'event';
UPDATE `news` SET `type` = 'promo' WHERE `category` = 'promo';

-- ---------------------------------------------------------------
-- 7. GALLERY_IMAGES TABLE
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `gallery_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `news_id` INT NOT NULL,
  `image_path` VARCHAR(255) NOT NULL,
  `caption` VARCHAR(255) NULL,
  `is_cover` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_gallery_news` (`news_id`),
  CONSTRAINT `fk_gallery_news` FOREIGN KEY (`news_id`) REFERENCES `news` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------
-- 8. ACTIVITY_LOGS TABLE (Append-Only)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `actor_id` VARCHAR(36) NULL,
  `actor_role` ENUM('user', 'admin', 'superadmin', 'system') NOT NULL DEFAULT 'user',
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NULL,
  `entity_id` VARCHAR(100) NULL,
  `detail` JSON NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_act_created` (`created_at`),
  INDEX `idx_act_actor` (`actor_id`),
  INDEX `idx_act_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate data from audit_logs if it exists
INSERT INTO `activity_logs` (`actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `detail`, `created_at`)
SELECT 
  CONCAT('00000000-0000-4000-8000-', LPAD(COALESCE(admin_id, 1), 12, '0')),
  'admin',
  action,
  'booking',
  booking_id,
  detail,
  created_at
FROM `audit_logs`
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs' AND table_schema = DATABASE());

-- Drop old audit_logs table safely after migration
DROP TABLE IF EXISTS `audit_logs`;

-- ---------------------------------------------------------------
-- 9. SETTINGS TABLE
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `key` VARCHAR(50) PRIMARY KEY,
  `value` TEXT NOT NULL,
  `updated_by` VARCHAR(36) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default settings
INSERT INTO `settings` (`key`, `value`) VALUES
  ('OPEN_HOUR', '8'),
  ('CLOSE_HOUR', '22'),
  ('HOLD_MINUTES', '30'),
  ('LOCK_MINUTES', '5'),
  ('MAX_HOURS', '3'),
  ('MAX_DAYS_AHEAD', '60'),
  ('CANCEL_BEFORE_HOURS', '24'),
  ('BANK_NAME', 'Bank Mandiri'),
  ('BANK_ACCOUNT_NO', '1140023456789'),
  ('BANK_ACCOUNT_NAME', 'Politeknik Negeri Lampung - Mini Soccer'),
  ('ADMIN_WHATSAPP', '6281234567890')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

SET FOREIGN_KEY_CHECKS = 1;

