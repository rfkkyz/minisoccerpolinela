import React, { forwardRef } from 'react';

export const Textarea = forwardRef(function Textarea(
  {
    label,
    hint,
    error,
    rows = 3,
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

      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={`w-full bg-[var(--surface)] text-[var(--ink)] placeholder-[var(--ink-3)] text-sm rounded-[12px] border p-3.5 transition-all duration-150 outline-none resize-y ${
          error
            ? 'border-[var(--danger)] focus:ring-4 focus:ring-[var(--danger)]/15 focus:border-[var(--danger)]'
            : 'border-[var(--line-strong)] focus:ring-4 focus:ring-[var(--accent-strong)]/18 focus:border-[var(--accent-strong)]'
        } disabled:bg-[var(--paper-2)] disabled:text-[var(--ink-3)] disabled:cursor-not-allowed ${className}`}
        {...props}
      />

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

export default Textarea;

