import React from 'react';

export function Skeleton({
  variant = 'text', // 'text' | 'rect' | 'circle'
  width,
  height,
  className = ''
}) {
  const variantStyles = {
    text: 'h-4 w-full rounded-[6px]',
    rect: 'h-24 w-full rounded-[14px]',
    circle: 'rounded-full w-10 h-10 shrink-0'
  };

  return (
    <div
      style={{ width, height }}
      className={`animate-pulse bg-gradient-to-r from-[var(--paper-2)] via-[var(--surface-tint)] to-[var(--paper-2)] bg-[length:200%_100%] ${variantStyles[variant] || variantStyles.text} ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[var(--surface)] p-6 rounded-[20px] border border-[var(--line)] space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="circle" className="w-8 h-8" />
      </div>
      <Skeleton variant="rect" className="h-8 w-2/3" />
      <Skeleton variant="text" className="w-1/2" />
    </div>
  );
}

export default Skeleton;

