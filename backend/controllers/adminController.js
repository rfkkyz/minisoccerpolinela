/**
 * Admin Controller - POLISOCCER
 * Admin and Superadmin operations: booking verifications, status updates, walk-in reservations,
 * schedule blocking, private file streaming, and news management.
 */
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize, Booking, BookingSlot, BlockedSlot, Field, User, News, GalleryImage } = require('../models');
const { getTariffPrice, calculateTariffQuote } = require('../services/pricing.service');
const { logActivity } = require('../services/activity.service');
const { generateBookingCode } = require('../utils/bookingCodeGenerator');

/**
 * GET /api/admin/summary
 */
async function getAdminSummary(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const startOfMonth = today.slice(0, 7) + '-01';

    // 1. Stats
    const todayBookingsCount = await Booking.count({
      where: { booking_date: today }
    });

    const needConfirmationCount = await Booking.count({
      where: {
        payment_status: { [Op.in]: ['pending_hold', 'dp_paid_50'] },
        proof_of_payment: { [Op.ne]: null }
      }
    });

    const pendingPaymentCount = await Booking.count({
      where: {
        payment_status: 'pending_hold',
        proof_of_payment: null
      }
    });

    const monthlyRevenue = await Booking.sum('paid_amount', {
      where: {
        booking_date: { [Op.gte]: startOfMonth },
        payment_status: { [Op.in]: ['dp_paid_50', 'fully_paid'] }
      }
    }) || 0;

    const cancelledThisMonth = await Booking.count({
      where: {
        booking_date: { [Op.gte]: startOfMonth },
        payment_status: 'expired_cancelled'
      }
    });

    // 2. Action Required Bookings (latest 10)
    const actionRequired = await Booking.findAll({
      where: {
        payment_status: { [Op.in]: ['pending_hold', 'dp_paid_50'] },
        proof_of_payment: { [Op.ne]: null }
      },
      include: [{ model: Field, as: 'field', attributes: ['id', 'name'] }],
      order: [['updated_at', 'DESC']],
      limit: 10
    });

    // 3. Today's hourly schedule timeline
    const todaySlots = await BookingSlot.findAll({
      where: { booking_date: today, is_active: true },
      include: [{
        model: Booking,
        as: 'booking',
        attributes: ['id', 'booking_code', 'customer_name', 'whatsapp', 'payment_status']
      }],
      order: [['hour', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          today_bookings: todayBookingsCount,
          need_confirmation: needConfirmationCount,
          pending_payment: pendingPaymentCount,
          monthly_revenue: monthlyRevenue,
          cancelled_this_month: cancelledThisMonth
        },
        action_required: actionRequired,
        today_slots: todaySlots
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/bookings
 */
async function getBookings(req, res, next) {
  try {
    const { status, field_id, tariff_tier, category, from, to, q, page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (status && status !== 'all') {
      where.payment_status = status;
    }
    if (field_id) {
      where.field_id = field_id;
    }
    if (tariff_tier || category) {
      where.tariff_tier = tariff_tier || category;
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
        { customer_name: { [Op.like]: `%${q.trim()}%` } },
        { whatsapp: { [Op.like]: `%${q.trim()}%` } }
      ];
    }

    const { count, rows } = await Booking.findAndCountAll({
      where,
      include: [
        { model: Field, as: 'field', attributes: ['id', 'name', 'price_umum', 'price_mahasiswa', 'price_karyawan'] },
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'identity_status'] }
      ],
      order: [['created_at', 'DESC']],
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
 * GET /api/admin/bookings/:id
 */
async function getBookingDetail(req, res, next) {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: Field, as: 'field' },
        { model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'phone', 'identity_status', 'identity_card_path'] },
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
 * PATCH /api/admin/bookings/:id/confirm-dp
 */
async function confirmDp(req, res, next) {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Booking tidak ditemukan.' });
    }

    booking.payment_status = 'dp_paid_50';
    booking.paid_amount = Math.round(booking.total_price * 0.5);
    booking.confirmed_by = req.user.id;
    booking.confirmed_at = new Date();
    booking.hold_expires_at = null;
    await booking.save();

    await BookingSlot.update(
      { status: 'dp_paid_50' },
      { where: { booking_id: booking.id } }
    );

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'KONFIRMASI_DP',
      entityType: 'booking',
      entityId: booking.id,
      detail: { code: booking.booking_code, amount: booking.paid_amount },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Pembayaran DP 50% berhasil dikonfirmasi.',
      data: booking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/bookings/:id/confirm-payment
 */
async function confirmFullPayment(req, res, next) {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Booking tidak ditemukan.' });
    }

    booking.payment_status = 'fully_paid';
    booking.paid_amount = booking.total_price;
    booking.confirmed_by = req.user.id;
    booking.confirmed_at = new Date();
    booking.hold_expires_at = null;
    await booking.save();

    await BookingSlot.update(
      { status: 'fully_paid' },
      { where: { booking_id: booking.id } }
    );

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'KONFIRMASI_LUNAS',
      entityType: 'booking',
      entityId: booking.id,
      detail: { code: booking.booking_code, total: booking.total_price },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Pembayaran LUNAS berhasil dikonfirmasi.',
      data: booking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/bookings/:id/reject-proof
 */
async function rejectProof(req, res, next) {
  try {
    const { action = 'extend', reason = 'Bukti transfer tidak valid/tidak terbaca' } = req.body;
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Booking tidak ditemukan.' });
    }

    if (action === 'cancel') {
      booking.payment_status = 'expired_cancelled';
      booking.cancel_reason = reason;
      booking.cancelled_by = req.user.id;
      booking.hold_expires_at = null;
      await booking.save();

      await BookingSlot.update(
        { is_active: false, active_flag: null, status: 'expired_cancelled' },
        { where: { booking_id: booking.id } }
      );
    } else {
      // Extend hold by 30 mins
      booking.payment_status = 'pending_hold';
      booking.proof_of_payment = null;
      booking.paid_amount = 0.00;
      booking.hold_expires_at = new Date(Date.now() + 30 * 60 * 1000);
      await booking.save();

      await BookingSlot.update(
        { status: 'pending_hold' },
        { where: { booking_id: booking.id } }
      );
    }

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'TOLAK_BUKTI',
      entityType: 'booking',
      entityId: booking.id,
      detail: { code: booking.booking_code, action, reason },
      req
    });

    return res.status(200).json({
      success: true,
      message: action === 'cancel' ? 'Booking berhasil dibatalkan.' : 'Bukti ditolak dan waktu pembayaran diperpanjang 30 menit.',
      data: booking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/bookings/:id/change-to-umum
 * Switches booking to 'umum' tier with atomic price recalculation and activity log
 */
async function changeToUmum(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const { reason = 'Dokumen KTM/KTA tidak valid. Dialihkan ke tarif umum.' } = req.body;
    const booking = await Booking.findByPk(req.params.id, {
      include: [{ model: Field, as: 'field' }],
      transaction
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Booking tidak ditemukan.' });
    }

    const oldTariff = booking.tariff_tier;
    const oldPerHour = parseFloat(booking.price_per_hour);
    const oldTotal = parseFloat(booking.total_price);
    const hoursCount = booking.hours_count || Math.max(1, (booking.end_hour - booking.start_hour) || 1);

    const priceUmum = Math.round(parseFloat(booking.field?.price_umum) || 150000);
    const newTotal = priceUmum * hoursCount;
    const diff = newTotal - oldTotal;

    booking.tariff_tier = 'umum';
    booking.price_per_hour = priceUmum;
    booking.hours_count = hoursCount;
    booking.total_price = newTotal;

    booking.cancel_reason = reason ? `Dialihkan ke tarif umum: ${reason}` : 'Dokumen tidak valid. Dialihkan ke tarif umum.';
    await booking.save({ transaction });

    await transaction.commit();

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'PINDAH_TARIF_UMUM',
      entityType: 'booking',
      entityId: booking.id,
      detail: {
        code: booking.booking_code,
        old_tariff: oldTariff,
        new_tariff: 'umum',
        old_per_hour: oldPerHour,
        new_per_hour: priceUmum,
        old_total: oldTotal,
        new_total: newTotal,
        diff,
        reason
      },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Tarif berhasil dialihkan ke tarif umum dan total harga dihitung ulang.',
      data: {
        booking,
        old_tariff: oldTariff,
        new_tariff: 'umum',
        old_total: oldTotal,
        new_total: newTotal,
        diff,
        remaining: Math.max(0, newTotal - parseFloat(booking.paid_amount || 0))
      }
    });
  } catch (err) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(err);
  }
}

/**
 * PATCH /api/admin/bookings/:id/verify-identity
 * Approves identity or redirects to changeToUmum
 */
async function verifyIdentity(req, res, next) {
  try {
    const { action = 'approve', status } = req.body;
    if (action === 'change_to_umum' || action === 'downgrade_to_umum' || req.body.downgrade_to_umum) {
      return changeToUmum(req, res, next);
    }

    const transaction = await sequelize.transaction();
    try {
      const booking = await Booking.findByPk(req.params.id, { transaction });
      if (!booking) {
        await transaction.rollback();
        return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Booking tidak ditemukan.' });
      }

      if (booking.user_id) {
        await User.update(
          { identity_status: 'verified', identity_verified_at: new Date() },
          { where: { id: booking.user_id }, transaction }
        );
      }
      await transaction.commit();

      await logActivity({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'SETUJUI_IDENTITAS',
        entityType: 'booking',
        entityId: booking.id,
        req
      });

      return res.status(200).json({
        success: true,
        message: 'Identitas pemesan berhasil disetujui.',
        data: booking
      });
    } catch (innerErr) {
      if (transaction && !transaction.finished) await transaction.rollback();
      throw innerErr;
    }
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/bookings/:id/cancel
 */
async function cancelBooking(req, res, next) {
  try {
    const { reason = 'Dibatalkan oleh staf admin' } = req.body;
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Booking tidak ditemukan.' });
    }

    booking.payment_status = 'expired_cancelled';
    booking.cancel_reason = reason;
    booking.cancelled_by = req.user.id;
    booking.hold_expires_at = null;
    await booking.save();

    // Instantly free slots
    await BookingSlot.update(
      { is_active: false, active_flag: null, status: 'expired_cancelled' },
      { where: { booking_id: booking.id } }
    );

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'ADMIN_BATALKAN_BOOKING',
      entityType: 'booking',
      entityId: booking.id,
      detail: { code: booking.booking_code, reason },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Booking berhasil dibatalkan dan slot langsung terbuka kembali.',
      data: booking
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/bookings/manual
 * Walk-in manual booking by admin with strict collision check
 */
async function manualBooking(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const {
      field_id,
      booking_date,
      start_hour,
      end_hour,
      customer_name,
      whatsapp,
      category = 'umum',
      total_price,
      payment_type = 'full_100',
      payment_status = 'fully_paid'
    } = req.body;

    const targetFieldId = parseInt(field_id, 10);
    const targetDate = String(booking_date).trim();
    const s = parseInt(start_hour, 10);
    const e = parseInt(end_hour, 10);

    const hours = [];
    for (let h = s; h < e; h++) hours.push(h);

    // Collision check
    const conflicts = await BookingSlot.findAll({
      where: {
        field_id: targetFieldId,
        booking_date: targetDate,
        hour: { [Op.in]: hours },
        is_active: true
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (conflicts.length > 0) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        code: 'SLOT_TAKEN',
        message: 'Jadwal yang dipilih sudah terisi oleh pemesan lain.'
      });
    }

    const field = await Field.findByPk(targetFieldId, { transaction });
    const bookingCode = await generateBookingCode(targetDate);
    const bookingId = uuidv4();
    const tier = String(req.body.tariff_tier || category || 'umum').toLowerCase().trim();
    const pricePerHour = getTariffPrice(field, tier);
    const hoursCount = hours.length;
    const finalPrice = parseFloat(total_price) || (pricePerHour * hoursCount);

    const newBooking = await Booking.create({
      id: bookingId,
      booking_code: bookingCode,
      user_id: null, // Walk-in
      field_id: targetFieldId,
      customer_name: customer_name.trim(),
      whatsapp: whatsapp.trim(),
      tariff_tier: tier,
      price_per_hour: pricePerHour,
      hours_count: hoursCount,
      booking_date: targetDate,
      start_hour: s,
      end_hour: e,
      total_price: finalPrice,
      paid_amount: payment_status === 'fully_paid' ? finalPrice : Math.round(finalPrice * 0.5),
      payment_status,
      payment_type,
      confirmed_by: req.user.id,
      confirmed_at: new Date(),
      is_manual: true
    }, { transaction });

    const slotEntries = hours.map(h => ({
      booking_id: bookingId,
      field_id: targetFieldId,
      booking_date: targetDate,
      hour: h,
      is_active: true,
      active_flag: 1,
      status: payment_status
    }));

    await BookingSlot.bulkCreate(slotEntries, { transaction });
    await transaction.commit();

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'BOOKING_MANUAL',
      entityType: 'booking',
      entityId: bookingId,
      detail: { code: bookingCode, customer: customer_name },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Booking manual walk-in berhasil didaftarkan.',
      data: newBooking
    });
  } catch (err) {
    if (transaction && !transaction.finished) await transaction.rollback();
    next(err);
  }
}

/**
 * GET /api/admin/schedule
 * Weekly schedule grid per field
 */
async function getSchedule(req, res, next) {
  try {
    const { field_id = 1, week } = req.query;
    const targetFieldId = parseInt(field_id, 10);

    // Calculate Monday of target week
    let baseDate = new Date();
    if (week) baseDate = new Date(week);
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(baseDate.setDate(diff));

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d.toISOString().slice(0, 10));
    }

    const slots = await BookingSlot.findAll({
      where: {
        field_id: targetFieldId,
        booking_date: { [Op.in]: weekDays }
      },
      include: [{
        model: Booking,
        as: 'booking',
        attributes: ['id', 'booking_code', 'customer_name', 'whatsapp', 'payment_status', 'category']
      }]
    });

    const blocked = await BlockedSlot.findAll({
      where: {
        field_id: targetFieldId,
        booking_date: { [Op.in]: weekDays }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        field_id: targetFieldId,
        week_days: weekDays,
        slots,
        blocked_slots: blocked
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/blocked-slots
 */
async function blockSlot(req, res, next) {
  try {
    const { field_id, booking_date, hour, reason = 'Pemeliharaan Lapangan' } = req.body;
    const targetFieldId = parseInt(field_id, 10);
    const targetHour = parseInt(hour, 10);

    // Ensure slot not already active
    const activeBooking = await BookingSlot.findOne({
      where: {
        field_id: targetFieldId,
        booking_date,
        hour: targetHour,
        is_active: true
      }
    });

    if (activeBooking) {
      return res.status(409).json({
        success: false,
        code: 'SLOT_TAKEN',
        message: 'Tidak dapat memblokir jam yang sudah dipesan oleh pengguna.'
      });
    }

    const blocked = await BlockedSlot.create({
      field_id: targetFieldId,
      booking_date,
      hour: targetHour,
      reason,
      created_by: req.user.id
    });

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'BLOKIR_SLOT',
      entityType: 'slot',
      entityId: blocked.id,
      detail: { field_id: targetFieldId, date: booking_date, hour: targetHour, reason },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Slot jam berhasil dinonaktifkan/diblokir.',
      data: blocked
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/blocked-slots/:id
 */
async function unblockSlot(req, res, next) {
  try {
    const blocked = await BlockedSlot.findByPk(req.params.id);
    if (!blocked) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Data blokir slot tidak ditemukan.' });
    }

    await blocked.destroy();

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'BUKA_BLOKIR_SLOT',
      entityType: 'slot',
      entityId: req.params.id,
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Blokir slot berhasil dibuka kembali.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/users
 */
async function getUsers(req, res, next) {
  try {
    const { q, category, role, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (category) where.category = category;
    if (role) where.role = role;
    if (q) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${q.trim()}%` } },
        { email: { [Op.like]: `%${q.trim()}%` } },
        { phone: { [Op.like]: `%${q.trim()}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [{ model: Booking, as: 'bookings', attributes: ['id', 'payment_status'] }],
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset
    });

    return res.status(200).json({
      success: true,
      data: {
        users: rows,
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
 * PATCH /api/admin/users/:id/identity
 */
async function verifyUserIdentity(req, res, next) {
  try {
    const { status = 'verified', reason = null } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Pengguna tidak ditemukan.' });
    }

    user.identity_status = status;
    user.identity_verified_at = status === 'verified' ? new Date() : null;
    await user.save();

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'VERIFIKASI_USER_IDENTITAS',
      entityType: 'user',
      entityId: user.id,
      detail: { status, reason },
      req
    });

    return res.status(200).json({
      success: true,
      message: `Status verifikasi identitas pengguna diubah menjadi ${status}.`,
      data: { id: user.id, status: user.identity_status }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/files/:type/:filename
 * Secure private file download gateway via JWT authentication
 */
async function getPrivateFile(req, res, next) {
  try {
    const { type, filename } = req.params;
    if (!['identity', 'receipts'].includes(type)) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Kategori berkas tidak valid.'
      });
    }

    const cleanFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../uploads', type, cleanFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Berkas tidak ditemukan.'
      });
    }

    const ext = path.extname(cleanFilename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf'
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${cleanFilename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
}

// News CRUD for Admin
async function createNews(req, res, next) {
  try {
    const { title, content, type = 'berita', event_date = null, is_published = 1 } = req.body;
    let coverPath = null;
    if (req.file) {
      coverPath = `/uploads/news/${req.file.filename}`;
    }

    const news = await News.create({
      title: title.trim(),
      content: content.trim(),
      type,
      event_date: event_date || null,
      is_published: is_published == 1,
      image_path: coverPath,
      created_by: req.user.id
    });

    // If multi photos
    if (req.files && Array.isArray(req.files)) {
      const gallery = req.files.map((f, idx) => ({
        news_id: news.id,
        image_path: `/uploads/news/${f.filename}`,
        is_cover: idx === 0,
        sort_order: idx + 1
      }));
      await GalleryImage.bulkCreate(gallery);
    }

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'BUAT_BERITA',
      entityType: 'news',
      entityId: news.id,
      detail: { title },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Berita/kegiatan berhasil dipublikasikan.',
      data: news
    });
  } catch (err) {
    next(err);
  }
}

async function updateNews(req, res, next) {
  try {
    const news = await News.findByPk(req.params.id);
    if (!news) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Berita tidak ditemukan.' });

    const { title, content, type, event_date, is_published } = req.body;
    if (title) news.title = title.trim();
    if (content) news.content = content.trim();
    if (type) news.type = type;
    if (event_date !== undefined) news.event_date = event_date || null;
    if (is_published !== undefined) news.is_published = is_published == 1;

    if (req.file) {
      news.image_path = `/uploads/news/${req.file.filename}`;
    }
    await news.save();

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'UPDATE_BERITA',
      entityType: 'news',
      entityId: news.id,
      req
    });

    return res.status(200).json({ success: true, message: 'Berita berhasil diperbarui.', data: news });
  } catch (err) {
    next(err);
  }
}

async function deleteNews(req, res, next) {
  try {
    const news = await News.findByPk(req.params.id);
    if (!news) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Berita tidak ditemukan.' });

    // Only owner or superadmin can delete news
    if (news.created_by && news.created_by !== req.user.id && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Hanya pembuat atau Superadmin yang dapat menghapus berita ini.' });
    }

    await news.destroy();

    await logActivity({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: 'HAPUS_BERITA',
      entityType: 'news',
      entityId: req.params.id,
      req
    });

    return res.status(200).json({ success: true, message: 'Berita berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/bookings/scan/:code
 * Scan & validate ticket by booking code for match admission
 */
async function scanTicket(req, res, next) {
  try {
    const code = (req.params.code || req.query.code || '').trim().toUpperCase();
    if (!code) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Kode tiket booking wajib dimasukkan.'
      });
    }

    const booking = await Booking.findOne({
      where: { booking_code: code },
      include: [{ model: Field, as: 'field', attributes: ['id', 'name'] }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: `Tiket dengan kode ${code} tidak ditemukan di sistem.`
      });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const bookingDateStr = String(booking.booking_date);
    const isToday = bookingDateStr === todayStr;
    const isFuture = bookingDateStr > todayStr;
    const isPast = bookingDateStr < todayStr;

    const totalPrice = Number(booking.total_price);
    const paidAmount = Number(booking.paid_amount);
    const remainingBalance = Math.max(0, totalPrice - paidAmount);
    const isPaidValid = booking.payment_status === 'dp_paid_50' || booking.payment_status === 'fully_paid';

    let validationStatus = 'VALID';
    let statusMessage = 'Tiket valid dan siap digunakan.';

    if (booking.is_checked_in) {
      validationStatus = 'ALREADY_CHECKED_IN';
      statusMessage = `Tiket ini sudah dicheck-in pada ${booking.checked_in_at ? new Date(booking.checked_in_at).toLocaleString('id-ID') : 'sebelumnya'} oleh petugas ${booking.checked_in_by || 'Admin'}.`;
    } else if (booking.payment_status === 'expired_cancelled') {
      validationStatus = 'CANCELLED';
      statusMessage = 'Tiket ini telah dibatalkan atau kedaluwarsa.';
    } else if (booking.payment_status === 'pending_hold') {
      validationStatus = 'UNPAID';
      statusMessage = 'Tiket ini belum menyelesaikan pembayaran.';
    } else if (!isToday) {
      if (isFuture) {
        statusMessage = `Perhatian: Jadwal bermain adalah ${bookingDateStr} (belum hari ini).`;
      } else {
        statusMessage = `Perhatian: Jadwal bermain telah berlalu (${bookingDateStr}).`;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        id: booking.id,
        booking_code: booking.booking_code,
        customer_name: booking.customer_name,
        whatsapp: booking.whatsapp,
        field_name: booking.field?.name || 'Lapangan Mini Soccer Polinela',
        booking_date: booking.booking_date,
        start_hour: booking.start_hour,
        end_hour: booking.end_hour,
        hours_count: booking.hours_count,
        tariff_tier: booking.tariff_tier,
        total_price: totalPrice,
        paid_amount: paidAmount,
        remaining_balance: remainingBalance,
        payment_status: booking.payment_status,
        payment_type: booking.payment_type,
        is_checked_in: Boolean(booking.is_checked_in),
        checked_in_at: booking.checked_in_at,
        checked_in_by: booking.checked_in_by,
        is_today: isToday,
        is_future: isFuture,
        is_past: isPast,
        can_check_in: !booking.is_checked_in && isPaidValid,
        validation_status: validationStatus,
        message: statusMessage
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/bookings/check-in
 * Check in ticket for match admission with optional onsite remaining balance settlement
 */
async function checkInTicket(req, res, next) {
  try {
    const { booking_code, settle_remaining } = req.body;
    if (!booking_code) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Kode tiket booking wajib dimasukkan.'
      });
    }

    const booking = await Booking.findOne({
      where: { booking_code: booking_code.trim().toUpperCase() },
      include: [{ model: Field, as: 'field', attributes: ['id', 'name'] }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Tiket tidak ditemukan.'
      });
    }

    if (booking.is_checked_in) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_CHECKED_IN',
        message: `Tiket sudah dicheck-in pada ${booking.checked_in_at ? new Date(booking.checked_in_at).toLocaleString('id-ID') : 'sebelumnya'} oleh petugas ${booking.checked_in_by || 'Admin'}.`
      });
    }

    if (booking.payment_status === 'expired_cancelled' || booking.payment_status === 'pending_hold') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_STATUS',
        message: 'Tiket belum terkonfirmasi pembayarannya.'
      });
    }

    // Process onsite settlement if requested
    if (settle_remaining && booking.payment_status === 'dp_paid_50') {
      booking.payment_status = 'fully_paid';
      booking.paid_amount = booking.total_price;
    }

    booking.is_checked_in = true;
    booking.checked_in_at = new Date();
    booking.checked_in_by = req.user.full_name || req.user.username || 'Admin';
    await booking.save();

    await logActivity(
      req.user.id,
      'CHECK_IN_TIKET',
      `Check-in tiket ${booking.booking_code} atas nama ${booking.customer_name} berhasil diverifikasi.${settle_remaining ? ' Pelunasan sisa biaya di lapangan lunas.' : ''}`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: `Check-in tiket ${booking.booking_code} berhasil! Pemain dipersilakan memasuki arena.`,
      data: {
        booking_code: booking.booking_code,
        customer_name: booking.customer_name,
        is_checked_in: true,
        checked_in_at: booking.checked_in_at,
        checked_in_by: booking.checked_in_by,
        payment_status: booking.payment_status,
        paid_amount: Number(booking.paid_amount)
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminSummary,
  getBookings,
  getBookingDetail,
  scanTicket,
  checkInTicket,
  confirmDp,
  confirmFullPayment,
  rejectProof,
  verifyIdentity,
  changeToUmum,
  cancelBooking,
  manualBooking,
  getSchedule,
  blockSlot,
  unblockSlot,
  getUsers,
  verifyUserIdentity,
  getPrivateFile,
  createNews,
  updateNews,
  deleteNews
};
