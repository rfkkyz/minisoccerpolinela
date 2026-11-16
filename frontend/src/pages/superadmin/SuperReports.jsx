import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { superMenuItems } from './superMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatRupiah, formatDateIndo } from '../../utils/format';
import { 
  Download, Printer, Filter, Calendar, 
  DollarSign, Clock, Users, ArrowUpRight 
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { BarChart } from '../../components/ui/Charts';

export function SuperReports() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    apiClient.superadmin.getReports({ start_date: startDate, end_date: endDate })
      .then((res) => {
        if (res.data) setReport(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const chartData = (report?.breakdown_by_field || [
    { name: 'Lapangan Mini Soccer Polinela', value: 15200000 },
  ]).map(f => ({ name: f.name, value: f.total || f.value || 0 }));

  const categoryBreakdown = report?.breakdown_by_category || [
    { category: 'Mahasiswa', count: 28, revenue: 5600000, hours: 56 },
    { category: 'Karyawan', count: 14, revenue: 3920000, hours: 28 },
    { category: 'Umum', count: 24, revenue: 9600000, hours: 48 },
  ];

  return (
    <DashboardLayout
      role="superadmin"
      menuItems={superMenuItems}
    >
      <PageHeader
        title="Laporan Keuangan & Okupansi"
        highlightWord="Keuangan"
        subtitle="Rekapitulasi omset sewa bersih, jam terisi, dan kontribusi per kategori penyewa"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'SUPER ADMIN', path: '/superadmin' },
          { label: 'LAPORAN' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Cetak Laporan
            </Button>
          </div>
        }
      />

      <div className="-mt-6 space-y-6">
        {/* Date Filter Bar */}
        <div className="bg-[var(--surface)] p-4 sm:p-5 rounded-[20px] border border-[var(--line)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--ink-2)]">
            <span className="font-semibold uppercase text-[var(--ink)]">PERIODE LAPORAN:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-[12px] border border-[var(--line-strong)] text-xs font-mono bg-[var(--surface)] text-[var(--ink)] outline-none"
            />
            <span className="text-xs font-mono text-[var(--ink-3)]">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-[12px] border border-[var(--line-strong)] text-xs font-mono bg-[var(--surface)] text-[var(--ink)] outline-none"
            />
            <Button
              variant="accent"
              size="sm"
              onClick={fetchReports}
            >
              Terapkan
            </Button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            variant="dark"
            title="TOTAL OMSET BERSIH"
            value={report?.total_revenue || 0}
            isCurrency
            icon={DollarSign}
            subtitle="Periode terpilih"
          />

          <StatCard
            variant="light"
            title="TOTAL JAM TERPAKAI"
            value={report?.total_hours || 0}
            suffix=" Jam"
            icon={Clock}
            subtitle="Jam operasional lapangan"
          />

          <StatCard
            variant="light"
            title="TOTAL RESERVASI"
            value={report?.total_bookings || 0}
            icon={Calendar}
            subtitle="Transaksi terkonfirmasi"
          />

          <StatCard
            variant="light"
            title="RATA-RATA DURASI"
            value={report?.avg_duration || 2}
            suffix=" Jam"
            icon={Users}
            subtitle="Per reservasi"
          />
        </div>

        {/* Charts & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Chart (8 cols) */}
          <div className="lg:col-span-7 bg-[var(--surface)] p-6 rounded-[24px] border border-[var(--line)] shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-base text-[var(--ink)]">
              Pendapatan per Lapangan (IDR)
            </h3>
            <BarChart
              data={chartData}
              xKey="name"
              yKey="value"
              isCurrency
              height={260}
            />
          </div>

          {/* Right Category Breakdown (5 cols) */}
          <div className="lg:col-span-5 bg-[var(--surface)] p-6 rounded-[24px] border border-[var(--line)] shadow-sm space-y-4">
            <h3 className="font-sans font-bold text-base text-[var(--ink)]">
              Kontribusi per Kategori
            </h3>

            <div className="space-y-3">
              {categoryBreakdown.map((c) => (
                <div
                  key={c.category}
                  className="p-3.5 rounded-[16px] bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <Chip tier={c.category} size="md" />
                    <div className="text-[11px] font-mono text-[var(--ink-3)]">
                      {c.count} Pesanan • {c.hours} Jam
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-[var(--ink)]">
                      {formatRupiah(c.revenue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default SuperReports;
