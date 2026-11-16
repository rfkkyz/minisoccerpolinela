import React from 'react';
import { Lock, Ban, Check } from 'lucide-react';

export function SlotGrid({
  slots = [],
  selectedHours = [],
  onToggleHour,
  disabled = false,
  className = ''
}) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5 ${className}`}>
      {slots.map((slot) => {
        const isSelected = selectedHours.includes(slot.hour);
        const isPast = slot.status === 'past';
        const isBooked = slot.status === 'booked';
        const isBlocked = slot.status === 'blocked';
        const isLocked = slot.status === 'locked';
        const isAvailable = slot.status === 'available';

        let stateClasses = 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--accent-strong)] hover:bg-[var(--accent-soft)] hover:shadow-sm cursor-pointer';
        let tooltip = 'Tersedia untuk dipesan';

        if (isSelected) {
          stateClasses = 'bg-[var(--accent-strong)] text-white border-transparent shadow-[0_2px_12px_rgba(18,161,80,0.35)] scale-[1.02] cursor-pointer font-bold';
          tooltip = 'Slot terpilih';
        } else if (isPast) {
          stateClasses = 'bg-[var(--paper-2)] text-[var(--ink-3)] border-[var(--line)] opacity-40 cursor-not-allowed';
          tooltip = 'Waktu telah lampau';
        } else if (isBlocked) {
          stateClasses = 'text-[var(--ink-3)] border-[var(--line)] cursor-not-allowed bg-[repeating-linear-gradient(45deg,var(--paper-2),var(--paper-2)_6px,var(--line)_6px,var(--line)_12px)] opacity-60';
          tooltip = 'Jadwal ditutup untuk pemeliharaan';
        } else if (isBooked) {
          stateClasses = 'bg-[var(--paper-2)] text-[var(--ink-3)] border-[var(--line)] line-through opacity-50 cursor-not-allowed';
          tooltip = 'Sudah dipesan oleh pengguna lain';
        } else if (isLocked) {
          stateClasses = 'bg-[var(--warning-soft)] text-[#8F5900] border-[#E8A317]/40 opacity-90 cursor-not-allowed';
          tooltip = 'Sedang dalam proses pemesanan';
        }

        return (
          <button
            key={slot.hour}
            type="button"
            title={tooltip}
            disabled={disabled || (!isAvailable && !isSelected)}
            onClick={() => onToggleHour && onToggleHour(slot.hour)}
            className={`min-w-[64px] h-[52px] flex flex-col items-center justify-center p-2 rounded-[12px] text-center transition-all duration-150 select-none relative group ${stateClasses}`}
          >
            <div className="font-mono text-xs font-bold tracking-tight">
              {String(slot.hour).padStart(2, '0')}:00
            </div>
            <div className="text-[10px] mt-0.5 font-mono uppercase tracking-wider flex items-center gap-1">
              {isSelected ? (
                <span className="flex items-center gap-0.5 font-semibold text-white">
                  <Check className="w-2.5 h-2.5" /> PILIH
                </span>
              ) : isLocked ? (
                <span className="flex items-center gap-0.5 text-[#8F5900]">
                  <Lock className="w-2.5 h-2.5" /> PROSES
                </span>
              ) : isBlocked ? (
                <span className="flex items-center gap-0.5">
                  <Ban className="w-2.5 h-2.5" /> TUTUP
                </span>
              ) : isBooked ? (
                <span>TERISI</span>
              ) : (
                <span className="text-[var(--ink-3)] group-hover:text-[var(--accent-strong)]">KOSONG</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default SlotGrid;
