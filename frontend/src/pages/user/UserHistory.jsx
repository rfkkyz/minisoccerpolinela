import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { userMenuItems } from './userMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatRupiah, formatDateIndo } from '../../utils/format';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Chip } from '../../components/ui/Chip';
import { Table } from '../../components/ui/Table';
import { Drawer } from '../../components/ui/Drawer';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Timeline } from '../../components/ui/Timeline';
import { Search, Download, Eye, Ticket, Calendar } from 'lucide-react';

export function UserHistory() {
  const { user } = useAuth();
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiClient.user.getBookings()
      .then((res) => {
        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.bookings)
            ? res.data.bookings
            : Array.isArray(res.data?.data)
              ? res.data.data
              : [];
        setHistoryList(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const safeHistory = Array.isArray(historyList) ? historyList : [];

  const filteredHistory = safeHistory.filter((item) => {
    const code = item.booking_code || '';
    const fieldName = item.field_name || item.field?.name || '';
    const matchSearch = code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fieldName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const exportCSV = () => {
    const headers = ['Kode Booking', 'Arena', 'Kategori', 'Tanggal Main', 'Jam', 'Total Biaya', 'Status'];
    const rows = filteredHistory.map(b => [
      b.booking_code,
      `"${b.field_name || b.field?.name || 'Lapangan Utama'}"`,
      b.tariff_tier || 'umum',
      b.play_date || b.booking_date,
      `"${b.start_time?.slice(0, 5) || b.start_hour + ':00'} - ${b.end_time?.slice(0, 5) || b.end_hour + ':00'}"`,
      b.total_price,
      b.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Riwayat_Reservasi_${user?.username || 'User'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      key: 'field_name',
      label: 'ARENA',
      render: (_, row) => (
        <span className="text-xs font-semibold text-[var(--ink)]">
          {row.field_name || row.field?.name || 'Lapangan Utama'}
        </span>
      ),
    },
    {
      key: 'tariff_tier',
      label: 'KATEGORI',
      render: (_, row) => <Chip tier={row.tariff_tier || 'umum'} />,
    },
    {
      key: 'play_date',
      label: 'TANGGAL & JAM',
      render: (_, row) => (
        <div className="text-xs font-mono">
          <div className="font-semibold text-[var(--ink)]">
            {row.play_date ? formatDateIndo(row.play_date) : '-'}
          </div>
          <div className="text-[var(--ink-3)]">
            {row.start_time?.slice(0, 5)} - {row.end_time?.slice(0, 5)} WIB
          </div>
        </div>
      ),
    },
    {
      key: 'total_price',
      label: 'TOTAL BIAYA',
      render: (_, row) => (
        <span className="font-mono text-xs font-bold text-[var(--ink)]">
          {formatRupiah(row.total_price)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (_, row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'AKSI',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setSelectedBooking(row)}
          className="p-1.5 rounded-[8px] bg-[var(--surface-tint)] border border-[var(--line)] hover:bg-[var(--paper-2)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
          title="Lihat Rincian"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout
      role="user"
      menuItems={userMenuItems}
    >
      <PageHeader
        title="Riwayat Transaksi & Pertandingan"
        highlightWord="Riwayat"
        subtitle="Daftar lengkap seluruh reservasi yang pernah Anda buat di sistem Polisoccer"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'DASHBOARD', path: '/dashboard' },
          { label: 'RIWAYAT' }
        ]}
        actions={
          <Button
            variant="secondary"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={exportCSV}
          >
            Ekspor CSV
          </Button>
        }
      />

      <div className="-mt-6 space-y-6">
        {/* Filter & Search Bar */}
        <div className="bg-[var(--surface)] p-4 sm:p-5 rounded-[20px] border border-[var(--line)] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Cari kode booking atau arena..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'all', label: 'Semua Status' },
                { value: 'confirmed', label: 'Dikonfirmasi' },
                { value: 'dp_paid_50', label: 'DP 50%' },
                { value: 'pending_hold', label: 'Menunggu Bayar' },
                { value: 'completed', label: 'Selesai' },
                { value: 'expired_cancelled', label: 'Dibatalkan' }
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
            />
          </div>
        </div>

        {/* History Table */}
        <Table
          columns={columns}
          data={filteredHistory}
          loading={loading}
          emptyMessage="Tidak ada riwayat transaksi yang cocok dengan filter."
        />
      </div>

      {/* Booking Detail Drawer (480px) */}
      <Drawer
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Rincian Reservasi"
        subtitle={selectedBooking ? `Kode: #${selectedBooking.booking_code}` : ''}
        footer={
          <Button
            variant="secondary"
            size="md"
            block
            onClick={() => setSelectedBooking(null)}
          >
            Tutup
          </Button>
        }
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="flex justify-between items-center p-3.5 rounded-[14px] bg-[var(--surface-tint)] border border-[var(--line-strong)]">
              <div>
                <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">STATUS TRANSAKSI</span>
                <span className="font-mono text-sm font-bold text-[var(--ink)]">#{selectedBooking.booking_code}</span>
              </div>
              <StatusBadge status={selectedBooking.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-[12px] bg-[var(--paper-2)]">
                <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">ARENA</span>
                <span className="font-semibold text-[var(--ink)]">{selectedBooking.field_name || 'Lapangan Utama'}</span>
              </div>
              <div className="p-3 rounded-[12px] bg-[var(--paper-2)]">
                <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">KATEGORI TARIF</span>
                <Chip tier={selectedBooking.tariff_tier || 'umum'} />
              </div>
              <div className="p-3 rounded-[12px] bg-[var(--paper-2)]">
                <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">TANGGAL MAIN</span>
                <span className="font-semibold text-[var(--ink)]">{selectedBooking.play_date ? formatDateIndo(selectedBooking.play_date) : '-'}</span>
              </div>
              <div className="p-3 rounded-[12px] bg-[var(--paper-2)]">
                <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">JAM MAIN</span>
                <span className="font-semibold text-[var(--ink)]">{selectedBooking.start_time?.slice(0, 5)} - {selectedBooking.end_time?.slice(0, 5)} WIB</span>
              </div>
            </div>

            <div className="p-4 rounded-[16px] bg-[var(--surface)] border border-[var(--line)] space-y-2 text-xs">
              <div className="flex justify-between text-[var(--ink-2)]">
                <span>Tarif Sewa Lapangan:</span>
                <span className="font-mono font-bold text-[var(--ink)]">{formatRupiah(selectedBooking.total_price)}</span>
              </div>
              {Number(selectedBooking.dp_paid) > 0 && (
                <div className="flex justify-between text-[var(--accent-strong)]">
                  <span>DP 50% Telah Masuk:</span>
                  <span className="font-mono font-bold">-{formatRupiah(selectedBooking.dp_paid)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[var(--ink)] pt-2 border-t border-[var(--line)]">
                <span>Total Pelunasan:</span>
                <span className="font-mono">{formatRupiah(selectedBooking.total_price)}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-4">
                <span className="w-1.5 h-3 rounded-full bg-[var(--accent-strong)] shrink-0" />
                <h4 className="font-sans text-xs uppercase tracking-wider text-[var(--ink-2)] font-bold">
                  Alur Status
                </h4>
              </div>
              <Timeline
                items={[
                  { title: 'Reservasi Masuk', description: 'Tercatat di basis data Polisoccer', status: 'completed' },
                  { title: 'Pembayaran DP / Lunas', description: selectedBooking.status !== 'pending_hold' ? 'Bukti bayar tervalidasi' : 'Menunggu pembayaran', status: selectedBooking.status !== 'pending_hold' ? 'completed' : 'current' },
                  { title: 'Pertandingan Selesai', description: selectedBooking.status === 'completed' ? 'Selesai dimainkan' : 'Mendatang', status: selectedBooking.status === 'completed' ? 'completed' : 'upcoming' }
                ]}
              />
            </div>
          </div>
        )}
      </Drawer>
    </DashboardLayout>
  );
}

export default UserHistory;
