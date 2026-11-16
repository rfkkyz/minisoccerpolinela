const sequelize = require('../config/database');
const User = require('./User');
const Field = require('./Field');
const Booking = require('./Booking');
const BookingSlot = require('./BookingSlot');
const LockTimer = require('./LockTimer');
const BlockedSlot = require('./BlockedSlot');
const News = require('./News');
const GalleryImage = require('./GalleryImage');
const ActivityLog = require('./ActivityLog');
const Setting = require('./Setting');

// 1. Users & Bookings
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 2. Fields & Bookings
Field.hasMany(Booking, { foreignKey: 'field_id', as: 'bookings' });
Booking.belongsTo(Field, { foreignKey: 'field_id', as: 'field' });

// 3. Bookings & BookingSlots
Booking.hasMany(BookingSlot, { foreignKey: 'booking_id', as: 'slots', onDelete: 'CASCADE' });
BookingSlot.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

// 4. Fields & BookingSlots
Field.hasMany(BookingSlot, { foreignKey: 'field_id', as: 'hourly_slots', onDelete: 'CASCADE' });
BookingSlot.belongsTo(Field, { foreignKey: 'field_id', as: 'field' });

// 5. Fields & LockTimers
Field.hasMany(LockTimer, { foreignKey: 'field_id', as: 'locks', onDelete: 'CASCADE' });
LockTimer.belongsTo(Field, { foreignKey: 'field_id', as: 'field' });

// 6. Users & LockTimers
User.hasMany(LockTimer, { foreignKey: 'user_id', as: 'locks' });
LockTimer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// 7. Fields & BlockedSlots
Field.hasMany(BlockedSlot, { foreignKey: 'field_id', as: 'blocked_slots', onDelete: 'CASCADE' });
BlockedSlot.belongsTo(Field, { foreignKey: 'field_id', as: 'field' });

// 8. News & GalleryImages
News.hasMany(GalleryImage, { foreignKey: 'news_id', as: 'images', onDelete: 'CASCADE' });
GalleryImage.belongsTo(News, { foreignKey: 'news_id', as: 'news' });

// 9. Users & News
User.hasMany(News, { foreignKey: 'created_by', as: 'articles' });
News.belongsTo(User, { foreignKey: 'created_by', as: 'author' });

// 10. Users & ActivityLogs
User.hasMany(ActivityLog, { foreignKey: 'actor_id', as: 'activities' });
ActivityLog.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' });

module.exports = {
  sequelize,
  User,
  Field,
  Booking,
  BookingSlot,
  LockTimer,
  BlockedSlot,
  News,
  GalleryImage,
  ActivityLog,
  Setting
};
