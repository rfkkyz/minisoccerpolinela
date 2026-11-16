import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { userMenuItems } from './userMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatRupiah, formatDate, formatDateIndo } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';
import { 
  Calendar as CalendarIcon, Clock, Lock, ShieldCheck, ArrowRight, 
  ArrowLeft, CheckCircle2, AlertCircle, Copy, Check, ChevronLeft, ChevronRight,
  Sun, Moon, Sparkles, MapPin, Check as CheckIcon, Info
} from 'lucide-react';
import { Countdown } from '../../components/ui/Countdown';
import { Stepper } from '../../components/ui/Stepper';
import { FileUpload } from '../../components/ui/FileUpload';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import confetti from 'canvas-confetti';
import { ETicketCard } from '../../components/ticket/ETicketCard';

export function UserBookingWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Parse query params
  const queryParams = new URLSearchParams(location.search);
  const initialFieldId = queryParams.get('field_id') ? Number(queryParams.get('field_id')) : 1;
  const initialDate = queryParams.get('date') || todayStr;
  const initialHour = queryParams.get('start_hour') ? Number(queryParams.get('start_hour')) : 8;
  const initialDuration = queryParams.get('duration') ? Number(queryParams.get('duration')) : 2;

  // Wizard Step: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [fields, setFields] = useState([]);
  const [selectedFieldId, setSelectedFieldId] = useState(initialFieldId);
  const [selectedDate, setSelectedDate] = useState(initialDate);

  // Calendar Month & Year
  const initialParsedDate = new Date(initialDate);
  const [currentYear, setCurrentYear] = useState(!isNaN(initialParsedDate.getTime()) ? initialParsedDate.getFullYear() : today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(!isNaN(initialParsedDate.getTime()) ? initialParsedDate.getMonth() + 1 : today.getMonth() + 1);

  const [monthStatus, setMonthStatus] = useState({});
  const [daySlots, setDaySlots] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);

  // Selected hour slots
  const [selectedHours, setSelectedHours] = useState(() => {
    return Array.from({ length: initialDuration }, (_, i) => initialHour + i);
  });

  // Selected Tariff Tier (defaults to user's category)
  const userCategory = user?.category || 'umum';
  const [tariffTier, setTariffTier] = useState(userCategory);
  const [customerWhatsapp, setCustomerWhatsapp] = useState(user?.phone || user?.whatsapp || '');
  const requestedTier = queryParams.get('tier');
  const showTierNotice = requestedTier && user?.category && requestedTier.toLowerCase() !== user.category.toLowerCase();

  useEffect(() => {
    if (user?.category) {
      setTariffTier(user.category);
    }
    if (user && !customerWhatsapp) {
      setCustomerWhatsapp(user.phone || user.whatsapp || '');
    }
  }, [user]);

  // Lock State
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockedHours, setLockedHours] = useState([]);
  const [createdBookingData, setCreatedBookingData] = useState(null);

  // Payment Option State
  const [paymentType, setPaymentType] = useState('dp_50'); // 'dp_50' | 'full_100'
  const [proofFile, setProofFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Bank Info
  const bankInfo = {
    bank_name: 'BANK SYARIAH INDONESIA (BSI)',
    account_number: '7144-8899-0011',
    account_holder: 'BPU POLITEKNIK NEGERI LAMPUNG',
  };

  // 1. Fetch Fields on Mount
  useEffect(() => {
    apiClient.public.fields()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.fields) ? res.data.fields : [];
        if (list.length > 0) {
          setFields(list);
          if (!selectedFieldId) setSelectedFieldId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch Month Availability
  useEffect(() => {
    if (!selectedFieldId) return;
    apiClient.public.monthAvailability(selectedFieldId, currentYear, currentMonth)
      .then((res) => {
        if (res.data) {
          setMonthStatus(res.data);
        }
      })
      .catch(() => {});
  }, [selectedFieldId, currentYear, currentMonth]);

  // 3. Fetch Day Slots when selectedDate or field changes
  useEffect(() => {
    if (!selectedFieldId || !selectedDate) return;
    setLoadingDay(true);
    apiClient.public.availability(selectedFieldId, selectedDate)
      .then((res) => {
        let slots = [];
        if (res.data && Array.isArray(res.data.slots)) {
          slots = res.data.slots;
        } else if (Array.isArray(res.data)) {
          slots = res.data;
        } else {
          slots = Array.from({ length: 18 }, (_, i) => ({
            hour: i + 6,
            status: 'available',
            label: `${String(i + 6).padStart(2, '0')}:00 - ${String(i + 7).padStart(2, '0')}:00`,
          }));
        }
        setDaySlots(slots);
        // Only adjust selected hours on Step 1 when slots are not locked yet
        if (currentStep === 1 && !isLocked) {
          setSelectedHours(prev => {
            const avail = slots.filter(s => s.status === 'available').map(s => s.hour);
            const valid = prev.filter(h => avail.includes(h));
            if (valid.length > 0) return valid;
            return avail.length > 0 ? [avail[0]] : [];
          });
        }
      })
      .catch(() => {
        const fallback = Array.from({ length: 18 }, (_, i) => ({
          hour: i + 6,
          status: 'available',
          label: `${String(i + 6).padStart(2, '0')}:00 - ${String(i + 7).padStart(2, '0')}:00`,
        }));
        setDaySlots(fallback);
      })
      .finally(() => setLoadingDay(false));
  }, [selectedFieldId, selectedDate, currentStep, isLocked]);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sunday

  const activeField = useMemo(() => {
    return fields.find(f => f.id === Number(selectedFieldId)) || fields[0] || {
      name: 'Lapangan Mini Soccer Polinela',
      price_umum: 150000,
      price_mahasiswa: 100000,
      price_karyawan: 120000,
      prices: { umum: 150000, mahasiswa: 100000, karyawan: 120000 }
    };
  }, [fields, selectedFieldId]);

  // Pricing Calculation
  const quote = useMemo(() => {
    const hours = selectedHours.length || 1;
    const tier = tariffTier || 'umum';
    
    let pricePerHour = 150000;
    if (activeField?.prices && activeField.prices[tier]) {
      pricePerHour = Number(activeField.prices[tier]);
    } else if (activeField?.[`price_${tier}`]) {
      pricePerHour = Number(activeField[`price_${tier}`]);
    }

    const totalPrice = pricePerHour * hours;
    const dpAmount = Math.round(totalPrice * 0.5);
    const payNow = paymentType === 'dp_50' ? dpAmount : totalPrice;
    const remainingAmount = totalPrice - payNow;

    return {
      hours,
      tariffTier: tier,
      pricePerHour,
      totalPrice,
      payNow,
      dpAmount,
      remainingAmount
    };
  }, [activeField, selectedHours, tariffTier, paymentType]);

  // Handle Hour toggle (consecutive up to 3 hours max)
  const toggleHour = (hour, status) => {
    if (status !== 'available') return;
    if (selectedHours.includes(hour)) {
      if (selectedHours.length > 1) {
        const min = Math.min(...selectedHours);
        const max = Math.max(...selectedHours);
        if (hour === min || hour === max) {
          setSelectedHours(selectedHours.filter(h => h !== hour));
        } else {
          // Deselected middle hour: keep only clicked hour to avoid non-consecutive gap
          setSelectedHours([hour]);
        }
      }
    } else {
      const min = Math.min(...selectedHours);
      const max = Math.max(...selectedHours);
      if (hour === min - 1 && selectedHours.length < 3) {
        setSelectedHours([hour, ...selectedHours].sort((a, b) => a - b));
      } else if (hour === max + 1 && selectedHours.length < 3) {
        setSelectedHours([...selectedHours, hour].sort((a, b) => a - b));
      } else {
        // Non-adjacent or limit reached: switch selection to clicked slot
        setSelectedHours([hour]);
      }
    }
  };

  // Lanjut ke Pembayaran & Mengunci Slot Otomatis
  const handleProceedToPayment = async () => {
    if (!selectedHours || selectedHours.length === 0) {
      setError('Silakan pilih setidaknya 1 slot jam terlebih dahulu.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const minHour = Math.min(...selectedHours);
      const duration = selectedHours.length;

      const res = await apiClient.bookings.lock({
        field_id: selectedFieldId,
        date: selectedDate,
        start_hour: minHour,
        duration: duration,
        hours: selectedHours,
      });

      if (res.data?.expires_at) {
        setLockExpiresAt(res.data.expires_at);
        setIsLocked(true);
        setLockedHours([...selectedHours]);
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Kembali Ubah Jadwal (Lepaskan Kunci Slot)
  const handleBackToSchedule = async () => {
    const hoursToRelease = lockedHours.length > 0 ? lockedHours : selectedHours;
    try {
      await apiClient.bookings.releaseLock({
        field_id: selectedFieldId,
        date: selectedDate,
        hours: hoursToRelease,
      });
    } catch (_) {}
    setIsLocked(false);
    setLockExpiresAt(null);
    setLockedHours([]);
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Copy Bank Account
  const handleCopy = () => {
    navigator.clipboard.writeText(bankInfo.account_number.replace(/-/g, ''));
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  // Final Submit Booking
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const hoursToSubmit = lockedHours.length > 0 ? lockedHours : selectedHours;
    if (!hoursToSubmit || hoursToSubmit.length === 0) {
      setError('Jadwal jam pemesanan belum ditentukan. Silakan kembali ke Langkah 1 untuk memilih jam.');
      return;
    }
    if (!selectedDate) {
      setError('Tanggal pemesanan belum ditentukan.');
      return;
    }

    const cleanPhone = (customerWhatsapp || user?.phone || user?.whatsapp || '').replace(/\D/g, '');
    if (!cleanPhone) {
      setError('Nomor WhatsApp aktif wajib diisi untuk konfirmasi tiket & koordinasi lapangan.');
      return;
    }
    if (!/^(08|628)[0-9]{8,12}$/.test(cleanPhone)) {
      setError('Nomor WhatsApp tidak valid. Format: 08xx atau 628xx (10-14 digit angka).');
      return;
    }

    if (!proofFile) {
      setError('Harap unggah struk / bukti transfer pembayaran terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const uniqueHours = [...new Set(hoursToSubmit)].sort((a, b) => a - b);
      const minHour = Math.min(...uniqueHours);
      const duration = uniqueHours.length;

      const formData = new FormData();
      formData.append('field_id', selectedFieldId);
      formData.append('booking_date', selectedDate);
      formData.append('start_hour', minHour);
      formData.append('end_hour', minHour + duration);
      uniqueHours.forEach(h => {
        formData.append('hours[]', h);
      });
      formData.append('customer_name', user?.full_name || user?.name || user?.username || 'Pemesan');
      formData.append('whatsapp', cleanPhone);
      formData.append('tariff_tier', tariffTier);
      formData.append('payment_type', paymentType);

      if (proofFile) {
        formData.append('proof_of_payment', proofFile);
      }

      const res = await apiClient.bookings.reserve(formData);
      const bookingResult = res.data?.data || res.data?.booking || res.data || {};
      
      setCreatedBookingData({
        ...bookingResult,
        booking_code: bookingResult.booking_code || `POL-${selectedDate.replace(/-/g, '').slice(2)}-${Math.floor(1000 + Math.random() * 9000)}`,
        field_name: activeField?.name || 'Lapangan Mini Soccer Polinela',
        booking_date: selectedDate,
        start_hour: minHour,
        end_hour: minHour + duration,
        hours_count: duration,
        customer_name: user?.full_name || user?.name || user?.username || 'Pemesan',
        whatsapp: cleanPhone,
        tariff_tier: tariffTier,
        total_price: bookingResult.total || bookingResult.total_price || quote.totalPrice,
        paid_amount: bookingResult.pay_now || quote.payNow,
        payment_status: paymentType === 'full_100' ? 'fully_paid' : 'dp_paid_50',
        payment_type: paymentType,
        is_checked_in: false,
      });

      setIsLocked(false);
      setLockExpiresAt(null);
      setLockedHours([]);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 }
        });
      } catch (_) {}
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { id: 1, label: 'Jadwal & Jam' },
    { id: 2, label: 'Pembayaran' },
    { id: 3, label: 'Selesai' }
  ];

  return (
    <DashboardLayout
      role="user"
      menuItems={userMenuItems}
    >
      <PageHeader
        title="Reservasi Lapangan Mini Soccer"
        highlightWord="Mini Soccer"
        subtitle="Pilih tanggal di kalender dan slot jam yang diinginkan dengan sistem kunci anti bentrok"
        breadcrumbs={[
          { label: 'BERANDA', path: '/' },
          { label: 'DASHBOARD', path: '/dashboard' },
          { label: 'PESAN LAPANGAN' }
        ]}
      />

      <div className="-mt-6 space-y-8 pb-12">
        {/* Stepper Wizard Indicator */}
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-[24px] border border-slate-200/90 shadow-xs">
          <Stepper
            steps={stepsList}
            currentStep={currentStep}
            onStepClick={(step) => {
              if (step < currentStep && !isLocked) setCurrentStep(step);
            }}
          />
        </div>

        {/* Payment Timer Banner when in payment step */}
        {isLocked && lockExpiresAt && currentStep === 2 && (
          <div className="p-4 sm:p-5 rounded-[22px] bg-emerald-50/90 border border-emerald-300 text-emerald-900 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#12A150] shrink-0" />
              <div>
                <span className="font-sans text-xs font-bold uppercase tracking-wider block">
                  BATAS WAKTU PENYELESAIAN PEMBAYARAN
                </span>
                <span className="text-xs text-emerald-800">
                  Selesaikan transfer dan unggah bukti pembayaran sebelum waktu habis.
                </span>
              </div>
            </div>
            <div className="font-zen text-base sm:text-xl font-bold text-emerald-900 shrink-0">
              <Countdown
                targetTime={lockExpiresAt}
                onExpire={() => {
                  alert('Waktu pembayaran habis. Jadwal telah dilepaskan kembali.');
                  setIsLocked(false);
                  setLockExpiresAt(null);
                  setCurrentStep(1);
                }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-[18px] bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {showTierNotice && (
          <div className="p-4 rounded-[18px] bg-blue-50/90 border border-blue-200 text-blue-900 text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Anda memilih tautan <strong>Tarif {requestedTier.toUpperCase()}</strong>, namun akun Anda terdaftar sebagai kategori <strong>{user?.category?.toUpperCase()}</strong>. Sistem otomatis menerapkan tarif sesuai kategori akun Anda ({user?.category?.toUpperCase()}).
              </span>
            </div>
            {user?.category === 'umum' && (
              <Link to="/dashboard/profil" className="shrink-0 text-blue-700 underline font-semibold text-[11px]">
                Verifikasi Berkas Kampus
              </Link>
            )}
          </div>
        )}

        {/* Main Step View */}
        {currentStep === 3 && createdBookingData ? (
          <div className="bg-white/95 backdrop-blur-md p-6 sm:p-10 rounded-[28px] border border-emerald-500/20 shadow-[0_12px_40px_rgba(14,42,32,0.08)] space-y-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Celebration Header */}
            <div className="text-center max-w-xl mx-auto space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#12A150] to-[#0A803E] text-white mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h2 className="font-extrabold text-2xl sm:text-3xl text-[var(--ink)] tracking-tight font-sans">
                Reservasi Berhasil Dikonfirmasi!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                E-Tiket resmi pertandingan Anda telah diterbitkan. Tunjukkan barcode QR Code ini kepada petugas admin di gerbang mini soccer untuk validasi check-in masuk lapangan.
              </p>
            </div>

            {/* The Stylized Horizontal Match Pass E-Ticket */}
            <ETicketCard booking={createdBookingData} showActions={true} />

            {/* Bottom Navigation Links */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="accent"
                size="md"
                onClick={() => navigate('/dashboard/bookings')}
                icon={<CalendarIcon className="w-4 h-4" />}
              >
                Lihat di Pesanan Saya
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setCreatedBookingData(null);
                  setCurrentStep(1);
                }}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Pesan Jadwal Baru
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          
          {/* ESTIMASI BIAYA CARD (order-2 on mobile, order-1 sticky on desktop) */}
          <div className="order-2 lg:order-1 lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white/95 backdrop-blur-md rounded-[22px] sm:rounded-[28px] p-4 sm:p-7 border border-emerald-500/20 shadow-[0_8px_30px_rgba(14,42,32,0.06)] space-y-4 sm:space-y-6">
              
              {/* Card Header */}
              <div className="pb-3 sm:pb-4 border-b border-slate-100">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#0B7A3B] text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wide mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12A150]" />
                  <span>Estimasi Biaya Sewa</span>
                </div>
                <h3 className="font-zen font-bold text-lg sm:text-xl text-[var(--ink)] tracking-tight">
                  {activeField.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#12A150] shrink-0" />
                  <span>Kampus Polinela, Rajabasa, Bandar Lampung</span>
                </p>
              </div>

              {/* Price Details */}
              <div className="space-y-2 sm:space-y-3 text-xs font-sans">
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Kategori Tarif:</span>
                  <Chip tier={quote.tariffTier} />
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Tarif Resmi / Jam:</span>
                  <span className="font-bold text-[var(--ink)]">{formatRupiah(quote.pricePerHour)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Durasi Bermain:</span>
                  <span className="font-bold text-[#0B7A3B] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {quote.hours} Jam Terpilih
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Tanggal Main:</span>
                  <span className="font-bold text-[var(--ink)]">{selectedDate ? formatDateIndo(selectedDate) : '-'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">Jam Main:</span>
                  <span className="font-bold text-[var(--ink)] text-right">
                    {selectedHours.length > 0
                      ? `${Math.min(...selectedHours)}:00 - ${Math.max(...selectedHours) + 1}:00 WIB`
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Total & Payment Summary */}
              <div className="pt-3 sm:pt-4 border-t border-slate-100 space-y-2.5 sm:space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-sans font-bold text-slate-500 uppercase tracking-wide">Total Biaya Sewa</span>
                  <span className="font-zen font-bold text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
                    {formatRupiah(quote.totalPrice)}
                  </span>
                </div>

                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-200/80 space-y-2">
                  <div className="flex justify-between items-center text-xs text-[#0B7A3B] font-bold">
                    <span>Bayar Sekarang ({paymentType === 'dp_50' ? 'DP 50%' : 'Lunas 100%'}):</span>
                    <span className="font-zen text-sm sm:text-base font-extrabold text-[#0B7A3B]">
                      {formatRupiah(quote.payNow)}
                    </span>
                  </div>
                  {quote.remainingAmount > 0 && (
                    <div className="flex justify-between items-center text-[10px] sm:text-[11px] text-slate-500 pt-1.5 border-t border-emerald-200/50">
                      <span>Sisa Pembayaran di Lapangan:</span>
                      <span className="font-semibold text-slate-700">{formatRupiah(quote.remainingAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step Navigation Action on Left Panel */}
              <div className="pt-1 sm:pt-2">
                {currentStep === 1 ? (
                  <button
                    type="button"
                    disabled={selectedHours.length === 0 || loading}
                    onClick={handleProceedToPayment}
                    className="w-full h-11 sm:h-[52px] rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#12A150] to-[#0A803E] hover:from-[#0D8741] hover:to-[#086732] text-white font-sans font-bold text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(18,161,80,0.30)] hover:shadow-[0_14px_32px_rgba(18,161,80,0.40)] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>{loading ? 'Menyiapkan...' : 'Lanjut ke Pembayaran'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleBackToSchedule}
                    className="w-full h-10 sm:h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Ubah Jadwal</span>
                  </button>
                )}
              </div>

              {/* Anti Double-Booking Note */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-slate-500 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#12A150] shrink-0" />
                <span>Sistem reservasi resmi &amp; anti-bentrok</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Big Calendar & Big Slots (order-1 on mobile, order-2 on desktop) */}
          <div className="order-1 lg:order-2 lg:col-span-8 space-y-4 sm:space-y-6">
            
            {/* STEP 1: Big Calendar & Big Slots */}
            {currentStep === 1 && (
              <div className="space-y-4 sm:space-y-6">
                
                {/* Status Indicator Legend */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-6 text-[11px] sm:text-xs font-sans font-medium text-slate-600 bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-[18px] sm:rounded-[24px] border border-emerald-500/20 shadow-xs">
                  <div className="flex items-center gap-1.5 text-[var(--ink)] font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
                    <span className="w-1.5 h-3 sm:h-3.5 rounded-full bg-[#12A150] shrink-0" />
                    <span>Indikator Status:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500" />
                    <span>Tersedia</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-400" />
                    <span>Dalam Proses Pembayaran</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-rose-500" />
                    <span>Terisi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-slate-400" />
                    <span>Terkunci</span>
                  </div>
                </div>

                {/* 1. Monthly Calendar Card */}
                <div className="bg-white/95 backdrop-blur-md rounded-[22px] sm:rounded-[28px] p-4 sm:p-7 border border-emerald-500/20 shadow-[0_8px_30px_rgba(14,42,32,0.06)] space-y-4 sm:space-y-6">
                  {/* Calendar Month Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[#12A150] flex items-center justify-center shrink-0 shadow-xs">
                        <CalendarIcon className="w-4 h-4 stroke-[2]" />
                      </div>
                      <span className="font-zen font-bold text-base sm:text-2xl text-[var(--ink)] tracking-tight">
                        {monthNames[currentMonth - 1]} {currentYear}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        aria-label="Bulan sebelumnya"
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200 hover:border-[#12A150] hover:bg-emerald-50 text-[var(--ink)] hover:text-[#12A150] flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        aria-label="Bulan berikutnya"
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200 hover:border-[#12A150] hover:bg-emerald-50 text-[var(--ink)] hover:text-[#12A150] flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                  {/* Days of week */}
                  <div className="grid grid-cols-7 text-center font-sans text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                    {['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'].map(d => (
                      <div key={d} className="py-1">{d}</div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center">
                    {/* Empty padding before day 1 */}
                    {Array.from({ length: firstDayIndex }).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2 text-transparent select-none">-</div>
                    ))}

                    {/* Days in month */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const dayNum = i + 1;
                      const dateKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const isSelected = selectedDate === dateKey;
                      const isPast = dateKey < todayStr;
                      const isToday = dateKey === todayStr;

                      // Month availability status for this day
                      const dayInfo = monthStatus[dateKey];
                      const availableCount = dayInfo ? dayInfo.available_slots : 14;

                      // Color code for indicator dot
                      let dotColor = 'bg-emerald-500';
                      if (isPast) dotColor = 'bg-slate-300';
                      else if (availableCount === 0) dotColor = 'bg-rose-500';
                      else if (availableCount <= 5) dotColor = 'bg-amber-400';

                      return (
                        <button
                          key={dateKey}
                          type="button"
                          disabled={isPast}
                          onClick={() => setSelectedDate(dateKey)}
                          className={`relative h-11 sm:h-12 p-1 rounded-[14px] sm:rounded-[16px] flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-br from-[#12A150] to-[#0A803E] text-white font-extrabold shadow-[0_8px_20px_rgba(18,161,80,0.35)] scale-[1.04] ring-2 ring-emerald-400/50'
                              : isPast
                              ? 'text-slate-300 cursor-not-allowed bg-transparent'
                              : isToday
                              ? 'bg-emerald-50 text-[#12A150] font-extrabold border-2 border-[#12A150] hover:bg-emerald-100 shadow-xs'
                              : 'bg-slate-50/70 text-[var(--ink)] font-bold text-xs sm:text-sm hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200/70 hover:scale-105 hover:shadow-xs'
                          }`}
                        >
                          <span className="font-sans text-xs sm:text-sm leading-none">{dayNum}</span>
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${isSelected ? 'bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]' : dotColor}`} />
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Footer Info */}
                  <div className="pt-4 border-t border-slate-100 text-xs font-sans flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>Hari Ini: <strong className="text-[var(--ink)]">{formatDate(todayStr)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#0B7A3B] font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Jam Operasional: 06:00 - 24:00 WIB</span>
                    </div>
                  </div>
                </div>

                {/* 2. Hourly Slots Grid Card */}
                <div className="bg-white/95 backdrop-blur-md rounded-[22px] sm:rounded-[28px] p-4 sm:p-7 border border-emerald-500/20 shadow-[0_8px_30px_rgba(14,42,32,0.06)] space-y-4 sm:space-y-6">
                  
                  {/* Slot Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 sm:pb-4 border-b border-slate-100">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-[#0B7A3B] mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#12A150]" />
                        Tanggal Terpilih
                      </span>
                      <h3 className="font-zen font-bold text-lg sm:text-3xl text-[var(--ink)] tracking-tight">
                        {formatDate(selectedDate)}
                      </h3>
                    </div>
                    <div className="text-[11px] sm:text-xs font-sans font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 self-start sm:self-center">
                      Pilih satu atau beberapa slot jam:
                    </div>
                  </div>

                  {/* Hour Cards Grid (3 Columns on mobile & desktop) */}
                  <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
                    {(Array.isArray(daySlots) ? daySlots : []).map((slot) => {
                      const hour = slot.hour;
                      const status = slot.status || 'available';
                      const isAvailable = status === 'available';
                      const isSelected = selectedHours.includes(hour);
                      const isNight = hour >= 18;
                      const isMorning = hour < 12;

                      return (
                        <button
                          key={hour}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => toggleHour(hour, status)}
                          className={`p-2 sm:p-4 rounded-[14px] sm:rounded-[20px] border-2 text-left transition-all duration-200 relative flex flex-col justify-between min-h-[58px] sm:min-h-[92px] ${
                            isSelected && isAvailable
                              ? 'bg-gradient-to-br from-[#12A150] to-[#0A803E] border-[#12A150] text-white shadow-[0_8px_20px_rgba(18,161,80,0.30)] scale-[1.02] ring-2 ring-emerald-400/40 cursor-pointer'
                              : isAvailable
                              ? 'bg-white border-slate-200/90 text-[var(--ink)] hover:border-[#12A150] hover:bg-emerald-50/40 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer'
                              : status === 'pending_hold'
                              ? 'bg-amber-50/70 border-amber-200 text-amber-900 cursor-not-allowed'
                              : 'bg-slate-50/70 border-slate-200/60 text-slate-400 cursor-not-allowed opacity-60'
                          }`}
                        >
                          {/* Top Row: Time & Period Icon */}
                          <div className="flex items-center justify-between">
                            <span className={`font-zen font-bold text-xs sm:text-base tracking-wide ${isSelected && isAvailable ? 'text-white' : 'text-[var(--ink)]'}`}>
                              {String(hour).padStart(2, '0')}:00{' '}
                              <span className={`font-sans text-[8px] sm:text-[11px] font-bold ${isSelected && isAvailable ? 'text-emerald-100' : 'text-slate-400'}`}>
                                WIB
                              </span>
                            </span>

                            {isSelected && isAvailable ? (
                              <span className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-white text-[#12A150] flex items-center justify-center shrink-0 shadow-xs">
                                <CheckIcon className="w-2 sm:w-3 h-2 sm:h-3 stroke-[3]" />
                              </span>
                            ) : isNight ? (
                              <span className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shrink-0" title="Malam (Gratis Lampu Sorot)">
                                <Moon className="w-2 sm:w-3 h-2 sm:h-3" />
                              </span>
                            ) : isMorning ? (
                              <span className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-md bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0" title="Pagi">
                                <Sun className="w-2 sm:w-3 h-2 sm:h-3" />
                              </span>
                            ) : null}
                          </div>

                          {/* Bottom Row: Status Badge */}
                          <div className="mt-1 sm:mt-2.5">
                            {isSelected && isAvailable ? (
                              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-sans font-bold bg-white/20 text-white backdrop-blur-sm">
                                Terpilih
                              </span>
                            ) : isAvailable ? (
                              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-sans font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Tersedia
                              </span>
                            ) : status === 'booked' ? (
                              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-sans font-medium bg-rose-50 text-rose-600 border border-rose-200">
                                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-rose-500" />
                                Terisi
                              </span>
                            ) : status === 'pending_hold' ? (
                              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-sans font-medium bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock className="w-2 sm:w-2.5 h-2 sm:h-2.5 animate-spin" />
                                Proses
                              </span>
                            ) : status === 'past' ? (
                              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-sans font-medium bg-slate-100 text-slate-400 border border-slate-200">
                                Waktu Lewat
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-sans font-medium bg-slate-200 text-slate-600">
                                Perawatan
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bottom Summary Bar & Action Button */}
                  <div className="pt-4 sm:pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-[#0B7A3B] font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wide">
                        <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#12A150]" />
                        <span>Total {selectedHours.length} Jam Dipilih</span>
                        <span className="text-emerald-800 font-semibold normal-case">
                          ({selectedHours.map(h => `${String(h).padStart(2, '0')}:00`).join(', ')})
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] sm:text-xs font-sans text-slate-500">
                        <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#12A150] shrink-0" />
                        <span>Jadwal dilindungi otomatis saat Anda lanjut ke pembayaran.</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleProceedToPayment}
                      disabled={selectedHours.length === 0 || loading}
                      className="group h-11 sm:h-[52px] px-5 sm:px-8 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#12A150] to-[#0A803E] hover:from-[#0D8741] hover:to-[#086732] text-white font-sans font-bold text-xs sm:text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(18,161,80,0.30)] hover:shadow-[0_14px_32px_rgba(18,161,80,0.40)] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      <span>{loading ? 'MEMPROSES...' : 'LANJUT KE PEMBAYARAN'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* STEP 2: Pembayaran & Bukti Transfer */}
            {currentStep === 2 && (
              <form onSubmit={handleFinalSubmit} className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-[28px] border border-emerald-500/20 shadow-[0_8px_30px_rgba(14,42,32,0.06)] space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#0B7A3B] text-[11px] font-sans font-bold uppercase tracking-wide mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12A150]" />
                    <span>Langkah 2: Pembayaran Resmi</span>
                  </div>
                  <h3 className="font-zen font-bold text-2xl text-[var(--ink)] tracking-tight">
                    Pembayaran &amp; Unggah Bukti Transfer
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Pilih skema pembayaran (DP 50% atau Lunas 100%) dan transfer ke rekening resmi Polinela.
                  </p>
                </div>

                {/* Detail Pemesanan Ringkas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs font-sans">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">PEMESAN</span>
                    <span className="font-bold text-xs sm:text-sm text-[var(--ink)] truncate block">
                      {user?.full_name || user?.name || user?.username || 'Pemesan'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">TANGGAL &amp; ARENA</span>
                    <span className="font-bold text-xs sm:text-sm text-[var(--ink)] truncate block">
                      {formatDateIndo(selectedDate)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">JAM MAIN</span>
                    <span className="font-bold text-xs sm:text-sm text-[#0B7A3B] truncate block">
                      {(lockedHours.length > 0 ? lockedHours : selectedHours).length > 0
                        ? `${Math.min(...(lockedHours.length > 0 ? lockedHours : selectedHours))}:00 - ${Math.max(...(lockedHours.length > 0 ? lockedHours : selectedHours)) + 1}:00 WIB (${(lockedHours.length > 0 ? lockedHours : selectedHours).length} Jam)`
                        : 'Belum dipilih'}
                    </span>
                  </div>
                </div>

                {/* Nomor WhatsApp Pemesan */}
                <div className="space-y-1.5 p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <label className="block font-sans text-xs font-bold uppercase tracking-wider text-slate-700">
                      Nomor WhatsApp Pemesan *
                    </label>
                    <span className="text-[10px] font-sans font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Aktif untuk E-Tiket
                    </span>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={customerWhatsapp}
                    onChange={(e) => setCustomerWhatsapp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-sans text-sm text-[var(--ink)] focus:outline-none focus:border-[#12A150] focus:ring-1 focus:ring-[#12A150] transition-colors"
                  />
                  <p className="text-[11px] text-slate-500 font-sans">
                    E-Tiket resmi dan konfirmasi akan dikaitkan ke nomor ini. 4 digit terakhir nomor ini juga digunakan untuk melacak status reservasi.
                  </p>
                </div>

                {/* Payment Option Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setPaymentType('dp_50')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentType === 'dp_50'
                        ? 'border-[#12A150] bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-sans font-bold text-sm text-[var(--ink)]">Uang Muka (DP 50%)</span>
                      <span className="font-sans text-[11px] text-[#0B7A3B] font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full">REKOMENDASI</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      Bayar separuh sekarang, sisa tagihan dibayarkan tunai di lapangan sebelum kick-off.
                    </p>
                    <div className="font-zen text-lg font-bold text-[var(--ink)]">
                      {formatRupiah(quote.dpAmount)}
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentType('full_100')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentType === 'full_100'
                        ? 'border-[#12A150] bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-sans font-bold text-sm text-[var(--ink)]">Pelunasan Penuh (100%)</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">
                      Bayar lunas langsung. Tidak perlu memikirkan sisa tagihan saat hari pertandingan.
                    </p>
                    <div className="font-zen text-lg font-bold text-[var(--ink)]">
                      {formatRupiah(quote.totalPrice)}
                    </div>
                  </div>
                </div>

                {/* Bank Account Info Card */}
                <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs uppercase tracking-wider text-slate-500 font-bold">
                      REKENING RESMI POLINELA
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-xs font-sans font-semibold text-[var(--ink)] hover:text-[#12A150] transition-colors cursor-pointer shadow-xs active:scale-95"
                    >
                      {copiedAccount ? <Check className="w-3.5 h-3.5 text-[#12A150]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAccount ? 'TERSALIN' : 'SALIN'}</span>
                    </button>
                  </div>

                  <div className="font-sans text-base font-bold text-[var(--ink)]">
                    {bankInfo.bank_name}
                  </div>
                  <div className="font-zen text-2xl sm:text-3xl font-bold text-[#0B7A3B] tracking-wider">
                    {bankInfo.account_number}
                  </div>
                  <div className="text-xs text-slate-600">
                    a.n. <strong className="text-[var(--ink)]">{bankInfo.account_holder}</strong>
                  </div>
                </div>

                {/* File Upload Dropzone */}
                <div>
                  <label className="block font-sans text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Unggah Struk / Bukti Transfer *
                  </label>
                  <FileUpload
                    accept="image/*,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
                    maxSizeMB={5}
                    selectedFile={proofFile}
                    onFileSelected={(file) => setProofFile(file)}
                  />
                </div>

                {error && (
                  <div className="p-3.5 sm:p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 shadow-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    className="w-full sm:w-auto"
                    onClick={handleBackToSchedule}
                    icon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Kembali Ubah Jadwal
                  </Button>

                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    className="w-full sm:w-auto"
                    loading={loading}
                    disabled={!proofFile}
                    icon={<CheckCircle2 className="w-5 h-5" />}
                  >
                    Kirim &amp; Selesaikan Reservasi
                  </Button>
                </div>
              </form>
            )}

          </div>

        </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default UserBookingWizard;