import { useState, useEffect } from 'react';

export function useCountUp(targetValue, duration = 400) {
  const [displayValue, setDisplayValue] = useState(targetValue);

  useEffect(() => {
    const startValue = displayValue;
    const diff = targetValue - startValue;
    if (diff === 0) return;

    let startTime = null;
    let animationFrame;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * ease;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    animationFrame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrame);
  }, [targetValue, duration]);

  return displayValue;
}

