import React from 'react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { Hero } from '../components/Hero/Hero';
import { PricingCalculator } from '../components/Pricing/PricingCalculator';
import { ScheduleSection } from '../components/Schedule/ScheduleSection';
import { NewsSection } from '../components/News/NewsSection';
import { CtaSection } from '../components/Cta/CtaSection';

export default function LandingPage() {
  const handleScrollToSection = (targetId) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <PublicLayout>
      {/* 1. Unified Landing Panel: Hero + Strip + Solusi Carousels (#beranda & #tentang) */}
      <Hero
        onStartBuilding={() => handleScrollToSection('jadwal')}
        onReadDocs={() => handleScrollToSection('tarif')}
      />

      {/* 2. Section Tarif (#tarif) with Live Quote Estimator */}
      <PricingCalculator />

      {/* 3. Section Kalender Ketersediaan (#jadwal) */}
      <ScheduleSection />

      {/* 4. Section Berita, Pengumuman & Galeri (#berita) */}
      <NewsSection />

      {/* 5. Section CTA with 3D Soccer Ball */}
      <CtaSection />
    </PublicLayout>
  );
}
