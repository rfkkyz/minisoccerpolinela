/**
 * Superadmin Controller - POLISOCCER
 * System health, admin management, user governance, audit trail (activity_logs),
 * tariff settings, and system-wide configurations.
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { sequelize, User, Booking, BookingSlot, Field, ActivityLog, Setting } = require('../models');
const { logActivity } = require('../services/activity.service');
const { updateSetting, getSettings } = require('../services/settings.service');

// Calculate folder size in MB recursively
function getFolderSizeMb(dirPath) {
  let size = 0;
  try {
    if (!fs.existsSync(dirPath)) return 0;
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const f of files) {
      const fullPath = path.join(dirPath, f.name);
      if (f.isDirectory()) {
        size += getFolderSizeMb(fullPath);
      } else {
        size += fs.statSync(fullPath).size;
      }
    }
  } catch (e) {
    return 0;
  }
  return parseFloat((size / (1024 * 1024)).toFixed(2));
}

/**
 * GET /api/superadmin/summary
 */
async function getSummary(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const startOfMonth = today.slice(0, 7) + '-01';

    const totalUsers = await User.count({ where: { role: 'user' } });
    const activeAdmins = await User.count({ where: { role: { [Op.in]: ['admin', 'superadmin'] }, is_active: true } });
    const bookingsThisMonth = await Booking.count({ where: { booking_date: { [Op.gte]: startOfMonth } } });
    const revenueThisMonth = await Booking.sum('paid_amount', {
      where: {
        booking_date: { [Op.gte]: startOfMonth },
        payment_status: { [Op.in]: ['dp_paid_50', 'fully_paid'] }
      }
    }) || 0;

    const totalCancelled = await Booking.count({
      where: {
        booking_date: { [Op.gte]: startOfMonth },
        payment_status: 'expired_cancelled'
      }
    });

    const cancellationRate = bookingsThisMonth > 0 ? ((totalCancelled / bookingsThisMonth) * 100).toFixed(1) : 0;

    // Failed logins in past 24 hours
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
    const failedLogins24h = await ActivityLog.count({
      where: {
        action: 'LOGIN_GAGAL',
        created_at: { [Op.gte]: yesterday }
      }
    });

    // Recent 10 live activities
    const recentActivities = await ActivityLog.findAll({
      order: [['created_at', 'DESC']],
      limit: 10,
      include: [{ model: User, as: 'actor', attributes: ['id', 'full_name', 'email', 'role'] }]
    });

    // System Health Status
    let dbStatus = 'healthy';
    try {
      await sequelize.authenticate();
    } catch (e) {
      dbStatus = 'degraded';
    }

    const uploadsDir = path.join(__dirname, '../uploads');
    const uploadSizeMb = getFolderSizeMb(uploadsDir);

    const pendingExpiringSoon = await Booking.count({
      where: {
        payment_status: 'pending_hold',
        hold_expires_at: {
          [Op.between]: [new Date(), new Date(Date.now() + 10 * 60 * 1000)]
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          total_users: totalUsers,
          active_admins: activeAdmins,
          bookings_this_month: bookingsThisMonth,
          revenue_this_month: revenueThisMonth,
          cancellation_rate: `${cancellationRate}%`,
          failed_logins_24h: failedLogins24h
        },
        health: {
          database: dbStatus,
          upload_size_mb: uploadSizeMb,
          pending_expiring_soon: pendingExpiringSoon,
          cron_status: 'running'
        },
        recent_activities: recentActivities
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/superadmin/admins
 */
async function getAdmins(req, res, next) {
  try {
    const admins = await User.findAll({
      where: { role: { [Op.in]: ['admin', 'superadmin'] } },
      attributes: { exclude: ['password'] },
      order: [['created_at', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: admins
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/superadmin/admins
 */
async function createAdmin(req, res, next) {
  try {
    const full_name = String(req.body.full_name || req.body.name || '').trim();
    const { email, phone, password, role = 'admin', must_change_password = true } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Nama dan email wajib diisi.'
      });
    }

    const exist = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (exist) {
      return res.status(409).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Email admin ini sudah terdaftar.'
      });
    }

    // Default or generated password
    const rawPass = password || Math.random().toString(36).slice(-8) + 'Poli1#';
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash(rawPass, salt);

    const newAdmin = await User.create({
      id: uuidv4(),
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      password: hash,
      role: role === 'superadmin' ? 'superadmin' : 'admin',
      is_active: true,
      must_change_password: !!must_change_password,
      created_by: req.user.id
    });

    await logActivity({
      actorId: req.user.id,
      actorRole: 'superadmin',
      action: 'BUAT_AKUN_ADMIN',
      entityType: 'user',
      entityId: newAdmin.id,
      detail: { email: newAdmin.email, role: newAdmin.role },
      req
    });

    const adminObj = newAdmin.toJSON();
    delete adminObj.password;

    return res.status(201).json({
      success: true,
      message: 'Akun admin berhasil dibuat.',
      data: adminObj,
      initial_password: rawPass
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/superadmin/admins/:id/reset-password
 */
async function resetAdminPassword(req, res, next) {
  try {
    const admin = await User.findByPk(req.params.id);
    if (!admin) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Admin tidak ditemukan.' });

    const newPassword = Math.random().toString(36).slice(-8) + 'Poli2#';
    const salt = await bcrypt.genSalt(12);
    admin.password = await bcrypt.hash(newPassword, salt);
    admin.must_change_password = true;
    await admin.save();

    await logActivity({
      actorId: req.user.id,
      actorRole: 'superadmin',
      action: 'RESET_PASSWORD_ADMIN',
      entityType: 'user',
      entityId: admin.id,
      detail: { email: admin.email },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Password admin berhasil direset. Harap segera catat password baru ini.',
      temporary_password: newPassword
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/superadmin/admins/:id/status
 */
async function toggleAdminStatus(req, res, next) {
  try {
    const { is_active } = req.body;
    const target = await User.findByPk(req.params.id);
    if (!target) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Admin tidak ditemukan.' });

    // Self protection
    if (target.id === req.user.id) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Superadmin tidak diizinkan menonaktifkan akunnya sendiri.'
      });
    }

    // Preserve at least 1 active superadmin
    if (target.role === 'superadmin' && is_active === false) {
      const activeSuperCount = await User.count({ where: { role: 'superadmin', is_active: true } });
      if (activeSuperCount <= 1) {
        return res.status(403).json({
          success: false,
          code: 'FORBIDDEN',
          message: 'Sistem harus selalu menyisakan minimal 1 Superadmin aktif.'
        });
      }
    }

    target.is_active = !!is_active;
    await target.save();

    await logActivity({
      actorId: req.user.id,
      actorRole: 'superadmin',
      action: is_active ? 'AKTIFKAN_ADMIN' : 'NONAKTIFKAN_ADMIN',
      entityType: 'user',
      entityId: target.id,
      req
    });

    return res.status(200).json({
      success: true,
      message: `Status admin diubah menjadi ${is_active ? 'Aktif' : 'Nonaktif'}.`
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/superadmin/admins/:id
 */
async function deleteAdmin(req, res, next) {
  try {
    const target = await User.findByPk(req.params.id);
    if (!target) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Admin tidak ditemukan.' });

    if (target.id === req.user.id) {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Tidak dapat menghapus akun Anda sendiri.' });
    }

    // Check if admin has logged activity
    const activityCount = await ActivityLog.count({ where: { actor_id: target.id } });
    if (activityCount > 0) {
      // Deactivate instead of delete to preserve audit integrity
      target.is_active = false;
      await target.save();
      return res.status(200).json({
        success: true,
        message: 'Admin ini memiliki riwayat aktivitas, sehingga statusnya dinonaktifkan alih-alih dihapus untuk menjaga integritas data.'
      });
    }

    await target.destroy();

    await logActivity({
      actorId: req.user.id,
      actorRole: 'superadmin',
      action: 'HAPUS_AKUN_ADMIN',
      entityType: 'user',
      entityId: req.params.id,
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Akun admin berhasil dihapus.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/superadmin/activity
 * Append-only audit logs with server filtering & CSV export
 */
async function getActivityLogs(req, res, next) {
  try {
    const { from, to, actor_id, actor_role, action, q, page = 1, limit = 25, format } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 25));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (from && to) {
      where.created_at = { [Op.between]: [from + ' 00:00:00', to + ' 23:59:59'] };
    }
    if (actor_id) where.actor_id = actor_id;
    if (actor_role) where.actor_role = actor_role;
    if (action) where.action = action;
    if (q) {
      where[Op.or] = [
        { action: { [Op.like]: `%${q.trim()}%` } },
        { entity_id: { [Op.like]: `%${q.trim()}%` } }
      ];
    }

    // CSV Export option
    if (format === 'csv') {
      const logs = await ActivityLog.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: 1000
      });

      let csv = 'ID,Waktu,Pelaku,Role,Aksi,Objek,Entity ID,IP Address\n';
      logs.forEach(l => {
        csv += `"${l.id}","${l.created_at}","${l.actor_id || 'system'}","${l.actor_role}","${l.action}","${l.entity_type || ''}","${l.entity_id || ''}","${l.ip_address || ''}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="polisoccer_activity_logs.csv"');
      return res.send(csv);
    }

    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: limitNum,
      offset,
      include: [{ model: User, as: 'actor', attributes: ['id', 'full_name', 'email', 'role'] }]
    });

    return res.status(200).json({
      success: true,
      data: {
        activities: rows,
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
 * CRUD /api/superadmin/fields/:id
 * Updates 3-tier prices for a field
 */
async function updateFieldTariff(req, res, next) {
  try {
    const { price_umum, price_mahasiswa, price_karyawan, status } = req.body;
    const field = await Field.findByPk(req.params.id);
    if (!field) return res.status(404).json({ success: false, code: 'NOT_FOUND', message: 'Lapangan tidak ditemukan.' });

    const before = {
      price_umum: field.price_umum,
      price_mahasiswa: field.price_mahasiswa,
      price_karyawan: field.price_karyawan,
      status: field.status
    };

    if (price_umum !== undefined) field.price_umum = Math.max(1, Math.round(parseFloat(price_umum) || 150000));
    if (price_mahasiswa !== undefined) field.price_mahasiswa = Math.max(1, Math.round(parseFloat(price_mahasiswa) || 100000));
    if (price_karyawan !== undefined) field.price_karyawan = Math.max(1, Math.round(parseFloat(price_karyawan) || 120000));
    if (status !== undefined) field.status = status;
    await field.save();

    await logActivity({
      actorId: req.user.id,
      actorRole: 'superadmin',
      action: 'UBAH_TARIF_LAPANGAN',
      entityType: 'field',
      entityId: field.id,
      detail: {
        before,
        after: {
          price_umum: field.price_umum,
          price_mahasiswa: field.price_mahasiswa,
          price_karyawan: field.price_karyawan,
          status: field.status
        }
      },
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Tarif lapangan 3 tingkat berhasil diperbarui (berlaku untuk pemesanan baru).',
      data: field
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/superadmin/settings
 */
async function getSystemSettings(req, res, next) {
  try {
    const settings = await getSettings(true);
    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/superadmin/settings
 */
async function updateSystemSettings(req, res, next) {
  try {
    const entries = req.body;
    for (const [k, v] of Object.entries(entries)) {
      await updateSetting(k, v, req.user.id);
    }

    await logActivity({
      actorId: req.user.id,
      actorRole: 'superadmin',
      action: 'UBAH_PENGATURAN_SISTEM',
      detail: entries,
      req
    });

    return res.status(200).json({
      success: true,
      message: 'Pengaturan sistem berhasil diperbarui.'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/superadmin/reports
 */
async function getReports(req, res, next) {
  try {
    const { from, to } = req.query;
    const today = new Date().toISOString().slice(0, 10);
    const start = from || today.slice(0, 7) + '-01';
    const end = to || today;

    const bookings = await Booking.findAll({
      where: {
        booking_date: { [Op.between]: [start, end] }
      },
      include: [{ model: Field, as: 'field', attributes: ['id', 'name'] }]
    });

    const revenueTotal = bookings
      .filter(b => ['dp_paid_50', 'fully_paid'].includes(b.payment_status))
      .reduce((sum, b) => sum + parseFloat(b.paid_amount || 0), 0);

    const byStatus = {};
    const byTariff = { umum: 0, mahasiswa: 0, karyawan: 0 };
    const byField = {};

    bookings.forEach(b => {
      byStatus[b.payment_status] = (byStatus[b.payment_status] || 0) + 1;
      const tier = b.tariff_tier || 'umum';
      byTariff[tier] = (byTariff[tier] || 0) + 1;
      const fn = b.field?.name || `Lapangan ${b.field_id}`;
      byField[fn] = (byField[fn] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        period: { from: start, to: end },
        summary: {
          total_bookings: bookings.length,
          total_revenue: revenueTotal
        },
        by_status: byStatus,
        by_tariff: byTariff,
        by_category: byTariff,
        by_field: byField
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSummary,
  getAdmins,
  createAdmin,
  resetAdminPassword,
  toggleAdminStatus,
  deleteAdmin,
  getActivityLogs,
  updateFieldTariff,
  getSystemSettings,
  updateSystemSettings,
  getReports
};

