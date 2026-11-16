import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Menu, Bell, ChevronDown, User, LogOut, LayoutDashboard, 
  CalendarPlus, Ticket, History, ShieldCheck, Sparkles, 
  CheckCheck, Clock, ExternalLink, Calendar
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Chip } from '../ui/Chip';
import { useClickOutside } from '../../hooks/useClickOutside';

export function DashboardTopbar({
  user,
  role = 'user',
  onOpenMobileSidebar,
  onLogout
}) {
  const navigate = useNavigate();
  const location = useLocation();

  // Dropdown states
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Unread notifications count
  const [unreadCount, setUnreadCount] = useState(2);

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  useClickOutside(dropdownRef, () => setUserDropdownOpen(false));
  useClickOutside(notifRef, () => setNotifOpen(false));

  const userName = user?.full_name || user?.name || user?.username || 'Pengguna';
  const userCategory = user?.category || role || 'umum';

  // Sample real-time notifications
  const notifications = [
    {
      id: 1,
      title: 'Proteksi Jadwal Aktif',
      desc: 'Sistem anti-bentrok aktif memastikan slot yang Anda pilih terlindungi saat transaksi.',
      time: 'Baru saja',
      unread: unreadCount > 0,
      icon: Clock,
      color: 'bg-emerald-50 text-[#12A150] border-emerald-200'
    },
    {
      id: 2,
      title: 'Verifikasi Akun Sivitas',
      desc: userCategory === 'mahasiswa' 
        ? 'KTM Mahasiswa Anda telah terdaftar. Nikmati tarif khusus Rp 100.000/jam.'
        : 'Akun Anda aktif dan siap melakukan reservasi lapangan online.',
      time: '1 jam lalu',
      unread: unreadCount > 1,
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-[#12A150] border-emerald-200'
    },
    {
      id: 3,
      title: 'Fasilitas Lampu Sorot Malam',
      desc: 'Pertandingan sesi malam (18:00 - 24:00 WIB) bebas biaya tambahan lampu penerangan arena.',
      time: 'Hari ini',
      unread: false,
      icon: Sparkles,
      color: 'bg-teal-50 text-teal-600 border-teal-200'
    }
  ];

  const handleMarkAllRead = () => {
    setUnreadCount(0);
  };

  return (
    <header className="sticky top-4 z-40 mb-6 select-none">
      {/* Floating Pill Container (Height 56px) */}
      <div className="h-14 bg-white/95 backdrop-blur-md rounded-[20px] border border-slate-200/90 shadow-sm px-4 sm:px-6 flex items-center justify-between gap-4">
        
        {/* Left: Hamburger (mobile) + System Status */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 text-slate-500 hover:text-[var(--ink)] hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Location Badge / Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-sans text-slate-600">
            <span className="w-2 h-2 rounded-full bg-[#12A150] animate-pulse shrink-0" />
            <span className="font-bold text-[var(--ink)] uppercase tracking-wider text-[11px]">
              SISTEM RESERVASI RESMI POLINELA
            </span>
          </div>
        </div>

        {/* Right: Notifications & User Avatar Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* 1. NOTIFICATION BELL WITH INTERACTIVE FLYOUT */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen(!notifOpen);
                setUserDropdownOpen(false);
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                notifOpen 
                  ? 'bg-emerald-50 text-[#12A150] border border-emerald-300' 
                  : 'text-slate-600 hover:text-[var(--ink)] hover:bg-slate-100 border border-transparent'
              }`}
              title="Notifikasi"
              aria-label="Lihat Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#12A150] ring-2 ring-white animate-pulse" />
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2.5 w-[320px] sm:w-[360px] bg-white/95 backdrop-blur-md rounded-[24px] border border-emerald-500/20 shadow-[0_20px_50px_rgba(14,42,32,0.14)] z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-sm text-[var(--ink)]">Notifikasi</span>
                    {unreadCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#0B7A3B] font-sans font-bold text-[10px]">
                        {unreadCount} Baru
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-sans">Semua dibaca</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-sans font-semibold text-[#12A150] hover:text-[#0B7A3B] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Tandai dibaca</span>
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl transition-colors border ${
                          n.unread 
                            ? 'bg-emerald-50/40 border-emerald-200/80 shadow-xs' 
                            : 'bg-slate-50/60 border-slate-100'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${n.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-sans font-bold text-xs text-[var(--ink)] truncate">
                                {n.title}
                              </span>
                              <span className="text-[10px] text-slate-400 shrink-0 font-sans">
                                {n.time}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {n.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/dashboard/booking');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-[#12A150] text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Pesan Lapangan Sekarang</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-5 w-[1px] bg-slate-200" />

          {/* 2. USER PROFILE DROPDOWN PILL */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
                setNotifOpen(false);
              }}
              className={`flex items-center gap-2.5 p-1 sm:pr-3 rounded-full transition-all cursor-pointer border ${
                userDropdownOpen
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'hover:bg-slate-50 border-transparent'
              }`}
              title="Menu Pengguna"
              aria-label="Buka Menu Pengguna"
            >
              <Avatar
                name={userName}
                size="sm"
                online={true}
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-sans font-bold text-[var(--ink)] leading-tight truncate max-w-[130px]">
                  {userName}
                </div>
                <div className="text-[11px] font-sans font-medium text-slate-500 capitalize">
                  {userCategory}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-[#12A150]' : ''}`} />
            </button>

            {/* User Dropdown Menu Panel */}
            {userDropdownOpen && (
              <div className="absolute right-0 top-full mt-2.5 w-[280px] sm:w-[300px] bg-white/95 backdrop-blur-md rounded-[24px] border border-emerald-500/20 shadow-[0_20px_50px_rgba(14,42,32,0.14)] z-50 p-2.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                
                {/* User Info Header Card */}
                <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 mb-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      name={userName}
                      size="md"
                      online={true}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-sans font-bold text-sm text-[var(--ink)] truncate">
                        {userName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate font-sans">
                        {user?.email || 'user@polinela.ac.id'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] font-sans font-bold uppercase text-slate-400">Kategori:</span>
                    <Chip tier={userCategory} size="sm" />
                  </div>
                </div>

                {/* Navigation Links */}
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    if (role === 'superadmin') navigate('/superadmin');
                    else if (role === 'admin') navigate('/admin');
                    else navigate('/dashboard');
                  }}
                  className="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors hover:bg-emerald-50 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#12A150] text-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <LayoutDashboard className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-sans font-bold text-[var(--ink)]">Dashboard Utama</div>
                    <div className="text-[10px] font-sans text-slate-400">Ringkasan status akun</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate('/dashboard/booking');
                  }}
                  className="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors hover:bg-emerald-50 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#12A150] text-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <CalendarPlus className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-sans font-bold text-[var(--ink)]">Pesan Lapangan Baru</div>
                    <div className="text-[10px] font-sans text-slate-400">Pilih kalender &amp; reservasi online</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate('/dashboard/bookings');
                  }}
                  className="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors hover:bg-emerald-50 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#12A150] text-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-sans font-bold text-[var(--ink)]">Pesanan &amp; E-Tiket</div>
                    <div className="text-[10px] font-sans text-slate-400">Jadwal aktif &amp; bukti bayar</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate('/dashboard/profil');
                  }}
                  className="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors hover:bg-emerald-50 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-[#12A150] text-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-sans font-bold text-[var(--ink)]">Profil &amp; Identitas</div>
                    <div className="text-[10px] font-sans text-slate-400">KTM / KTA &amp; data kontak</div>
                  </div>
                </button>

                <div className="border-t border-slate-100 my-1" />

                {/* Logout Action */}
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors hover:bg-rose-50 group cursor-pointer text-rose-600"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-sans font-bold">Keluar Akun</div>
                    <div className="text-[10px] font-sans text-rose-400">Akhiri sesi login</div>
                  </div>
                </button>

              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

export default DashboardTopbar;