import { 
  LayoutDashboard, CalendarCheck, CalendarRange, 
  Newspaper, Users, UserCog, QrCode 
} from 'lucide-react';

export const adminMenuItems = [
  { path: '/admin', label: 'Ringkasan Admin', icon: LayoutDashboard, exact: true },
  { path: '/admin/scan', label: 'Scan Tiket Lapangan', icon: QrCode },
  { path: '/admin/reservasi', label: 'Kelola Reservasi', icon: CalendarCheck },
  { path: '/admin/jadwal', label: 'Jadwal & Blokir', icon: CalendarRange },
  { path: '/admin/berita', label: 'Berita & Galeri', icon: Newspaper },
  { path: '/admin/pengguna', label: 'Verifikasi Pengguna', icon: Users },
  { path: '/admin/profil', label: 'Profil Admin', icon: UserCog },
];

