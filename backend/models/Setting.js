const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
  key: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  updated_by: {
    type: DataTypes.STRING(36),
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'settings',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at'
});

module.exports = Setting;

