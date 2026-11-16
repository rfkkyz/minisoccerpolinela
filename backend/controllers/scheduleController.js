const { Field, Schedule, ScheduleSlot, PricingCategory } = require('../models');

/**
 * Get all fields
 * GET /api/schedules/fields
 */
async function getFields(req, res, next) {
  try {
    const fields = await Field.findAll({
      order: [['id', 'ASC']]
    });
    return res.status(200).json({
      status: 'success',
      data: fields
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get pricing categories
 * GET /api/schedules/categories
 */
async function getPricingCategories(req, res, next) {
  try {
    const categories = await PricingCategory.findAll({
      order: [['id', 'ASC']]
    });
    return res.status(200).json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get full schedule and slots for a field
 * GET /api/schedules/fields/:field_id
 */
async function getFieldSchedule(req, res, next) {
  try {
    const { field_id } = req.params;

    const field = await Field.findByPk(field_id, {
      include: [
        {
          model: Schedule,
          as: 'schedules',
          include: [
            {
              model: ScheduleSlot,
              as: 'slots',
              where: { is_active: true },
              required: false
            }
          ]
        }
      ]
    });

    if (!field) {
      return res.status(404).json({
        status: 'error',
        message: `Lapangan dengan ID ${field_id} tidak ditemukan.`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: field
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFields,
  getPricingCategories,
  getFieldSchedule
};
