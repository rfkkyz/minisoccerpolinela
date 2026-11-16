/**
 * Unified Auth Controller - POLISOCCER
 * Manages all roles ('user', 'admin', 'superadmin') in a single consolidated auth system.
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');
const { logActivity } = require('../services/activity.service');

// Generate 8-hour JWT
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'polisoccer_secret_fallback',
    { expiresIn: '8h' }
  );
}

// Normalize phone number to standard 628xx
function normalizePhone(phone) {
  if (!phone) return null;
  let p = String(phone).trim().replace(/[^0-9]/g, '');
  if (p.startsWith('08')) {
    p = '62' + p.slice(1);
  } else if (p.startsWith('8')) {
    p = '62' + p;
  } else if (p.startsWith('628')) {
    // Already in 628xx format
  } else if (p.startsWith('0')) {
    p = '62' + p.slice(1);
  }
  return p;
}

// Validate Indonesian mobile phone: 10-15 digits, must start with 628 (or 08 / 8 before normalization)
function isValidIndonesianPhone(phone) {
  if (!phone) return false;
  const p = normalizePhone(phone);
  if (!p) return false;
  // Indonesian mobile numbers are 628xxxxxxxx (10 to 14 total digits in 628 format)
  return /^628[0-9]{8,12}$/.test(p);
}

// Validate identity number for academic categories (NPM / NIP / KTP)
function validateIdentityNumber(category, identityNumber) {
  if (!category || category === 'umum') return null;
  const idStr = String(identityNumber || '').trim();
  if (!idStr) {
    return category === 'mahasiswa' 
      ? 'Nomor Pokok Mahasiswa (NPM) wajib diisi.' 
      : 'Nomor Identitas Pegawai (NIP / ID Karyawan) wajib diisi.';
  }
  if (category === 'mahasiswa') {
    // Polinela NPM: 8-12 digits
    if (!/^[0-9]{8,12}$/.test(idStr)) {
      return 'Format NPM tidak valid (harus 8-12 digit angka).';
    }
  } else if (category === 'karyawan') {
    // NIP/KTA: min 6, max 20 characters
    if (idStr.length < 6 || idStr.length > 20) {
      return 'Format NIP / ID Pegawai tidak valid (minimal 6 - 20 karakter).';
    }
  }
  return null;
}

// Password validation: min 8 characters, at least 1 letter and 1 digit
function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return 'Password minimal 8 karakter.';
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password harus mengandung kombinasi huruf dan angka.';
  }
  return null;
}

/**
 * POST /api/auth/register
 * Only registers standard 'user' accounts
 */
