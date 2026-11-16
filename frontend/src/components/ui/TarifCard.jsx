import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  BadgeCheck,
} from 'lucide-react';

const TIER_META = {
  umum: {
    tier: 'umum',
    name: 'Tarif Umum',
    title: 'Umum',
    subtitle: 'Masyarakat & Komunitas',
    desc: 'Untuk masyarakat umum dan komunitas olahraga tanpa verifikasi berkas kampus.',
    docChip: 'Tanpa Dokumen',
    docIcon: CheckCircle2,
    docBadgeClass: 'bg-slate-100/90 text-slate-700 border-slate-200',
    icon: Users,
    accentGradient: 'from-slate-400 via-emerald-400 to-[#12A150]',
    ctaText: 'Pesan Tarif Umum',
  },
  mahasiswa: {
    tier: 'mahasiswa',
    name: 'Tarif Mahasiswa',
    title: 'Mahasiswa',
    subtitle: 'Mahasiswa Aktif Polinela',
    desc: 'Untuk mahasiswa aktif Politeknik Negeri Lampung dengan verifikasi KTM.',
    docChip: 'Wajib KTM Aktif',
    docIcon: FileCheck,
    docBadgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: GraduationCap,
    accentGradient: 'from-[#12A150] via-[#22C55E] to-[#0A803E]',
    ctaText: 'Pesan Tarif Mahasiswa',
  },
  karyawan: {
    tier: 'karyawan',
    name: 'Tarif Karyawan',
    title: 'Karyawan',
    subtitle: 'Dosen & Tenaga Kependidikan',
    desc: 'Untuk dosen dan karyawan/staf di lingkungan Politeknik Negeri Lampung.',
    docChip: 'Wajib ID Card / KTA',
    docIcon: BadgeCheck,
    docBadgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    icon: Briefcase,
    accentGradient: 'from-teal-500 via-emerald-500 to-[#0A803E]',
    ctaText: 'Pesan Tarif Karyawan',
  },
};

export function TarifCard({
  tier = 'umum',
  price = 150000,
  isUserCategory = false,
  isMaintenance = false,
  onSelect,
  index = 0,
  className = '',
}) {
  const meta = TIER_META[tier] || TIER_META.umum;
  const Icon = meta.icon;
  const DocIcon = meta.docIcon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: isMaintenance ? 0 : -8, transition: { duration: 0.25, ease: 'easeOut' } }}
      whileTap={{ scale: isMaintenance ? 1 : 0.985 }}
      className={`group relative flex flex-col justify-between rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-7 bg-white/95 backdrop-blur-md transition-all duration-300 ${
        isUserCategory
          ? 'border-2 border-[#12A150] shadow-[0_12px_32px_rgba(18,161,80,0.16)] ring-3 ring-[#12A150]/10'
          : 'border border-[rgba(18,161,80,0.16)] shadow-[0_4px_20px_rgba(14,42,32,0.05)] hover:border-[#12A150]/60 hover:shadow-[0_16px_36px_rgba(18,161,80,0.12)]'
      } ${isMaintenance ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      {/* 1. Sleek Top Accent Gradient Line */}
      <div
        className={`absolute top-0 inset-x-0 h-1 sm:h-1.5 rounded-t-[18px] sm:rounded-t-[24px] bg-gradient-to-r ${meta.accentGradient} opacity-90 transition-opacity duration-300 group-hover:opacity-100`}
      />

      {/* 2. Top Zone: Icon + Document Requirement Pill */}
      <div>
        <div className="flex items-center justify-between gap-2.5 pt-0.5 sm:pt-1">
          <div className="flex items-center gap-2.5">
            {/* Animated Icon Box */}
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[16px] bg-gradient-to-br from-emerald-50 to-emerald-100/70 border border-emerald-200/70 text-[#12A150] flex items-center justify-center shadow-xs group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-md transition-all duration-300">
              <Icon className="w-4 h-4 sm:w-6 sm:h-6 stroke-[1.85]" />
            </div>

            {/* Title visible beside icon on mobile for ultra-compactness */}
            <div className="sm:hidden">
              <h3 className="font-zen font-bold text-base text-[var(--ink)] tracking-tight leading-none">
                {meta.title}
              </h3>
            </div>
          </div>

          {/* Document Requirement Pill */}
          <span
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-sans font-semibold border ${meta.docBadgeClass} shadow-xs transition-colors shrink-0`}
          >
            <DocIcon className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
            <span>{meta.docChip}</span>
          </span>
        </div>

        {/* 3. Tier Title & Description (Desktop: below icon, Mobile: concise description) */}
        <div className="mt-2 sm:mt-5">
          <h3 className="hidden sm:block font-zen font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
            {meta.title}
          </h3>
          <p className="text-[11px] sm:text-[13px] text-[var(--ink-2)] mt-0.5 sm:mt-1.5 leading-relaxed min-h-0 sm:min-h-[36px] line-clamp-2">
            {meta.desc}
          </p>
        </div>

        {/* 4. Modern Price Box */}
        <div className="mt-2.5 sm:mt-5 p-2.5 sm:p-4 rounded-xl sm:rounded-[18px] bg-gradient-to-br from-[var(--paper-2)]/80 to-emerald-50/50 border border-[var(--line)] group-hover:border-emerald-200/80 transition-colors duration-200">
          <div className="text-[9px] sm:text-[10px] font-sans font-bold uppercase tracking-wider text-[var(--ink-3)] mb-0.5 sm:mb-1">
            Tarif Resmi Sewa Lapangan
          </div>
          <div className="flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-xs sm:text-base font-bold text-[var(--ink-2)]">Rp</span>
            <span className="font-sans font-extrabold text-xl sm:text-[38px] text-[var(--ink)] tabular-nums tracking-tight">
              {Number(price).toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-[var(--ink-3)]">/ jam</span>
          </div>
          <div className="mt-1 sm:mt-1.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#0B7A3B] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#12A150]" />
            <span>DP 50% mulai Rp {(Math.round(Number(price) * 0.5)).toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>

      {/* 5. Action CTA Button */}
      <div className="pt-2.5 sm:pt-6 mt-2.5 sm:mt-6 border-t border-[var(--line)]/60">
        <button
          type="button"
          onClick={() => onSelect && onSelect(tier)}
          disabled={isMaintenance}
          className="group/btn w-full h-9 sm:h-12 rounded-xl sm:rounded-[14px] font-sans font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer bg-white hover:bg-[#12A150] text-[#0E2A20] hover:text-white border-2 border-slate-200 hover:border-[#12A150] shadow-xs hover:shadow-[0_10px_24px_rgba(18,161,80,0.22)] active:scale-[0.98]"
        >
          <span>{meta.ctaText}</span>
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#12A150] group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all duration-200" />
        </button>
      </div>
    </motion.div>
  );
}

export default TarifCard;
