import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function MenuPanel({
  items = [],
  bottomButton = null,
  onSelect,
  className = '',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div
      className={`bg-[var(--surface)] rounded-[16px] p-1.5 shadow-[var(--shadow-dropdown)] border border-[var(--line)] space-y-1 min-w-[240px] text-left select-none ${className}`}
      role="menu"
    >
      {items.map((item, idx) => {
        if (item.type === 'divider') {
          return <div key={`div-${idx}`} className="h-[1px] bg-[var(--line)] my-1.5 mx-2" />;
        }

        const Icon = item.icon;
        const isHovered = hoveredIdx === idx;
        const isDanger = item.danger;

        return (
          <button
            key={item.id || idx}
            type="button"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => {
              if (item.onClick) item.onClick();
              if (onSelect) onSelect(item.id || item);
            }}
            className={`w-full h-[52px] rounded-[10px] px-2.5 flex items-center justify-between transition-colors duration-120 cursor-pointer text-left ${
              isHovered ? 'bg-[var(--paper-2)]' : 'bg-transparent'
            }`}
            role="menuitem"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* 40x40 Icon box (light gray to black on hover) */}
              {Icon && (
                <div
                  className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 transition-colors duration-120 ${
                    isDanger
                      ? isHovered ? 'bg-[var(--danger)] text-white' : 'bg-rose-50 text-[var(--danger)]'
                      : isHovered
                      ? 'bg-[#0B0F0D] text-white'
                      : 'bg-[var(--paper-2)] text-[var(--ink)]'
                  }`}
                >
                  {React.isValidElement(Icon) ? Icon : Icon ? <Icon className="w-[18px] h-[18px]" /> : null}
                </div>
              )}

              {/* Text label */}
              <div className="truncate">
                <span className={`font-sans text-xs font-semibold uppercase tracking-wider block truncate ${
                  isDanger ? 'text-[var(--danger)]' : 'text-[var(--ink)]'
                }`}>
                  {item.label}
                </span>
                {item.subtitle && (
                  <span className="text-[10px] text-[var(--ink-3)] block truncate font-sans">
                    {item.subtitle}
                  </span>
                )}
              </div>
            </div>

            {/* Sliding arrow */}
            <motion.div
              initial={false}
              animate={{
                opacity: isHovered ? 1 : 0,
                x: isHovered ? 0 : -4,
              }}
              transition={{ duration: 0.15 }}
              className={`shrink-0 pr-1 ${isDanger ? 'text-[var(--danger)]' : 'text-[var(--ink)]'}`}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.div>
          </button>
        );
      })}

      {/* Optional Full-width Bottom Button */}
      {bottomButton && (
        <div className="pt-1.5 px-0.5">
          <button
            type="button"
            onClick={bottomButton.onClick}
            className="w-full h-11 rounded-[10px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)] text-[var(--ink)] font-mono text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 transition-all duration-150 shadow-xs hover:shadow-[0_0_15px_var(--accent-glow)] cursor-pointer"
          >
            {bottomButton.icon && <bottomButton.icon className="w-4 h-4" />}
            <span>{bottomButton.label}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default MenuPanel;

