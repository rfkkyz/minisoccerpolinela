import React, { useState, useEffect } from 'react';
import {
  Search, Ticket, Calendar, Clock, MapPin, User,
  Printer, ArrowRight, ShieldCheck, Upload, AlertCircle
} from 'lucide-react';
import { apiClient } from '../api';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Timeline } from '../components/ui/Timeline';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { Modal } from '../components/ui/Modal';
import { FileUpload } from '../components/ui/FileUpload';
import { ETicketCard } from '../components/ticket/ETicketCard';
import { formatRupiah, formatDateIndo } from '../utils/format';

export default function CheckStatusPage() {
  const [bookingCode, setBookingCode] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('code') || '';
  });
  const [whatsappDigits, setWhatsappDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Re-upload proof state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newProofFile, setNewProofFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const wa = urlParams.get('wa') || urlParams.get('whatsapp');
    if (code && wa) {
      setBookingCode(code);
      setWhatsappDigits(wa.slice(-4));
      triggerSearch(code, wa.slice(-4));
    }
  }, []);

  const triggerSearch = async (code, wa) => {
    const cleanCode = (code || '').trim().toUpperCase();
    const cleanWa = (wa || '').trim().replace(/\D/g, '');

    if (!cleanCode || cleanWa.length !== 4) {
      setErrorMsg('Harap masukkan Kode Reservasi lengkap dan tepat 4 digit terakhir nomor WhatsApp pemesan.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setBooking(null);

    try {
      const res = await apiClient.bookings.checkStatus(cleanCode, cleanWa);
      if (res.data) {
        setBooking(res.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Data pemesanan tidak ditemukan atau nomor WhatsApp tidak cocok.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    triggerSearch(bookingCode, whatsappDigits);
  };

  const handleReuploadProof = async (e) => {
    e.preventDefault();
    if (!newProofFile || !booking) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('booking_code', booking.booking_code);
      formData.append('proof_of_payment', newProofFile);
      await apiClient.bookings.uploadPayment(formData);
      setUploadSuccess(true);
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadSuccess(false);
        triggerSearch(bookingCode, whatsappDigits);
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setIsUploading(false);
    }
  };

  // Build timeline items from booking data
  const getTimelineItems = (b) => {
    if (!b) return [];
    const isCancelled = b.status === 'cancelled' || b.status === 'expired_cancelled' || b.status === 'rejected';

    if (isCancelled) {
      return [
        { title: 'Reservasi Dibuat', description: `Kode: ${b.booking_code}`, status: 'completed' },
        { title: 'Dibatalkan / Kadaluarsa', description: 'Reservasi telah dibatalkan oleh sistem atau admin.', status: 'danger' }
      ];
    }

    const isDp = b.status === 'dp_paid_50' || b.status === 'dp_paid';
    const isFully = b.status === 'fully_paid' || b.status === 'confirmed';
    const isCompleted = b.status === 'completed';

    return [
      {
        title: 'Reservasi Dibuat',
        description: 'Menunggu pembayaran awal',
        status: 'completed'
      },
      {
        title: 'Pembayaran DP / Lunas',
        description: isDp ? 'DP 50% telah diterima' : isFully ? 'Pembayaran lunas terkonfirmasi' : 'Unggah bukti pembayaran',
        status: isDp || isFully || isCompleted ? 'completed' : 'current'
      },
      {
        title: 'Verifikasi Admin',
        description: isFully || isCompleted ? 'Jadwal terkunci resmi di lapangan' : 'Admin memeriksa berkas dan pembayaran',
        status: isFully || isCompleted ? 'completed' : isDp ? 'current' : 'upcoming'
      },
      {
        title: 'Pertandingan Selesai',
        description: 'Terima kasih telah menggunakan fasilitas Polinela',
        status: isCompleted ? 'completed' : 'upcoming'
      }
    ];
  };

  return (
    <AuthLayout
      title="Cek Status Reservasi"
      subtitle="Periksa jadwal bermain, sisa tagihan, dan unduh tiket reservasi"
      badge="LACAK RESERVASI"
      className={booking ? "max-w-4xl transition-all duration-300" : "max-w-[620px] transition-all duration-300"}
    >
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <Input
          label="Kode Booking"
          type="text"
          required
          placeholder="Contoh: POLI-261116-XXXX"
          icon={Ticket}
          value={bookingCode}
          onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
        />

        <Input
          label="4 Digit Terakhir No. WhatsApp"
          type="text"
          maxLength={4}
          required
          placeholder="Contoh: 1234"
          icon={Search}
          value={whatsappDigits}
          onChange={(e) => setWhatsappDigits(e.target.value.replace(/\D/g, ''))}
          hint="Verifikasi keamanan nomor WhatsApp yang digunakan saat memesan"
        />

        {errorMsg && (
          <div className="p-3.5 rounded-[12px] bg-rose-50 border border-rose-200 text-[var(--danger)] text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <Button
          type="submit"
          variant="accent"
          size="lg"
          block
          loading={loading}
          icon={<Search className="w-4 h-4" />}
        >
          Lacak Status Pemesanan
        </Button>
      </form>

      {/* Booking Result Card */}
      {booking && (
        <div className="mt-8 pt-6 border-t border-[var(--line)] space-y-6 animate-in fade-in duration-200">
          {/* Header Result */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[16px] bg-[var(--surface-tint)] border border-[var(--line-strong)]">
            <div>
              <div className="font-mono text-xs text-[var(--ink-3)] uppercase tracking-wider">
                KODE BOOKING
              </div>
              <div className="font-mono text-base sm:text-lg font-bold text-[var(--ink)]">
                {booking.booking_code}
              </div>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-[14px] bg-[var(--paper-2)] space-y-1">
              <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">LAPANGAN</span>
              <span className="font-semibold text-[var(--ink)] block">
                {booking.field_name || booking.field?.name || 'Lapangan Utama'}
              </span>
            </div>

            <div className="p-3.5 rounded-[14px] bg-[var(--paper-2)] space-y-1">
              <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">KATEGORI TARIF</span>
              <Chip tier={booking.tariff_tier || 'umum'} size="md" />
            </div>

            <div className="p-3.5 rounded-[14px] bg-[var(--paper-2)] space-y-1">
              <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">TANGGAL MAIN</span>
              <span className="font-semibold text-[var(--ink)] block">
                {booking.play_date ? formatDateIndo(booking.play_date) : '-'}
              </span>
            </div>

            <div className="p-3.5 rounded-[14px] bg-[var(--paper-2)] space-y-1">
              <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">WAKTU & DURASI</span>
              <span className="font-semibold text-[var(--ink)] block">
                {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)} WIB ({booking.hours_count || 1} Jam)
              </span>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="p-4 rounded-[16px] border border-[var(--line)] bg-[var(--surface)] space-y-2">
            <div className="flex justify-between text-xs text-[var(--ink-2)]">
              <span>Tarif Lapangan:</span>
              <span className="font-mono font-semibold text-[var(--ink)]">{formatRupiah(booking.total_price)}</span>
            </div>
            {Number(booking.dp_paid) > 0 && (
              <div className="flex justify-between text-xs text-[var(--accent-strong)]">
                <span>DP 50% Terbayar:</span>
                <span className="font-mono font-bold">-{formatRupiah(booking.dp_paid)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-[var(--ink)] pt-2 border-t border-[var(--line)]">
              <span>Sisa Pembayaran:</span>
              <span className="font-mono text-[var(--danger)]">
                {formatRupiah(Math.max(0, Number(booking.total_price) - Number(booking.dp_paid || 0)))}
              </span>
            </div>
          </div>

          {/* Timeline of progress */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-3.5 rounded-full bg-[var(--accent-strong)] shrink-0" />
              <h4 className="font-sans text-xs uppercase tracking-wider text-[var(--ink-2)] font-bold">
                Status Progres Reservasi
              </h4>
            </div>
            <Timeline items={getTimelineItems(booking)} />
          </div>

          {/* Official E-Ticket Match Pass */}
          {(['confirmed', 'dp_paid_50', 'dp_paid', 'fully_paid', 'completed'].includes(booking.status) ||
            ['confirmed', 'dp_paid_50', 'fully_paid'].includes(booking.payment_status)) && (
            <div className="pt-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-3.5 rounded-full bg-[var(--accent-strong)] shrink-0" />
                <h4 className="font-sans text-xs uppercase tracking-wider text-[var(--ink-2)] font-bold">
                  E-Tiket Resmi Pertandingan
                </h4>
              </div>
              <ETicketCard booking={booking} />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {booking.status === 'pending_hold' && (
              <Button
                variant="accent"
                size="md"
                block
                icon={<Upload className="w-4 h-4" />}
                onClick={() => setShowUploadModal(true)}
              >
                Unggah Bukti Bayar
              </Button>
            )}

            <Button
              variant="secondary"
              size="md"
              block
              icon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
            >
              Cetak Rincian
            </Button>
          </div>
        </div>
      )}

      {/* Upload Proof Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Unggah Bukti Pembayaran"
        subtitle={`Reservasi #${booking?.booking_code}`}
      >
        <form onSubmit={handleReuploadProof} className="space-y-4">
          <p className="text-xs text-[var(--ink-2)] leading-relaxed">
            Silakan transfer sesuai nominal ke Rekening Resmi Polinela (<strong>Bank Syariah Indonesia (BSI) 7144-8899-0011</strong> a.n. <strong>BPU POLITEKNIK NEGERI LAMPUNG</strong>) dan unggah foto struk/tangkapan layar di bawah ini.
          </p>

          <FileUpload
            accept="image/*,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
            maxSizeMB={5}
            selectedFile={newProofFile}
            onFileSelected={(file) => setNewProofFile(file)}
          />

          {uploadSuccess && (
            <p className="text-xs font-semibold text-[var(--accent-strong)] text-center">
              ✓ Bukti transfer berhasil dikirim! Memperbarui status...
            </p>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowUploadModal(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="accent"
              loading={isUploading}
              disabled={!newProofFile}
            >
              Kirim Bukti Bayar
            </Button>
          </div>
        </form>
      </Modal>
    </AuthLayout>
  );
}
