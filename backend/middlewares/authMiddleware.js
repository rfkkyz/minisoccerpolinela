/**
 * Authentication & Authorization Middleware - POLISOCCER
 * Unified JWT verification via cookie or Authorization header for all roles ('user', 'admin', 'superadmin').
 */
const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function requireAuth(req, res, next) {
  try {
    let token = null;

    // 1. Check Authorization header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }

    // 2. Check httpOnly Cookie if no header token
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Akses ditolak. Token otentikasi tidak ditemukan.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'polisoccer_secret_fallback');
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Akun tidak ditemukan atau telah dihapus.'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Akun telah dinonaktifkan. Silakan hubungi pengelola.'
      });
    }

    if (user.must_change_password && req.path !== '/password' && req.path !== '/logout') {
      return res.status(403).json({
        success: false,
        code: 'PASSWORD_CHANGE_REQUIRED',
        message: 'Anda wajib mengubah password akun sebelum melanjutkan.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Sesi token telah kedaluwarsa. Silakan login kembali.'
      });
    }
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Token otentikasi tidak valid atau telah dimodifikasi.'
    });
  }
}

/**
 * Optional Auth: populates req.user if valid token provided, but doesn't block if absent
 */
async function optionalAuth(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'polisoccer_secret_fallback');
      const user = await User.findByPk(decoded.id);
      if (user && user.is_active) {
        req.user = user;
      }
    }
  } catch (e) {
    // Ignore invalid token on optional routes
  }
  next();
}

/**
 * Middleware to restrict route to specific roles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Akses ditolak. Silakan login terlebih dahulu.'
      });
    }

    const userRole = req.user.role;
    const isSuper = userRole === 'superadmin';
    const isAllowed = allowedRoles.includes(userRole) || (isSuper && allowedRoles.includes('admin'));

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: `Akses ditolak. Memerlukan hak akses [${allowedRoles.join(', ')}].`
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  authenticateToken: requireAuth,
  requireRole
};
