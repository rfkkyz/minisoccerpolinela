/**
 * Booking Controller - POLISOCCER
 * Core reservation engine: multi-hour atomic locking, server quotes, hold enforcement, and receipt upload.
 */
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize, Booking, BookingSlot, LockTimer, BlockedSlot, Field, User } = require('../models');
const { getTariffPrice, calculateTariffQuote } = require('../services/pricing.service');
const { getSetting } = require('../services/settings.service');
const { logActivity } = require('../services/activity.service');
const { generateBookingCode } = require('../utils/bookingCodeGenerator');

// Normalize phone number to standard 628xx
function normalizePhone(phone) {
  if (!phone) return null;
  let p = String(phone).trim().replace(/[^0-9]/g, '');
  if (p.startsWith('08')) {
    p = '62' + p.slice(1);
  } else if (p.startsWith('8')) {
    p = '62' + p;
  } else if (p.startsWith('628')) {
    // already 628 format
  } else if (p.startsWith('0')) {
    p = '62' + p.slice(1);
  }
  return p;
}

// Validate Indonesian mobile phone: 10-15 digits
function isValidIndonesianPhone(phone) {
  if (!phone) return false;
  const p = normalizePhone(phone);
  if (!p) return false;
  return /^628[0-9]{8,12}$/.test(p);
}

// Get current date and hour in Asia/Jakarta (WIB) timezone
function getJakartaDateAndHour() {
  const now = new Date();
  const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const jakartaHour = parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: 'numeric', hour12: false }).format(now), 10);
  return { todayStr: jakartaDate, currentHour: jakartaHour };
}

/**
 * POST /api/bookings/lock
 * Locks 1-3 consecutive hours atomically for the logged-in user.
 */
async function lockSlot(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const { field_id, booking_date, date, hours, hour, start_hour } = req.body;
    const targetFieldId = parseInt(field_id, 10);
    const targetDate = String(booking_date || date || '').trim();

    // Standardize hours array (supports array of numbers or start_hour + duration)
    let hourList = [];
    if (Array.isArray(hours)) {
      hourList = hours.map(h => parseInt(h, 10));
    } else if (start_hour !== undefined && req.body.duration !== undefined) {
      const s = parseInt(start_hour, 10);
      const d = parseInt(req.body.duration, 10);
      for (let i = 0; i < d; i++) hourList.push(s + i);
    } else if (start_hour !== undefined) {
      hourList = [parseInt(start_hour, 10)];
    } else if (hour !== undefined) {
      hourList = [parseInt(hour, 10)];
    }

    if (!targetFieldId || !targetDate || hourList.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Lapangan, tanggal, dan jam booking wajib dipilih.'
      });
    }

    // Deduplicate and sort hours
    hourList = [...new Set(hourList)].sort((a, b) => a - b);

    // Verify consecutive hours (no gaps)
    for (let i = 1; i < hourList.length; i++) {
      if (hourList[i] !== hourList[i - 1] + 1) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Jadwal jam pemesanan harus berurutan tanpa jeda waktu.'
        });
      }
    }

    if (hourList.length > 3) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Maksimal booking berturut-turut adalah 3 jam.'
      });
    }

    // Validate operational hours
    const openHour = parseInt(await getSetting('OPEN_HOUR', 8), 10);
    const closeHour = parseInt(await getSetting('CLOSE_HOUR', 22), 10);
    for (const h of hourList) {
      if (h < openHour || h >= closeHour) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: `Jam ${h}:00 di luar jam operasional (${openHour}:00 - ${closeHour}:00 WIB).`
        });
      }
    }

    // Validate date not in past and not beyond MAX_DAYS_AHEAD (WIB)
    const { todayStr, currentHour } = getJakartaDateAndHour();
    if (targetDate < todayStr) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Tidak dapat memesan jadwal di tanggal yang sudah lewat.'
      });
    }
    if (targetDate === todayStr && hourList.some(h => h <= currentHour)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Slot jam yang dipilih sudah lewat waktu operasional hari ini.'
      });
    }

    const maxDaysAhead = parseInt(await getSetting('MAX_DAYS_AHEAD', 60), 10);
    const maxDate = new Date(Date.now() + maxDaysAhead * 86400000).toISOString().slice(0, 10);
    if (targetDate > maxDate) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: `Pemesanan maksimal dapat dilakukan hingga ${maxDaysAhead} hari ke depan.`
      });
    }

    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId || (userId ? `user_${userId}` : 'anon');

    // 1. Check conflicts in active booking_slots
    const bookedConflicts = await BookingSlot.findAll({
      where: {
        field_id: targetFieldId,
        booking_date: targetDate,
        hour: { [Op.in]: hourList },
        is_active: true
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (bookedConflicts.length > 0) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        code: 'SLOT_TAKEN',
        message: 'Salah satu jam yang dipilih sudah dipesan oleh pengguna lain.'
      });
    }

    // 2. Check conflicts in blocked_slots
    const blockedConflicts = await BlockedSlot.findAll({
      where: {
        field_id: targetFieldId,
        booking_date: targetDate,
        hour: { [Op.in]: hourList }
      },
      transaction
    });

    if (blockedConflicts.length > 0) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        code: 'SLOT_TAKEN',
        message: 'Salah satu jam yang dipilih sedang dinonaktifkan untuk pemeliharaan.'
      });
    }

    // 3. Check conflicts in lock_timers held by another user/session
    const lockMinutes = parseInt(await getSetting('LOCK_MINUTES', 5), 10);
    const nowTimestamp = new Date();

    const activeLocks = await LockTimer.findAll({
      where: {
        field_id: targetFieldId,
        booking_date: targetDate,
        hour: { [Op.in]: hourList },
        expires_at: { [Op.gt]: nowTimestamp },
        [Op.and]: [
          userId ? { user_id: { [Op.ne]: userId } } : {},
          sessionId ? { locked_by_session: { [Op.ne]: sessionId } } : {}
        ]
      },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (activeLocks.length > 0) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        code: 'SLOT_TAKEN',
        message: 'Slot ini sedang dikunci sementara oleh pemesan lain. Silakan coba 5 menit lagi.'
      });
    }

    // Clear old expired locks or prior user locks for these hours
    await LockTimer.destroy({
      where: {
        field_id: targetFieldId,
        booking_date: targetDate,
        hour: { [Op.in]: hourList }
      },
      transaction
    });

    // Insert new locks
    const expiresAt = new Date(Date.now() + lockMinutes * 60 * 1000);
    const lockEntries = hourList.map(h => ({
      field_id: targetFieldId,
      booking_date: targetDate,
      hour: h,
      user_id: userId,
      locked_by_session: sessionId,
      expires_at: expiresAt
    }));

    await LockTimer.bulkCreate(lockEntries, { transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `Slot berhasil dikunci sementara selama ${lockMinutes} menit.`,
      data: {
        field_id: targetFieldId,
        booking_date: targetDate,
        hours: hourList,
        expires_at: expiresAt.toISOString()
      }
    });
  } catch (err) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    if (err.name === 'SequelizeUniqueConstraintError' || err.original?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        code: 'SLOT_TAKEN',
        message: 'Jadwal slot yang dipilih baru saja dikunci atau dipesan oleh pihak lain.'
      });
    }
    next(err);
  }
}

