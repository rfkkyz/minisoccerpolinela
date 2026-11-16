import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MintBackdrop } from '../ui/MintBackdrop';

export function PageHeader({
  title,
  highlightWord, // word in title to highlight in green
  subtitle,
  breadcrumbs = [], // [{ label, path }]
  actions = null,   // JSX button(s) on the right
  className = ''
}) {
  // If highlightWord is provided, split title or format
  const renderTitle = () => {
    if (!highlightWord || !title.includes(highlightWord)) {
      return title;
    }
    const parts = title.split(highlightWord);
    return (
      <>
        {parts[0]}
        <span className="text-[var(--accent-heading)] font-extrabold">
          {highlightWord}
        </span>
        {parts[1]}
      </>
    );
  };

  return (
    <div className={`relative rounded-[18px] sm:rounded-[24px] overflow-hidden mb-5 sm:mb-8 select-none border border-[var(--glass-border)] shadow-[var(--shadow-glass)] ${className}`}>
      {/* Mint band background */}
      <MintBackdrop variant="band" tone="a" className="min-h-[110px] sm:min-h-[160px] p-4 sm:p-7 flex flex-col justify-between">
        {/* Top: Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-[10px] sm:text-xs font-sans font-semibold tracking-wide uppercase text-[var(--ink-3)] mb-2 sm:mb-3">
            {breadcrumbs.map((bc, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={idx}>
                  {bc.path && !isLast ? (
                    <Link
                      to={bc.path}
                      className="hover:text-[var(--accent-text)] transition-colors"
                    >
                      {bc.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'text-[var(--accent-text)] font-bold' : ''}>
                      {bc.label}
                    </span>
                  )}
                  {!isLast && <ChevronRight className="w-3 h-3 text-[var(--ink-3)]/40 shrink-0" />}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        {/* Bottom / Main Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mt-auto">
          <div>
            <h1 className="font-zen font-bold text-xl sm:text-3xl lg:text-4xl text-[var(--ink)] tracking-tight">
              {renderTitle()}
            </h1>
            {subtitle && (
              <p className="mt-1 sm:mt-1.5 text-[11px] sm:text-sm text-[var(--ink-2)] max-w-xl font-normal leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Action buttons on the right */}
          {actions && (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-start sm:self-auto">
              {actions}
            </div>
          )}
        </div>
      </MintBackdrop>
    </div>
  );
}

export default PageHeader;
