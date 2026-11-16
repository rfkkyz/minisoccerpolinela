import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PageHeader } from '../../components/layout/PageHeader';
import { adminMenuItems } from './adminMenu';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api';
import { formatRupiah, formatDateIndo } from '../../utils/format';
import { getErrorMessage } from '../../utils/errorMessage';
import { 
  QrCode, Camera, Keyboard, CheckCircle2, AlertTriangle, 
  XCircle, Clock, MapPin, User, Calendar, DollarSign,
  ArrowRight, RefreshCw, Volume2, ShieldCheck, Phone
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ETicketCard } from '../../components/ticket/ETicketCard';

// Subtle Web Audio Beeper for scanner feedback
function playSound(type = 'success') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15); // A6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (_) {}
}

export function AdminTicketScanner() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'manual'
  const [manualCode, setManualCode] = useState('');
  
  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Scanned ticket data & check-in result
  const [ticketData, setTicketData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [checkInSuccess, setCheckInSuccess] = useState('');
  const [processingCheckIn, setProcessingCheckIn] = useState(false);

  // Recent check-in history
  const [recentScans, setRecentScans] = useState([]);

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'qr-reader-viewport';

  // Initialize camera scanner
  const startScanner = async () => {
    setCameraError('');
    setIsScanning(true);
    setTicketData(null);
    setErrorMsg('');
    setCheckInSuccess('');

    try {
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (_) {}
      }

      const qrScanner = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = qrScanner;

      await qrScanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          playSound('success');
          stopScanner();
          handleValidateCode(decodedText);
        },
        () => {
          // Frame error (silently ignore unparsed frames)
        }
      );
    } catch (err) {
      setIsScanning(false);
      setCameraError(err.message || 'Kamera tidak dapat diakses. Pastikan izin kamera telah diberikan di browser.');
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (_) {}
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  // Clean up camera on unmount or tab switch
  useEffect(() => {
    if (activeTab === 'camera') {
      startScanner();
    } else {
      stopScanner();
    }
    return () => {
      stopScanner();
    };
  }, [activeTab]);

  // Validate Code API call
  const handleValidateCode = async (codeToTest) => {
    const code = (codeToTest || manualCode).trim().toUpperCase();
    if (!code) {
      setErrorMsg('Masukkan kode booking terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setCheckInSuccess('');
    setTicketData(null);

    try {
      const res = await apiClient.admin.scanTicket(code);
      // apiClient interceptor automatically returns response.data
      const ticket = res?.data || res;
      if (ticket && (ticket.booking_code || ticket.id)) {
        setTicketData(ticket);
        if (!ticket.can_check_in) {
          playSound('error');
        } else {
          playSound('success');
        }
      } else {
        playSound('error');
        setErrorMsg('Data tiket tidak ditemukan.');
      }
    } catch (err) {
      playSound('error');
      setErrorMsg(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Execute Check-in
  const handleProcessCheckIn = async (settleRemaining = false) => {
    if (!ticketData) return;
    setProcessingCheckIn(true);
    setErrorMsg('');

    try {
      const res = await apiClient.admin.checkInTicket({
        booking_code: ticketData.booking_code,
        settle_remaining: settleRemaining
      });

      playSound('success');
      setCheckInSuccess(res?.message || 'Check-in berhasil diverifikasi!');

      // Update current ticket state
      setTicketData(prev => ({
        ...prev,
        is_checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: user?.full_name || 'Admin',
        can_check_in: false,
        payment_status: settleRemaining ? 'fully_paid' : prev.payment_status,
        remaining_balance: settleRemaining ? 0 : prev.remaining_balance
      }));

      // Add to recent scans log
      setRecentScans(prev => [
        {
          code: ticketData.booking_code,
          customer: ticketData.customer_name,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          settled: settleRemaining
        },
        ...prev.slice(0, 7)
      ]);
    } catch (err) {
      playSound('error');
      setErrorMsg(getErrorMessage(err));
    } finally {
      setProcessingCheckIn(false);
    }
  };

  return (
    <DashboardLayout
      role={user?.role === 'superadmin' ? 'superadmin' : 'admin'}
      menuItems={adminMenuItems}
    >
      <PageHeader
        title="Pemindai Tiket Lapangan"
        highlightWord="Tiket Lapangan"
        subtitle="Validasi QR Code e-tiket pertandingan dan konfirmasi check-in pemain di gerbang arena"
        breadcrumbs={[
          { label: 'BERANDA', path: '/admin' },
          { label: 'SCAN TIKET' }
        ]}
      />

      <div className="-mt-6 space-y-8 pb-12">
        
        {/* Main Scanner Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column (Scanner Viewfinder & Manual Input) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Tab Controls: Camera vs Manual Input */}
            <div className="bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`flex-1 py-2.5 rounded-xl font-sans text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-[#0E2A20] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[var(--ink)] hover:bg-slate-50'
                }`}
              >
                <Camera className="w-4 h-4 text-[#7CFFB2]" />
                <span>Kamera QR Scanner</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-2.5 rounded-xl font-sans text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-[#0E2A20] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[var(--ink)] hover:bg-slate-50'
                }`}
              >
                <Keyboard className="w-4 h-4 text-[#7CFFB2]" />
                <span>Input Kode Tiket</span>
              </button>
            </div>

            {/* TAB 1: Camera Scanner Viewport */}
            {activeTab === 'camera' && (
              <div className="bg-white/95 backdrop-blur-md rounded-[24px] border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4 text-center">
                <div className="relative mx-auto max-w-[340px] aspect-square rounded-[20px] overflow-hidden bg-slate-950 border-2 border-emerald-500/40 shadow-inner flex items-center justify-center">
                  
                  {/* html5-qrcode target container */}
                  <div id={scannerContainerId} className="w-full h-full object-cover" />

                  {/* Laser Scanning Animation Overlay */}
                  {isScanning && (
                    <div className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#7CFFB2] to-transparent shadow-[0_0_12px_#7CFFB2] animate-bounce" />
                  )}

                  {!isScanning && (
                    <div className="p-6 text-center text-slate-400 space-y-3">
                      <Camera className="w-10 h-10 mx-auto text-slate-600" />
                      <p className="text-xs font-sans">
                        {cameraError || 'Kamera sedang nonaktif.'}
                      </p>
                      <Button
                        variant="accent"
                        size="sm"
                        onClick={startScanner}
                        icon={<RefreshCw className="w-4 h-4" />}
                      >
                        Mulai Kamera
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 px-2 font-sans">
                  <span>Arahkan kamera ke QR Code e-tiket pelanggan</span>
                  {isScanning && (
                    <button
                      type="button"
                      onClick={stopScanner}
                      className="text-rose-600 font-semibold hover:underline cursor-pointer"
                    >
                      Hentikan Kamera
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Manual Code Input */}
            {activeTab === 'manual' && (
              <div className="bg-white/95 backdrop-blur-md rounded-[24px] border border-slate-200/90 shadow-sm p-6 space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleValidateCode(manualCode);
                  }}
                  className="space-y-4"
                >
                  <Input
                    label="Kode Tiket Booking"
                    type="text"
                    required
                    placeholder="Contoh: POLI-261110-8721"
                    icon={QrCode}
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  />

                  <Button
                    type="submit"
                    variant="accent"
                    size="md"
                    block
                    loading={loading}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Validasi Tiket Sekarang
                  </Button>
                </form>
              </div>
            )}

            {/* Recent Scans Activity Log Card */}
            {recentScans.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/80 border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-xs font-sans font-bold text-[var(--ink)]">
                  <span>Aktivitas Check-In Terakhir</span>
                  <span className="text-[10px] text-slate-400 font-normal">{recentScans.length} Tiket</span>
                </div>
                <div className="space-y-1.5">
                  {recentScans.map((scan, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs font-sans">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#12A150]" />
                        <span className="font-mono font-bold text-[var(--ink)]">{scan.code}</span>
                        <span className="text-slate-500 truncate max-w-[120px]">{scan.customer}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        {scan.settled && <span className="text-amber-600 font-semibold px-1 rounded bg-amber-50">Pelunasan</span>}
                        <span>{scan.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Ticket Details & Action Panel */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Error Banner */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-sans flex items-start gap-2.5 shadow-xs animate-in fade-in">
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Tiket Tidak Valid</span>
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {checkInSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-[#0E2A20] text-xs font-sans flex items-start gap-2.5 shadow-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#12A150] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Check-In Berhasil!</span>
                  <span>{checkInSuccess}</span>
                </div>
              </div>
            )}

            {/* Ticket Card Details View */}
            {ticketData ? (
              <div className="space-y-4">
                
                {/* Status Callout Card */}
                <div className={`p-4 rounded-[20px] border shadow-xs flex items-center justify-between gap-3 ${
                  ticketData.is_checked_in
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : ticketData.payment_status === 'dp_paid_50'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-300 text-[#0E2A20]'
                }`}>
                  <div className="flex items-center gap-3">
                    {ticketData.is_checked_in ? (
                      <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                    ) : ticketData.payment_status === 'dp_paid_50' ? (
                      <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-[#12A150] shrink-0" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm font-sans">
                        {ticketData.is_checked_in
                          ? 'SUDAH DIGUNAKAN (CHECKED-IN)'
                          : ticketData.payment_status === 'dp_paid_50'
                            ? 'TIKET DP 50% (SISA BELUM LUNAS)'
                            : 'TIKET VALID (LUNAS)'}
                      </h4>
                      <p className="text-xs mt-0.5">
                        {ticketData.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* The Stylized Polisoccer E-Ticket Card (Vertical stack for scanner pane) */}
                <ETicketCard booking={ticketData} showActions={false} layout="vertical" />

                {/* Admission & Settlement Actions */}
                {!ticketData.is_checked_in && ticketData.can_check_in && (
                  <div className="p-5 rounded-2xl bg-white/95 border border-slate-200 shadow-sm space-y-3">
                    <div className="text-xs font-sans font-bold text-[var(--ink)]">
                      Tindakan Petugas Lapangan:
                    </div>

                    {/* If DP 50% - Offer Onsite Settlement */}
                    {ticketData.payment_status === 'dp_paid_50' && ticketData.remaining_balance > 0 ? (
                      <div className="space-y-2">
                        <Button
                          variant="accent"
                          size="md"
                          block
                          loading={processingCheckIn}
                          onClick={() => handleProcessCheckIn(true)}
                          icon={<DollarSign className="w-4 h-4" />}
                        >
                          Terima Pelunasan ({formatRupiah(ticketData.remaining_balance)}) &amp; Check-In
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleProcessCheckIn(false)}
                          disabled={processingCheckIn}
                          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-sans font-semibold transition-colors cursor-pointer"
                        >
                          Check-In Saja (Pelunasan Belakangan)
                        </button>
                      </div>
                    ) : (
                      <Button
                        variant="accent"
                        size="md"
                        block
                        loading={processingCheckIn}
                        onClick={() => handleProcessCheckIn(false)}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Konfirmasi Pemain Masuk Lapangan
                      </Button>
                    )}
                  </div>
                )}

                {/* Reset button to scan next */}
                <Button
                  variant="secondary"
                  size="md"
                  block
                  onClick={() => {
                    setTicketData(null);
                    setErrorMsg('');
                    setCheckInSuccess('');
                    setManualCode('');
                    if (activeTab === 'camera') startScanner();
                  }}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Pindai Tiket Selanjutnya
                </Button>

              </div>
            ) : (
              <div className="p-8 sm:p-12 rounded-[24px] bg-white/60 border border-dashed border-slate-300 text-center space-y-3">
                <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-700 font-sans">
                    Menunggu Pemindaian Tiket
                  </h4>
                  <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
                    Arahkan kamera ke kode QR atau ketik kode booking untuk memeriksa keaslian tiket dan memvalidasi izin masuk pemain.
                  </p>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}

export default AdminTicketScanner;
