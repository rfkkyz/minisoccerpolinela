const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadminController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

router.use(requireAuth);
router.use(requireRole('superadmin'));

router.get('/summary', superadminController.getSummary);
router.get('/admins', superadminController.getAdmins);
router.post('/admins', superadminController.createAdmin);
router.post('/admins/:id/reset-password', superadminController.resetAdminPassword);
router.patch('/admins/:id/status', superadminController.toggleAdminStatus);
router.delete('/admins/:id', superadminController.deleteAdmin);

router.get('/activity', superadminController.getActivityLogs);
router.patch('/fields/:id', superadminController.updateFieldTariff);

router.get('/settings', superadminController.getSystemSettings);
router.put('/settings', superadminController.updateSystemSettings);

router.get('/reports', superadminController.getReports);

module.exports = router;

