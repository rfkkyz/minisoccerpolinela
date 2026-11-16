/**
 * Database Migration Runner for POLISOCCER - FASE 2
 * Sequentially executes all migrations in database/migrations/
 */
const fs = require('fs');
const path = require('path');
const mysql = require('../backend/node_modules/mysql2/promise');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const host = process.env.DB_HOST || '127.0.0.1';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASS || '';
const database = process.env.DB_NAME || 'polisoccer_db';
const port = Number(process.env.DB_PORT) || 3306;

async function runMigration() {
  console.log(`Connecting to MariaDB/MySQL at ${host}:${port}...`);
  const connection = await mysql.createConnection({
    host,
    user,
    password,
    database,
    port,
    multipleStatements: true
  });

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
        \`version\` VARCHAR(191) PRIMARY KEY,
        \`applied_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check if initial migrations were previously applied
    const [appliedRows] = await connection.query('SELECT `version` FROM `schema_migrations`');
    const appliedSet = new Set(appliedRows.map(r => r.version));

    if (appliedSet.size === 0) {
      // Check if users already unified
      const [cols] = await connection.query("SHOW COLUMNS FROM `users` LIKE 'full_name'");
      if (cols.length > 0) {
        // Pre-mark 02 and 03 as applied since DB already has them
        await connection.query("INSERT IGNORE INTO `schema_migrations` (`version`) VALUES ('02_fase2_updates.sql'), ('03_fase2_account_system.sql')");
        appliedSet.add('02_fase2_updates.sql');
        appliedSet.add('03_fase2_account_system.sql');
      }
    }

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration file(s): ${files.join(', ')}`);

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`    [ALREADY APPLIED] Skipping: ${file}`);
        continue;
      }
      const filePath = path.join(migrationsDir, file);
      console.log(`\n--> Executing: ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      await connection.query(sql);
      await connection.query('INSERT INTO `schema_migrations` (`version`) VALUES (?)', [file]);
      appliedSet.add(file);
      console.log(`    Success: ${file}`);
    }

    console.log('\n--- Verifying Database Schema ---');
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('Active Tables in DB:', tableNames.join(', '));

    const [userCols] = await connection.query('DESCRIBE users');
    console.log('users schema:', userCols.map(c => `${c.Field} (${c.Type})`).join(', '));

    const [bookingCols] = await connection.query('DESCRIBE bookings');
    console.log('bookings schema:', bookingCols.map(c => `${c.Field} (${c.Type})`).join(', '));

    const [slotCols] = await connection.query('DESCRIBE booking_slots');
    console.log('booking_slots schema:', slotCols.map(c => `${c.Field} (${c.Type})`).join(', '));

    const [settingsRows] = await connection.query('SELECT `key`, `value` FROM settings LIMIT 5');
    console.log('Sample settings:', settingsRows);

    console.log('\nAll migrations applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
