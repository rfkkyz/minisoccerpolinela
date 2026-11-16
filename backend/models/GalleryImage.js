const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GalleryImage = sequelize.define('GalleryImage', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  news_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'news',
      key: 'id'
    }
  },
  image_path: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  caption: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_cover: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'gallery_images',
  timestamps: false
});

module.exports = GalleryImage;

