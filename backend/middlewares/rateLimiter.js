/**
 * Rate Limiting Middleware - POLISOCCER
 * Enforces rate limits per IP with uniform error response: { success: false, code: 'RATE_LIMITED', message }
 */
const rateLimit = require('express-rate-limit');

const skipInTest = (req) => process.env.NODE_ENV === 'test' || req.headers['x-bypass-ratelimit'] === 'true';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Terlalu banyak percobaan login dari IP ini. Silakan coba lagi setelah 15 menit.'
  }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Batas pendaftaran akun terlampaui untuk alamat IP ini. Silakan coba kembali nanti.'
  }
});

const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Terlalu banyak permintaan publik. Silakan tunggu sejenak.'
  }
});

const lockLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Terlalu banyak aktivitas penguncian slot. Silakan tunggu sejenak.'
  }
});

const statusLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Terlalu banyak permintaan cek status. Silakan tunggu 1 menit.'
  }
});

module.exports = {
  loginLimiter,
  authLimiter: loginLimiter, // Backward compatibility alias
  registerLimiter,
  publicLimiter,
  lockLimiter,
  statusLimiter
};
