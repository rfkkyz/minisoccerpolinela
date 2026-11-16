import React, { forwardRef, useState, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

export const Select = forwardRef(function Select(
  {
    label,
    hint,
    error,
    options = [],
    value,
    onChange,
    placeholder = 'Pilih salah satu...',
    customDropdown = false,
    className = '',
    required = false,
    disabled = false,
    ...props
  },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useClickOutside(containerRef, () => setIsOpen(false));

  const selectedOption = options.find((o) => (o.id !== undefined ? o.id : o.value) === value);

  // If custom dropdown mode requested
  if (customDropdown) {
    return (
      <div ref={containerRef} className="w-full space-y-1.5 text-left relative">
        {label && (
          <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-2)]">
            {label}
            {required && <span className="text-[var(--danger)] ml-1">*</span>}
          </label>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full h-12 bg-[var(--surface)] text-[var(--ink)] text-sm rounded-[12px] border px-3.5 flex items-center justify-between transition-all duration-150 outline-none cursor-pointer ${
            error
              ? 'border-[var(--danger)] focus:ring-4 focus:ring-[var(--danger)]/15'
              : 'border-[var(--line-strong)] focus:ring-4 focus:ring-[var(--accent-strong)]/18'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--paper-2)]' : ''} ${className}`}
        >
          <span className={selectedOption ? 'text-[var(--ink)]' : 'text-[var(--ink-3)]'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-[var(--ink-2)] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-40 max-h-56 overflow-y-auto bg-[var(--surface)] rounded-[14px] border border-[var(--line-strong)] shadow-lg p-1 space-y-0.5">
            {options.map((opt) => {
              const optVal = opt.id !== undefined ? opt.id : opt.value;
              const isSelected = optVal === value;
              return (
                <button
                  key={optVal}
                  type="button"
                  onClick={() => {
                    if (onChange) onChange(optVal);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-[10px] flex items-center justify-between text-xs sm:text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--surface-tint)] text-[var(--accent-strong)] font-semibold'
                      : 'text-[var(--ink)] hover:bg-[var(--paper-2)]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-[var(--accent-strong)]" />}
                </button>
              );
            })}
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

  // Native accessible select
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-2)]">
          {label}
          {required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.value)}
          className={`w-full h-12 bg-[var(--surface)] text-[var(--ink)] text-sm rounded-[12px] border px-3.5 pr-10 appearance-none transition-all duration-150 outline-none cursor-pointer ${
            error
              ? 'border-[var(--danger)] focus:ring-4 focus:ring-[var(--danger)]/15 focus:border-[var(--danger)]'
              : 'border-[var(--line-strong)] focus:ring-4 focus:ring-[var(--accent-strong)]/18 focus:border-[var(--accent-strong)]'
          } disabled:bg-[var(--paper-2)] disabled:cursor-not-allowed ${className}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const optVal = opt.id !== undefined ? opt.id : opt.value;
            return (
              <option key={optVal} value={optVal}>
                {opt.label}
              </option>
            );
          })}
        </select>

        <div className="absolute right-3.5 pointer-events-none text-[var(--ink-3)]">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-xs text-[var(--danger)] font-medium">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--ink-3)]">{hint}</p>
      ) : null}
    </div>
  );
});

export default Select;

