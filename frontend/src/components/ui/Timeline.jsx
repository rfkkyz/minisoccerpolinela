import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';

export function Timeline({
  items = [], // [{ title, description, time, status: 'completed' | 'current' | 'upcoming' | 'danger' }]
  className = ''
}) {
  return (
    <div className={`space-y-6 select-none ${className}`}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const status = item.status || 'upcoming';

        let dotBg = 'bg-[var(--line-strong)] text-white';
        let lineBg = 'bg-[var(--line)]';

        if (status === 'completed') {
          dotBg = 'bg-[var(--accent-strong)] text-white shadow-xs';
          lineBg = 'bg-[var(--accent-strong)]';
        } else if (status === 'current') {
          dotBg = 'bg-[var(--seg-active)] text-[var(--accent)] ring-4 ring-[var(--accent)]/25';
          lineBg = 'bg-[var(--line-strong)]';
        } else if (status === 'danger') {
          dotBg = 'bg-[var(--danger)] text-white';
          lineBg = 'bg-rose-200';
        }

        return (
          <div key={idx} className="relative flex items-start gap-4">
            {/* Left Timeline Line & Dot */}
            <div className="flex flex-col items-center shrink-0">
              {/* 12px Dot */}
              <div
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-200 ${dotBg}`}
              />

              {/* Vertical connecting line */}
              {!isLast && (
                <div className={`w-0.5 min-h-[36px] my-1 flex-1 ${lineBg}`} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className={`text-xs sm:text-sm font-semibold ${
                  status === 'completed' || status === 'current'
                    ? 'text-[var(--ink)]'
                    : 'text-[var(--ink-2)]'
                }`}>
                  {item.title}
                </h4>
                {item.time && (
                  <span className="font-mono text-[10px] text-[var(--ink-3)] shrink-0">
                    {item.time}
                  </span>
                )}
              </div>

              {item.description && (
                <p className="mt-0.5 text-xs text-[var(--ink-2)] leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Timeline;

