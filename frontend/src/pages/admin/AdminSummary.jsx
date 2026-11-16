import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { adminMenuItems } from './adminMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatRupiah, formatDateIndo } from '../../utils/format';
import { 
  DollarSign, Calendar, Clock, AlertCircle, 
  ArrowRight, Users, CheckCircle2, ShieldCheck, Activity, Ticket 
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Chip } from '../../components/ui/Chip';
import { Table } from '../../components/ui/Table';
import { AreaChart } from '../../components/ui/Charts';
import { Button } from '../../components/ui/Button';

export function AdminSummary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiClient.admin.getSummary()
      .then((res) => {
        const payload = res.data?.data || res.data;
        if (payload) setSummary(payload);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = summary?.stats || summary?.data?.stats || summary || {};

  const chartData = summary?.chart_data || [
    { name: 'Sen', value: 600000 },
    { name: 'Sel', value: 800000 },
    { name: 'Rab', value: 400000 },
    { name: 'Kam', value: 1200000 },
    { name: 'Jum', value: 1000000 },
    { name: 'Sab', value: 2400000 },
    { name: 'Min', value: 2000000 },
  ];

  const columns = [
    {
      key: 'booking_code',
      label: 'KODE BOOKING',
      render: (_, row) => (
        <span className="font-mono font-bold text-xs text-[var(--accent-strong)]">
          {row.booking_code}
        </span>
      ),
    },
    {
      key: 'customer_name',
      label: 'PEMESAN',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-xs text-[var(--ink)]">{row.customer_name}</div>
          <div className="text-[10px] font-mono text-[var(--ink-3)]">{row.whatsapp}</div>
        </div>
      ),
    },
    {
      key: 'field_name',
      label: 'LAPANGAN',
      render: (_, row) => (
        <span className="text-xs font-medium text-[var(--ink)]">{row.field_name || 'Lapangan Utama'}</span>
      ),
    },
    {
      key: 'tariff_tier',
      label: 'KATEGORI',
      render: (_, row) => <Chip tier={row.tariff_tier || 'umum'} />,
    },
    {
      key: 'time',
      label: 'WAKTU',
      render: (_, row) => (
        <span className="text-xs font-mono text-[var(--ink-2)]">
          {row.start_time?.slice(0, 5)} - {row.end_time?.slice(0, 5)} WIB
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (_, row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <DashboardLayout
      role={user?.role === 'superadmin' ? 'superadmin' : 'admin'}
      menuItems={adminMenuItems}
    >
      <PageHeader
        title="Ringkasan Operasional Lapangan"
        highlightWord="Operasional"
        subtitle="Pantau pendapatan sewa, utilisasi slot jadwal, dan verifikasi harian"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'ADMINISTRATOR' }
        ]}
        actions={
          <Button
            variant="accent"
            size="md"
            icon={<Ticket className="w-4 h-4" />}
            onClick={() => navigate('/admin/reservasi')}
          >
            Kelola Reservasi
          </Button>
        }
      />

      <div className="-mt-6 space-y-8">
        {/* Action Required Banner */}
        {((summary?.stats?.need_confirmation || summary?.pending_proofs_count) > 0 || (summary?.pending_identities_count > 0)) && (
          <div className="p-4 sm:p-5 rounded-[20px] bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-xs font-mono uppercase block tracking-wider">
                  VERIFIKASI MENUNGGU TINDAKAN ADMIN
                </span>
                <span className="text-xs text-amber-700">
                  Ada {summary?.stats?.need_confirmation ?? summary?.pending_proofs_count ?? 0} bukti transfer menunggu verifikasi.
                </span>
              </div>
            </div>

            <Button
              variant="accent"
              size="sm"
              onClick={() => navigate('/admin/reservasi?status=pending_hold')}
            >
              Tinjau Pembayaran
            </Button>
          </div>
        )}

        {/* 4 Stat Cards: 2x2 grid on mobile! */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <StatCard
            variant="dark"
            title="PENDAPATAN BULAN INI"
            value={stats.monthly_revenue ?? stats.revenue_month ?? 0}
            isCurrency
            icon={DollarSign}
            subtitle="Total sewa terkonfirmasi"
          />

          <StatCard
            variant="light"
            title="PENDAPATAN HARI INI"
            value={stats.today_revenue ?? stats.revenue_today ?? (stats.monthly_revenue || 0)}
            isCurrency
            icon={Activity}
            subtitle="Penerimaan transaksi hari ini"
          />

          <StatCard
            variant="light"
            title="BOOKING HARI INI"
            value={stats.today_bookings ?? stats.bookings_today_count ?? 0}
            icon={Calendar}
            subtitle="Jadwal main terjadwal"
          />

          <StatCard
            variant="light"
            title="VERIFIKASI TERTUNDA"
            value={stats.need_confirmation ?? ((stats.pending_proofs_count || 0) + (stats.pending_identities_count || 0))}
            icon={Clock}
            subtitle="Memerlukan tindakan"
          />
        </div>

        {/* Revenue Trends Chart Card */}
        <div className="bg-[var(--surface)] p-6 sm:p-8 rounded-[24px] border border-[var(--line)] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-3 rounded-full bg-[var(--accent-strong)] shrink-0" />
                <span className="font-sans text-xs uppercase tracking-wider text-[var(--accent-strong)] font-bold">
                  Analisis Tren Pendapatan
                </span>
              </div>
              <h3 className="font-sans font-bold text-lg text-[var(--ink)]">
                Penerimaan Sewa 7 Hari Terakhir
              </h3>
            </div>
          </div>

          <AreaChart
            data={chartData}
            xKey="name"
            yKey="value"
            isCurrency
            height={260}
          />
        </div>

        {/* Today's Bookings Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-lg text-[var(--ink)]">
              Jadwal Pertandingan Hari Ini
            </h3>
            <Button
              variant="ghost"
              size="sm"
              iconRight={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/admin/reservasi')}
            >
              Lihat Semua
            </Button>
          </div>

          <Table
            columns={columns}
            data={summary?.today_bookings || []}
            loading={loading}
            emptyMessage="Belum ada jadwal pertandingan hari ini."
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AdminSummary;
