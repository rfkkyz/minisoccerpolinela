const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const bookingRoutes = require('./bookingRoutes');
const publicRoutes = require('./publicRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const superadminRoutes = require('./superadminRoutes');

const publicController = require('../controllers/publicController');
const authController = require('../controllers/authController');

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend Mini Soccer Politeknik Negeri Lampung (POLISOCCER) berjalan normal.',
    timestamp: new Date().toISOString()
  });
});

// Top-Level Public Endpoints (Direct access)
router.get('/fields', publicController.getFields);
router.get('/availability', publicController.getAvailability);
router.get('/availability/month', publicController.getMonthAvailability);
router.get('/news', publicController.getNews);
router.get('/news/:id', publicController.getNewsDetail);

// Legacy admin login alias
router.post('/admin/login', authController.adminLogin);

// Mount Modular Sub-routes
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
router.use('/public', publicRoutes);
router.use('/me', userRoutes);
router.use('/admin', adminRoutes);
router.use('/superadmin', superadminRoutes);

module.exports = router;