async function register(req, res, next) {
  try {
    const full_name = String(req.body.full_name || req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const phone = String(req.body.phone || req.body.whatsapp || '').trim();
    const {
      password,
      category = 'umum',
      identity_number = null
    } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Nama lengkap, email, dan password wajib diisi.'
      });
    }

    const passError = validatePasswordStrength(password);
    if (passError) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: passError
      });
    }

    if (phone && !isValidIndonesianPhone(phone)) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Nomor WhatsApp tidak valid. Masukkan nomor seluler aktif 10-14 digit (contoh: 081234567890).'
      });
    }

    const identityErr = validateIdentityNumber(category, identity_number);
    if (identityErr) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: identityErr
      });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = normalizePhone(phone);

    // Check existing email
    const existingEmail = await User.findOne({ where: { email: cleanEmail } });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Alamat email ini sudah terdaftar di sistem.'
      });
    }

    // Check existing phone if provided
    if (cleanPhone) {
      const existingPhone = await User.findOne({ where: { phone: cleanPhone } });
      if (existingPhone) {
        return res.status(409).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Nomor WhatsApp / telepon ini sudah terdaftar.'
        });
      }
    }

    // Hash password with cost 12
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Handle uploaded identity card if any
    let identityCardPath = null;
    let identityStatus = 'none';
    if (req.file) {
      identityCardPath = `/uploads/identity/${req.file.filename}`;
      identityStatus = 'pending';
    }

    const newUser = await User.create({
      full_name: full_name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
      role: 'user',
      is_active: true,
      must_change_password: false,
      category: ['mahasiswa', 'karyawan'].includes(category) ? category : 'umum',
      identity_number: identity_number ? identity_number.trim() : null,
      identity_card_path: identityCardPath,
      identity_status: identityStatus
    });

    const token = generateToken(newUser);

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 3600 * 1000 // 8 hours
    });

    await logActivity({
      actorId: newUser.id,
      actorRole: 'user',
      action: 'REGISTER',
      entityType: 'user',
      entityId: newUser.id,
      detail: { email: cleanEmail, name: full_name },
      req
    });

    const userObj = newUser.toJSON();
    delete userObj.password;

    return res.status(201).json({
      success: true,
      message: 'Pendaftaran akun berhasil.',
      token,
      user: userObj
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Unified login for user, admin, and superadmin
 */
async function login(req, res, next) {
  try {
    const { email, password, username, emailOrUsername } = req.body;
    const identifier = String(email || username || emailOrUsername || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Email dan password wajib diisi.'
      });
    }

    const cleanIdentifier = identifier.toLowerCase();
    const cleanPhone = normalizePhone(identifier);

    // Search by email, username prefix (@polinela.ac.id), or normalized phone
    const searchConditions = [
      { email: cleanIdentifier },
      cleanIdentifier.includes('@') ? null : { email: `${cleanIdentifier}@polinela.ac.id` },
      cleanPhone ? { phone: cleanPhone } : null
    ].filter(Boolean);

    const user = await User.findOne({
      where: {
        [Op.or]: searchConditions
      }
    });

    if (!user) {
      await logActivity({
        actorRole: 'system',
        action: 'LOGIN_GAGAL',
        detail: { identifier, reason: 'Akun tidak ditemukan' },
        req
      });
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Email atau password yang Anda masukkan salah.'
      });
    }

    if (!user.is_active) {
      await logActivity({
        actorId: user.id,
        actorRole: user.role,
        action: 'LOGIN_GAGAL',
        detail: { reason: 'Akun nonaktif' },
        req
      });
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Akun Anda berstatus nonaktif. Silakan hubungi Superadmin.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logActivity({
        actorId: user.id,
        actorRole: user.role,
        action: 'LOGIN_GAGAL',
        detail: { reason: 'Password salah' },
        req
      });
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Email atau password yang Anda masukkan salah.'
      });
    }

    // Update last login
    user.last_login_at = new Date();
    await user.save();

    const token = generateToken(user);

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 3600 * 1000 // 8 hours
    });

    await logActivity({
      actorId: user.id,
      actorRole: user.role,
      action: 'LOGIN',
      detail: { email: user.email, role: user.role },
      req
    });

    const userObj = user.toJSON();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: userObj,
      must_change_password: user.must_change_password
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res, next) {
  try {
    if (req.user) {
      await logActivity({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'LOGOUT',
        req
      });
    }

    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production'
    });

    return res.status(200).json({
      success: true,
      message: 'Berhasil keluar.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
async function me(req, res, next) {
  try {
    const userObj = req.user.toJSON();
    delete userObj.password;
    return res.status(200).json({
      success: true,
      data: userObj
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/auth/profile
 */
async function updateProfile(req, res, next) {
  try {
    const full_name = String(req.body.full_name || req.body.name || '').trim();
    const rawPhone = String(req.body.phone || req.body.whatsapp || '').trim();
    const user = req.user;

    if (full_name) user.full_name = full_name;
    if (rawPhone) {
      if (!isValidIndonesianPhone(rawPhone)) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Nomor WhatsApp tidak valid. Masukkan nomor seluler aktif 10-14 digit (contoh: 081234567890).'
        });
      }
      const cleanPhone = normalizePhone(rawPhone);
      if (cleanPhone && cleanPhone !== user.phone) {
        const exist = await User.findOne({ where: { phone: cleanPhone } });
        if (exist) {
          return res.status(409).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'Nomor telepon ini sudah digunakan akun lain.'
          });
        }
        user.phone = cleanPhone;
      }
    }

    await user.save();

    await logActivity({
      actorId: user.id,
      actorRole: user.role,
      action: 'UPDATE_PROFILE',
      detail: { updated_fields: { full_name, phone: rawPhone } },
      req
    });

    const userObj = user.toJSON();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: userObj
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/auth/password
 */
async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    const user = req.user;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Password saat ini dan password baru wajib diisi.'
      });
    }

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Password saat ini tidak cocok.'
      });
    }

    const passError = validatePasswordStrength(new_password);
    if (passError) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: passError
      });
    }

    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(new_password, salt);
    user.must_change_password = false;
    await user.save();

    await logActivity({
      actorId: user.id,
      actorRole: user.role,
      action: 'UPDATE_PASSWORD',
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Password berhasil diperbarui.'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  me,
  updateProfile,
  changePassword,
  adminLogin: login // Alias for legacy /api/admin/login
};
