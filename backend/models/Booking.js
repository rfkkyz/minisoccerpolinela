const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.STRING(36),
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  booking_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  user_id: {
    type: DataTypes.STRING(36),
    allowNull: true,
    references: {
      model: 'users',
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
  customer_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  whatsapp: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  tariff_tier: {
    type: DataTypes.ENUM('umum', 'mahasiswa', 'karyawan'),
    allowNull: false,
    defaultValue: 'umum'
  },
  price_per_hour: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false,
    defaultValue: 150000
  },
  hours_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  identity_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  identity_card_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  booking_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  start_hour: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 8
  },
  end_hour: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 9
  },
  total_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  paid_amount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  payment_status: {
    type: DataTypes.ENUM('pending_hold', 'dp_paid_50', 'fully_paid', 'expired_cancelled'),
    allowNull: false,
    defaultValue: 'pending_hold'
  },
  payment_type: {
    type: DataTypes.ENUM('dp_50', 'full_100'),
    allowNull: false,
    defaultValue: 'dp_50'
  },
  proof_of_payment: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_manual: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  hold_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancel_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelled_by: {
    type: DataTypes.STRING(36),
    allowNull: true
  },
  confirmed_by: {
    type: DataTypes.STRING(36),
    allowNull: true
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_checked_in: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  checked_in_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checked_in_by: {
    type: DataTypes.STRING(36),
    allowNull: true
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Booking;
