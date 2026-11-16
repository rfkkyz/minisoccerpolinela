const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { lockLimiter, statusLimiter } = require('../middlewares/rateLimiter');
const { optionalAuth } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { magicBytesGuard } = upload;

router.post('/lock', lockLimiter, optionalAuth, bookingController.lockSlot);
router.post('/lock/release', optionalAuth, bookingController.releaseLock);
router.post('/quote', bookingController.getQuote);
router.post('/reserve', optionalAuth, upload.fields([
  { name: 'identity_card', maxCount: 1 },
  { name: 'proof_of_payment', maxCount: 1 }
]), magicBytesGuard, bookingController.reserve);
router.post('/upload-payment', optionalAuth, upload.single('proof_of_payment'), magicBytesGuard, bookingController.uploadPayment);
router.post('/upload-dp', optionalAuth, upload.single('proof_of_payment'), magicBytesGuard, bookingController.uploadPayment);
router.get('/status', statusLimiter, bookingController.checkStatus);

module.exports = router;
