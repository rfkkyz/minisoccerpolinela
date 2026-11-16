import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Check, Sparkles } from 'lucide-react';

/**
 * GlassCard
 * Interactive ultrared-style glass card with frosted backdrop blur,
 * gradient tint, subtle top-left radial shine, 3D glass top-right ornament,
 * bottom-left 28px glass glyph with green check, and full tactile press animation:
 * - Water-ripple wave originating from exact click/tap point
 * - Framer Motion spring compression (whileTap)
 * - Luminous glass sheen sweep
 * - Emerald active border glow
 * - Playful 3D ornament icon wiggle & checkmark pulse
 */
export function GlassCard({
  number,
  icon: Icon,
  label,
  title,
  body,
  footerLabel = 'SISTEM POLISOCCER',
  footerSub = 'Langkah 1 dari 4',
  ornamentIcon: OrnamentIcon,
  isActive = false,
  className = '',
  onClick,
  ...props
}) {
  const [ripples, setRipples] = useState([]);
  const [isPressed, setIsPressed] = useState(false);
  const cardRef = useRef(null);

  const handlePointerDown = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();

    setRipples((prev) => [...prev.slice(-2), { id, x, y }]);
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 650);
  }, []);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: isActive ? -4 : -2 }}
      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
      className={`relative w-full h-full min-h-[200px] sm:min-h-[300px] p-4 sm:p-9 rounded-[18px] sm:rounded-[28px] flex flex-col justify-between overflow-hidden select-none cursor-pointer transition-shadow duration-300 ${
        isPressed
          ? 'shadow-[0_0_0_2px_#12A150,0_20px_50px_rgba(18,161,80,0.25)]'
          : isActive
          ? 'shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_18px_50px_rgba(14,42,32,0.12)]'
          : 'shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_10px_30px_rgba(14,42,32,0.06)]'
      } ${className}`}
      style={{
        background: isPressed
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(215, 247, 227, 0.90) 50%, rgba(182, 236, 206, 0.75) 100%)'
          : 'linear-gradient(135deg, rgba(250, 254, 251, 0.94) 0%, rgba(227, 248, 235, 0.85) 50%, rgba(192, 239, 213, 0.60) 100%)',
        backdropFilter: 'blur(14px) saturate(130%)',
        WebkitBackdropFilter: 'blur(14px) saturate(130%)',
        border: isPressed ? '1px solid #12A150' : '1px solid rgba(255, 255, 255, 0.75)',
        ...props.style,
      }}
      {...props}
    >
      {/* 1. Subtle Glass Radial Sheen at Top-Left */}
      <div
        className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, transparent 70%)',
        }}
      />

      {/* 2. Water-Ripple Expanding from Click Coordinate */}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.span
            key={r.id}
            initial={{ scale: 0, opacity: 0.65 }}
            animate={{ scale: 4.5, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full z-20"
            style={{
              left: r.x,
              top: r.y,
              background:
                'radial-gradient(circle, rgba(18, 161, 80, 0.40) 0%, rgba(124, 255, 178, 0.20) 45%, transparent 75%)',
            }}
          />
        ))}
      </AnimatePresence>

      {/* 3. Diagonal Light Sheen Sweep on Click */}
      <AnimatePresence>
        {isPressed && (
          <motion.div
            initial={{ x: '-100%', opacity: 0.7 }}
            animate={{ x: '250%', opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-0 z-20 w-3/4 h-full -skew-x-12"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.85) 50%, rgba(124, 255, 178, 0.45) 75%, transparent 100%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* 4. Top-Right 3D Glass Ornament (56px) with Playful Bounce on Click */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-10">
        <motion.div
          animate={
            isPressed
              ? { rotate: [0, -12, 12, -6, 6, 0], scale: [1, 1.2, 1] }
              : { rotate: 0, scale: 1 }
          }
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-[16px] bg-gradient-to-br from-white/95 to-[#DDF7E8]/85 border border-white/90 shadow-[0_8px_20px_rgba(14,42,32,0.08)] flex items-center justify-center text-[#12A150] transition-colors duration-200"
        >
          {OrnamentIcon ? (
            <OrnamentIcon className="w-6 h-6 stroke-[1.8]" />
          ) : number ? (
            <span className="font-mono font-bold text-lg sm:text-xl text-[#0B7A3B]">
              {number}
            </span>
          ) : (
            <Sparkles className="w-6 h-6 stroke-[1.8]" />
          )}
        </motion.div>
      </div>

      {/* 5. Card Header: Top-Left Chip / Icon & Label */}
      <div className="relative z-10 space-y-4 pr-14">
        <div className="flex items-center gap-3">
          {number ? (
            <motion.div
              animate={isPressed ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.4 }}
              className={`w-12 h-12 rounded-[14px] flex items-center justify-center font-mono font-bold text-base shadow-xs shrink-0 transition-colors duration-200 ${
                isPressed
                  ? 'bg-[#12A150] text-white border-transparent'
                  : 'bg-[#E1F4E9] border border-[#12A150]/20 text-[#0B7A3B]'
              }`}
            >
              {number}
            </motion.div>
          ) : Icon ? (
            <motion.div
              animate={isPressed ? { scale: [1, 1.15, 1] } : {}}
              transition={{ duration: 0.4 }}
              className={`w-12 h-12 rounded-[14px] flex items-center justify-center shadow-xs shrink-0 transition-colors duration-200 ${
                isPressed
                  ? 'bg-[#12A150] text-white border-transparent'
                  : 'bg-[#E1F4E9] border border-[#12A150]/20 text-[#12A150]'
              }`}
            >
              <Icon className="w-6 h-6 stroke-[1.75]" />
            </motion.div>
          ) : null}

          {label && (
            <span className="font-mono text-[11px] font-semibold text-[#5E7C6E] uppercase tracking-wider">
              {label}
            </span>
          )}
        </div>

        {/* Card Title: Zen Dots */}
        <h4 className="font-display font-bold text-lg sm:text-2xl lg:text-[28px] text-[#071F15] tracking-tight leading-snug">
          {title}
        </h4>

        {/* Card Body: Plus Jakarta Sans */}
        <p className="font-sans text-xs sm:text-[15px] lg:text-[16px] text-[#2F4E3F] leading-relaxed line-clamp-3 sm:line-clamp-4 font-normal">
          {body}
        </p>
      </div>

      {/* 6. Card Footer: Divider + Sistem Polisoccer + Step/Feature Subtitle + Check Circle */}
      <div className="relative z-10 mt-6 pt-4 border-t border-[rgba(18,161,80,0.18)] flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="font-sans font-bold text-[12px] uppercase tracking-[0.04em] text-[#071F15]">
            {footerLabel}
          </div>
          <div className="font-sans text-[13px] text-[#5E7C6E]">
            {footerSub}
          </div>
        </div>

        {/* Right Green Check Circle with Pulse on Click */}
        <motion.div
          animate={isPressed ? { scale: [1, 1.35, 1], rotate: [0, 15, -15, 0] } : {}}
          transition={{ duration: 0.45 }}
          className="flex items-center gap-1.5 text-[#12A150] shrink-0"
        >
          <CheckCircle2 className="w-5 h-5 text-[#12A150]" />
        </motion.div>
      </div>

      {/* 7. Bottom-Left Testimonial-Style Glass Glyph Mark (28px) with Green Check */}
      <motion.div
        animate={isPressed ? { scale: [1, 1.25, 1], y: [0, -3, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="pointer-events-none absolute bottom-3.5 left-4 w-7 h-7 rounded-[8px] border border-white/70 shadow-xs flex items-center justify-center select-none transition-colors duration-200"
        style={{
          background: isPressed
            ? 'linear-gradient(135deg, #12A150 0%, #0E8541 100%)'
            : 'linear-gradient(135deg, #FAFEFB 0%, #C0EFD5 100%)',
          opacity: 0.95,
        }}
        aria-hidden="true"
      >
        <Check className={`w-3.5 h-3.5 stroke-[2.5] ${isPressed ? 'text-white' : 'text-[#12A150]'}`} />
      </motion.div>
    </motion.div>
  );
}

export default GlassCard;
