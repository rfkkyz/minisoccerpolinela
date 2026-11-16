const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimiter');
const upload = require('../middlewares/uploadMiddleware');
const { magicBytesGuard } = upload;

router.post('/register', registerLimiter, upload.single('identity_card'), magicBytesGuard, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);
router.patch('/profile', requireAuth, authController.updateProfile);
router.patch('/password', requireAuth, authController.changePassword);

module.exports = router;
