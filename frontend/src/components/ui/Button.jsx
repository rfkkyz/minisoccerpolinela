import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'dark'
  size = 'md',        // 'sm' | 'md' | 'lg'
  pill = false,
  block = false,
  className = '',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  onClick,
  ...props
}) {
  const baseStyles =
    'font-sans font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)] focus-visible:ring-offset-2 active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none disabled:active:scale-100';

  const sizeStyles = {
    sm: 'h-9 px-3.5 text-xs',
    md: 'h-11 px-5 text-sm',
    lg: 'h-[52px] px-6 text-base',
  };

  const radiusStyles = pill
    ? 'rounded-full'
    : size === 'sm'
    ? 'rounded-[10px]'
    : size === 'lg'
    ? 'rounded-[14px]'
    : 'rounded-[12px]';

  const variantStyles = {
    primary:
      'bg-[var(--accent)] text-[var(--ink)] font-semibold hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)] shadow-xs hover:shadow-[0_0_20px_rgba(124,255,178,0.55)] hover:translate-y-[-1px]',
    accent:
      'bg-[var(--accent)] text-[var(--ink)] font-semibold hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)] shadow-xs hover:shadow-[0_0_20px_rgba(124,255,178,0.55)] hover:translate-y-[-1px]',
    secondary:
      'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line-strong)] hover:bg-[var(--surface-tint)] hover:border-[var(--ink-3)] shadow-xs',
    ghost:
      'bg-transparent text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-tint)]',
    outline:
      'bg-transparent border border-[var(--accent-strong)] text-[var(--accent-strong)] hover:bg-[var(--accent-soft)]',
    danger:
      'bg-[var(--danger)] text-white hover:opacity-95 shadow-xs',
    dark:
      'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line-strong)] hover:bg-[var(--surface-tint)] shadow-xs'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${radiusStyles} ${
        variantStyles[variant] || variantStyles.primary
      } ${block ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}

export default Button;
