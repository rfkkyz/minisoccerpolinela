import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { 
  Menu, X, ChevronDown, ChevronRight, 
  MapPin, Phone, Layers, CheckCircle2, User, LogOut, LayoutDashboard,
  Calendar, Clock, ShieldCheck, Sparkles, Newspaper
} from 'lucide-react';

export function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Scroll state
  const [scrolled, setScrolled] = useState(false);

  // Active section via scroll-spy
  const [activeSection, setActiveSection] = useState('');

  // Dropdowns state: 'tentang' | 'tarif' | 'jadwal' | 'berita' | 'booking' | 'user' | null
  const [activeDropdown, setActiveDropdown] = useState(null);
  const hoverTimeoutRef = useRef(null);
  const navRef = useRef(null);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Fields state for Tarif dropdown
  const [fields, setFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);

  // 1. Fetch fields for the Tarif dropdown on mount
  useEffect(() => {
    let isMounted = true;
    setFieldsLoading(true);
    apiClient.public.fields()
      .then((res) => {
        if (!isMounted) return;
        const list = Array.isArray(res.data) 
          ? res.data 
          : Array.isArray(res.data?.fields) 
            ? res.data.fields 
            : [];
        setFields(list);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setFieldsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  // 2. Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Scroll-spy
  useEffect(() => {
    if (location.pathname !== '/') {
      setActiveSection('');
      return;
    }

    const sectionIds = ['tentang', 'tarif', 'jadwal', 'berita'];
    const observers = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(id);
            }
          });
        },
        { rootMargin: '-20% 0px -70% 0px' }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [location.pathname]);

  // Close dropdowns on route change
  useEffect(() => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Navigation click handler
  const handleNavClick = (target, e) => {
    if (e) e.preventDefault();
    setActiveDropdown(null);
    setMobileMenuOpen(false);

    if (target.startsWith('#')) {
      const targetId = target.slice(1);
      if (location.pathname !== '/') {
        navigate('/' + target);
      } else {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(target);
    }
  };

  // Hover-intent for dropdowns
  const handleMouseEnter = (name) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(name);
    }, 60);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 100);
  };

  const isItemActive = (id, path) => {
    if (path) return location.pathname === path;
    if (location.pathname === '/' && activeSection === id) return true;
    return false;
  };

  const bookingTargetUrl = user ? '/dashboard/booking' : '/#jadwal';

  return (
    <>
      {/* Skip to Content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-[#0E2A20] focus:text-white focus:rounded-md focus:text-xs"
      >
        Lewati ke konten
      </a>

      {/* Main Navbar Bar */}
      <header
        ref={navRef}
        className={`sticky top-0 z-[100] w-full transition-all duration-200 ease-out select-none ${
          scrolled
            ? 'h-[62px] bg-white/95 backdrop-blur-md border-b border-[#DCE8E0] shadow-[0_4px_20px_rgba(14,42,32,0.06)]'
            : 'h-[64px] lg:h-[68px] bg-white/90 backdrop-blur-md border-b border-black/[0.06]'
        }`}
      >
        <div className="max-w-[1440px] h-full mx-auto px-5 sm:px-8 flex items-center justify-between">
          
          {/* ======================================================== */}
          {/* LEFT GROUP: LOGO + ADJACENT NAVIGATION LINKS (Mistral)   */}
          {/* ======================================================== */}
          <div className="flex items-center gap-7 lg:gap-9">
            
            {/* Logo */}
            <Link
              to="/"
              onClick={(e) => {
                if (location.pathname === '/') {
                  e.preventDefault();
                  handleNavClick('#beranda');
                }
              }}
              aria-label="Polisoccer Beranda"
              className="inline-flex items-center gap-2.5 group cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#12A150] rounded-lg"
            >
              <div className="w-8 h-8 rounded-lg bg-white p-1 border border-[#DCE8E0] shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                <img src="/logo-polinela.png" alt="Logo Polinela" className="w-full h-full object-contain" />
              </div>
              <span className="font-extrabold text-[20px] lg:text-[22px] tracking-tight uppercase leading-none font-sans flex items-center">
                <span className="text-[#0E2A20]">POLI</span>
                <span className="text-[#12A150]">SOCCER</span>
              </span>
            </Link>

            {/* Navigation Links directly adjacent to Logo */}
            <nav
              aria-label="Navigasi Utama"
              className="hidden md:flex items-center gap-1 lg:gap-1.5"
            >
              {/* 1. TENTANG (with chevron) */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('tentang')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'tentang' ? null : 'tentang')}
                  className={`h-9 px-3 rounded-lg font-sans text-[14px] transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer ${
                    isItemActive('tentang') || activeDropdown === 'tentang'
                      ? 'font-semibold text-[#0E2A20] bg-black/[0.04]'
                      : 'font-medium text-[#2C3E35] hover:text-[#0E2A20] hover:bg-black/[0.03]'
                  }`}
                >
                  <span>Tentang</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === 'tentang' ? 'rotate-180 text-[#12A150]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Dropdown Panel "Tentang" */}
                <AnimatePresence>
                  {activeDropdown === 'tentang' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-[calc(100%+6px)] left-0 w-[340px] bg-white rounded-2xl p-2 border border-[#DCE8E0] shadow-[0_20px_50px_rgba(14,42,32,0.12)] z-50 space-y-1"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleNavClick('#tentang', e)}
                        className="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors hover:bg-[#F0F8F3] group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#E1ECE6] flex items-center justify-center text-[#0E2A20] group-hover:bg-[#12A150] group-hover:text-white transition-colors shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-[#0E2A20] leading-tight">Cara Kerja</div>
                          <div className="text-[12px] text-slate-500 truncate">Alur reservasi online bebas bentrok</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#12A150] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      <a
                        href="https://wa.me/628117200000?text=Halo%20Admin%20Polisoccer%2C%20saya%20ingin%20bertanya%20tentang%20reservasi%20lapangan"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setActiveDropdown(null)}
                        className="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors hover:bg-[#F0F8F3] group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#E1ECE6] flex items-center justify-center text-[#0E2A20] group-hover:bg-[#12A150] group-hover:text-white transition-colors shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-[#0E2A20] leading-tight">Kontak Admin</div>
                          <div className="text-[12px] text-slate-500 truncate">Layanan WhatsApp BPU Polinela</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#12A150] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>

                      <button
                        type="button"
                        onClick={(e) => handleNavClick('#tentang', e)}
                        className="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors hover:bg-[#F0F8F3] group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#E1ECE6] flex items-center justify-center text-[#0E2A20] group-hover:bg-[#12A150] group-hover:text-white transition-colors shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-[#0E2A20] leading-tight">Lokasi Lapangan</div>
                          <div className="text-[12px] text-slate-500 truncate">Kampus Politeknik Negeri Lampung</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#12A150] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. TARIF (with chevron) */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('tarif')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setActiveDropdown(activeDropdown === 'tarif' ? null : 'tarif')}
                  className={`h-9 px-3 rounded-lg font-sans text-[14px] transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer ${
                    isItemActive('tarif') || activeDropdown === 'tarif'
                      ? 'font-semibold text-[#0E2A20] bg-black/[0.04]'
                      : 'font-medium text-[#2C3E35] hover:text-[#0E2A20] hover:bg-black/[0.03]'
                  }`}
                >
                  <span>Tarif</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === 'tarif' ? 'rotate-180 text-[#12A150]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Dropdown Panel "Tarif" */}
                <AnimatePresence>
                  {activeDropdown === 'tarif' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-[calc(100%+6px)] left-0 w-[340px] bg-white rounded-2xl p-2 border border-[#DCE8E0] shadow-[0_20px_50px_rgba(14,42,32,0.12)] z-50 space-y-1"
                    >
                      {fieldsLoading ? (
                        <div className="p-3 space-y-2">
                          <div className="h-10 bg-slate-50 rounded-lg animate-pulse" />
                        </div>
                      ) : (
                        fields.slice(0, 3).map((f) => {
                          const lowestPrice = Math.min(
                            Number(f.price_mahasiswa || f.prices?.mahasiswa || 100000),
                            Number(f.price_karyawan || f.prices?.karyawan || 120000),
                            Number(f.price_umum || f.prices?.umum || 150000)
                          );
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={(e) => handleNavClick('#tarif', e)}
                              className="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors hover:bg-[#F0F8F3] group cursor-pointer"
                            >
                              <div className="w-9 h-9 rounded-lg bg-[#E1ECE6] flex items-center justify-center text-[#0E2A20] group-hover:bg-[#12A150] group-hover:text-white transition-colors shrink-0">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[14px] font-semibold text-[#0E2A20] leading-tight truncate">
                                  {f.name || f.nama}
                                </div>
                                <div className="text-[12px] text-slate-500 truncate">
                                  Mulai Rp{lowestPrice.toLocaleString('id-ID')} / jam
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-[#12A150] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          );
                        })
                      )}

                      <div className="pt-2 border-t border-slate-100 px-2 pb-1">
                        <button
                          type="button"
                          onClick={(e) => handleNavClick('#tarif', e)}
                          className="w-full text-left text-[12px] font-bold text-[#12A150] hover:text-[#0E2A20] flex items-center justify-between cursor-pointer py-1"
                        >
                          <span>Lihat Kalkulator Tarif Lengkap</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. JADWAL (with chevron indicator) */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('jadwal')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={(e) => handleNavClick('#jadwal', e)}
                  className={`h-9 px-3 rounded-lg font-sans text-[14px] transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer ${
                    isItemActive('jadwal') || activeDropdown === 'jadwal'
                      ? 'font-semibold text-[#0E2A20] bg-black/[0.04]'
                      : 'font-medium text-[#2C3E35] hover:text-[#0E2A20] hover:bg-black/[0.03]'
                  }`}
                >
                  <span>Jadwal</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === 'jadwal' ? 'rotate-180 text-[#12A150]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Dropdown Panel "Jadwal" */}
                <AnimatePresence>
                  {activeDropdown === 'jadwal' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-[calc(100%+6px)] left-0 w-[300px] bg-white rounded-2xl p-2 border border-[#DCE8E0] shadow-[0_20px_50px_rgba(14,42,32,0.12)] z-50 space-y-1"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleNavClick('#jadwal', e)}
                        className="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors hover:bg-[#F0F8F3] group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#E1ECE6] flex items-center justify-center text-[#0E2A20] group-hover:bg-[#12A150] group-hover:text-white transition-colors shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-[#0E2A20] leading-tight">Kalender Lapangan</div>
                          <div className="text-[12px] text-slate-500 truncate">Cek slot ketersediaan per jam</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#12A150] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      <div className="px-3 py-2 bg-emerald-50/60 rounded-xl flex items-center gap-2 text-xs text-[#0A803E] font-medium">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Operasional: 06:00 – 24:00 WIB</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. BERITA (with chevron indicator) */}
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('berita')}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  type="button"
                  onClick={(e) => handleNavClick('#berita', e)}
                  className={`h-9 px-3 rounded-lg font-sans text-[14px] transition-colors duration-150 inline-flex items-center gap-1.5 cursor-pointer ${
                    isItemActive('berita') || activeDropdown === 'berita'
                      ? 'font-semibold text-[#0E2A20] bg-black/[0.04]'
                      : 'font-medium text-[#2C3E35] hover:text-[#0E2A20] hover:bg-black/[0.03]'
                  }`}
                >
                  <span>Berita</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === 'berita' ? 'rotate-180 text-[#12A150]' : 'text-slate-400'
                    }`}
                  />
                </button>

                {/* Dropdown Panel "Berita" */}
                <AnimatePresence>
                  {activeDropdown === 'berita' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-[calc(100%+6px)] left-0 w-[300px] bg-white rounded-2xl p-2 border border-[#DCE8E0] shadow-[0_20px_50px_rgba(14,42,32,0.12)] z-50 space-y-1"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleNavClick('#berita', e)}
                        className="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors hover:bg-[#F0F8F3] group cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#E1ECE6] flex items-center justify-center text-[#0E2A20] group-hover:bg-[#12A150] group-hover:text-white transition-colors shrink-0">
                          <Newspaper className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-semibold text-[#0E2A20] leading-tight">Pengumuman & Liputan</div>
                          <div className="text-[12px] text-slate-500 truncate">Kabar kegiatan & turnamen</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#12A150] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 5. CEK TIKET (Direct link) */}
              <Link
                to="/cek-tiket"
                className={`h-9 px-3 rounded-lg font-sans text-[14px] transition-colors duration-150 inline-flex items-center cursor-pointer ${
                  isItemActive('', '/cek-tiket')
                    ? 'font-semibold text-[#0E2A20] bg-black/[0.04]'
                    : 'font-medium text-[#2C3E35] hover:text-[#0E2A20] hover:bg-black/[0.03]'
                }`}
              >
                Cek Tiket
              </Link>
            </nav>

          </div>

          {/* ======================================================== */}
          {/* RIGHT GROUP: ACTION BUTTONS (Mistral: Button > & Button v) */}
          {/* ======================================================== */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {!user ? (
              <>
                {/* Button 1: Masuk > (Clean rectangular with right chevron) */}
                <Link
                  to="/login"
                  className="group hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 lg:px-4 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] text-[#0E2A20] font-sans font-medium text-xs lg:text-[13px] border border-black/[0.08] transition-all duration-150 cursor-pointer"
                >
                  <span>Masuk</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#0E2A20] group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {/* Button 2: Booking Sekarang v (Clean dark button with down chevron) */}
                <div
                  className="relative hidden sm:block"
                  onMouseEnter={() => handleMouseEnter('booking')}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    onClick={(e) => handleNavClick('#jadwal', e)}
                    className="group inline-flex items-center gap-2 h-9 px-3.5 lg:px-4 rounded-lg bg-[#0E2A20] hover:bg-[#12A150] text-white font-sans font-medium text-xs lg:text-[13px] shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer"
                  >
                    <span>Booking Lapangan</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-white/80 transition-transform duration-200 ${
                        activeDropdown === 'booking' ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Booking Quick Dropdown */}
                  <AnimatePresence>
                    {activeDropdown === 'booking' && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-[calc(100%+6px)] right-0 w-[260px] bg-white rounded-2xl p-2 border border-[#DCE8E0] shadow-[0_20px_50px_rgba(14,42,32,0.12)] z-50 space-y-1"
                      >
                        <button
                          type="button"
                          onClick={(e) => handleNavClick('#jadwal', e)}
                          className="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors hover:bg-[#F0F8F3] group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#12A150] flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-[#0E2A20]">Pesan Jadwal Sekarang</div>
                            <div className="text-[11px] text-slate-500">Reservasi resmi anti-bentrok</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleNavClick('#tarif', e)}
                          className="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors hover:bg-[#F0F8F3] group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-[#0E2A20]">Cek Tarif Kategori</div>
                            <div className="text-[11px] text-slate-500">Umum, Mhs & Karyawan</div>
                          </div>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                {/* User is logged in: Dashboard Button > */}
                <button
                  type="button"
                  onClick={() => {
                    if (user.role === 'superadmin') navigate('/superadmin');
                    else if (user.role === 'admin') navigate('/admin');
                    else navigate('/dashboard');
                  }}
                  className="group hidden sm:inline-flex items-center gap-1.5 h-9 px-3.5 lg:px-4 rounded-lg bg-black/[0.04] hover:bg-black/[0.08] text-[#0E2A20] font-sans font-medium text-xs lg:text-[13px] border border-black/[0.08] transition-all duration-150 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#12A150]" />
                  <span>Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* User Dropdown Button v */}
                <div
                  className="relative hidden sm:block"
                  onMouseEnter={() => handleMouseEnter('user')}
                  onMouseLeave={handleMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                    className="h-9 px-3 rounded-lg bg-[#0E2A20] hover:bg-[#12A150] text-white flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-[10px] uppercase">
                      {(user.full_name || user.username || 'U').slice(0, 2)}
                    </div>
                    <span className="font-sans text-[13px] font-medium max-w-[90px] truncate">
                      {user.full_name?.split(' ')[0] || user.username}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/80" />
                  </button>

                  <AnimatePresence>
                    {activeDropdown === 'user' && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-[calc(100%+6px)] right-0 w-[190px] bg-white rounded-2xl p-2 border border-[#DCE8E0] shadow-[0_20px_50px_rgba(14,42,32,0.12)] z-50 space-y-1"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdown(null);
                            if (user.role === 'superadmin') navigate('/superadmin');
                            else if (user.role === 'admin') navigate('/admin');
                            else navigate('/dashboard');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F0F8F3] text-[13px] font-medium text-[#0E2A20] flex items-center gap-2"
                        >
                          <LayoutDashboard className="w-4 h-4 text-[#12A150]" />
                          <span>Dashboard</span>
                        </button>
                        {user.role === 'admin' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdown(null);
                              navigate('/admin/reservasi');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F0F8F3] text-[13px] font-medium text-[#0E2A20] flex items-center gap-2"
                          >
                            <Calendar className="w-4 h-4 text-[#12A150]" />
                            <span>Kelola Reservasi</span>
                          </button>
                        ) : user.role === 'superadmin' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdown(null);
                              navigate('/superadmin/lapangan');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F0F8F3] text-[13px] font-medium text-[#0E2A20] flex items-center gap-2"
                          >
                            <Calendar className="w-4 h-4 text-[#12A150]" />
                            <span>Kelola Lapangan</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDropdown(null);
                              navigate('/dashboard/booking');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F0F8F3] text-[13px] font-medium text-[#0E2A20] flex items-center gap-2"
                          >
                            <Calendar className="w-4 h-4 text-[#12A150]" />
                            <span>Booking Baru</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdown(null);
                            if (user.role === 'superadmin') navigate('/superadmin');
                            else if (user.role === 'admin') navigate('/admin/profil');
                            else navigate('/dashboard/profil');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F0F8F3] text-[13px] font-medium text-[#0E2A20] flex items-center gap-2"
                        >
                          <User className="w-4 h-4 text-[#12A150]" />
                          <span>Profil Saya</span>
                        </button>
                        <div className="border-t border-[#DCE8E0] my-1" />
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdown(null);
                            logout();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-[13px] font-medium text-rose-600 flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>Keluar</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
              className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-[#0E2A20] hover:bg-black/[0.04] transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* ======================================================== */}
      {/* MOBILE MENU SHEET                                        */}
      {/* ======================================================== */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[64px] z-50 bg-white border-b border-[#DCE8E0] shadow-xl p-5 md:hidden space-y-4 max-h-[calc(100vh-80px)] overflow-y-auto"
          >
            <div className="space-y-1">
              <button
                type="button"
                onClick={(e) => handleNavClick('#tentang', e)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[#0E2A20] hover:bg-[#F0F8F3]"
              >
                Tentang
              </button>
              <button
                type="button"
                onClick={(e) => handleNavClick('#tarif', e)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[#0E2A20] hover:bg-[#F0F8F3]"
              >
                Tarif Lapangan
              </button>
              <button
                type="button"
                onClick={(e) => handleNavClick('#jadwal', e)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[#0E2A20] hover:bg-[#F0F8F3]"
              >
                Jadwal Lapangan
              </button>
              <button
                type="button"
                onClick={(e) => handleNavClick('#berita', e)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-[#0E2A20] hover:bg-[#F0F8F3]"
              >
                Berita & Kegiatan
              </button>
              <Link
                to="/cek-tiket"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-[#0E2A20] hover:bg-[#F0F8F3]"
              >
                Cek Status Tiket
              </Link>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              {!user ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0E2A20] font-sans font-semibold text-sm flex items-center justify-center gap-1.5"
                  >
                    <span>Masuk</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleNavClick('#jadwal', e)}
                    className="w-full h-10 rounded-lg bg-[#0E2A20] hover:bg-[#12A150] text-white font-sans font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <span>Booking Lapangan</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (user.role === 'superadmin') navigate('/superadmin');
                      else if (user.role === 'admin') navigate('/admin');
                      else navigate('/dashboard');
                    }}
                    className="w-full h-10 rounded-lg bg-[#0E2A20] text-white font-sans font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <span>Buka Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full h-10 rounded-lg bg-rose-50 text-rose-600 font-sans font-semibold text-sm flex items-center justify-center"
                  >
                    Keluar
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PublicNavbar;
