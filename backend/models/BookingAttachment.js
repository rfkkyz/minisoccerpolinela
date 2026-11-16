const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookingAttachment = sequelize.define('BookingAttachment', {
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
  file_path: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  doc_type: {
    type: DataTypes.ENUM('ktm', 'kta', 'bukti_tf'),
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'booking_attachments',
  timestamps: false
});

module.exports = BookingAttachment;
