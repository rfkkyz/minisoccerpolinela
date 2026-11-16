const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

// GET /api/schedules/fields
router.get('/fields', scheduleController.getFields);

// GET /api/schedules/categories
router.get('/categories', scheduleController.getPricingCategories);

// GET /api/schedules/fields/:field_id
router.get('/fields/:field_id', scheduleController.getFieldSchedule);

module.exports = router;
