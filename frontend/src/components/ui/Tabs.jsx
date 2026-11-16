import React from 'react';

export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'light', // 'light' | 'dark'
  className = ''
}) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`inline-flex items-center p-1 rounded-full select-none ${
        isDark
          ? 'bg-black/50 border border-white/10 backdrop-blur-md'
          : 'bg-[var(--paper-2)] border border-[var(--line)] shadow-xs'
      } ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const tabId = typeof tab === 'string' ? tab : tab.id;
        const tabLabel = typeof tab === 'string' ? tab : tab.label;
        const tabIcon = typeof tab === 'object' ? tab.icon : null;
        const tabBadge = typeof tab === 'object' ? tab.badge : null;
        const isActive = activeTab === tabId;

        return (
          <button
            key={tabId}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tabId)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              isActive
                ? 'bg-[#3E5C4F] text-white shadow-sm font-semibold'
                : isDark
                ? 'text-white/60 hover:text-white hover:bg-white/5'
                : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-white/50'
            }`}
          >
            {tabIcon && <span className="shrink-0">{tabIcon}</span>}
            <span>{tabLabel}</span>
            {tabBadge !== undefined && tabBadge !== null && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isActive ? 'bg-white/20 text-white' : 'bg-[var(--line)] text-[var(--ink-2)]'
              }`}>
                {tabBadge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
