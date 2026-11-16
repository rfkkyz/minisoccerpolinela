const { News } = require('../models');

/**
 * Get all news (Public)
 * GET /api/news?category=event|berita|promo&limit=10&page=1
 */
async function getAllNews(req, res, next) {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause = {};
    if (category && ['event', 'berita', 'promo'].includes(category)) {
      whereClause.category = category;
    }

    const { count, rows } = await News.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    });

    return res.status(200).json({
      status: 'success',
      data: {
        total_items: count,
        total_pages: Math.ceil(count / Number(limit)),
        current_page: Number(page),
        news: rows
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single news by ID (Public)
 * GET /api/news/:id
 */
async function getNewsById(req, res, next) {
  try {
    const { id } = req.params;
    const item = await News.findByPk(id);

    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: `Berita dengan ID ${id} tidak ditemukan.`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: item
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create News (Admin only)
 * POST /api/admin/news
 */
async function createNews(req, res, next) {
  try {
    const { title, content, category } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        status: 'error',
        message: 'Field title, content, dan category wajib diisi.'
      });
    }

    if (!['event', 'berita', 'promo'].includes(category)) {
      return res.status(400).json({
        status: 'error',
        message: 'Kategori harus bernilai salah satu dari: event, berita, promo.'
      });
    }

    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/news/${req.file.filename}`;
    }

    const news = await News.create({
      title: title.trim(),
      content: content.trim(),
      category,
      image_path: imagePath
    });

    return res.status(201).json({
      status: 'success',
      message: 'Berita/event/promo berhasil dipublikasikan.',
      data: news
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update News (Admin only)
 * PUT /api/admin/news/:id
 */
async function updateNews(req, res, next) {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;

    const news = await News.findByPk(id);
    if (!news) {
      return res.status(404).json({
        status: 'error',
        message: `Berita dengan ID ${id} tidak ditemukan.`
      });
    }

    if (title) news.title = title.trim();
    if (content) news.content = content.trim();
    if (category) {
      if (!['event', 'berita', 'promo'].includes(category)) {
        return res.status(400).json({
          status: 'error',
          message: 'Kategori harus salah satu dari: event, berita, promo.'
        });
      }
      news.category = category;
    }
    if (req.file) {
      news.image_path = `/uploads/news/${req.file.filename}`;
    }

    await news.save();

    return res.status(200).json({
      status: 'success',
      message: 'Berita berhasil diperbarui.',
      data: news
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete News (Admin only)
 * DELETE /api/admin/news/:id
 */
async function deleteNews(req, res, next) {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id);
    if (!news) {
      return res.status(404).json({
        status: 'error',
        message: `Berita dengan ID ${id} tidak ditemukan.`
      });
    }

    await news.destroy();

    return res.status(200).json({
      status: 'success',
      message: 'Berita berhasil dihapus.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews
};
