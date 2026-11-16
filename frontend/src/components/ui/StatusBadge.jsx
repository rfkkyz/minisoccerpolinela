import React from 'react';

const STATUS_CONFIG = {
  // Booking statuses
  pending: {
    label: 'MENUNGGU PEMBAYARAN',
    classes: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  pending_hold: {
    label: 'MENUNGGU PEMBAYARAN',
    classes: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  dp_paid: {
    label: 'DP DIBAYAR',
    classes: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  dp_paid_50: {
    label: 'DP DIBAYAR (50%)',
    classes: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  confirmed: {
    label: 'DIKONFIRMASI',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  fully_paid: {
    label: 'LUNAS',
    classes: 'bg-[var(--accent-soft)] text-[var(--accent-strong)] border-[var(--accent-strong)]/30'
  },
  completed: {
    label: 'SELESAI',
    classes: 'bg-teal-50 text-teal-800 border-teal-200'
  },
  cancelled: {
    label: 'DIBATALKAN',
    classes: 'bg-rose-50 text-[var(--danger)] border-rose-200'
  },
  expired_cancelled: {
    label: 'DIBATALKAN / KADALUARSA',
    classes: 'bg-rose-50 text-[var(--danger)] border-rose-200'
  },
  rejected: {
    label: 'DITOLAK',
    classes: 'bg-rose-50 text-[var(--danger)] border-rose-200'
  },
  // User/Category/Verification statuses
  verified: {
    label: 'TERVERIFIKASI',
    classes: 'bg-emerald-50 text-[var(--accent-strong)] border-emerald-200'
  },
  unverified: {
    label: 'BELUM VERIFIKASI',
    classes: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  active: {
    label: 'AKTIF',
    classes: 'bg-emerald-50 text-[var(--accent-strong)] border-emerald-200'
  },
  inactive: {
    label: 'NONAKTIF',
    classes: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  maintenance: {
    label: 'PERAWATAN',
    classes: 'bg-amber-50 text-amber-800 border-amber-200'
  }
};

export function StatusBadge({ status, className = '' }) {
  const normStatus = String(status || '').toLowerCase();
  const config = STATUS_CONFIG[normStatus] || {
    label: status ? String(status).replace(/_/g, ' ').toUpperCase() : 'UNKNOWN',
    classes: 'bg-[var(--paper-2)] text-[var(--ink-2)] border-[var(--line)]'
  };

  return (
    <span
      className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-mono font-medium tracking-wider uppercase border select-none ${config.classes} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current shrink-0" />
      {config.label}
    </span>
  );
}

export default StatusBadge;
