import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './GlassCard';

/**
 * NavArrowButton
 * Premium glassmorphic arrow button with:
 * - Geometric modern SVG arrow (strokeWidth 2.5)
 * - Spring scale on tap (scale: 0.88)
 * - Hover elevation & transition to vibrant emerald gradient
 * - Dynamic arrow shoot animation on press (direction-aware)
 * - Inner luminous ripple ring flash
 */
function NavArrowButton({ direction = 'next', onClick, ariaLabel }) {
  const [isClicked, setIsClicked] = useState(false);
  const isNext = direction === 'next';

  const handleClick = (e) => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 450);
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      whileHover={{ scale: 1.08, y: -2 }}
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 450, damping: 24 }}
      className={`relative group w-12 h-12 sm:w-14 sm:h-14 rounded-[18px] flex items-center justify-center cursor-pointer select-none overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12A150] focus-visible:ring-offset-2 border ${
        isClicked
          ? 'bg-gradient-to-br from-[#12A150] to-[#0A803E] text-white border-transparent shadow-[0_0_0_3px_rgba(18,161,80,0.35),0_14px_30px_rgba(18,161,80,0.45)]'
          : 'bg-white/80 hover:bg-gradient-to-br hover:from-[#12A150] hover:to-[#0A803E] text-[#0B7A3B] hover:text-white border-white/90 shadow-[0_8px_20px_rgba(14,42,32,0.08),0_1px_0_rgba(255,255,255,0.95)_inset] hover:shadow-[0_12px_28px_rgba(18,161,80,0.35)]'
      }`}
      style={{
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      {/* Click ripple flash */}
      <AnimatePresence>
        {isClicked && (
          <motion.span
            initial={{ scale: 0.2, opacity: 0.7 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 rounded-[18px] bg-white/45"
          />
        )}
      </AnimatePresence>

      {/* Top-glass subtle reflection */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-[18px] opacity-70 group-hover:opacity-30 transition-opacity" />

      {/* Animated Arrow Icon */}
      <motion.div
        animate={
          isClicked
            ? { x: isNext ? [0, 8, -2, 0] : [0, -8, 2, 0] }
            : {}
        }
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`relative z-10 transition-transform duration-200 ${
          isNext ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'
        }`}
      >
        {isNext ? (
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-xs"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-xs"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        )}
      </motion.div>
    </motion.button>
  );
}

/**
 * GlassCarousel
 * Reusable full-bleed glass card carousel with Embla, Autoplay,
 * center-card magnification, edge masks, interactive 52x52 glass control buttons,
 * dynamic slide counter (01 / 04), and smooth animated progress bar.
 */
export function GlassCarousel({
  items = [],
  direction = 'forward', // 'forward' | 'backward'
  initialIndex = 0,
  ariaLabel = 'Carousel',
  cardVariant = 'step',  // 'step' | 'security'
  bare = true,
  className = '',
}) {
  const originalLength = items.length;

  // Visual duplication if slide count is too small for smooth infinite loop (< 6 slides)
  const slides = useMemo(() => {
    if (items.length === 0) return [];
    if (items.length >= 6) {
      return items.map((item, idx) => ({ ...item, originalIndex: idx, isClone: false }));
    }
    const multiplier = Math.ceil(6 / items.length);
    const result = [];
    for (let m = 0; m < multiplier; m++) {
      items.forEach((item, idx) => {
        result.push({
          ...item,
          originalIndex: idx,
          isClone: m > 0,
          uniqueKey: `${m}-${idx}-${item.title || item.num}`,
        });
      });
    }
    return result;
  }, [items]);

  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Autoplay Plugin configuration
  const autoplayRef = useRef(
    Autoplay({
      delay: 4500,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  const plugins = prefersReducedMotion ? [] : [autoplayRef.current];

  // Embla hook
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'center',
      containScroll: false,
      dragFree: false,
      skipSnaps: false,
      duration: 28,
      startIndex: initialIndex,
    },
    plugins
  );

  // Sync selected index
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setProgress(0);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  // Backward autoplay for second carousel
  useEffect(() => {
    if (!emblaApi || prefersReducedMotion || direction !== 'backward') return;

    const interval = setInterval(() => {
      if (!isHovered && emblaApi) {
        emblaApi.scrollPrev();
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [emblaApi, prefersReducedMotion, direction, isHovered]);

  // Progress bar animation timer (4500ms)
  useEffect(() => {
    if (prefersReducedMotion || isHovered) return;

    const step = 50;
    const total = 4500;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + (step / total) * 100;
      });
    }, step);

    return () => clearInterval(interval);
  }, [prefersReducedMotion, isHovered, selectedIndex]);

  // Controls navigation with 6-second pause on user interaction
  const scrollPrev = useCallback(() => {
    if (!emblaApi) return;
    if (direction === 'backward') {
      emblaApi.scrollNext();
    } else {
      emblaApi.scrollPrev();
    }
    if (autoplayRef.current?.stop) {
      autoplayRef.current.stop();
      setTimeout(() => {
        if (autoplayRef.current?.play) autoplayRef.current.play();
      }, 6000);
    }
    setProgress(0);
  }, [emblaApi, direction]);

  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    if (direction === 'backward') {
      emblaApi.scrollPrev();
    } else {
      emblaApi.scrollNext();
    }
    if (autoplayRef.current?.stop) {
      autoplayRef.current.stop();
      setTimeout(() => {
        if (autoplayRef.current?.play) autoplayRef.current.play();
      }, 6000);
    }
    setProgress(0);
  }, [emblaApi, direction]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext]
  );

  // Active item calculation (original index 0..N-1)
  const activeOriginalIndex =
    originalLength > 0 ? selectedIndex % originalLength : 0;
  const counterText = `${String(activeOriginalIndex + 1).padStart(2, '0')} / ${String(
    originalLength
  ).padStart(2, '0')}`;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full focus:outline-none select-none ${className}`}
      tabIndex={0}
    >
      {/* 1. Carousel Viewport: full panel width, 3% mask fade on edges */}
      <div
        className="w-full overflow-hidden py-4 sm:py-6 cursor-grab active:cursor-grabbing"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)',
        }}
        ref={emblaRef}
      >
        <div className="flex touch-pan-y">
          {slides.map((slide, index) => {
            const isActive = index === selectedIndex;
            const originalIdx = slide.originalIndex;

            return (
              <div
                key={slide.uniqueKey || `${index}-${slide.title}`}
                className="shrink-0 mr-4 sm:mr-8 w-[86vw] sm:w-[70vw] lg:w-[clamp(300px,46vw,720px)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex"
                style={{
                  transform: isActive ? 'scale(1)' : 'scale(0.95)',
                  opacity: isActive ? 1 : 0.85,
                }}
                role="group"
                aria-roledescription="slide"
                aria-label={`${originalIdx + 1} dari ${originalLength}`}
                aria-hidden={slide.isClone ? 'true' : undefined}
                tabIndex={slide.isClone ? -1 : 0}
                onFocus={() => emblaApi && emblaApi.scrollTo(index)}
                onClick={() => {
                  if (!isActive && emblaApi) {
                    emblaApi.scrollTo(index);
                  }
                }}
              >
                <GlassCard
                  number={cardVariant === 'step' ? slide.num : undefined}
                  icon={cardVariant === 'security' ? slide.iconComp : undefined}
                  label={
                    cardVariant === 'step'
                      ? `LANGKAH ${originalIdx + 1}`
                      : 'KEAMANAN SISTEM'
                  }
                  title={slide.title}
                  body={slide.desc}
                  footerLabel={
                    cardVariant === 'step'
                      ? 'SISTEM POLISOCCER'
                      : 'POLISOCCER SECURITY'
                  }
                  footerSub={
                    cardVariant === 'step'
                      ? `Langkah ${originalIdx + 1} dari ${originalLength}`
                      : `Fitur ${originalIdx + 1} dari ${originalLength}`
                  }
                  ornamentIcon={slide.ornamentIcon}
                  isActive={isActive}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Control Block Below Carousel: Centered Arrows on Top, Progress & Counter Centered Below */}
      <div className="mt-7 sm:mt-9 flex flex-col items-center justify-center gap-4">
        
        {/* Top: Two Modern Glass Arrow Control Buttons Centered */}
        <div className="flex items-center justify-center gap-3.5">
          <NavArrowButton
            direction="prev"
            onClick={scrollPrev}
            ariaLabel="Langkah Sebelumnya"
          />
          <NavArrowButton
            direction="next"
            onClick={scrollNext}
            ariaLabel="Langkah Berikutnya"
          />
        </div>

        {/* Bottom: Progress Indicator & Live Counter Centered Directly Below the Arrows */}
        <div className="flex items-center justify-center gap-3.5 px-3 py-1 rounded-full bg-white/40 border border-white/60 backdrop-blur-sm shadow-xs">
          {/* Progress Bar (120x3px): Track #CAEBD9, Fill #12A150 */}
          <div className="w-[110px] sm:w-[130px] h-[3px] rounded-full bg-[#CAEBD9] overflow-hidden">
            <div
              className="h-full bg-[#12A150] transition-all duration-75 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Counter "01 / 06": Mono #2A4D3B */}
          <div
            className="font-mono text-xs font-bold text-[#2A4D3B] tracking-widest pl-1"
            aria-live="polite"
          >
            {counterText}
          </div>
        </div>

      </div>
    </div>
  );
}

export default GlassCarousel;
