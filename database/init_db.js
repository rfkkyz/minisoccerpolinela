/**
 * Database Initiation Runner for POLISOCCER
 * Creates database and executes init.sql
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const host = process.env.DB_HOST || '127.0.0.1';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASS || '';
const database = process.env.DB_NAME || 'polisoccer_db';
const port = Number(process.env.DB_PORT) || 3306;

async function initDatabase() {
  console.log(`Connecting to MySQL server at ${host}:${port}...`);
  const connection = await mysql.createConnection({
    host,
    user,
    password,
    port,
    multipleStatements: true
  });

  try {
    console.log(`Ensuring database '${database}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.changeUser({ database });

    const sqlFilePath = path.join(__dirname, 'init.sql');
    console.log(`Reading SQL from: ${sqlFilePath}`);
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing SQL schema and seed data...');
    await connection.query(sql);

    console.log('✅ Database initialization and seeding completed successfully!');
    console.log(`Total 13 tables created and seeded in '${database}'.`);
  } catch (error) {
    console.error('❌ Error executing database initialization:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

initDatabase();
