import { 
  LayoutDashboard, CalendarPlus, CalendarCheck, 
  History, UserCheck 
} from 'lucide-react';

export const userMenuItems = [
  { path: '/dashboard', label: 'Ringkasan User', icon: LayoutDashboard, exact: true },
  { path: '/dashboard/booking', label: 'Pesan Lapangan', icon: CalendarPlus },
  { path: '/dashboard/bookings', label: 'Pesanan Aktif', icon: CalendarCheck },
  { path: '/dashboard/riwayat', label: 'Riwayat Transaksi', icon: History },
  { path: '/dashboard/profil', label: 'Profil & Identitas', icon: UserCheck },
];

