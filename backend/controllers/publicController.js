/**
 * Public Controller - POLISOCCER
 * Public endpoints: fields, hourly slot availability, monthly calendar availability, system summary, and news.
 */
const { Op } = require('sequelize');
const { Field, BookingSlot, LockTimer, BlockedSlot, News, GalleryImage } = require('../models');
const { getSetting } = require('../services/settings.service');

/**
 * GET /api/fields
 */
async function getFields(req, res, next) {
  try {
    const fields = await Field.findAll({
      order: [['id', 'ASC']]
    });
    const formatted = fields.map(f => ({
      id: f.id,
      name: f.name || f.nama,
      status: f.status,
      prices: {
        umum: Math.round(parseFloat(f.price_umum) || 150000),
        mahasiswa: Math.round(parseFloat(f.price_mahasiswa) || 100000),
        karyawan: Math.round(parseFloat(f.price_karyawan) || 120000)
      },
      price_umum: Math.round(parseFloat(f.price_umum) || 150000),
      price_mahasiswa: Math.round(parseFloat(f.price_mahasiswa) || 100000),
      price_karyawan: Math.round(parseFloat(f.price_karyawan) || 120000),
      jenis_rumput: f.jenis_rumput
    }));
    return res.status(200).json({
      success: true,
      data: formatted
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/availability?field_id=&date=
 * Zero PII. Returns hourly status: available | locked | booked | blocked | past
 */
async function getAvailability(req, res, next) {
  try {
    const { field_id = 1, date } = req.query;
    if (!date) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Parameter tanggal (date) wajib diisi (format: YYYY-MM-DD).'
      });
    }

    const fieldId = parseInt(field_id, 10);
    const dateStr = String(date).trim();
    const openHour = parseInt(await getSetting('OPEN_HOUR', 8), 10);
    const closeHour = parseInt(await getSetting('CLOSE_HOUR', 22), 10);

    // 1. Fetch active booked slots
    const bookedSlots = await BookingSlot.findAll({
      where: {
        field_id: fieldId,
        booking_date: dateStr,
        is_active: true
      },
      attributes: ['hour', 'status']
    });
    const bookedHours = new Map();
    bookedSlots.forEach(s => bookedHours.set(s.hour, s.status));

    // 2. Fetch blocked slots
    const blockedSlots = await BlockedSlot.findAll({
      where: {
        field_id: fieldId,
        booking_date: dateStr
      },
      attributes: ['hour']
    });
    const blockedHours = new Set(blockedSlots.map(s => s.hour));

    // 3. Fetch active lock timers
    const now = new Date();
    const lockTimers = await LockTimer.findAll({
      where: {
        field_id: fieldId,
        booking_date: dateStr,
        expires_at: { [Op.gt]: now }
      },
      attributes: ['hour']
    });
    const lockedHours = new Set(lockTimers.map(s => s.hour));

    // Determine current local date & hour in Asia/Jakarta (WIB) for accurate past slot detection
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const currentHour = parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false }).format(now), 10);

    const slots = [];
    for (let h = openHour; h < closeHour; h++) {
      let status = 'available';

      if (dateStr < todayStr || (dateStr === todayStr && h <= currentHour)) {
        status = 'past';
      } else if (blockedHours.has(h)) {
        status = 'blocked';
      } else if (bookedHours.has(h)) {
        status = 'booked';
      } else if (lockedHours.has(h)) {
        status = 'locked';
      }

      slots.push({
        hour: h,
        time_label: `${String(h).padStart(2, '0')}:00 - ${String(h + 1).padStart(2, '0')}:00 WIB`,
        status
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        field_id: fieldId,
        date: dateStr,
        slots
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/availability/month?field_id=&month=YYYY-MM
 * Monthly availability overview with color levels (green/yellow/red/gray)
 */
async function getMonthAvailability(req, res, next) {
  try {
    const { field_id = 1, month } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const fieldId = parseInt(field_id, 10);

    const openHour = parseInt(await getSetting('OPEN_HOUR', 8), 10);
    const closeHour = parseInt(await getSetting('CLOSE_HOUR', 22), 10);
    const totalDailyHours = closeHour - openHour; // 14 hours

    const startDate = `${targetMonth}-01`;
    const [year, m] = targetMonth.split('-').map(Number);
    const daysInMonth = new Date(year, m, 0).getDate();
    const endDate = `${targetMonth}-${String(daysInMonth).padStart(2, '0')}`;

    // Get all active bookings in this month
    const booked = await BookingSlot.findAll({
      where: {
        field_id: fieldId,
        booking_date: { [Op.between]: [startDate, endDate] },
        is_active: true
      },
      attributes: ['booking_date', 'hour']
    });

    // Group booked hours by date
    const bookedByDate = {};
    for (const b of booked) {
      const d = b.booking_date;
      bookedByDate[d] = (bookedByDate[d] || 0) + 1;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${targetMonth}-${String(day).padStart(2, '0')}`;
      const bookedCount = bookedByDate[dStr] || 0;
      const availableCount = Math.max(0, totalDailyHours - bookedCount);

      let level = 'green';
      if (dStr < todayStr) {
        level = 'gray'; // Past date
      } else if (availableCount === 0) {
        level = 'red'; // Fully booked
      } else if (availableCount <= 4) {
        level = 'yellow'; // Few slots left
      }

      days.push({
        date: dStr,
        day,
        total_slots: totalDailyHours,
        booked_slots: bookedCount,
        available_slots: availableCount,
        level
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        field_id: fieldId,
        month: targetMonth,
        days
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/public/summary
 * Real-time landing hero stats
 */
async function getPublicSummary(req, res, next) {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const openHour = parseInt(await getSetting('OPEN_HOUR', 8), 10);
    const closeHour = parseInt(await getSetting('CLOSE_HOUR', 22), 10);
    const fields = await Field.findAll({ where: { status: 'active' } });
    const totalDailyHours = (closeHour - openHour) * (fields.length || 1);

    const activeBookingsCount = await BookingSlot.count({
      where: {
        booking_date: todayStr,
        is_active: true
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        today: todayStr,
        open_hour: `${openHour}:00 WIB`,
        close_hour: `${closeHour}:00 WIB`,
        total_fields: fields.length,
        free_slots_today: Math.max(0, totalDailyHours - activeBookingsCount),
        field_status: fields.length > 0 ? 'Normal / Beroperasi' : 'Perawatan'
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/news
 */
async function getNews(req, res, next) {
  try {
    const { type, page = 1, limit = 6 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10) || 6));
    const offset = (pageNum - 1) * limitNum;

    const where = { is_published: true };
    if (type && type !== 'all') {
      where.type = type;
    }

    const { count, rows } = await News.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      include: [{ model: GalleryImage, as: 'images', required: false }]
    });

    return res.status(200).json({
      success: true,
      data: {
        news: rows,
        pagination: {
          total: count,
          page: pageNum,
          limit: limitNum,
          total_pages: Math.ceil(count / limitNum)
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/news/:id
 */
async function getNewsDetail(req, res, next) {
  try {
    const news = await News.findOne({
      where: { id: req.params.id, is_published: true },
      include: [{ model: GalleryImage, as: 'images', required: false }]
    });

    if (!news) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Artikel atau berita tidak ditemukan.'
      });
    }

    return res.status(200).json({
      success: true,
      data: news
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFields,
  getAvailability,
  getMonthAvailability,
  getPublicSummary,
  getNews,
  getNewsDetail
};

