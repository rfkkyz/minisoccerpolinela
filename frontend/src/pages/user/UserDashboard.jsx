import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { userMenuItems } from './userMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatRupiah, formatDateIndo, formatHourRange } from '../../utils/format';
import { 
  Calendar, Ticket, Clock, CheckCircle2, 
  ArrowRight, ShieldAlert, ShieldCheck, PlusCircle, CreditCard,
  QrCode, Printer, MapPin
} from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Countdown } from '../../components/ui/Countdown';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { ETicketCard } from '../../components/ticket/ETicketCard';

export function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingBooking, setUpcomingBooking] = useState(null);
  const [pendingBooking, setPendingBooking] = useState(null);

  // E-Ticket Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.user.getSummary(),
      apiClient.user.getBookings({ status: 'confirmed', limit: 1 }),
      apiClient.user.getBookings({ status: 'pending_hold', limit: 1 })
    ])
      .then(([summaryRes, confirmedRes, pendingRes]) => {
        const payload = summaryRes?.data?.data || summaryRes?.data;
        if (payload) setSummary(payload);
        const confirmedList = Array.isArray(confirmedRes?.data)
          ? confirmedRes.data
          : Array.isArray(confirmedRes?.data?.bookings)
            ? confirmedRes.data.bookings
            : [];
        if (confirmedList.length > 0) {
          setUpcomingBooking(confirmedList[0]);
        }
        const pendingList = Array.isArray(pendingRes?.data)
          ? pendingRes.data
          : Array.isArray(pendingRes?.data?.bookings)
            ? pendingRes.data.bookings
            : [];
        if (pendingList.length > 0) {
          setPendingBooking(pendingList[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = summary?.stats || summary?.data?.stats || summary || {};

  const identityStatus = user?.identity_verification_status || 'unverified';
  const category = user?.category || 'umum';

  return (
    <DashboardLayout
      role="user"
      menuItems={userMenuItems}
    >
      {/* 1. Standard PageHeader (Neon band with 2-color heading) */}
      <PageHeader
        title={`Ringkasan Akun ${user?.name || user?.username || 'Pengguna'}`}
        highlightWord={user?.name ? user.name.split(' ')[0] : 'Pengguna'}
        subtitle={`Kategori Akun: ${category.toUpperCase()} • Sistem Reservasi Mini Soccer Polinela`}
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'DASHBOARD' }
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

      <div className="space-y-8 -mt-6">
        {/* 2. Pending Payment Alert Banner (if any booking waiting for payment) */}
        {pendingBooking && (
          <div className="p-4 sm:p-5 rounded-[20px] bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs font-mono uppercase tracking-wider text-amber-900">
                    Menunggu Pembayaran #{pendingBooking.booking_code}
                  </h4>
                  {pendingBooking.expires_at && (
                    <Countdown targetDate={pendingBooking.expires_at} />
                  )}
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  Selesaikan pembayaran Rp {formatRupiah(pendingBooking.dp_amount || pendingBooking.total_price)} sebelum batas waktu berakhir untuk mengunci slot.
                </p>
              </div>
            </div>

            <Button
              variant="accent"
              size="sm"
              onClick={() => navigate('/dashboard/bookings')}
            >
              Bayar Sekarang
            </Button>
          </div>
        )}

        {/* 3. Identity Verification Banner (if Mahasiswa/Karyawan pending) */}
        {category !== 'umum' && identityStatus === 'unverified' && (
          <div className="p-4 sm:p-5 rounded-[20px] bg-blue-50 border border-blue-200 text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-xs font-mono uppercase tracking-wider text-blue-900">
                  Kartu Identitas ({category.toUpperCase()}) Sedang Diverifikasi Admin
                </h4>
                <p className="text-xs text-blue-700 mt-0.5">
                  Admin BPU Polinela sedang memvalidasi data Anda. Tarif khusus akan aktif otomatis setelah disetujui.
                </p>
              </div>
            </div>

            <Link to="/dashboard/profil">
              <Button variant="secondary" size="sm">
                Lihat Berkas
              </Button>
            </Link>
          </div>
        )}

        {/* 4. StatCards Row (2x2 grid on mobile!) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <StatCard
            variant="dark"
            title="TOTAL RESERVASI"
            value={stats.total_bookings ?? 0}
            icon={Calendar}
            subtitle="Seluruh riwayat sewa"
          />

          <StatCard
            variant="light"
            title="JADWAL AKTIF"
            value={stats.active_bookings ?? 0}
            icon={Ticket}
            subtitle="Menunggu & terkonfirmasi"
          />

          <StatCard
            variant="light"
            title="PERTANDINGAN SELESAI"
            value={stats.completed_bookings ?? 0}
            icon={CheckCircle2}
            subtitle="Selesai digunakan"
          />

          <StatCard
            variant="light"
            title="TOTAL DIBAYARKAN"
            value={stats.total_expenditure ?? stats.total_spent ?? 0}
            isCurrency
            icon={CreditCard}
            subtitle="Akumulasi pembayaran resmi"
          />
        </div>

        {/* 5. Next Upcoming Match Card (Card with Countdown) */}
        <div className="bg-[var(--surface)] rounded-[24px] border border-[var(--line)] shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--line)]">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-3 rounded-full bg-[var(--accent-strong)] shrink-0" />
                <span className="font-sans text-xs uppercase tracking-wider text-[var(--accent-strong)] font-bold">
                  Jadwal Pertandingan Terdekat
                </span>
              </div>
              <h3 className="font-sans font-bold text-xl text-[var(--ink)]">
                Pertandingan Anda Berikutnya
              </h3>
            </div>

            {upcomingBooking && (
              <StatusBadge status={upcomingBooking.status} />
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton variant="text" className="w-1/3 h-6" />
              <Skeleton variant="rect" className="h-24" />
            </div>
          ) : upcomingBooking ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-[14px] bg-[var(--paper-2)] space-y-1">
                    <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">KODE RESERVASI</span>
                    <span className="font-mono text-base font-bold text-[var(--ink)] block">
                      {upcomingBooking.booking_code}
                    </span>
                  </div>

                  <div className="p-4 rounded-[14px] bg-[var(--paper-2)] space-y-1">
                    <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">LAPANGAN</span>
                    <span className="font-semibold text-sm text-[var(--ink)] block">
                      {upcomingBooking.field_name || upcomingBooking.field?.name || 'Lapangan Utama'}
                    </span>
                  </div>

                  <div className="p-4 rounded-[14px] bg-[var(--paper-2)] space-y-1">
                    <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">TANGGAL MAIN</span>
                    <span className="font-semibold text-sm text-[var(--ink)] block">
                      {upcomingBooking.play_date ? formatDateIndo(upcomingBooking.play_date) : '-'}
                    </span>
                  </div>

                  <div className="p-4 rounded-[14px] bg-[var(--paper-2)] space-y-1">
                    <span className="font-mono text-[10px] text-[var(--ink-3)] uppercase block">WAKTU PERTANDINGAN</span>
                    <span className="font-semibold text-sm text-[var(--ink)] block">
                      {upcomingBooking.start_time?.slice(0, 5)} - {upcomingBooking.end_time?.slice(0, 5)} WIB
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Column: E-Ticket preview & Button */}
              <div className="lg:col-span-4 flex flex-col justify-center items-center p-6 rounded-[20px] bg-[var(--surface-tint)] border border-[var(--line-strong)] text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--surface)] text-[var(--accent-strong)] flex items-center justify-center mb-3 shadow-xs">
                  <QrCode className="w-6 h-6" />
                </div>
                <h4 className="font-sans font-bold text-sm text-[var(--ink)]">
                  E-Tiket Siap Digunakan
                </h4>
                <p className="text-xs text-[var(--ink-2)] mt-1 mb-4">
                  Tunjukkan barcode kepada pengawas lapangan sebelum kick-off.
                </p>

                <Button
                  variant="accent"
                  size="md"
                  block
                  icon={<QrCode className="w-4 h-4" />}
                  onClick={() => setSelectedTicket(upcomingBooking)}
                >
                  Buka E-Tiket
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-3">
              <Calendar className="w-12 h-12 text-[var(--ink-3)] mx-auto opacity-50" />
              <h4 className="font-sans font-bold text-base text-[var(--ink)]">
                Belum Ada Jadwal Pertandingan Mendatang
              </h4>
              <p className="text-xs text-[var(--ink-2)] max-w-sm mx-auto">
                Pilih slot lapangan dan waktu yang sesuai untuk bermain bersama tim Anda.
              </p>
              <div className="pt-2">
                <Button
                  variant="accent"
                  size="md"
                  icon={<PlusCircle className="w-4 h-4" />}
                  onClick={() => navigate('/dashboard/booking')}
                >
                  Pesan Lapangan Sekarang
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* E-Ticket Modal (Reusing ETicketCard Component) */}
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
    </DashboardLayout>
  );
}

export default UserDashboard;
