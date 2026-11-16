import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Button from './Button';

export function ErrorState({
  title = 'Terjadi Kesalahan',
  message = 'Gagal memuat data. Silakan coba beberapa saat lagi.',
  onRetry,
  className = ''
}) {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-[20px] bg-[var(--surface)] border border-rose-200 shadow-sm flex flex-col items-center justify-center max-w-md mx-auto ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-[var(--danger)] flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 stroke-[1.75]" />
      </div>

      <h3 className="font-sans font-bold text-lg text-[var(--ink)]">
        {title}
      </h3>

      <p className="mt-1.5 text-xs sm:text-sm text-[var(--ink-2)] max-w-xs">
        {message}
      </p>

      {onRetry && (
        <div className="mt-6">
          <Button
            variant="secondary"
            size="md"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={onRetry}
          >
            Coba Lagi
          </Button>
        </div>
      )}
    </div>
  );
}

export default ErrorState;

