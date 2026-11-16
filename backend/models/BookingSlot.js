const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookingSlot = sequelize.define('BookingSlot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  booking_id: {
    type: DataTypes.STRING(36),
    allowNull: false,
    references: {
      model: 'bookings',
      key: 'id'
    }
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
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  active_flag: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('pending_hold', 'dp_paid_50', 'fully_paid', 'expired_cancelled'),
    allowNull: false,
    defaultValue: 'pending_hold'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'booking_slots',
  timestamps: false
});

module.exports = BookingSlot;
