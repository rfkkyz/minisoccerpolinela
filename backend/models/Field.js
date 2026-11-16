const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Field = sequelize.define('Field', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  jenis_rumput: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  price_umum: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false,
    defaultValue: 150000
  },
  price_mahasiswa: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false,
    defaultValue: 100000
  },
  price_karyawan: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false,
    defaultValue: 120000
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'fields',
  timestamps: false
});

module.exports = Field;
