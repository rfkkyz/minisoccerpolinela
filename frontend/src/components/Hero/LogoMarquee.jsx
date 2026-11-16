import React from 'react';
import { content } from '../../data/content';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export function LogoMarquee() {
  const items = content.hero.facilitiesMarquee || content.hero.logos || [];
  const reducedMotion = useReducedMotion();

  // Duplicate for seamless infinite loop
  const displayItems = [...items, ...items, ...items];

  return (
    <div
      className="relative w-full overflow-hidden select-none h-11 sm:h-12 flex items-center bg-white/55 backdrop-blur-[10px] border-t border-b border-[rgba(18,161,80,0.18)]"
      style={{
        maskImage:
          'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}
    >
      <div
        className={`flex items-center gap-8 sm:gap-12 whitespace-nowrap group hover:[animation-play-state:paused] ${
          reducedMotion ? 'overflow-x-auto scrollbar-none' : 'animate-marquee'
        }`}
        style={{
          width: reducedMotion ? '100%' : 'max-content',
        }}
      >
        {displayItems.map((name, i) => (
          <div
            key={`${name}-${i}`}
            className="flex items-center gap-2.5 text-[#3F5E50] hover:text-[#0E2A20] transition-colors duration-150 cursor-pointer shrink-0"
          >
            <span className="w-1.5 h-1.5 rounded-[2px] bg-[#12A150] shrink-0" />
            <span className="font-mono text-[11px] font-semibold tracking-wider uppercase">
              {name}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-marquee {
          animation: marquee 32s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default LogoMarquee;