/**
 * POST /api/bookings/lock/release
 */
async function releaseLock(req, res, next) {
  try {
    const { field_id, booking_date, hours } = req.body;
    const userId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || (userId ? `user_${userId}` : null);

    const whereClause = {};
    if (field_id) whereClause.field_id = field_id;
    if (booking_date) whereClause.booking_date = booking_date;
    if (Array.isArray(hours) && hours.length > 0) whereClause.hour = { [Op.in]: hours };

    if (userId || sessionId) {
      whereClause[Op.or] = [
        userId ? { user_id: userId } : null,
        sessionId ? { locked_by_session: sessionId } : null
      ].filter(Boolean);
    }

    await LockTimer.destroy({ where: whereClause });

    return res.status(200).json({
      success: true,
      message: 'Kunci slot berhasil dilepaskan.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/bookings/quote
 * Server-authoritative price quote based on 3-tier tariff
 */
async function getQuote(req, res, next) {
  try {
    const { field_id, hours_count, hours, duration, tariff_tier, category = 'umum', payment_type = 'dp_50' } = req.body;
    const field = await Field.findByPk(field_id);
    if (!field) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Lapangan tidak ditemukan.'
      });
    }

    const tier = String(tariff_tier || category || 'umum').toLowerCase().trim();
    const pricePerHour = getTariffPrice(field, tier);
    const requestedHours = hours_count !== undefined ? hours_count : (hours !== undefined ? hours : (duration !== undefined ? duration : 1));
    const numHours = Array.isArray(requestedHours) ? requestedHours.length : parseInt(requestedHours, 10);

    const quote = calculateTariffQuote({
      pricePerHour,
      hoursCount: numHours,
      paymentType: payment_type,
      tariffTier: tier
    });

    return res.status(200).json({
      success: true,
      data: {
        price_per_hour: quote.price_per_hour,
        hours_count: quote.hours_count,
        total: quote.total,
        total_price: quote.total,
        pay_now: quote.pay_now,
        remaining: quote.remaining,
        tariff_tier: quote.tariff_tier,
        payment_type
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/bookings/reserve
 * Authoritative booking creation with 30-min hold
 */
async function reserve(req, res, next) {
  console.log('=== [RESERVE REQUEST] ===');
  console.log('req.body:', req.body);
  console.log('req.files:', req.files ? Object.keys(req.files) : null);
  console.log('req.user:', req.user ? { id: req.user.id, category: req.user.category, identity_status: req.user.identity_status, identity_card_path: req.user.identity_card_path } : null);

  const transaction = await sequelize.transaction();
  try {
    const {
      field_id,
      booking_date,
      start_hour,
      end_hour,
      hours,
      customer_name,
      whatsapp,
      category = 'umum',
      identity_number = null,
      payment_type = 'dp_50'
    } = req.body;

    const targetFieldId = parseInt(field_id, 10);
    const targetDate = (booking_date && String(booking_date).trim() !== 'undefined' && String(booking_date).trim() !== 'null')
      ? String(booking_date).trim()
      : null;

    // Determine hour list from all possible formats (hours[], hours, or start_hour/end_hour)
    let hourList = [];
    const rawHours = req.body['hours[]'] || req.body['hours'] || hours;
    if (rawHours !== undefined && rawHours !== null) {
      if (Array.isArray(rawHours)) {
        hourList = rawHours.map(h => parseInt(h, 10)).filter(h => !isNaN(h) && h >= 0);
      } else {
        const parsed = parseInt(rawHours, 10);
        if (!isNaN(parsed) && parsed >= 0) hourList = [parsed];
      }
    }

    if (hourList.length === 0 && start_hour !== undefined && end_hour !== undefined) {
      const s = parseInt(start_hour, 10);
      const e = parseInt(end_hour, 10);
      if (!isNaN(s) && !isNaN(e) && s < e) {
        for (let h = s; h < e; h++) hourList.push(h);
      }
    } else if (hourList.length === 0 && start_hour !== undefined) {
      const s = parseInt(start_hour, 10);
      if (!isNaN(s)) hourList = [s];
    }

    // Deduplicate and sort hours
    hourList = [...new Set(hourList)].sort((a, b) => a - b);

    // Verify consecutive hours (no gaps)
    for (let i = 1; i < hourList.length; i++) {
      if (hourList[i] !== hourList[i - 1] + 1) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: 'Jadwal jam pemesanan harus berurutan tanpa jeda waktu.'
        });
      }
    }

    if (hourList.length > 3) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Maksimal booking berturut-turut adalah 3 jam.'
      });
    }

    // Validate operational date and hours (WIB)
    const { todayStr, currentHour } = getJakartaDateAndHour();
    if (targetDate < todayStr) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Tidak dapat memesan jadwal di tanggal yang sudah lewat.'
      });
    }
    if (targetDate === todayStr && hourList.some(h => h <= currentHour)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Slot jam yang dipilih sudah lewat waktu operasional hari ini.'
      });
    }

    console.log('Parsed reserve parameters: fieldId=', targetFieldId, 'date=', targetDate, 'hours=', hourList);

    if (!targetFieldId || !targetDate || hourList.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Data lapangan, tanggal, dan jam pemesanan tidak lengkap.'
      });
    }

    // Validate WhatsApp number
    const rawWa = String(whatsapp || req.body.phone || user?.phone || user?.whatsapp || '').trim();
    if (!rawWa || !isValidIndonesianPhone(rawWa)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Nomor WhatsApp pemesan wajib diisi dengan format nomor seluler aktif 10-14 digit (contoh: 081234567890).'
      });
    }
    const cleanWhatsapp = normalizePhone(rawWa);

    const field = await Field.findByPk(targetFieldId, { transaction });
    if (!field || field.status !== 'active') {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Lapangan tidak aktif atau tidak ditemukan.'
      });
    }

    // Check conflict on booking_slots
    const conflicts = await BookingSlot.findAll({
      where: {
        field_id: targetFieldId,
        booking_date: targetDate,
        hour: { [Op.in]: hourList },
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

    // Identity and Proof of Payment file extraction
    const user = req.user;
    let identityCardPath = user?.identity_card_path || null;
    let proofOfPaymentPath = null;
    let finalIdentityNumber = identity_number || user?.identity_number || null;

    if (req.files) {
      if (req.files['identity_card'] && req.files['identity_card'][0]) {
        identityCardPath = `/uploads/identity/${req.files['identity_card'][0].filename}`;
      }
      if (req.files['proof_of_payment'] && req.files['proof_of_payment'][0]) {
        proofOfPaymentPath = `/uploads/receipts/${req.files['proof_of_payment'][0].filename}`;
      }
    } else if (req.file) {
      if (req.file.fieldname === 'identity_card') {
        identityCardPath = `/uploads/identity/${req.file.filename}`;
      } else if (req.file.fieldname === 'proof_of_payment') {
        proofOfPaymentPath = `/uploads/receipts/${req.file.filename}`;
      }
    }

    // Reuse user document automatically if available
    if (user && (user.identity_status === 'verified' || user.identity_card_path)) {
      identityCardPath = user.identity_card_path || identityCardPath;
      finalIdentityNumber = user.identity_number || finalIdentityNumber;
    }

    const tier = String(req.body.tariff_tier || category || user?.category || 'umum').toLowerCase().trim();
    if (!['umum', 'mahasiswa', 'karyawan'].includes(tier)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Kategori tarif harus salah satu dari: umum, mahasiswa, atau karyawan.'
      });
    }

    if (tier === 'mahasiswa' && !identityCardPath) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        code: 'IDENTITY_REQUIRED',
        message: 'Tarif Mahasiswa wajib menyertakan foto identitas KTM yang terunggah.'
      });
    }
    if (tier === 'karyawan' && !identityCardPath) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        code: 'IDENTITY_REQUIRED',
        message: 'Tarif Karyawan wajib menyertakan foto ID Card / KTA yang terunggah.'
      });
    }

    // Authoritative Server-side Price Calculation (3-tier tariff model)
    const pricePerHour = getTariffPrice(field, tier);
    const hoursCount = hourList.length;
    const quote = calculateTariffQuote({
      pricePerHour,
      hoursCount,
      paymentType: payment_type,
      tariffTier: tier
    });

    const holdMinutes = parseInt(await getSetting('HOLD_MINUTES', 30), 10);
    const holdExpiresAt = new Date(Date.now() + holdMinutes * 60 * 1000);
    const bookingCode = await generateBookingCode(targetDate);
    const bookingId = uuidv4();

    const minHour = Math.min(...hourList);
    const maxHour = Math.max(...hourList) + 1;

    // Create booking in pending_hold status
    const booking = await Booking.create({
      id: bookingId,
      booking_code: bookingCode,
      user_id: user ? user.id : null,
      field_id: targetFieldId,
      customer_name: customer_name ? customer_name.trim() : (user ? user.full_name : 'Pemesan'),
      whatsapp: cleanWhatsapp,
      tariff_tier: tier,
      price_per_hour: pricePerHour,
      hours_count: hoursCount,
      identity_number: finalIdentityNumber,
      identity_card_path: identityCardPath,
      booking_date: targetDate,
      start_hour: minHour,
      end_hour: maxHour,
      total_price: quote.total,
      paid_amount: 0.00,
      payment_status: 'pending_hold',
      payment_type: payment_type === 'full_100' ? 'full_100' : 'dp_50',
      proof_of_payment: proofOfPaymentPath,
      hold_expires_at: holdExpiresAt,
      is_manual: false
    }, { transaction });

    // Insert active booking_slots with active_flag = 1
    const slotEntries = hourList.map(h => ({
      booking_id: bookingId,
      field_id: targetFieldId,
      booking_date: targetDate,
      hour: h,
      is_active: true,
      active_flag: 1,
      status: 'pending_hold'
    }));

    await BookingSlot.bulkCreate(slotEntries, { transaction });

    // Release temporary lock timers
    await LockTimer.destroy({
      where: {
        field_id: targetFieldId,
        booking_date: targetDate,
        hour: { [Op.in]: hourList }
      },
      transaction
    });

    await transaction.commit();

    await logActivity({
      actorId: user ? user.id : null,
      actorRole: user ? user.role : 'user',
      action: 'BOOKING_DIBUAT',
      entityType: 'booking',
      entityId: bookingId,
      detail: { code: bookingCode, total: quote.total, tariff_tier: tier },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Reservasi berhasil dibuat. Silakan lakukan pembayaran sebelum batas waktu berakhir.',
      data: {
        id: booking.id,
        booking_id: booking.id,
        booking_code: booking.booking_code,
        tariff_tier: booking.tariff_tier,
        price_per_hour: booking.price_per_hour,
        hours_count: booking.hours_count,
        payment_status: booking.payment_status,
        total: booking.total_price,
        total_price: booking.total_price,
        pay_now: quote.pay_now,
        remaining: quote.remaining,
        payment_type: booking.payment_type,
        hold_expires_at: holdExpiresAt.toISOString(),
        field_name: field.name,
        booking_date: booking.booking_date,
        hours: hourList
      }
    });
  } catch (err) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    if (err.name === 'SequelizeUniqueConstraintError' || err.original?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        code: 'SLOT_TAKEN',
        message: 'Jadwal slot yang dipilih baru saja dikunci atau dipesan oleh pihak lain.'
      });
    }
    next(err);
  }
}

