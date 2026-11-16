const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// GET /api/news (All news with optional category filter)
router.get('/', newsController.getAllNews);

// GET /api/news/:id (Single news item)
router.get('/:id', newsController.getNewsById);

module.exports = router;
