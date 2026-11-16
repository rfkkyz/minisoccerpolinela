-- ===============================================================
-- POLISOCCER: REVISI BESAR - 3 TINGKAT TARIF TANPA DISKON
-- Migration 04: Three-tier pricing for fields & snapshot for bookings
-- ===============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------
-- 1. FIELDS: Add 3-tier price columns, migrate, drop discount columns
-- ---------------------------------------------------------------
ALTER TABLE `fields`
  ADD COLUMN IF NOT EXISTS `price_umum` DECIMAL(12, 0) NOT NULL DEFAULT 150000 AFTER `name`,
  ADD COLUMN IF NOT EXISTS `price_mahasiswa` DECIMAL(12, 0) NOT NULL DEFAULT 100000 AFTER `price_umum`,
  ADD COLUMN IF NOT EXISTS `price_karyawan` DECIMAL(12, 0) NOT NULL DEFAULT 120000 AFTER `price_mahasiswa`;

-- Migrate existing field prices based on previous values (if old columns exist)
UPDATE `fields`
SET
  `price_umum` = 150000,
  `price_mahasiswa` = 100000,
  `price_karyawan` = 120000;

-- Drop discount columns if they exist
SET @exist_normal := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fields' AND COLUMN_NAME = 'normal_price');
SET @sql_drop_normal := IF(@exist_normal > 0, 'ALTER TABLE `fields` DROP COLUMN `normal_price`', 'SELECT 1');
PREPARE stmt FROM @sql_drop_normal;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist_student := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fields' AND COLUMN_NAME = 'student_discount_pct');
SET @sql_drop_student := IF(@exist_student > 0, 'ALTER TABLE `fields` DROP COLUMN `student_discount_pct`', 'SELECT 1');
PREPARE stmt FROM @sql_drop_student;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist_staff := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'fields' AND COLUMN_NAME = 'staff_discount_pct');
SET @sql_drop_staff := IF(@exist_staff > 0, 'ALTER TABLE `fields` DROP COLUMN `staff_discount_pct`', 'SELECT 1');
PREPARE stmt FROM @sql_drop_staff;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check constraint on field prices (> 0)
ALTER TABLE `fields`
  DROP CONSTRAINT IF EXISTS `chk_fields_price_positive`;

ALTER TABLE `fields`
  ADD CONSTRAINT `chk_fields_price_positive`
  CHECK (`price_mahasiswa` > 0 AND `price_karyawan` > 0 AND `price_umum` > 0);

-- ---------------------------------------------------------------
-- 2. BOOKINGS: Add tariff_tier, price_per_hour, hours_count, drop category
-- ---------------------------------------------------------------
ALTER TABLE `bookings`
  ADD COLUMN IF NOT EXISTS `tariff_tier` ENUM('umum', 'mahasiswa', 'karyawan') NOT NULL DEFAULT 'umum' AFTER `whatsapp`,
  ADD COLUMN IF NOT EXISTS `price_per_hour` DECIMAL(12, 0) NOT NULL DEFAULT 150000 AFTER `tariff_tier`,
  ADD COLUMN IF NOT EXISTS `hours_count` INT NOT NULL DEFAULT 1 AFTER `price_per_hour`;

-- Migrate existing bookings from category to tariff_tier and compute price_per_hour
SET @exist_booking_cat := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'category');
SET @sql_migrate_bookings := IF(@exist_booking_cat > 0, 
  "UPDATE `bookings` SET `tariff_tier` = CASE WHEN LOWER(`category`) = 'mahasiswa' THEN 'mahasiswa' WHEN LOWER(`category`) = 'karyawan' THEN 'karyawan' ELSE 'umum' END, `hours_count` = GREATEST(1, COALESCE(`end_hour` - `start_hour`, 1)), `price_per_hour` = ROUND(COALESCE(`total_price`, 150000) / GREATEST(1, COALESCE(`end_hour` - `start_hour`, 1)), 0)",
  "UPDATE `bookings` SET `hours_count` = GREATEST(1, COALESCE(`end_hour` - `start_hour`, 1)), `price_per_hour` = ROUND(COALESCE(`total_price`, 150000) / GREATEST(1, COALESCE(`end_hour` - `start_hour`, 1)), 0)"
);
PREPARE stmt_b FROM @sql_migrate_bookings;
EXECUTE stmt_b;
DEALLOCATE PREPARE stmt_b;

-- Drop category column from bookings
SET @sql_drop_booking_cat := IF(@exist_booking_cat > 0, 'ALTER TABLE `bookings` DROP COLUMN `category`', 'SELECT 1');
PREPARE stmt_cat FROM @sql_drop_booking_cat;
EXECUTE stmt_cat;
DEALLOCATE PREPARE stmt_cat;

-- Check constraint on bookings
ALTER TABLE `bookings`
  DROP CONSTRAINT IF EXISTS `chk_bookings_hours_count`;

ALTER TABLE `bookings`
  ADD CONSTRAINT `chk_bookings_hours_count`
  CHECK (`hours_count` >= 1 AND `hours_count` <= 3);

SET FOREIGN_KEY_CHECKS = 1;

