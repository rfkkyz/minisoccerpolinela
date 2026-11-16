import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MintBackdrop } from '../ui/MintBackdrop';
import { LogoMarquee } from './LogoMarquee';
import { GlassCarousel } from '../ui/GlassCarousel';
import { Button } from '../ui/Button';
import { content } from '../../data/content';
import {
  ArrowRight,
  Calendar,
  UserCheck,
  Lock,
  CreditCard,
  FileCheck,
  QrCode,
} from 'lucide-react';

/**
 * LandingPanel (Unified Hero + Facilities Marquee + Solusi Carousels)
 * Single continuous mint grid backdrop spanning from the top hero zone
 * through the facilities strip down to the two full-bleed glass carousels.
 * Fully responsive, AA WCAG compliant, zero separate box wrappers.
 */
export function LandingPanel({ onStartBuilding, onReadDocs }) {
  const { badge, headline, subheading, ctaPrimary, ctaSecondary } = content.hero;
  const { steps } = content.about;

  // Prepare Step Carousel items (6 Langkah Lengkap: Cek -> Daftar -> Kunci -> Bayar -> E-Tiket -> Scan)
  const stepIcons = [Calendar, UserCheck, Lock, CreditCard, FileCheck, QrCode];
  const stepItems = useMemo(() => {
    return (steps || []).map((step, idx) => ({
      ...step,
      ornamentIcon: stepIcons[idx] || QrCode,
    }));
  }, [steps]);

  return (
    <section
      id="beranda"
      className="landing-panel relative mx-2 sm:mx-3 mt-1.5 sm:mt-2 rounded-[20px] sm:rounded-[28px] overflow-hidden select-none border border-[rgba(255,255,255,0.75)] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_18px_50px_rgba(14,42,32,0.10)] scroll-mt-24 flex flex-col"
    >
      {/* 1. Single Continuous Mint Grid Backdrop for the ENTIRE Panel with field photo under grid */}
      <MintBackdrop
        variant="landing"
        tone="b"
        beams="top"
        photo="/images/hero-field.jpg"
        photoOpacity={0.35}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* 2. Hero Zone: Centered Modern Content */}
      <div className="hero-zone relative z-10 w-full min-h-[clamp(320px,calc(100vh-280px),520px)] flex flex-col justify-center pt-6 sm:pt-14 pb-6 sm:pb-10">
        <div className="max-w-4xl sm:max-w-5xl mx-auto px-3.5 sm:px-6 text-center space-y-4 sm:space-y-6 my-auto">
          
          {/* Label Badge Chip */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/85 border border-[#12A150]/30 text-[#0B7A3B] font-sans font-semibold text-[10px] sm:text-xs tracking-wide uppercase shadow-xs backdrop-blur-md"
          >
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#12A150] animate-pulse shrink-0" />
            <span>{badge}</span>
          </motion.div>

          {/* Main H1 Headline with Zen Dots modern techno typography */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-zen text-2xl sm:text-4xl lg:text-[54px] text-[#071F15] leading-snug sm:leading-[1.18] tracking-normal"
          >
            {headline.part1}{' '}
            <span className="bg-gradient-to-r from-[#0EA250] to-[#0A803E] bg-clip-text text-transparent block sm:inline">
              {headline.part2}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="font-sans text-xs sm:text-base lg:text-lg text-[#264435] font-medium max-w-[640px] mx-auto leading-relaxed"
          >
            {subheading}
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 pt-1 sm:pt-2"
          >
            <Button
              size="md"
              variant="primary"
              onClick={onStartBuilding}
              className="!rounded-full !px-5 sm:!px-8 !py-2.5 sm:!py-3.5 !bg-[#12A150] hover:!bg-[#0D8741] !text-white font-sans font-bold text-xs sm:text-sm tracking-wide shadow-[0_10px_25px_rgba(18,161,80,0.30)] hover:shadow-[0_14px_30px_rgba(18,161,80,0.40)] transition-all duration-200 border-none"
              iconRight={<ArrowRight className="w-4 h-4 text-white" />}
            >
              {ctaPrimary}
            </Button>

            <Button
              size="md"
              variant="secondary"
              className="!rounded-full !px-5 sm:!px-8 !py-2.5 sm:!py-3.5 !bg-white/80 hover:!bg-white !text-[#0E2A20] font-sans font-bold text-xs sm:text-sm tracking-wide !border-[rgba(255,255,255,0.9)] shadow-xs backdrop-blur-md hover:shadow-md transition-all duration-200"
              onClick={onReadDocs}
            >
              {ctaSecondary}
            </Button>
          </motion.div>

        </div>
      </div>

      {/* 3. Full-Bleed Facilities Marquee Strip */}
      <div className="relative z-10 w-full shrink-0">
        <LogoMarquee />
      </div>

      {/* 4. Solusi Zone (#tentang) directly on the same continuous mint backdrop */}
      <div id="tentang" className="solusi-zone relative z-10 w-full pt-10 sm:pt-14 pb-14 sm:pb-18 scroll-mt-24 space-y-8 sm:space-y-10">
        
        {/* Centered Solusi Header */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 text-center space-y-3.5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/85 border border-[#12A150]/30 text-[#0B7A3B] font-sans font-semibold text-xs tracking-wide uppercase shadow-xs backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#12A150] shrink-0" />
            <span>Alur &amp; Keandalan Sistem</span>
          </div>

          <h2 className="font-zen text-3xl sm:text-4xl lg:text-[46px] font-bold tracking-tight text-[#071F15] leading-[1.12]">
            Solusi Reservasi Digital <br />
            <span className="bg-gradient-to-r from-[#0EA250] to-[#0A803E] bg-clip-text text-transparent font-bold">
              Bebas Bentrok &amp; Transparan
            </span>
          </h2>

          <p className="font-sans text-sm sm:text-base text-[#2E4B3E] max-w-[560px] mx-auto leading-relaxed font-normal">
            Sistem reservasi terpadu Mini Soccer Politeknik Negeri Lampung dirancang dengan teknologi penjadwalan presisi tanpa antrean fisik.
          </p>
        </div>

        {/* 4A. Carousel 1: Alur Lengkap Reservasi Lapangan */}
        <div className="w-full space-y-6">
          {/* Label Baris 1 in Container */}
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[rgba(18,161,80,0.18)]">
              <span className="w-1.5 h-4 rounded-full bg-[#12A150] shrink-0" />
              <span className="font-sans font-bold text-xs uppercase tracking-wider text-[#1F4131]">
                Alur Lengkap Reservasi Lapangan
              </span>
            </div>
          </div>

          {/* Full-Bleed Bare GlassCarousel 1 */}
          <GlassCarousel
            bare={true}
            items={stepItems}
            direction="forward"
            initialIndex={0}
            cardVariant="step"
            ariaLabel="Alur Lengkap Reservasi Lapangan"
          />
        </div>

      </div>
    </section>
  );
}

export const Hero = LandingPanel;
export default LandingPanel;
