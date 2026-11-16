import React from 'react';

export function IconButton({
  icon: Icon,
  children,
  size = 'md', // 'sm' (32px) | 'md' (36px) | 'lg' (44px)
  variant = 'ghost', // 'ghost' | 'surface' | 'dark' | 'accent' | 'danger'
  shape = 'circle', // 'circle' | 'rounded'
  title,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base'
  };

  const shapeClasses = {
    circle: 'rounded-full',
    rounded: 'rounded-[10px]'
  };

  const variantClasses = {
    ghost: 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-tint)] active:bg-[var(--paper-2)]',
    surface: 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] shadow-xs hover:border-[var(--line-strong)] hover:bg-[var(--surface-tint)]',
    dark: 'bg-[var(--surface)] text-[var(--ink)] border border-[var(--line-strong)] hover:bg-[var(--surface-tint)]',
    accent: 'bg-[var(--accent)] text-[var(--ink)] hover:bg-[var(--accent-hover)] shadow-xs',
    danger: 'text-[var(--danger)] hover:bg-[var(--danger-soft)] active:bg-rose-100'
  };

  return (
    <button
      type="button"
      title={title}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none disabled:opacity-40 disabled:pointer-events-none active:scale-95 ${sizeClasses[size] || sizeClasses.md} ${shapeClasses[shape] || shapeClasses.circle} ${variantClasses[variant] || variantClasses.ghost} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 stroke-[2]" />
      ) : (
        children
      )}
    </button>
  );
}

export default IconButton;

