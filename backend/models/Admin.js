const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  nama: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  nip: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  whatsapp: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'admins',
  timestamps: false
});

module.exports = Admin;