/**
 * POST /api/bookings/upload-payment
 * Uploads bank transfer receipt and moves to dp_paid_50 or fully_paid
 */
async function uploadPayment(req, res, next) {
  try {
    const { booking_id, booking_code } = req.body;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_FILE',
        message: 'File bukti pembayaran wajib diunggah.'
      });
    }

    const where = {};
    if (booking_id) where.id = booking_id;
    else if (booking_code) where.booking_code = booking_code;
    else {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'ID atau kode booking wajib disertakan.'
      });
    }

    const booking = await Booking.findOne({ where });
    if (!booking) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Data booking tidak ditemukan.'
      });
    }

    // Enforce ownership if user is logged in
    if (req.user && req.user.role === 'user' && booking.user_id && booking.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki hak untuk memperbarui booking ini.'
      });
    }

    const receiptPath = `/uploads/receipts/${req.file.filename}`;
    const isFull = booking.payment_type === 'full_100';

    booking.proof_of_payment = receiptPath;
    booking.payment_status = isFull ? 'fully_paid' : 'dp_paid_50';
    booking.paid_amount = isFull ? booking.total_price : Math.round(booking.total_price * 0.5);
    booking.hold_expires_at = null; // Hold timer cancelled once receipt is uploaded
    await booking.save();

    // Update slots in booking_slots
    await BookingSlot.update(
      { status: booking.payment_status },
      { where: { booking_id: booking.id } }
    );

    await logActivity({
      actorId: req.user ? req.user.id : null,
      actorRole: req.user ? req.user.role : 'user',
      action: 'UPLOAD_BUKTI',
      entityType: 'booking',
      entityId: booking.id,
      detail: { code: booking.booking_code, status: booking.payment_status, paid: booking.paid_amount },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Bukti transfer berhasil diunggah. Menunggu verifikasi admin.',
      data: {
        booking_code: booking.booking_code,
        payment_status: booking.payment_status,
        paid_amount: booking.paid_amount,
        proof_of_payment: receiptPath
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings/status
 * Public status verification by booking_code + last 4 digits of whatsapp
 */
async function checkStatus(req, res, next) {
  try {
    const { code, whatsapp } = req.query;
    const cleanWA = String(whatsapp || '').replace(/[^0-9]/g, '');
    const cleanCode = String(code || '').trim().toUpperCase();

    if (!cleanCode || !cleanWA || cleanWA.length < 4) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Kode booking dan minimal 4 digit nomor WhatsApp pemesan wajib diisi.'
      });
    }

    const booking = await Booking.findOne({
      where: { booking_code: cleanCode },
      include: [{ model: Field, as: 'field', attributes: ['id', 'name', 'price_umum', 'price_mahasiswa', 'price_karyawan'] }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Tiket booking tidak ditemukan. Pastikan format kode benar (POLI-YYMMDD-XXXX).'
      });
    }

    // Verify WhatsApp match (matches if last 4 digits match or full number)
    const bookingWA = String(booking.whatsapp).replace(/[^0-9]/g, '');
    const last4WA = cleanWA.slice(-4);
    const bookingLast4 = bookingWA.slice(-4);

    if (last4WA !== bookingLast4) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Verifikasi nomor WhatsApp tidak sesuai dengan data pemesan.'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: booking.id,
        booking_code: booking.booking_code,
        customer_name: booking.customer_name,
        field_name: booking.field?.name,
        booking_date: booking.booking_date,
        start_hour: booking.start_hour,
        end_hour: booking.end_hour,
        tariff_tier: booking.tariff_tier,
        category: booking.tariff_tier,
        price_per_hour: booking.price_per_hour,
        hours_count: booking.hours_count,
        total_price: booking.total_price,
        paid_amount: booking.paid_amount,
        payment_status: booking.payment_status,
        payment_type: booking.payment_type,
        hold_expires_at: booking.hold_expires_at,
        proof_of_payment: booking.proof_of_payment,
        is_checked_in: Boolean(booking.is_checked_in),
        checked_in_at: booking.checked_in_at,
        checked_in_by: booking.checked_in_by,
        cancel_reason: booking.cancel_reason,
        created_at: booking.created_at
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  lockSlot,
  releaseLock,
  getQuote,
  reserve,
  uploadPayment,
  checkStatus
};
