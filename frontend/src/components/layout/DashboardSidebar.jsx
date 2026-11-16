import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, History, Users, 
  HelpCircle, LogOut, X, ExternalLink, ShieldAlert,
  UserPlus, FileText, Settings, DollarSign, Activity,
  SlidersHorizontal, CalendarRange, Newspaper, UserCog, CalendarCheck, User, QrCode
} from 'lucide-react';

export function DashboardSidebar({ isOpen, onClose, role = 'user', onLogout, menuItems: propMenuItems }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Role metadata
  const roleConfig = {
    user: { label: 'Pengguna', badgeClass: 'bg-[var(--accent-soft)] text-[var(--accent-text)] border-[var(--accent-strong)]/30' },
    admin: { label: 'Admin', badgeClass: 'bg-emerald-50 text-[var(--accent-strong)] border-emerald-300' },
    superadmin: { label: 'Super Admin', badgeClass: 'bg-purple-50 text-purple-700 border-purple-300' },
  };
  const roleMeta = roleConfig[role] || roleConfig.user;

  // Role-specific navigation items (fallback if propMenuItems is empty)
  const menuConfig = {
    user: [
      { label: 'Ringkasan User', path: '/dashboard', icon: LayoutDashboard, exact: true },
      { label: 'Pesan Lapangan', path: '/dashboard/booking', icon: Calendar },
      { label: 'Pesanan Aktif', path: '/dashboard/bookings', icon: CalendarCheck },
      { label: 'Riwayat Transaksi', path: '/dashboard/riwayat', icon: History },
      { label: 'Profil & Identitas', path: '/dashboard/profil', icon: User },
    ],
    admin: [
      { label: 'Ringkasan Admin', path: '/admin', icon: LayoutDashboard, exact: true },
      { label: 'Scan Tiket Lapangan', path: '/admin/scan', icon: QrCode },
      { label: 'Kelola Reservasi', path: '/admin/reservasi', icon: CalendarCheck },
      { label: 'Jadwal & Blokir', path: '/admin/jadwal', icon: CalendarRange },
      { label: 'Berita & Galeri', path: '/admin/berita', icon: Newspaper },
      { label: 'Verifikasi Pengguna', path: '/admin/pengguna', icon: Users },
      { label: 'Profil Admin', path: '/admin/profil', icon: UserCog },
    ],
    superadmin: [
      { label: 'Ringkasan Sistem', path: '/superadmin', icon: LayoutDashboard, exact: true },
      { label: 'Akun Pengelola', path: '/superadmin/admin', icon: UserPlus },
      { label: 'Semua Pengguna', path: '/superadmin/pengguna', icon: Users },
      { label: 'Log Audit Aktivitas', path: '/superadmin/aktivitas', icon: FileText },
      { label: 'Kelola Data Lapangan', path: '/superadmin/lapangan', icon: DollarSign },
      { label: 'Laporan Keuangan', path: '/superadmin/laporan', icon: SlidersHorizontal },
      { label: 'Pengaturan Sistem', path: '/superadmin/pengaturan', icon: Settings },
    ],
  };

  const menuItems = propMenuItems && propMenuItems.length > 0 ? propMenuItems : (menuConfig[role] || menuConfig.user);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[var(--scrim)] backdrop-blur-sm lg:hidden"
        />
      )}

      {/* 264px Mint/White Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[264px] bg-[var(--surface)] border-r border-[var(--line)] text-[var(--ink)] flex flex-col transition-transform duration-250 ease-out select-none lg:translate-x-0 shadow-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[var(--line)] shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            {/* Logo Icon */}
            <div className="w-10 h-10 rounded-[12px] bg-white border border-[var(--line)] p-1.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <img src="/logo-polinela.png" alt="POLINELA" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="font-sans text-sm font-extrabold tracking-tight text-[var(--ink)] flex items-center gap-1.5">
                <span className="text-[#0E2A20]">POLI</span>
                <span className="text-[#12A150]">SOCCER</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-sans tracking-wide px-2 py-0.5 rounded-full border uppercase font-bold ${roleMeta.badgeClass}`}>
                  {roleMeta.label}
                </span>
              </div>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden text-[var(--ink-2)] hover:text-[var(--ink)] p-1 rounded-lg transition-colors cursor-pointer"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3.5 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.exact ? location.pathname === item.path : (item.path !== '/dashboard' && item.path !== '/admin' && item.path !== '/superadmin' && location.pathname.startsWith(item.path)));
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => {
                  navigate(item.path);
                  if (onClose) onClose();
                }}
                className={`w-full h-11 px-3 rounded-[12px] flex items-center justify-between transition-all duration-150 cursor-pointer text-left relative group ${
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] font-semibold shadow-xs'
                    : 'text-[var(--ink-2)] hover:bg-[var(--surface-tint)] hover:text-[var(--ink)]'
                }`}
              >
                {/* Active Indicator Strip */}
                {isActive && (
                  <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--accent-strong)]" />
                )}

                <div className="flex items-center gap-3">
                  {/* 32x32 Icon Box */}
                  <div
                    className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-[var(--accent-strong)] text-white'
                        : 'bg-[var(--paper-2)] text-[var(--ink-2)] group-hover:bg-[var(--line)] group-hover:text-[var(--ink)]'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4 stroke-[2]" />}
                  </div>

                  <span className="font-sans text-[13px] font-semibold">
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-sans bg-[var(--accent-soft)] text-[var(--accent-text)] font-bold border border-[var(--accent-strong)]/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: WhatsApp Help & Logout */}
        <div className="p-4 border-t border-[var(--line)] space-y-2 shrink-0">
          {/* Help link */}
          <a
            href="https://wa.me/6282188997766?text=Halo%20Admin%20Polisoccer%2C%20saya%20butuh%20bantuan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-[10px] text-xs font-sans font-semibold text-[var(--ink-2)] hover:text-[var(--accent-text)] hover:bg-[var(--surface-tint)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[var(--accent-strong)]" />
              <span>Bantuan WhatsApp</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>

          {/* Logout button */}
          <button
            type="button"
            onClick={onLogout}
            className="w-full h-10 px-3 rounded-[10px] flex items-center gap-2 text-xs font-sans font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default DashboardSidebar;
