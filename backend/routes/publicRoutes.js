const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { publicLimiter } = require('../middlewares/rateLimiter');

router.use(publicLimiter);

router.get('/fields', publicController.getFields);
router.get('/availability', publicController.getAvailability);
router.get('/availability/month', publicController.getMonthAvailability);
router.get('/summary', publicController.getPublicSummary);
router.get('/news', publicController.getNews);
router.get('/news/:id', publicController.getNewsDetail);

module.exports = router;

