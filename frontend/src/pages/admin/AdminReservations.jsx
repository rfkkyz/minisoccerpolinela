import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { adminMenuItems } from './adminMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatRupiah, formatDate, formatHourRange } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Chip } from '../../components/ui/Chip';
import { Table } from '../../components/ui/Table';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Input } from '../../components/ui/Input';
import { 
  Search, PlusCircle, CheckCircle2, XCircle, 
  Eye, Phone, ShieldCheck, ShieldAlert, AlertTriangle, 
  Upload, Download, Calendar, Clock 
} from 'lucide-react';

export function AdminReservations() {
  const { user } = useAuth();
  const location = useLocation();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Booking for 480px Drawer
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Manual Walk-in Booking Modal State
  const [walkinModalOpen, setWalkinModalOpen] = useState(false);
  const [walkinLoading, setWalkinLoading] = useState(false);
  const [walkinForm, setWalkinForm] = useState({
    field_id: 1,
    booking_date: new Date().toISOString().split('T')[0],
    start_hour: 16,
    duration: 2,
    customer_name: '',
    whatsapp: '',
    category: 'umum',
    payment_status: 'fully_paid',
    paid_amount: 400000,
  });

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchBookings = () => {
    setLoading(true);
    const params = statusFilter === 'all' ? {} : { status: statusFilter };
    apiClient.admin.getBookings(params)
      .then((res) => {
        const items = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.bookings)
            ? res.data.bookings
            : Array.isArray(res.data?.data)
              ? res.data.data
              : [];
        setBookings(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  // Handle URL query for direct lookup
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code && bookings.length > 0) {
      const match = bookings.find(b => b.booking_code === code);
      if (match) {
        setSelectedBooking(match);
        setDrawerOpen(true);
      }
    }
  }, [location.search, bookings]);

  const openDrawer = (booking) => {
    setSelectedBooking(booking);
    setShowRejectInput(false);
    setDrawerOpen(true);
  };

  // Actions
  const handleConfirmDp = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      await apiClient.admin.confirmDp(selectedBooking.id);
      fetchBookings();
      setDrawerOpen(false);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmFull = async () => {
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      await apiClient.admin.confirmPayment(selectedBooking.id);
      fetchBookings();
      setDrawerOpen(false);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectProof = async () => {
    if (!selectedBooking) return;
    if (!rejectReason) {
      alert('Harap isi alasan penolakan bukti bayar.');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.admin.rejectProof(selectedBooking.id, { reason: rejectReason });
      fetchBookings();
      setDrawerOpen(false);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyIdentity = async (verified, changeToUmum = false) => {
    if (!selectedBooking) return;
    setActionLoading(true);
    try {
      if (changeToUmum) {
        await apiClient.admin.changeToUmum(selectedBooking.id, { reason: 'Dokumen identitas tidak valid / tidak sesuai' });
      } else {
        await apiClient.admin.verifyIdentity(selectedBooking.id, {
          status: verified ? 'verified' : 'rejected'
        });
      }
      fetchBookings();
      setDrawerOpen(false);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    setWalkinLoading(true);
    try {
      await apiClient.admin.manualBooking({
        ...walkinForm,
        end_hour: Number(walkinForm.start_hour) + Number(walkinForm.duration)
      });
      setWalkinModalOpen(false);
      fetchBookings();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setWalkinLoading(false);
    }
  };

  const safeBookings = Array.isArray(bookings) ? bookings : [];

  const filteredBookings = safeBookings.filter((b) => {
    return (b.booking_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.whatsapp || '').includes(searchTerm);
  });

  const columns = [
    {
      header: 'KODE BOOKING',
      accessor: 'booking_code',
      render: (row) => (
        <span className="font-mono font-bold text-xs text-[var(--accent-strong)]">
          {row.booking_code}
        </span>
      ),
    },
    {
      header: 'PENYEWA',
      accessor: 'customer_name',
      render: (row) => (
        <div className="text-xs font-mono">
          <div className="font-bold text-[var(--text)]">{row.customer_name}</div>
          <div className="text-slate-400">{row.whatsapp} • {row.category}</div>
        </div>
      ),
    },
    {
      header: 'JADWAL MAIN',
      accessor: 'booking_date',
      render: (row) => (
        <div className="text-xs font-mono">
          <div>{formatDate(row.booking_date)}</div>
          <div className="text-slate-500">{formatHourRange(row.start_hour, row.end_hour)} WIB</div>
        </div>
      ),
    },
    {
      header: 'BIAYA',
      accessor: 'total_price',
      render: (row) => (
        <div className="text-xs font-mono">
          <div className="font-bold">{formatRupiah(row.paid_amount)} / {formatRupiah(row.total_price)}</div>
        </div>
      ),
    },
    {
      header: 'STATUS',
      accessor: 'payment_status',
      render: (row) => <StatusBadge status={row.payment_status} />,
    },
    {
      header: 'AKSI',
      accessor: 'id',
      render: (row) => (
        <button
          onClick={() => openDrawer(row)}
          className="px-3 py-1.5 rounded-lg bg-[var(--text)] hover:bg-black text-white font-mono text-[11px] font-bold uppercase transition-colors cursor-pointer"
        >
          Periksa
        </button>
      ),
    },
  ];

  return (
    <DashboardLayout
      role={user?.role === 'superadmin' ? 'superadmin' : 'admin'}
      menuItems={adminMenuItems}
      title="Kelola Reservasi"
      user={user}
    >
      <PageHeader
        title="Manajemen Reservasi Lapangan"
        highlightWord="Reservasi"
        subtitle="Verifikasi bukti transfer, validasi identitas pemesan, dan catat sewa langsung di tempat"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'ADMINISTRATOR', path: '/admin' },
          { label: 'RESERVASI' }
        ]}
        actions={
          <Button
            variant="accent"
            size="md"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setWalkinModalOpen(true)}
          >
            Booking Manual / Walk-in
          </Button>
        }
      />

      <div className="-mt-6 space-y-6">
        {/* Filter Bar */}
        <div className="bg-[var(--surface)] p-4 sm:p-5 rounded-[20px] border border-[var(--line)] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <Input
              placeholder="Cari kode booking, nama, WA..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Tabs
              tabs={[
                { id: 'all', label: 'SEMUA' },
                { id: 'pending_hold', label: 'MENUNGGU VERIFIKASI' },
                { id: 'dp_paid_50', label: 'DP 50%' },
                { id: 'fully_paid', label: 'LUNAS' },
                { id: 'expired_cancelled', label: 'BATAL' }
              ]}
              activeTab={statusFilter}
              onChange={(tabId) => setStatusFilter(tabId)}
            />
          </div>
        </div>

        {/* Table View */}
        <Table
          columns={columns}
          data={filteredBookings}
          loading={loading}
          emptyMessage="Tidak ada data reservasi yang cocok dengan filter."
        />

      </div>

      {/* 480px Detail Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={`Detail Reservasi: ${selectedBooking?.booking_code}`}
        width="max-w-xl"
      >
        {selectedBooking && (
          <div className="space-y-6 text-xs font-mono">
            
            {/* Status & Timing */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase">STATUS PEMBAYARAN:</span>
                <StatusBadge status={selectedBooking.payment_status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase">ARENA:</span>
                <span className="font-bold">{selectedBooking.field?.name || 'Lapangan A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 uppercase">TANGGAL & JAM:</span>
                <span className="font-bold text-[var(--accent-strong)]">
                  {formatDate(selectedBooking.booking_date)}, {formatHourRange(selectedBooking.start_hour, selectedBooking.end_hour)} WIB
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500 uppercase">TOTAL / DIBAYAR:</span>
                <span className="font-bold text-sm">
                  {formatRupiah(selectedBooking.paid_amount)} / {formatRupiah(selectedBooking.total_price)}
                </span>
              </div>
            </div>

            {/* Customer Details & Direct WhatsApp */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5">
              <span className="text-slate-400 uppercase font-semibold block mb-1">DATA PENYEWA</span>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Lengkap:</span>
                <span className="font-bold">{selectedBooking.customer_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nomor WhatsApp:</span>
                <a
                  href={`https://wa.me/${selectedBooking.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedBooking.whatsapp} (Hubungi WA)</span>
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori Identitas:</span>
                <span className="font-bold uppercase text-[var(--accent-strong)]">{selectedBooking.category}</span>
              </div>
              {selectedBooking.identity_number && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor NPM / NIP:</span>
                  <span className="font-bold">{selectedBooking.identity_number}</span>
                </div>
              )}
            </div>

            {/* Proof of Payment Viewer */}
            <div className="space-y-2">
              <span className="text-slate-500 uppercase font-semibold block">
                BUKTI TRANSFER PEMBAYARAN:
              </span>
              {selectedBooking.proof_of_payment ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                  <img
                    src={`http://localhost:5000/api/admin/files/${selectedBooking.proof_of_payment}`}
                    alt="Bukti Transfer"
                    className="w-full max-h-72 object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/600x400?text=Bukti+Transfer';
                    }}
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-100 text-slate-400 text-center">
                  Belum ada bukti pembayaran yang diunggah.
                </div>
              )}
            </div>

            {/* Identity Card Document (KTM/KTA) & Downgrade Options */}
            {selectedBooking.identity_card_path && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-slate-500 uppercase font-semibold block">
                  KARTU IDENTITAS SIVITAS (KTM/KTA):
                </span>
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                  <img
                    src={`http://localhost:5000/api/admin/files/${selectedBooking.identity_card_path}`}
                    alt="Kartu Identitas"
                    className="w-full max-h-72 object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/600x400?text=KTM+KTA+Identitas';
                    }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleVerifyIdentity(true)}
                    disabled={actionLoading}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold uppercase hover:bg-emerald-700 cursor-pointer"
                  >
                    Identitas Valid
                  </button>
                  <button
                    onClick={() => handleVerifyIdentity(false, true)}
                    disabled={actionLoading}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-600 text-white font-bold uppercase hover:bg-amber-700 cursor-pointer"
                  >
                    Pindahkan ke Tarif Umum
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <span className="text-slate-400 uppercase font-semibold block mb-2">AKSI ADMIN:</span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleConfirmDp}
                  disabled={actionLoading || selectedBooking.payment_status === 'dp_paid_50'}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase transition-colors cursor-pointer disabled:opacity-50"
                >
                  Konfirmasi DP 50%
                </button>

                <button
                  onClick={handleConfirmFull}
                  disabled={actionLoading || selectedBooking.payment_status === 'fully_paid'}
                  className="py-2.5 px-3 rounded-xl bg-[var(--text)] hover:bg-black text-white font-bold uppercase transition-colors cursor-pointer disabled:opacity-50"
                >
                  Konfirmasi Lunas 100%
                </button>
              </div>

              {/* Reject Proof Input */}
              {showRejectInput ? (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2 mt-2">
                  <input
                    type="text"
                    placeholder="Alasan penolakan bukti transfer..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="px-3 py-1 rounded text-xs text-slate-500"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleRejectProof}
                      disabled={actionLoading}
                      className="px-3 py-1 rounded bg-rose-600 text-white font-bold"
                    >
                      Kirim Tolak
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowRejectInput(true)}
                  className="w-full py-2 px-3 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold uppercase cursor-pointer"
                >
                  Tolak Bukti Transfer
                </button>
              )}
            </div>

          </div>
        )}
      </Drawer>

      {/* Walk-in Booking Modal */}
      {walkinModalOpen && (
        <Modal
          isOpen={walkinModalOpen}
          onClose={() => setWalkinModalOpen(false)}
          title="Booking Manual / Walk-in di Lokasi"
        >
          <form onSubmit={handleWalkinSubmit} className="space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-slate-500 uppercase font-semibold">Nama Penyewa</label>
              <input
                type="text"
                required
                value={walkinForm.customer_name}
                onChange={(e) => setWalkinForm({ ...walkinForm, customer_name: e.target.value })}
                placeholder="Nama tim / penyewa langsung"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Nomor WhatsApp</label>
                <input
                  type="text"
                  required
                  value={walkinForm.whatsapp}
                  onChange={(e) => setWalkinForm({ ...walkinForm, whatsapp: e.target.value })}
                  placeholder="08123456789"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Kategori</label>
                <select
                  value={walkinForm.category}
                  onChange={(e) => setWalkinForm({ ...walkinForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="umum">Umum</option>
                  <option value="mahasiswa">Mahasiswa</option>
                  <option value="karyawan">Karyawan</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Tanggal</label>
                <input
                  type="date"
                  required
                  value={walkinForm.booking_date}
                  onChange={(e) => setWalkinForm({ ...walkinForm, booking_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Jam Mulai</label>
                <select
                  value={walkinForm.start_hour}
                  onChange={(e) => setWalkinForm({ ...walkinForm, start_hour: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  {Array.from({ length: 18 }, (_, i) => i + 6).map((hr) => (
                    <option key={hr} value={hr}>{String(hr).padStart(2, '0')}:00 WIB</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Durasi (Jam)</label>
                <select
                  value={walkinForm.duration}
                  onChange={(e) => setWalkinForm({ ...walkinForm, duration: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value={1}>1 Jam</option>
                  <option value={2}>2 Jam</option>
                  <option value={3}>3 Jam</option>
                  <option value={4}>4 Jam</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-500 uppercase font-semibold">Status Pembayaran</label>
                <select
                  value={walkinForm.payment_status}
                  onChange={(e) => setWalkinForm({ ...walkinForm, payment_status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                >
                  <option value="fully_paid">Lunas Tunai (100%)</option>
                  <option value="dp_paid_50">DP 50% Tunai</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWalkinModalOpen(false)}
                className="py-2 px-4 rounded-xl border border-slate-200"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={walkinLoading}
                className="py-2 px-5 rounded-xl bg-[var(--text)] text-white font-bold uppercase"
              >
                {walkinLoading ? 'Menyimpan...' : 'Simpan Walk-in'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </DashboardLayout>
  );
}

export default AdminReservations;

