/**
 * Central Error Handler - POLISOCCER
 * Uniform error responses: { success: false, code, message }
 * Without client-side stack traces.
 */
const multer = require('multer');

function errorHandler(err, req, res, next) {
  // Always log server-side for internal diagnostics
  console.error('⚠️ [ERROR]', err);

  // 1. Multer Upload Errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_FILE',
        message: `Ukuran file melebihi batas maksimum (${process.env.MAX_FILE_SIZE_MB || 5} MB).`
      });
    }
    return res.status(400).json({
      success: false,
      code: 'INVALID_FILE',
      message: `Gagal mengunggah file: ${err.message}`
    });
  }

  // 2. Custom App Code Errors
  if (err.code && err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message
    });
  }

  // 3. Sequelize Database Validation Errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: err.errors?.[0]?.message || 'Data input tidak memenuhi validasi database.'
    });
  }

  // 4. Sequelize Unique Constraint Violations
  if (err.name === 'SequelizeUniqueConstraintError' || err.original?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      code: 'SLOT_TAKEN',
      message: 'Jadwal slot yang dipilih sudah terisi atau terkunci oleh pihak lain.'
    });
  }

  // 5. Default Fallback Internal Server Error
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    code: err.code || 'SERVER_ERROR',
    message: err.message || 'Terjadi kesalahan sistem internal. Silakan coba kembali.'
  });
}

module.exports = errorHandler;
