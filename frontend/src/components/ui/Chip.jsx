import React from 'react';

const TIER_CONFIG = {
  umum: {
    label: 'UMUM',
    classes: 'bg-slate-100 text-slate-700 border-slate-200'
  },
  mahasiswa: {
    label: 'MAHASISWA',
    classes: 'bg-[var(--accent-soft)] text-[var(--accent-strong)] border-[var(--accent-strong)]/30'
  },
  karyawan: {
    label: 'KARYAWAN',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  }
};

export function Chip({
  tier = 'umum', // 'umum' | 'mahasiswa' | 'karyawan'
  label,
  size = 'sm', // 'sm' | 'md'
  className = ''
}) {
  const normTier = String(tier || 'umum').toLowerCase();
  const config = TIER_CONFIG[normTier] || {
    label: label || normTier.toUpperCase(),
    classes: 'bg-[var(--paper-2)] text-[var(--ink-2)] border-[var(--line)]'
  };

  const displayLabel = label || config.label;
  const sizeClasses = size === 'md' ? 'h-6 px-2.5 text-xs' : 'h-5 px-2 text-[10px]';

  return (
    <span
      className={`inline-flex items-center font-sans font-semibold uppercase tracking-wider rounded-full border select-none ${sizeClasses} ${config.classes} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80 shrink-0" />
      {displayLabel}
    </span>
  );
}

export default Chip;

