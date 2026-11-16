import React, { useState, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Calendar } from './Calendar';
import { useClickOutside } from '../../hooks/useClickOutside';

export function DatePicker({
  label,
  value, // 'YYYY-MM-DD'
  onChange,
  error,
  hint,
  placeholder = 'Pilih tanggal...',
  minDate,
  maxDate,
  className = '',
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useClickOutside(containerRef, () => setIsOpen(false));

  const formatDisplay = (val) => {
    if (!val) return '';
    const d = new Date(val + 'T00:00:00');
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  };

  return (
    <div ref={containerRef} className={`w-full space-y-1.5 text-left relative ${className}`}>
      {label && (
        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-2)]">
          {label}
          {required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 bg-[var(--surface)] text-[var(--ink)] text-sm rounded-[12px] border px-3.5 flex items-center justify-between transition-all duration-150 outline-none cursor-pointer ${
          error
            ? 'border-[var(--danger)] focus:ring-4 focus:ring-[var(--danger)]/15'
            : 'border-[var(--line-strong)] focus:ring-4 focus:ring-[var(--accent-strong)]/18'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <CalendarIcon className="w-4 h-4 text-[var(--ink-3)]" />
          <span className={value ? 'text-[var(--ink)] font-medium' : 'text-[var(--ink-3)]'}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--ink-3)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-full sm:w-[320px] shadow-xl">
          <Calendar
            selectedDate={value}
            minDate={minDate}
            maxDate={maxDate}
            onSelectDate={(dateStr) => {
              if (onChange) onChange(dateStr);
              setIsOpen(false);
            }}
          />
        </div>
      )}

      {error ? (
        <p className="text-xs text-[var(--danger)] font-medium">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--ink-3)]">{hint}</p>
      ) : null}
    </div>
  );
}

export default DatePicker;

