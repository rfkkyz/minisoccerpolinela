import React from 'react';

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  className = '',
  disabled = false,
}) {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className={`relative w-full flex items-center select-none py-2.5 ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      {/* Background Track (3px, --line-strong) */}
      <div className="w-full h-[3px] rounded-full bg-[var(--line-strong)] relative overflow-hidden">
        {/* Filled Portion (--accent-strong) */}
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-[var(--accent-strong)] transition-all duration-75"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Hidden Native Range Input */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange && onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />

      {/* Custom Styled Thumb (16px, --ink with white ring and shadow) */}
      <div
        className="absolute w-4 h-4 rounded-full bg-[var(--ink)] ring-2 ring-white shadow-md pointer-events-none transition-transform duration-100 ease-out hover:scale-125"
        style={{
          left: `calc(${percentage}% - 8px)`,
        }}
      />
    </div>
  );
}

export default Slider;

