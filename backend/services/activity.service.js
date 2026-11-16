/**
 * Activity Log Service - POLISOCCER
 * Append-only activity logger for system, user, and administrative actions.
 */
const { ActivityLog } = require('../models');

async function logActivity({
  actorId = null,
  actorRole = 'user',
  action,
  entityType = null,
  entityId = null,
  detail = null,
  req = null
}) {
  try {
    let ip = null;
    let ua = null;

    if (req) {
      ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
      ua = req.headers['user-agent'] ? req.headers['user-agent'].substring(0, 255) : null;
    }

    await ActivityLog.create({
      actor_id: actorId,
      actor_role: actorRole,
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      detail: typeof detail === 'object' ? detail : { message: detail },
      ip_address: ip,
      user_agent: ua
    });
  } catch (err) {
    console.error('Failed to record activity log:', err);
    // Never throw from activity logger to prevent interrupting core workflows
  }
}

module.exports = {
  logActivity
};

