const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { magicBytesGuard } = upload;

// All admin routes require authenticated admin or superadmin
router.use(requireAuth);
router.use(requireRole('admin', 'superadmin'));

router.get('/summary', adminController.getAdminSummary);
router.get('/stats', adminController.getAdminSummary); // Alias
router.get('/bookings', adminController.getBookings);
router.get('/bookings/scan/:code', adminController.scanTicket);
router.get('/bookings/scan', adminController.scanTicket);
router.post('/bookings/check-in', adminController.checkInTicket);
router.get('/bookings/:id', adminController.getBookingDetail);

router.patch('/bookings/:id/confirm-dp', adminController.confirmDp);
router.patch('/bookings/:id/confirm-payment', adminController.confirmFullPayment);
router.patch('/bookings/:id/reject-proof', adminController.rejectProof);
router.patch('/bookings/:id/verify-identity', adminController.verifyIdentity);
router.patch('/bookings/:id/change-to-umum', adminController.changeToUmum);
router.patch('/bookings/:id/cancel', adminController.cancelBooking);
router.post('/bookings/manual', adminController.manualBooking);

router.get('/schedule', adminController.getSchedule);
router.post('/blocked-slots', adminController.blockSlot);
router.delete('/blocked-slots/:id', adminController.unblockSlot);

router.get('/users', adminController.getUsers);
router.patch('/users/:id/identity', adminController.verifyUserIdentity);

// Secure private file streaming
router.get('/files/:type/:filename', adminController.getPrivateFile);

// News CRUD
router.post('/news', upload.array('photos', 10), magicBytesGuard, adminController.createNews);
router.put('/news/:id', upload.single('photo'), magicBytesGuard, adminController.updateNews);
router.delete('/news/:id', adminController.deleteNews);

module.exports = router;
