import React, { useRef, useEffect, useMemo } from 'react';

/**
 * MintBackdrop
 * Single unified background component for Polisoccer.
 * Supports variants:
 *  - 'landing': unified continuous background for Hero + Marquee + Solusi carousels
 *  - 'hero': standalone hero card
 *  - 'section': general sections (Pricing, Schedule, News)
 *  - 'band': narrow banner/marquee strip
 *  - 'panel': generic glass panel
 *  - 'footer': footer section
 */

// 22 stable pseudo-random coordinates distributed along full panel height
const FLOATING_SQUARES = [
  { top: '4%', left: '12%', size: 12, delay: 1.2, duration: 3.2, opacity: 0.65 },
  { top: '7%', left: '88%', size: 10, delay: 2.1, duration: 2.8, opacity: 0.5 },
  { top: '12%', left: '32%', size: 13, delay: 0.5, duration: 3.5, opacity: 0.75 },
  { top: '16%', left: '68%', size: 11, delay: 3.0, duration: 4.0, opacity: 0.4 },
  { top: '22%', left: '8%', size: 14, delay: 1.8, duration: 3.0, opacity: 0.6 },
  { top: '27%', left: '84%', size: 10, delay: 2.5, duration: 2.5, opacity: 0.55 },
  { top: '34%', left: '18%', size: 12, delay: 0.8, duration: 3.8, opacity: 0.7 },
  { top: '38%', left: '92%', size: 13, delay: 3.4, duration: 3.2, opacity: 0.45 },
  { top: '44%', left: '14%', size: 11, delay: 1.5, duration: 2.9, opacity: 0.6 },
  { top: '48%', left: '76%', size: 12, delay: 2.8, duration: 3.6, opacity: 0.65 },
  { top: '54%', left: '38%', size: 10, delay: 0.4, duration: 3.1, opacity: 0.5 },
  { top: '58%', left: '88%', size: 13, delay: 2.2, duration: 2.7, opacity: 0.75 },
  { top: '64%', left: '6%', size: 14, delay: 1.9, duration: 4.2, opacity: 0.55 },
  { top: '69%', left: '72%', size: 11, delay: 3.1, duration: 3.4, opacity: 0.6 },
  { top: '74%', left: '26%', size: 13, delay: 0.9, duration: 2.6, opacity: 0.7 },
  { top: '78%', left: '90%', size: 10, delay: 2.4, duration: 3.7, opacity: 0.45 },
  { top: '83%', left: '15%', size: 12, delay: 1.6, duration: 3.3, opacity: 0.65 },
  { top: '87%', left: '58%', size: 14, delay: 2.7, duration: 2.8, opacity: 0.6 },
  { top: '91%', left: '32%', size: 10, delay: 0.7, duration: 3.9, opacity: 0.5 },
  { top: '94%', left: '80%', size: 13, delay: 3.3, duration: 3.5, opacity: 0.7 },
  { top: '49%', left: '46%', size: 11, delay: 1.1, duration: 3.6, opacity: 0.5 },
  { top: '24%', left: '50%', size: 12, delay: 2.9, duration: 3.3, opacity: 0.6 },
];

