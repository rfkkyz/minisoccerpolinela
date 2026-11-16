const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LockTimer = sequelize.define('LockTimer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  field_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'fields',
      key: 'id'
    }
  },
  booking_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  hour: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.STRING(36),
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  locked_by_session: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'lock_timers',
  timestamps: false
});

module.exports = LockTimer;
