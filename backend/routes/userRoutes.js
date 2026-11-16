const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { uploadIdentity, magicBytesGuard } = upload;

router.use(requireAuth);

router.get('/summary', userController.getSummary);
router.get('/bookings', userController.getBookings);
router.get('/bookings/:id', userController.getBookingDetail);
router.patch('/bookings/:id/cancel', userController.cancelBooking);
router.post('/identity', uploadIdentity.single('identity_card'), magicBytesGuard, userController.uploadIdentity);
router.get('/notifications', userController.getNotifications);

module.exports = router;

