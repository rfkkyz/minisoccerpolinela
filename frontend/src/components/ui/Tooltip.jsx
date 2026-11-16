import React, { useState } from 'react';

export function Tooltip({
  content,
  children,
  position = 'top', // 'top' | 'bottom' | 'left' | 'right'
  className = ''
}) {
  const [visible, setVisible] = useState(false);

  const posClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          role="tooltip"
          className={`absolute z-50 px-2.5 py-1 text-[11px] font-mono tracking-wide text-[var(--ink)] bg-white/95 backdrop-blur-md border border-[var(--glass-border)] rounded-[8px] shadow-md pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100 ${
            posClasses[position] || posClasses.top
          } ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default Tooltip;

