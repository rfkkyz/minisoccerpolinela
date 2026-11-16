import React from 'react';
import { PublicLayout } from './PublicLayout';
import { MintBackdrop } from '../ui/MintBackdrop';

export function AuthLayout({
  title,
  subtitle,
  children,
  badge = 'PORTAL RESMI',
  className = ''
}) {
  return (
    <PublicLayout>
      {/* 1. Short Inset Hero Card (tinggi 280-320px, margin 0 12px/8px, radius 28px/20px) */}
      <div className="relative mx-2 sm:mx-3 rounded-[20px] sm:rounded-[28px] h-[280px] sm:h-[320px] overflow-hidden select-none border border-[var(--glass-border)] shadow-[var(--shadow-glass)] flex flex-col items-center justify-center text-center p-6 bg-transparent">
        <MintBackdrop variant="hero" tone="a" className="absolute inset-0" />

        {/* Polinela Branding inside short hero */}
        <div className="relative z-10 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--accent-strong)]/30 p-2 flex items-center justify-center shadow-xs mx-auto">
            <img src="/logo-polinela.png" alt="POLINELA" className="w-full h-full object-contain" />
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--accent-text)] font-semibold block">
            POLITEKNIK NEGERI LAMPUNG
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--ink)] tracking-tight font-sans">
            Sistem Reservasi Resmi
          </h2>
        </div>
      </div>

      {/* 2. Overlapping White Card (margin-top: -48px, radius 28px) */}
      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 relative z-20 pb-20 -mt-12 sm:-mt-16">
        <div className={`w-full max-w-[460px] bg-white rounded-[24px] sm:rounded-[28px] border border-[var(--glass-border)] shadow-xl p-6 sm:p-10 ${className}`}>
          {/* Card Header */}
          <div className="text-center mb-6">
            <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-strong)]/20 mb-3">
              {badge}
            </span>
            <h1 className="font-sans font-bold text-2xl sm:text-3xl text-[var(--ink)] tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-xs sm:text-sm text-[var(--ink-2)]">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>
    </PublicLayout>
  );
}

export default AuthLayout;
