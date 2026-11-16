import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function Countdown({
  targetDate,
  onExpire,
  className = '',
  label = 'Sisa Waktu:'
}) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!targetDate) return;

    const calculate = () => {
      const diff = Math.max(0, Math.floor((new Date(targetDate).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff === 0 && onExpire) {
        onExpire();
      }
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 60 && timeLeft > 0;

  return (
    <div
      aria-live="polite"
      className={`inline-flex items-center gap-2 font-mono px-3 py-1.5 rounded-lg border text-xs select-none ${
        isUrgent
          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      } ${className}`}
    >
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
      <span className="font-bold text-sm">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

export default Countdown;

