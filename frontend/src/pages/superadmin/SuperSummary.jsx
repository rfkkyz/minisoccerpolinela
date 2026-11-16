import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { superMenuItems } from './superMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatRupiah, formatDateIndo } from '../../utils/format';
import { 
  Activity, ShieldCheck, Users, DollarSign, 
  Database, Server, Lock, ArrowRight, UserPlus, SlidersHorizontal,
  FileText, Settings, Sparkles, CheckCircle2
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';

export function SuperSummary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.superadmin.getSummary()
      .then((res) => {
        const payload = res.data?.data || res.data;
        if (payload) setSummary(payload);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = summary?.stats || summary?.data?.stats || summary || {};

  return (
    <DashboardLayout
      role="superadmin"
      menuItems={superMenuItems}
    >
      <PageHeader
        title="Konsol Super Administrator"
        highlightWord="Super Administrator"
        subtitle="Otoritas tertinggi sistem: manajemen hak akses admin, tarif sewa lapangan, dan pengawasan audit sistem"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'SUPER ADMIN' }
        ]}
        actions={
          <Button
            variant="accent"
            size="md"
            icon={<UserPlus className="w-4 h-4" />}
            onClick={() => navigate('/superadmin/admin')}
          >
            Kelola Admin
          </Button>
        }
      />

      <div className="-mt-6 space-y-8 pb-12">
        {/* System Health Card (Clean Frosted Glass - No Collisions/No Floating Squares!) */}
        <div className="bg-white/95 backdrop-blur-md rounded-[22px] sm:rounded-[28px] p-4 sm:p-8 border border-emerald-500/20 shadow-[0_8px_30px_rgba(14,42,32,0.06)] space-y-4 sm:space-y-6 relative overflow-hidden">
          
          {/* Top Subtle Emerald Gradient Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#12A150] via-teal-400 to-[#0A803E]" />

          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#0B7A3B] text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wide mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12A150]" />
                <span>Kesehatan Sistem Terpusat</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold font-zen text-[var(--ink)] tracking-tight">
                Status Operasional: Prima &amp; Terlindungi
              </h2>
            </div>
            
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-emerald-50/80 border border-emerald-300 text-[#0B7A3B] font-sans text-[10px] sm:text-xs font-bold shadow-xs self-start sm:self-auto">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#12A150] animate-pulse" />
              <span>SERVER &amp; CRON BERJALAN NORMAL</span>
            </div>
          </div>

          {/* 4 Clean Modern Metric Boxes: 2x2 grid on mobile! */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 pt-1 sm:pt-2">
            
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-2.5 sm:gap-3.5 hover:border-emerald-300 transition-colors">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-100 text-[#12A150] flex items-center justify-center shrink-0 shadow-xs">
                <Database className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="text-slate-400 font-sans font-bold text-[9px] sm:text-[10px] uppercase tracking-wider truncate">DATABASE ENGINE</div>
                <div className="font-sans font-bold text-xs sm:text-sm text-[var(--ink)] truncate">MariaDB InnoDB</div>
              </div>
            </div>

            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-2.5 sm:gap-3.5 hover:border-emerald-300 transition-colors">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-100 text-[#12A150] flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="text-slate-400 font-sans font-bold text-[9px] sm:text-[10px] uppercase tracking-wider truncate">SISTEM RESERVASI</div>
                <div className="font-sans font-bold text-xs sm:text-sm text-[var(--ink)] truncate">Anti-Bentrok Terlindungi</div>
              </div>
            </div>

            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-2.5 sm:gap-3.5 hover:border-emerald-300 transition-colors">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
                <Server className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="text-slate-400 font-sans font-bold text-[9px] sm:text-[10px] uppercase tracking-wider truncate">BACKEND SERVICE</div>
                <div className="font-sans font-bold text-xs sm:text-sm text-[var(--ink)] truncate">Express • Node.js</div>
              </div>
            </div>

            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-2.5 sm:gap-3.5 hover:border-emerald-300 transition-colors">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <div className="text-slate-400 font-sans font-bold text-[9px] sm:text-[10px] uppercase tracking-wider truncate">ZONA WAKTU SISTEM</div>
                <div className="font-sans font-bold text-xs sm:text-sm text-[var(--ink)] truncate">Asia/Jakarta (WIB)</div>
              </div>
            </div>

          </div>
        </div>

        {/* 4 Modern Stat Cards: 2x2 grid on mobile! */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <StatCard
            title="TOTAL PENDAPATAN"
            value={stats.revenue_this_month ?? stats.total_revenue ?? 0}
            isCurrency
            icon={DollarSign}
            subtitle="Akumulasi penerimaan resmi"
          />

          <StatCard
            title="TOTAL RESERVASI"
            value={stats.bookings_this_month ?? stats.total_bookings ?? 0}
            icon={Activity}
            subtitle="Keseluruhan sewa lapangan"
          />

          <StatCard
            title="TOTAL PENGGUNA"
            value={stats.total_users ?? 0}
            icon={Users}
            subtitle="Mahasiswa, karyawan & umum"
          />

          <StatCard
            title="ADMIN AKTIF"
            value={stats.active_admins ?? stats.total_admins ?? 0}
            icon={ShieldCheck}
            subtitle="Pengawas operasional lapangan"
          />
        </div>

        {/* Quick Management Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
          
          <div
            onClick={() => navigate('/superadmin/lapangan')}
            className="p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] bg-white/95 backdrop-blur-md border border-emerald-500/15 shadow-[0_4px_20px_rgba(14,42,32,0.04)] hover:border-emerald-400 hover:shadow-[0_12px_30px_rgba(18,161,80,0.12)] hover:-translate-y-1 transition-all duration-200 cursor-pointer space-y-2 sm:space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 text-[#12A150] border border-emerald-200/80 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-[#12A150] group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="font-zen font-bold text-base sm:text-lg text-[var(--ink)] tracking-tight">
                Pengaturan Lapangan &amp; Tarif
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1 font-sans">
                Konfigurasi harga per jam 3 kategori (Umum, Mahasiswa, Karyawan) dan jadwal pemeliharaan.
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/superadmin/laporan')}
            className="p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] bg-white/95 backdrop-blur-md border border-emerald-500/15 shadow-[0_4px_20px_rgba(14,42,32,0.04)] hover:border-emerald-400 hover:shadow-[0_12px_30px_rgba(18,161,80,0.12)] hover:-translate-y-1 transition-all duration-200 cursor-pointer space-y-2 sm:space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <SlidersHorizontal className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="font-zen font-bold text-base sm:text-lg text-[var(--ink)] tracking-tight">
                Laporan Keuangan &amp; Audit
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1 font-sans">
                Unduh rekapitulasi transaksi sewa lapangan dalam format CSV / Excel untuk pembukuan BPU.
              </p>
            </div>
          </div>

          <div
            onClick={() => navigate('/superadmin/aktivitas')}
            className="p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] bg-white/95 backdrop-blur-md border border-emerald-500/15 shadow-[0_4px_20px_rgba(14,42,32,0.04)] hover:border-emerald-400 hover:shadow-[0_12px_30px_rgba(18,161,80,0.12)] hover:-translate-y-1 transition-all duration-200 cursor-pointer space-y-2 sm:space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-purple-700 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="font-zen font-bold text-base sm:text-lg text-[var(--ink)] tracking-tight">
                Log Audit Aktivitas Sistem
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1 font-sans">
                Pantau rekam jejak aksi verifikasi admin, pembatalan jadwal, dan perubahan konfigurasi sistem.
              </p>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

export default SuperSummary;