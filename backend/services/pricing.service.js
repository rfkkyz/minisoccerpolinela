/**
 * Pricing Service - POLISOCCER
 * Server-authoritative calculation for 3-tier tariffs: UMUM, MAHASISWA, KARYAWAN.
 * Pure 3-tier tariff pricing model (Umum, Mahasiswa, Karyawan).
 */

function getTariffPrice(field, tariffTier = 'umum') {
  const tier = String(tariffTier || 'umum').toLowerCase().trim();
  if (tier === 'mahasiswa') {
    return Math.round(parseFloat(field.price_mahasiswa) || 100000);
  }
  if (tier === 'karyawan') {
    return Math.round(parseFloat(field.price_karyawan) || 120000);
  }
  return Math.round(parseFloat(field.price_umum) || 150000);
}

function calculateTariffQuote({ pricePerHour, hoursCount = 1, paymentType = 'dp_50', tariffTier = 'umum' }) {
  const hourly = Math.max(0, Math.round(parseFloat(pricePerHour) || 0));
  const count = Math.max(1, Math.min(3, parseInt(hoursCount, 10) || 1));
  const total = hourly * count;

  let payNow = total;
  let remaining = 0;

  if (paymentType === 'dp_50') {
    payNow = Math.round(total / 2);
    remaining = total - payNow;
  }

  return {
    tariff_tier: tariffTier,
    price_per_hour: hourly,
    hours_count: count,
    total,
    pay_now: payNow,
    remaining
  };
}

module.exports = {
  getTariffPrice,
  calculateTariffQuote
};
