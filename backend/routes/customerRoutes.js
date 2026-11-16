const express = require('express');
const router = express.Router();
const customerAuthController = require('../controllers/customerAuthController');
const { authenticateCustomerToken } = require('../middlewares/customerAuthMiddleware');

// Public User Authentication Endpoints
// POST /api/customer/register
router.post('/register', customerAuthController.register);

// POST /api/customer/login
router.post('/login', customerAuthController.login);

// Protected User Endpoints (Requires Bearer token)
// GET /api/customer/me
router.get('/me', authenticateCustomerToken, customerAuthController.getProfile);

// PUT /api/customer/me
router.put('/me', authenticateCustomerToken, customerAuthController.updateProfile);

// GET /api/customer/my-bookings (Riwayat Reservasi Pengguna)
router.get('/my-bookings', authenticateCustomerToken, customerAuthController.getMyBookings);

module.exports = router;
