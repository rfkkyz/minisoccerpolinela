const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  detail: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('detail');
      try {
        return rawValue ? JSON.parse(rawValue) : null;
      } catch (e) {
        return rawValue;
      }
    },
    set(value) {
      if (typeof value === 'object') {
        this.setDataValue('detail', JSON.stringify(value));
      } else {
        this.setDataValue('detail', value);
      }
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'audit_logs',
  timestamps: false
});

module.exports = AuditLog;

