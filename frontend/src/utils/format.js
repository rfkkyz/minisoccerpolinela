/**
 * Formatting Utilities - POLISOCCER
 * Standardized Indonesian Currency and Asia/Jakarta Date-Time Formatting
 */

export function formatRupiah(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
}

export function formatDate(dateString, options = {}) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  }).format(d);
}

export const formatDateIndo = formatDate;

export function formatShortDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(d);
}

export function formatHourRange(startHour, endHour) {
  const s = String(startHour).padStart(2, '0');
  const e = String(endHour).padStart(2, '0');
  return `${s}:00 - ${e}:00 WIB`;
}

export function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00 WIB`;
}

