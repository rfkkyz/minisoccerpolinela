import React from 'react';

export function Card({
  children,
  className = '',
  variant = 'surface', // 'surface' | 'neon' | 'tinted' | 'outline' | 'glass'
  hoverable = false,
  padding = 'normal', // 'normal' (24px) | 'compact' (16px) | 'none'
  ...props
}) {
  const paddingStyles = {
    normal: 'p-6',
    compact: 'p-4',
    none: 'p-0'
  };

  const variantStyles = {
    surface: 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] shadow-sm',
    neon: 'bg-gradient-to-br from-[var(--glass-top)] to-[var(--glass-mid)] text-[var(--ink)] border border-[var(--glass-border)] shadow-[var(--shadow-glass)]',
    tinted: 'bg-[var(--surface-tint)] text-[var(--ink)] border border-[var(--line)] shadow-xs',
    tint: 'bg-[var(--surface-tint)] text-[var(--ink)] border border-[var(--line)] shadow-xs',
    outline: 'bg-transparent text-[var(--ink)] border border-[var(--line-strong)]',
    glass: 'bg-white/80 backdrop-blur-md text-[var(--ink)] border border-[var(--glass-border)] shadow-[var(--shadow-glass)]',
    night: 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] shadow-sm'
  };

  const hoverStyles = hoverable
    ? 'cursor-pointer hover:shadow-md hover:translate-y-[-2px] hover:border-[var(--line-strong)]'
    : '';

  return (
    <div
      className={`rounded-[20px] transition-all duration-200 ${paddingStyles[padding] || paddingStyles.normal} ${variantStyles[variant] || variantStyles.surface} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
