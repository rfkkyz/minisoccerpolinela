const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'polisoccer_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS !== undefined ? process.env.DB_PASS : '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 15,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+07:00', // Waktu Indonesia Barat (WIB)
    define: {
      timestamps: false, // Explicit timestamps handled in schema
      freezeTableName: true,
      underscored: true
    }
  }
);

module.exports = sequelize;
