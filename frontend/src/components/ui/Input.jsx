import React, { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    icon: Icon,
    iconRight: IconRight,
    type = 'text',
    className = '',
    required = false,
    disabled = false,
    ...props
  },
  ref
) {
  return (
    <div className="w-full space-y-1.5 text-left">
      {label && (
        <label className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-2)]">
          {label}
          {required && <span className="text-[var(--danger)] ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-[var(--ink-3)] pointer-events-none shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          type={type}
          disabled={disabled}
          className={`w-full h-12 bg-[var(--surface)] text-[var(--ink)] placeholder-[var(--ink-3)] text-sm rounded-[12px] border transition-all duration-150 outline-none select-text ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${IconRight ? 'pr-10' : 'pr-3.5'} ${
            error
              ? 'border-[var(--danger)] focus:ring-4 focus:ring-[var(--danger)]/15 focus:border-[var(--danger)]'
              : 'border-[var(--line-strong)] focus:ring-4 focus:ring-[var(--accent-strong)]/18 focus:border-[var(--accent-strong)]'
          } disabled:bg-[var(--paper-2)] disabled:text-[var(--ink-3)] disabled:cursor-not-allowed ${className}`}
          {...props}
        />

        {IconRight && (
          <div className="absolute right-3.5 text-[var(--ink-3)] shrink-0">
            {typeof IconRight === 'function' ? <IconRight className="w-4 h-4" /> : IconRight}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-[var(--danger)] font-medium flex items-center gap-1">
          <span>⚠</span>
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-[var(--ink-3)]">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;

