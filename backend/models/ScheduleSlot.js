const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScheduleSlot = sequelize.define('ScheduleSlot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  schedule_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'schedules',
      key: 'id'
    }
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  price_modifier: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 150000.00
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'schedule_slots',
  timestamps: false
});

module.exports = ScheduleSlot;
