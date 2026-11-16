const cron = require('node-cron');
const { Op } = require('sequelize');
const { sequelize, LockTimer, Booking, BookingSlot, ActivityLog } = require('../models');

/**
 * Clean up expired lock_timers and expired pending_hold bookings
 */
async function runCleanupJobs() {
  const now = new Date();
  let deletedLocks = 0;
  let expiredBookingsCount = 0;

  // 1. Delete expired lock_timers (> 5 minutes)
  try {
    deletedLocks = await LockTimer.destroy({
      where: {
        expires_at: {
          [Op.lte]: now
        }
      }
    });
  } catch (err) {
    console.error('⚠️ [CRON] Error clearing expired lock_timers:', err.message);
  }

  // 2. Expire pending_hold bookings (> 30 minutes)
  try {
    const expiredBookings = await Booking.findAll({
      where: {
        payment_status: 'pending_hold',
        hold_expires_at: {
          [Op.lte]: now
        }
      }
    });

    if (expiredBookings.length > 0) {
      for (const b of expiredBookings) {
        const transaction = await sequelize.transaction();
        try {
          b.payment_status = 'expired_cancelled';
          b.cancel_reason = 'Kedaluwarsa otomatis';
          b.hold_expires_at = null;
          await b.save({ transaction });

          // Deactivate slots and set active_flag to NULL (frees the slot immediately)
          await BookingSlot.update(
            { is_active: false, active_flag: null, status: 'expired_cancelled' },
            { where: { booking_id: b.id }, transaction }
          );

          // Write system activity log
          await ActivityLog.create({
            actor_id: null,
            actor_role: 'system',
            action: 'KEDALUWARSA_OTOMATIS',
            entity_type: 'booking',
            entity_id: b.id,
            detail: {
              booking_code: b.booking_code,
              reason: 'Batas waktu hold pembayaran habis (Kedaluwarsa otomatis)',
              field_id: b.field_id,
              date: b.booking_date
            }
          }, { transaction });

          await transaction.commit();
          expiredBookingsCount++;
        } catch (e) {
          if (transaction && !transaction.finished) await transaction.rollback();
          console.error(`⚠️ [CRON] Gagal meng-expire booking ${b.booking_code}:`, e.message);
        }
      }
    }
  } catch (err) {
    console.error('⚠️ [CRON] Error expiring pending_hold bookings:', err.message);
  }

  if (deletedLocks > 0 || expiredBookingsCount > 0) {
    console.log(`🧹 [CRON CLEANUP] Berhasil membersihkan ${deletedLocks} lock kedaluwarsa & membatalkan ${expiredBookingsCount} booking kedaluwarsa.`);
  }

  return { deletedLocks, expiredBookingsCount };
}

/**
 * Start cron job to auto-run every 1 minute
 */
function startLockCleanupCron() {
  const task = cron.schedule('* * * * *', async () => {
    await runCleanupJobs();
  });

  console.log('⏰ [CRON] Job auto-cleanup expired locks & pending bookings aktif (interval: setiap 1 menit).');
  return task;
}

module.exports = {
  runCleanupJobs,
  startLockCleanupCron
};
