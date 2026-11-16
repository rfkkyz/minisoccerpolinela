/**
 * User Controller - POLISOCCER
 * User dashboard endpoints (/api/me/*) restricted to logged-in users.
 */
const { Op } = require('sequelize');
const { Booking, BookingSlot, Field, News, User } = require('../models');
const { getSetting } = require('../services/settings.service');
const { logActivity } = require('../services/activity.service');

/**
 * GET /api/me/summary
 */
async function getSummary(req, res, next) {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().slice(0, 10);

    const activeBookingsCount = await Booking.count({
      where: {
        user_id: userId,
        payment_status: { [Op.in]: ['dp_paid_50', 'fully_paid'] },
        booking_date: { [Op.gte]: today }
      }
    });

    const pendingPaymentCount = await Booking.count({
      where: {
        user_id: userId,
        payment_status: 'pending_hold'
      }
    });

    const totalBookingsCount = await Booking.count({
      where: { user_id: userId }
    });

    const totalExpenditure = await Booking.sum('paid_amount', {
      where: {
        user_id: userId,
        payment_status: { [Op.in]: ['dp_paid_50', 'fully_paid'] }
      }
    }) || 0;

    // Nearest upcoming booking
    const nearestBooking = await Booking.findOne({
      where: {
        user_id: userId,
        booking_date: { [Op.gte]: today },
        payment_status: { [Op.ne]: 'expired_cancelled' }
      },
      include: [{ model: Field, as: 'field', attributes: ['id', 'name'] }],
      order: [['booking_date', 'ASC'], ['start_hour', 'ASC']]
    });

    // Recent news
    const recentNews = await News.findAll({
      where: { is_published: true },
      order: [['created_at', 'DESC']],
      limit: 3
    });

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          full_name: req.user.full_name,
          category: req.user.category,
          identity_status: req.user.identity_status
        },
        stats: {
          active_bookings: activeBookingsCount,
          pending_payment: pendingPaymentCount,
          total_bookings: totalBookingsCount,
          total_expenditure: totalExpenditure
        },
        nearest_booking: nearestBooking,
        recent_news: recentNews
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/me/bookings
 */
async function getBookings(req, res, next) {
  try {
    const userId = req.user.id;
    const { status, from, to, q, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const where = { user_id: userId };
    if (status && status !== 'all') {
      where.payment_status = status;
    }
    if (from && to) {
      where.booking_date = { [Op.between]: [from, to] };
    } else if (from) {
      where.booking_date = { [Op.gte]: from };
    } else if (to) {
      where.booking_date = { [Op.lte]: to };
    }
    if (q) {
      where[Op.or] = [
        { booking_code: { [Op.like]: `%${q.trim()}%` } },
        { customer_name: { [Op.like]: `%${q.trim()}%` } }
      ];
    }

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [{ model: Field, as: 'field', attributes: ['id', 'name', 'price_umum', 'price_mahasiswa', 'price_karyawan'] }],
      order: [['booking_date', 'DESC'], ['start_hour', 'DESC']],
      limit: limitNum,
      offset
    });

    return res.status(200).json({
      success: true,
      data: {
        bookings: rows,
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
 * GET /api/me/bookings/:id
 */
async function getBookingDetail(req, res, next) {
  try {
    const booking = await Booking.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: Field, as: 'field' },
        { model: BookingSlot, as: 'slots' }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Data booking tidak ditemukan.'
      });
    }

    return res.status(200).json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/me/bookings/:id/cancel
 * Self-cancellation with strict policy enforcement
 */
async function cancelBooking(req, res, next) {
  try {
    const { reason = 'Dibatalkan oleh pemesan' } = req.body;
    const booking = await Booking.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Data booking tidak ditemukan.'
      });
    }

    if (booking.payment_status === 'expired_cancelled') {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Booking ini sudah dibatalkan sebelumnya.'
      });
    }

    // Cancellation Policy:
    // If pending_hold, can cancel immediately.
    // If dp_paid_50 or fully_paid, must be > CANCEL_BEFORE_HOURS (24 hours) before match time.
    if (booking.payment_status !== 'pending_hold') {
      const cancelBeforeHours = parseInt(await getSetting('CANCEL_BEFORE_HOURS', 24), 10);
      const matchDateTime = new Date(`${booking.booking_date}T${String(booking.start_hour).padStart(2, '0')}:00:00+07:00`);
      const diffHours = (matchDateTime.getTime() - Date.now()) / (1000 * 3600);

      if (diffHours < cancelBeforeHours) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: `Pembatalan mandiri hanya diizinkan maksimal ${cancelBeforeHours} jam sebelum jadwal pertandingan. Hubungi admin untuk bantuan.`
        });
      }
    }

    booking.payment_status = 'expired_cancelled';
    booking.cancel_reason = reason;
    booking.cancelled_by = req.user.id;
    booking.hold_expires_at = null;
    await booking.save();

    // Deactivate slots and set active_flag to NULL (frees the slot immediately)
    await BookingSlot.update(
      { is_active: false, active_flag: null, status: 'expired_cancelled' },
      { where: { booking_id: booking.id } }
    );

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'PEMBATALAN',
      entityType: 'booking',
      entityId: booking.id,
      detail: { code: booking.booking_code, reason },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Booking berhasil dibatalkan dan jadwal telah dilepaskan.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/me/identity
 * Uploads user KTM or KTA
 */
async function uploadIdentity(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_FILE',
        message: 'File foto identitas (KTM/KTA) wajib dipilih.'
      });
    }

    const { identity_number, category } = req.body;
    const user = req.user;

    user.identity_card_path = `/uploads/identity/${req.file.filename}`;
    user.identity_status = 'pending';
    if (identity_number) user.identity_number = identity_number.trim();
    if (category && ['mahasiswa', 'karyawan'].includes(category)) {
      user.category = category;
    }
    await user.save();

    await logActivity({
      actorId: user.id,
      actorRole: user.role,
      action: 'UPLOAD_IDENTITAS',
      entityType: 'user',
      entityId: user.id,
      detail: { category: user.category, number: user.identity_number },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Identitas berhasil diunggah. Menunggu verifikasi petugas admin.',
      data: {
        category: user.category,
        identity_number: user.identity_number,
        identity_card_path: user.identity_card_path,
        identity_status: user.identity_status
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/me/notifications
 */
async function getNotifications(req, res, next) {
  try {
    const user = req.user;
    const notifications = [];

    if (user.identity_status === 'pending') {
      notifications.push({
        id: 'notif_id_pending',
        type: 'info',
        title: 'Verifikasi Identitas Sedang Diproses',
        message: 'Dokumen KTM/KTA Anda sedang ditinjau oleh staf admin.'
      });
    } else if (user.identity_status === 'rejected') {
      notifications.push({
        id: 'notif_id_rejected',
        type: 'danger',
        title: 'Verifikasi Identitas Ditolak',
        message: 'Foto KTM/KTA tidak terbaca atau tidak valid. Silakan unggah ulang dokumen asli.'
      });
    } else if (user.identity_status === 'verified') {
      notifications.push({
        id: 'notif_id_verified',
        type: 'success',
        title: 'Akun Terverifikasi',
        message: `Selamat! Kategori ${user.category} Anda telah terverifikasi.`
      });
    }

    return res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getBookings,
  getBookingDetail,
  cancelBooking,
  uploadIdentity,
  getNotifications
};

