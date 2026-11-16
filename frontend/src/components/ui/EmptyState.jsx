import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Belum Ada Data',
  description = 'Saat ini belum ada data yang dapat ditampilkan.',
  actionLabel,
  onAction,
  actionIcon,
  className = ''
}) {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-[20px] bg-[var(--surface)] border border-[var(--line)] flex flex-col items-center justify-center max-w-md mx-auto ${className}`}>
      {/* Icon Circle */}
      <div className="w-16 h-16 rounded-2xl bg-[var(--surface-tint)] border border-[var(--line-strong)] text-[var(--ink-2)] flex items-center justify-center mb-4 shadow-xs">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>

      <h3 className="font-sans font-bold text-lg text-[var(--ink)] tracking-tight">
        {title}
      </h3>

      <p className="mt-1.5 text-xs sm:text-sm text-[var(--ink-2)] max-w-xs leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-6">
          <Button
            variant="primary"
            size="md"
            icon={actionIcon}
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmptyState;

