const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PricingCategory = sequelize.define('PricingCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.ENUM('Umum', 'Mahasiswa POLINELA', 'Karyawan POLINELA'),
    allowNull: false,
    unique: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'pricing_categories',
  timestamps: false
});

module.exports = PricingCategory;
