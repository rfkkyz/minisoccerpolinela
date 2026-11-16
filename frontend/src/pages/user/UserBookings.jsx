import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { userMenuItems } from './userMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatRupiah, formatDateIndo } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Chip } from '../../components/ui/Chip';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { FileUpload } from '../../components/ui/FileUpload';
import { Countdown } from '../../components/ui/Countdown';
import { 
  Calendar, Ticket, Clock, Upload, XCircle, 
  PlusCircle, QrCode, Printer 
} from 'lucide-react';
import { ETicketCard } from '../../components/ticket/ETicketCard';

export function UserBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'pending' | 'completed'

  // Selected Booking for E-Ticket Modal
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Re-upload proof modal state
  const [uploadModalBooking, setUploadModalBooking] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Cancel Confirmation state
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBookings = () => {
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
        setBookings(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!proofFile || !uploadModalBooking) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('booking_code', uploadModalBooking.booking_code);
      formData.append('proof_of_payment', proofFile);
      await apiClient.bookings.uploadPayment(formData);
      setUploadModalBooking(null);
      setProofFile(null);
      fetchBookings();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    setIsCancelling(true);

    try {
      await apiClient.user.cancelBooking(cancelModalBooking.id, cancelReason);
      setCancelModalBooking(null);
      setCancelReason('');
      fetchBookings();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsCancelling(false);
    }
  };

  const safeBookings = Array.isArray(bookings) ? bookings : [];

  const getBookingStatus = (b) => b.payment_status || b.status || 'pending_hold';

  const filteredBookings = safeBookings.filter((b) => {
    const s = getBookingStatus(b);
    if (activeTab === 'pending') {
      return s === 'pending_hold' || s === 'pending';
    }
    if (activeTab === 'completed') {
      return s === 'completed' || s === 'cancelled' || s === 'expired_cancelled' || s === 'rejected';
    }
    // 'active' (default)
    return s === 'confirmed' || s === 'fully_paid' || s === 'dp_paid_50' || s === 'dp_paid';
  });

  const tabOptions = [
    { id: 'active', label: 'Terkonfirmasi / DP', badge: safeBookings.filter(b => ['confirmed', 'fully_paid', 'dp_paid_50', 'dp_paid'].includes(getBookingStatus(b))).length },
    { id: 'pending', label: 'Menunggu Bayar', badge: safeBookings.filter(b => ['pending_hold', 'pending'].includes(getBookingStatus(b))).length },
    { id: 'completed', label: 'Selesai & Batal', badge: safeBookings.filter(b => ['completed', 'cancelled', 'expired_cancelled', 'rejected'].includes(getBookingStatus(b))).length }
  ];

  return (
    <DashboardLayout
      role="user"
      menuItems={userMenuItems}
    >
      <PageHeader
        title="Daftar Reservasi Saya"
        highlightWord="Reservasi"
        subtitle="Kelola pesanan aktif, unggah bukti bayar, dan unduh tiket pertandingan"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'DASHBOARD', path: '/dashboard' },
          { label: 'PESANAN AKTIF' }
        ]}
        actions={
          <Button
            variant="accent"
            size="md"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/booking')}
          >
            Pesan Lapangan
          </Button>
        }
      />

      <div className="-mt-6 space-y-6">
        {/* Tabs Segmented Pills */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <Tabs
            tabs={tabOptions}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId)}
          />
        </div>

        {/* Bookings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton variant="rect" className="h-56" />
            <Skeleton variant="rect" className="h-56" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="Tidak Ada Reservasi Ditemukan"
            description={
              activeTab === 'pending'
                ? 'Tidak ada pesanan yang sedang menunggu pembayaran.'
                : activeTab === 'completed'
                ? 'Belum ada riwayat pertandingan selesai.'
                : 'Anda belum memiliki pesanan lapangan aktif.'
            }
            actionLabel="Pesan Jadwal Baru"
            onAction={() => navigate('/dashboard/booking')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredBookings.map((b) => {
              const st = getBookingStatus(b);
              const isPending = st === 'pending_hold' || st === 'pending';
              const isDp = st === 'dp_paid_50' || st === 'dp_paid';
              const bookingDate = b.booking_date || b.play_date;
              const startHour = b.start_hour !== undefined ? b.start_hour : (b.start_time ? parseInt(b.start_time, 10) : 8);
              const endHour = b.end_hour !== undefined ? b.end_hour : (b.end_time ? parseInt(b.end_time, 10) : (startHour + (b.hours_count || 1)));

              return (
                <div
                  key={b.id}
                  className="bg-[var(--surface)] rounded-[24px] border border-[var(--line)] shadow-sm p-6 flex flex-col justify-between space-y-5 hover:border-[var(--line-strong)] hover:shadow-md transition-all"
                >
                  <div>
                    {/* Header: Code & Status Badge */}
                    <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--line)]">
                      <div>
                        <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block tracking-wider">
                          KODE BOOKING
                        </span>
                        <span className="font-mono text-base font-bold text-[var(--ink)]">
                          {b.booking_code}
                        </span>
                      </div>
                      <StatusBadge status={st} />
                    </div>

                    {/* Pending Countdown banner if pending */}
                    {isPending && (b.hold_expires_at || b.expires_at) && (
                      <div className="mb-4 p-3 rounded-[12px] bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold">BATAS WAKTU BAYAR:</span>
                        <Countdown targetTime={b.hold_expires_at || b.expires_at} onExpire={fetchBookings} />
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                      <div className="p-3 rounded-[12px] bg-[var(--paper-2)] space-y-0.5">
                        <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">LAPANGAN</span>
                        <span className="font-semibold text-[var(--ink)] block truncate">
                          {b.field_name || b.field?.name || 'Lapangan Utama'}
                        </span>
                      </div>

                      <div className="p-3 rounded-[12px] bg-[var(--paper-2)] space-y-0.5">
                        <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">TARIF</span>
                        <Chip tier={b.tariff_tier || 'umum'} />
                      </div>

                      <div className="p-3 rounded-[12px] bg-[var(--paper-2)] space-y-0.5">
                        <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">TANGGAL MAIN</span>
                        <span className="font-semibold text-[var(--ink)] block">
                          {bookingDate ? formatDateIndo(bookingDate) : '-'}
                        </span>
                      </div>

                      <div className="p-3 rounded-[12px] bg-[var(--paper-2)] space-y-0.5">
                        <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">JAM MAIN</span>
                        <span className="font-semibold text-[var(--ink)] block">
                          {String(startHour).padStart(2, '0')}:00 - {String(endHour).padStart(2, '0')}:00 WIB
                        </span>
                      </div>
                    </div>

                    {/* Pricing summary */}
                    <div className="p-3.5 rounded-[14px] bg-[var(--surface-tint)] border border-[var(--line-strong)] text-xs space-y-1">
                      <div className="flex justify-between text-[var(--ink-2)]">
                        <span>Total Tagihan:</span>
                        <span className="font-mono font-bold text-[var(--ink)]">{formatRupiah(b.total_price)}</span>
                      </div>
                      {isDp && (
                        <div className="flex justify-between text-[var(--danger)]">
                          <span>Sisa di Lapangan:</span>
                          <span className="font-mono font-bold">
                            {formatRupiah(Math.max(0, Number(b.total_price) - Number(b.paid_amount || b.dp_paid || 0)))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--line)]">
                    {/* E-Ticket button */}
                    <Button
                      variant="secondary"
                      size="sm"
                      block
                      icon={<QrCode className="w-4 h-4" />}
                      onClick={() => setSelectedTicket(b)}
                    >
                      E-Tiket
                    </Button>

                    {/* If pending, upload proof */}
                    {isPending && (
                      <Button
                        variant="accent"
                        size="sm"
                        block
                        icon={<Upload className="w-4 h-4" />}
                        onClick={() => setUploadModalBooking(b)}
                      >
                        Unggah Bukti
                      </Button>
                    )}

                    {/* Cancel button if pending */}
                    {isPending && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[var(--danger)] hover:bg-rose-50"
                        onClick={() => setCancelModalBooking(b)}
                      >
                        Batal
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* E-Tiket Modal (Match Pass Design) */}
      {selectedTicket && (
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title="E-Tiket Resmi Pertandingan PoliSoccer"
          maxWidth="max-w-4xl"
        >
          <div className="py-2">
            <ETicketCard booking={selectedTicket} />
          </div>
        </Modal>
      )}

      {/* Upload Proof Modal */}
      {uploadModalBooking && (
        <Modal
          isOpen={!!uploadModalBooking}
          onClose={() => setUploadModalBooking(null)}
          title="Unggah Bukti Transfer"
          subtitle={`Kode: ${uploadModalBooking.booking_code}`}
        >
          <form onSubmit={handleUploadProof} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-[var(--ink)]">Rekening Resmi Pembayaran:</div>
              <div>Bank Syariah Indonesia (BSI): <strong className="text-[#0B7A3B]">7144-8899-0011</strong></div>
              <div>a.n. <strong>BPU POLITEKNIK NEGERI LAMPUNG</strong></div>
            </div>

            <FileUpload
              accept="image/*,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
              maxSizeMB={5}
              selectedFile={proofFile}
              onFileSelected={(file) => setProofFile(file)}
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setUploadModalBooking(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="accent"
                loading={isUploading}
                disabled={!proofFile}
              >
                Kirim Bukti Pembayaran
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Confirmation Dialog */}
      {cancelModalBooking && (
        <ConfirmDialog
          isOpen={!!cancelModalBooking}
          onClose={() => setCancelModalBooking(null)}
          onConfirm={handleCancelBooking}
          title="Batalkan Reservasi?"
          message={`Apakah Anda yakin ingin membatalkan pesanan #${cancelModalBooking.booking_code}? Slot lapangan akan otomatis dilepaskan kembali ke publik.`}
          confirmLabel="Ya, Batalkan"
          cancelLabel="Kembali"
          variant="danger"
          loading={isCancelling}
        />
      )}
    </DashboardLayout>
  );
}

export default UserBookings;
