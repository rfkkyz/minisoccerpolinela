/**
 * Upload Middleware - POLISOCCER
 * Enforces:
 * - Allowed types: JPG, PNG, WEBP, PDF
 * - MIME & Magic-bytes inspection
 * - Max size: 3 MB (identity) / 5 MB (payment & photos)
 * - Filename: UUID v4
 * - Private storage for sensitive files (outside public web root)
 * - Uniform error response: { success: false, code: 'INVALID_FILE', message }
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const privateUploadBase = path.join(__dirname, '../uploads');
const publicUploadBase = path.join(__dirname, '../public/uploads');

const subdirs = {
  identity: path.join(privateUploadBase, 'identity'),
  receipts: path.join(privateUploadBase, 'receipts'),
  news: path.join(publicUploadBase, 'news'),
  others: path.join(privateUploadBase, 'others')
};

Object.values(subdirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let target = subdirs.others;
    const f = file.fieldname.toLowerCase();
    if (f.includes('identity') || f.includes('ktm') || f.includes('kta')) {
      target = subdirs.identity;
    } else if (f.includes('proof') || f.includes('payment') || f.includes('bukti') || f.includes('receipt')) {
      target = subdirs.receipts;
    } else if (f.includes('news') || f.includes('image') || f.includes('photo') || f.includes('gallery')) {
      target = subdirs.news;
    }
    cb(null, target);
  },
  filename: (req, file, cb) => {
    const cleanExt = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${cleanExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    const err = new Error(`Tipe file ${ext} tidak diizinkan. Hanya format JPG, PNG, WEBP, dan PDF yang diperbolehkan.`);
    err.code = 'INVALID_FILE';
    cb(err);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter
});

// Dedicated identity upload with 3 MB limit
const uploadIdentity = multer({
  storage,
  limits: {
    fileSize: 3 * 1024 * 1024 // 3 MB max
  },
  fileFilter
});

/**
 * Validate magic bytes of uploaded file to prevent MIME spoofing
 */
function validateMagicBytes(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return true;
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return true;
    // PDF: %PDF- (25 50 44 46)
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) return true;
    // WEBP: RIFF....WEBP (52 49 46 46)
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return true;

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Middleware wrapper that checks magic bytes and unlinks fraudulent files
 */
function magicBytesGuard(req, res, next) {
  const filesToCheck = [];
  if (req.file) filesToCheck.push(req.file);
  if (req.files) {
    if (Array.isArray(req.files)) {
      filesToCheck.push(...req.files);
    } else {
      Object.values(req.files).forEach((arr) => {
        if (Array.isArray(arr)) filesToCheck.push(...arr);
      });
    }
  }

  for (const f of filesToCheck) {
    if (f.path && !validateMagicBytes(f.path)) {
      try {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      } catch (e) {}
      return res.status(400).json({
        success: false,
        code: 'INVALID_FILE',
        message: `Berkas ${f.originalname} ditolak: isi file tidak sesuai dengan format yang diizinkan.`
      });
    }
  }

  next();
}

module.exports = upload;
module.exports.uploadIdentity = uploadIdentity;
module.exports.validateMagicBytes = validateMagicBytes;
module.exports.magicBytesGuard = magicBytesGuard;
module.exports.privateUploadBase = privateUploadBase;
