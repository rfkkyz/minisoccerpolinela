const jwt = require('jsonwebtoken');
const { Customer, PricingCategory } = require('../models');

/**
 * Middleware to verify Customer JWT token in Authorization header
 */
async function authenticateCustomerToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({
        status: 'error',
        message: 'Akses ditolak. Silakan login sebagai pengguna pe-reservasi terlebih dahulu.'
      });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Format token salah. Gunakan: Bearer <token>'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'polisoccer_secret_fallback');

    const customer = await Customer.findByPk(decoded.id, {
      include: [{ model: PricingCategory, as: 'category' }]
    });

    if (!customer) {
      return res.status(401).json({
        status: 'error',
        message: 'Akun pengguna tidak ditemukan atau telah dihapus.'
      });
    }

    if (customer.status !== 'aktif') {
      return res.status(403).json({
        status: 'error',
        message: 'Akun Anda dinonaktifkan. Silakan hubungi admin pengelola.'
      });
    }

    req.customer = customer;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Sesi login telah kedaluwarsa. Silakan login kembali.'
      });
    }
    return res.status(401).json({
      status: 'error',
      message: 'Token otentikasi tidak valid.'
    });
  }
}

/**
 * Optional Customer Auth: attaches req.customer if valid token provided, else proceeds as guest
 */
async function optionalCustomerAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return next();

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'polisoccer_secret_fallback');
    const customer = await Customer.findByPk(decoded.id, {
      include: [{ model: PricingCategory, as: 'category' }]
    });

    if (customer && customer.status === 'aktif') {
      req.customer = customer;
    }
    next();
  } catch (error) {
    // Graceful fallback to guest
    next();
  }
}

module.exports = {
  authenticateCustomerToken,
  optionalCustomerAuth
};
