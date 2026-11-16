import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';

export function StatCard({
  title,
  value = 0,
  isCurrency = false,
  prefix = '',
  suffix = '',
  icon: Icon,
  subtitle,
  change,
  isPositive = true,
  variant = 'light', // 'light' | 'dark'
  className = ''
}) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const animatedValue = useCountUp(numericValue, 600);

  const displayValue = isCurrency
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(animatedValue)
    : `${prefix}${animatedValue.toLocaleString('id-ID')}${suffix}`;

  const isDark = variant === 'dark';

  return (
    <div
      className={`rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-6 transition-all duration-200 select-none relative overflow-hidden bg-white/95 backdrop-blur-md text-[var(--ink)] border border-emerald-500/15 shadow-[0_4px_20px_rgba(14,42,32,0.04)] hover:border-emerald-400 hover:shadow-[0_10px_25px_rgba(18,161,80,0.10)] hover:-translate-y-1 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2 sm:mb-3 relative z-10">
        <span className="text-[10px] sm:text-xs font-sans font-bold uppercase tracking-wider text-slate-500 line-clamp-1">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 bg-emerald-50 text-[#12A150] border border-emerald-200/80 shadow-xs">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
          </div>
        )}
      </div>

      <div className="font-zen text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight relative z-10 text-[var(--ink)] truncate">
        {displayValue}
      </div>

      {(subtitle || change !== undefined) && (
        <div className="mt-1.5 sm:mt-2.5 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs relative z-10 font-sans">
          {change !== undefined && (
            <span
              className={`font-sans font-bold px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] ${
                isPositive 
                  ? 'bg-emerald-50 text-[#0B7A3B] border border-emerald-200' 
                  : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}
            >
              {change}
            </span>
          )}
          {subtitle && (
            <span className="text-[10px] sm:text-xs text-slate-400 line-clamp-1">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default StatCard;
