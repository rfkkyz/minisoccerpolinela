const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
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
  day_of_week: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: {
      min: 0,
      max: 6
    }
  },
  open_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  close_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'schedules',
  timestamps: false
});

module.exports = Schedule;
