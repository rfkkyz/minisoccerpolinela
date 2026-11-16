const crypto = require('crypto');
const Booking = require('../models/Booking');

/**
 * Generate unique booking code in format: POLI-YYMMDD-XXXX
 * Example: POLI-261029-A7K2
 */
async function generateBookingCode(bookingDate = new Date()) {
  const d = new Date(bookingDate);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const datePrefix = `POLI-${yy}${mm}${dd}`;

  let isUnique = false;
  let candidateCode = '';

  while (!isUnique) {
    const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
    candidateCode = `${datePrefix}-${randomChars}`;

    const existing = await Booking.findOne({
      where: { booking_code: candidateCode },
      attributes: ['id']
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return candidateCode;
}

module.exports = {
  generateBookingCode
};
