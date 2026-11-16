const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  full_name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(191),
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true,
    unique: true
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'superadmin'),
    allowNull: false,
    defaultValue: 'user'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  must_change_password: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  category: {
    type: DataTypes.ENUM('umum', 'mahasiswa', 'karyawan'),
    allowNull: false,
    defaultValue: 'umum'
  },
  identity_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  identity_card_path: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  identity_status: {
    type: DataTypes.ENUM('none', 'pending', 'verified', 'rejected'),
    allowNull: false,
    defaultValue: 'none'
  },
  identity_verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  created_by: {
    type: DataTypes.STRING(36),
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password && !user.password.startsWith('$2')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password') && !user.password.startsWith('$2')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
