import {
  ShieldAlert, UserPlus, Users, FileText,
  Settings, DollarSign, Activity, SlidersHorizontal
} from 'lucide-react';

export const superMenuItems = [
  { path: '/superadmin', label: 'Ringkasan Sistem', icon: Activity, exact: true },
  { path: '/superadmin/admin', label: 'Akun Pengelola', icon: UserPlus },
  { path: '/superadmin/pengguna', label: 'Semua Pengguna', icon: Users },
  { path: '/superadmin/aktivitas', label: 'Log Audit Aktivitas', icon: FileText },
  { path: '/superadmin/lapangan', label: 'Kelola Data Lapangan', icon: DollarSign },
  { path: '/superadmin/laporan', label: 'Laporan Keuangan', icon: SlidersHorizontal },
  { path: '/superadmin/pengaturan', label: 'Pengaturan Sistem', icon: Settings },
];