export function MintBackdrop({
  variant = 'landing', // 'landing' | 'hero' | 'section' | 'band' | 'panel' | 'footer'
  tone = 'a',          // 'a' | 'b'
  beams = 'top',       // 'top' | 'none' | boolean
  photo = null,        // optional background photo overlay
  photoOpacity = 0.32,
  className = '',
  children,
  ...props
}) {
  const containerRef = useRef(null);
  const rafRef = useRef(null);

  // Check prefers-reduced-motion
  const isReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || isReducedMotion) return;

    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    let targetX = -1000;
    let targetY = -1000;

    const handleMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(() => {
          if (el) {
            el.style.setProperty('--mx', `${targetX}px`);
            el.style.setProperty('--my', `${targetY}px`);
          }
          rafRef.current = null;
        });
      }
    };

    const handleMouseLeave = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (el) {
        el.style.setProperty('--mx', '-1000px');
        el.style.setProperty('--my', '-1000px');
      }
    };

    el.addEventListener('mousemove', handleMouseMove, { passive: true });
    el.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isReducedMotion]);

  // Base gradients
  const baseGradient = useMemo(() => {
    if (variant === 'landing' || tone === 'b') {
      return 'linear-gradient(180deg, #D6EFE2 0%, #CBE9D8 45%, #C0E6D1 100%)';
    }
    return 'linear-gradient(180deg, #E1F4E9 0%, #D6F0E1 45%, #CAEBD9 100%)';
  }, [variant, tone]);

  const showBeams = beams === 'top' || beams === true || variant === 'hero';
  const showSquares = Boolean(props.squares || variant === 'landing');
  const showVignette = variant === 'hero';

  const isAbsolute = className.includes('absolute');

  return (
    <div
      ref={containerRef}
      className={`${isAbsolute ? 'absolute inset-0' : 'relative w-full'} overflow-hidden select-none ${className}`}
      style={{
        background: baseGradient,
        '--mx': '-1000px',
        '--my': '-1000px',
        ...(isAbsolute ? { position: 'absolute', inset: 0, width: '100%', height: '100%' } : {}),
        ...props.style,
      }}
      {...props}
    >
      {/* 0. Ambient Field Photo Layer with Smooth Gradient Dissolve */}
      {photo && (
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-[600px] sm:h-[700px] overflow-hidden z-0"
          style={{
            maskImage:
              'linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.80) 40%, rgba(0,0,0,0.25) 80%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.80) 40%, rgba(0,0,0,0.25) 80%, transparent 100%)',
          }}
        >
          <img
            src={photo}
            onError={(e) => {
              e.currentTarget.src =
                'https://static.wixstatic.com/media/6ba8d9_99fdd688d17546ff913d926fb1d820ea~mv2.jpg';
            }}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-[center_55%] filter contrast-110 saturate-125"
            style={{ opacity: photoOpacity }}
          />
          {/* Mint ambient wash overlay to blend seamlessly with the grid theme */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(214, 239, 226, 0.40) 0%, rgba(203, 233, 216, 0.65) 60%, rgba(192, 230, 209, 0.95) 100%)',
            }}
          />
        </div>
      )}

      {/* 1. Grid Layer: 56px cells + 224px major grid with radial mask */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-80"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(18, 161, 80, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(18, 161, 80, 0.12) 1px, transparent 1px),
            linear-gradient(to right, rgba(18, 161, 80, 0.20) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(18, 161, 80, 0.20) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px, 56px 56px, 224px 224px, 224px 224px',
          maskImage: variant === 'landing'
            ? 'linear-gradient(180deg, #000 0%, #000 95%, transparent 100%)'
            : 'radial-gradient(ellipse 90% 90% at 50% 50%, #000 65%, transparent 100%)',
          WebkitMaskImage: variant === 'landing'
            ? 'linear-gradient(180deg, #000 0%, #000 95%, transparent 100%)'
            : 'radial-gradient(ellipse 90% 90% at 50% 50%, #000 65%, transparent 100%)',
        }}
      />

      {/* 3. Cursor Spotlight Layer: highlights grid lines within 180px */}
      {!isReducedMotion && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(18, 161, 80, 0.30) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(18, 161, 80, 0.30) 1px, transparent 1px)
            `,
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(circle 180px at var(--mx) var(--my), #000 0%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle 180px at var(--mx) var(--my), #000 0%, transparent 100%)',
          }}
        />
      )}

      {/* 4. Diagonal Light Beams (-35deg, drift 14s, restricted to top ~800px) */}
      {showBeams && !isReducedMotion && (
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[820px] overflow-hidden z-0">
          {/* Main green-edged beam */}
          <div
            className="absolute -top-24 -left-16 w-[640px] h-36 blur-[36px] opacity-70 animate-drift"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.85) 40%, rgba(124,255,178,0.45) 70%, transparent 100%)',
              boxShadow: '0 0 80px rgba(124,255,178,0.40)',
              transform: 'rotate(-35deg)',
            }}
          />
          {/* Secondary soft white beam */}
          <div
            className="absolute top-1/3 -right-20 w-[540px] h-28 blur-[40px] opacity-55 animate-drift-reverse"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.9) 50%, transparent 100%)',
              transform: 'rotate(-35deg)',
            }}
          />
        </div>
      )}

      {/* 5. Twinkling Floating Green Squares (20-22 distributed, 8 on mobile) */}
      {showSquares && (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {FLOATING_SQUARES.slice(0, variant === 'band' ? 8 : 22).map((sq, i) => (
            <div
              key={i}
              className={`absolute rounded-[3px] ${isReducedMotion ? '' : 'animate-square-pulse'} ${
                i >= 8 ? 'hidden sm:block' : ''
              }`}
              style={{
                top: sq.top,
                left: sq.left,
                width: `${sq.size}px`,
                height: `${sq.size}px`,
                backgroundColor: 'rgba(124, 255, 178, 0.55)',
                border: '1px solid #12A150',
                opacity: sq.opacity,
                animationDelay: `${sq.delay}s`,
                animationDuration: `${sq.duration}s`,
                boxShadow: '0 0 8px rgba(18, 161, 80, 0.25)',
              }}
            />
          ))}
        </div>
      )}

      {/* 6. Soft White Vignette at edges */}
      {showVignette && (
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 62%, rgba(255, 255, 255, 0.30) 100%)',
          }}
        />
      )}

      {/* Children Content Layer */}
      {children && (
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes drift {
          0%, 100% {
            transform: rotate(-35deg) translate(0px, 0px);
          }
          50% {
            transform: rotate(-35deg) translate(40px, -20px);
          }
        }
        @keyframes driftReverse {
          0%, 100% {
            transform: rotate(-35deg) translate(0px, 0px);
          }
          50% {
            transform: rotate(-35deg) translate(-35px, 25px);
          }
        }
        @keyframes squarePulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.25);
            opacity: 0.85;
          }
        }
        .animate-drift {
          animation: drift 14s ease-in-out infinite;
        }
        .animate-drift-reverse {
          animation: driftReverse 16s ease-in-out infinite;
        }
        .animate-square-pulse {
          animation: squarePulse 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default MintBackdrop;
