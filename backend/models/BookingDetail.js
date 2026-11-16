const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookingDetail = sequelize.define('BookingDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  slot_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'schedule_slots',
      key: 'id'
    }
  },
  price_applied: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'booking_details',
  timestamps: false
});

module.exports = BookingDetail;
