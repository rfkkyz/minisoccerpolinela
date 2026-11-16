import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { 
  Calendar, Clock, MapPin, User, CheckCircle2, 
  Printer, Copy, Check, Share2, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { formatDateIndo, formatRupiah } from '../../utils/format';

export function ETicketCard({ booking, showActions = true, layout = 'auto' }) {
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const bookingCode = booking.booking_code || booking.code || 'POL-UNKNOWN';
  const customerName = booking.customer_name || booking.name || booking.User?.full_name || 'Pemesan';
  const fieldName = booking.field_name || booking.field?.name || booking.Field?.name || 'Lapangan Mini Soccer Polinela';
  const bookingDate = booking.booking_date || booking.play_date || booking.date || new Date().toISOString().slice(0, 10);
  
  let startHour = 8;
  if (booking.start_hour !== undefined && booking.start_hour !== null) {
    startHour = Number(booking.start_hour);
  } else if (booking.start_time) {
    startHour = parseInt(booking.start_time.split(':')[0], 10) || 8;
  }

  let endHour = startHour + (booking.hours_count || 1);
  if (booking.end_hour !== undefined && booking.end_hour !== null) {
    endHour = Number(booking.end_hour);
  } else if (booking.end_time) {
    endHour = parseInt(booking.end_time.split(':')[0], 10) || (startHour + 1);
  }

  const hoursCount = booking.hours_count || Math.max(1, endHour - startHour);
  const category = (booking.tariff_tier || booking.category || 'umum').toUpperCase();
  const totalPrice = Number(booking.total_price || booking.total || 0);
  const paidAmount = Number(booking.paid_amount || booking.dp_paid || 0);
  const isCheckedIn = Boolean(booking.is_checked_in);
  const rawStatus = booking.payment_status || booking.status || 'pending_hold';
  const isPaidFull = rawStatus === 'fully_paid' || rawStatus === 'confirmed' || (totalPrice > 0 && paidAmount >= totalPrice);
  const isDp = (rawStatus === 'dp_paid_50' || rawStatus === 'dp_paid') && !isPaidFull;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWA = () => {
    const text = `Halo, ini e-tiket resmi Mini Soccer Polinela:\nKode: ${bookingCode}\nPemesan: ${customerName}\nTanggal: ${formatDateIndo(bookingDate)}\nJam: ${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00 WIB\nCek tiket: ${window.location.origin}/cek-tiket?code=${bookingCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const isVertical = layout === 'vertical';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* ======================================================== */}
      {/* PRINT-OPTIMIZED E-TICKET CARD (MATCH PASS)                */}
      {/* ======================================================== */}
      <div 
        id="printable-ticket"
        className="relative bg-gradient-to-br from-[#072418] via-[#0E3527] to-[#051C13] text-white rounded-[24px] sm:rounded-[28px] border-2 border-emerald-500/40 shadow-[0_20px_50px_rgba(7,36,24,0.35)] overflow-hidden transition-all select-none"
      >
        {/* Subtle decorative field lines in background */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-10 z-0"
          style={{
            backgroundImage: `radial-gradient(circle at 70% 50%, rgba(124,255,178,0.3) 0%, transparent 60%), linear-gradient(0deg, transparent 49%, rgba(255,255,255,0.08) 50%, transparent 51%)`,
            backgroundSize: '100% 100%, 30px 30px'
          }}
        />

        {/* Outer Flex Container: Main Body + Stub */}
        <div className={`relative z-10 flex ${isVertical ? 'flex-col' : 'flex-col md:flex-row'} items-stretch`}>
          
          {/* Left Scalloped / Perforated Ticket Edge (Horizontal view only) */}
          {!isVertical && (
            <div className="hidden md:flex absolute left-0 top-0 bottom-0 w-2 flex-col justify-around py-3 pointer-events-none z-20">
              {[...Array(7)].map((_, i) => (
                <div key={`l-${i}`} className="w-3 h-3 rounded-full bg-[var(--surface,#ffffff)] -ml-2 border border-emerald-500/20 shadow-inner" />
              ))}
            </div>
          )}

          {/* ======================================================== */}
          {/* 1. MAIN BODY (Match Specs & Price Stamp)                 */}
          {/* ======================================================== */}
          <div className="flex-1 min-w-0 p-5 sm:p-7 lg:p-8 flex flex-col justify-between space-y-5">
            
            {/* Top Bar: Brand Crest + Round Price Stamp */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-1.5 flex items-center justify-center shrink-0 shadow-sm">
                  <img src="/logo-polinela.png" alt="POLINELA" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="font-sans text-[11px] font-bold text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
                    <span>POLITEKNIK NEGERI LAMPUNG</span>
                  </div>
                  <h3 className="font-extrabold text-lg sm:text-2xl font-sans tracking-tight text-white flex items-center gap-1.5">
                    <span>POLI</span>
                    <span className="text-[#7CFFB2]">SOCCER</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 ml-1">
                      MATCH PASS
                    </span>
                  </h3>
                </div>
              </div>

              {/* Price Stamp (Retro concert circle badge) */}
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 p-1 flex flex-col items-center justify-center text-center shadow-[0_4px_16px_rgba(245,158,11,0.4)] border-2 border-amber-200/90 shrink-0 transform rotate-6 hover:rotate-0 transition-transform">
                <span className="text-[9px] font-bold tracking-widest uppercase opacity-80 leading-none">
                  TARIF SEWA
                </span>
                <span className="font-zen font-black text-sm sm:text-base leading-tight mt-0.5">
                  {totalPrice > 0 ? `Rp ${(totalPrice / 1000).toLocaleString('id-ID')}K` : 'Rp 0'}
                </span>
                <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.5 bg-black/15 rounded-full mt-0.5">
                  {isPaidFull ? 'LUNAS' : isDp ? 'DP 50%' : 'BOOKED'}
                </span>
              </div>
            </div>

            {/* Middle Section: Match Highlight & Kick-off Time */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-xs font-sans text-emerald-300/80 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#7CFFB2]" />
                  <span className="font-bold text-white tracking-wide">
                    {formatDateIndo(bookingDate)}
                  </span>
                </div>
                <div className="text-xs font-sans text-slate-300 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate">{fieldName}</span>
                </div>
              </div>

              {/* Big Highlight Kick-off box */}
              <div className="p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7CFFB2] animate-pulse" />
                  <div>
                    <div className="text-[10px] font-sans font-bold text-emerald-300 uppercase tracking-widest">
                      KICK-OFF PERTANDINGAN
                    </div>
                    <div className="font-zen font-extrabold text-xl sm:text-2xl text-white tracking-tight">
                      {String(startHour).padStart(2, '0')}:00 – {String(endHour).padStart(2, '0')}:00 WIB
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-400/20 text-[#7CFFB2] text-xs font-bold font-sans">
                    {hoursCount} Jam Bermain
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Info Grid: Booking Code, Pemesan, Kategori */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 rounded-2xl bg-black/20 border border-white/5 text-xs">
              <div>
                <span className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
                  KODE BOOKING
                </span>
                <span className="font-mono font-bold text-white truncate block">
                  {bookingCode}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
                  PEMESAN
                </span>
                <span className="font-sans font-bold text-white truncate block">
                  {customerName}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-sans font-medium text-slate-400 uppercase tracking-wider block">
                  KATEGORI
                </span>
                <span className="font-sans font-bold text-[#7CFFB2] truncate block">
                  {category}
                </span>
              </div>
            </div>

            {/* Check-in status indicator */}
            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              {isCheckedIn ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SUDAH CHECK-IN MASUK ARENA</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-semibold font-sans">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7CFFB2]" />
                  <span>TIKET RESMI VALID — SIAP DIGUNAKAN</span>
                </div>
              )}

              {isDp && !isCheckedIn && (
                <div className="text-[11px] font-sans text-amber-300 font-medium">
                  Sisa pelunasan di lapangan: {formatRupiah(totalPrice - paidAmount)}
                </div>
              )}
            </div>

          </div>

          {/* ======================================================== */}
          {/* CENTER TEAR-OFF PERFORATION DIVIDER                      */}
          {/* ======================================================== */}
          {isVertical ? (
            /* Horizontal Perforation for Vertical Stack */
            <div className="relative w-full flex items-center justify-between shrink-0 my-1">
              <div className="w-7 h-7 rounded-full bg-[var(--surface,#ffffff)] -ml-3.5 border border-emerald-500/30 z-20 shadow-inner" />
              <div className="w-full border-t-2 border-dashed border-emerald-400/40" />
              <div className="w-7 h-7 rounded-full bg-[var(--surface,#ffffff)] -mr-3.5 border border-emerald-500/30 z-20 shadow-inner" />
            </div>
          ) : (
            /* Vertical Perforation for Horizontal Match Pass */
            <div className="relative flex md:flex-col items-center justify-between shrink-0">
              <div className="hidden md:block w-7 h-7 rounded-full bg-[var(--surface,#ffffff)] -mt-3.5 border border-emerald-500/30 z-20 shadow-inner" />
              <div className="w-full md:w-0 h-0 md:h-full border-t-2 md:border-t-0 md:border-r-2 border-dashed border-emerald-400/40 my-1 md:my-0" />
              <div className="hidden md:block w-7 h-7 rounded-full bg-[var(--surface,#ffffff)] -mb-3.5 border border-emerald-500/30 z-20 shadow-inner" />
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. STUB: QR CODE & ADMISSION PASS                        */}
          {/* ======================================================== */}
          <div className={`relative ${isVertical ? 'w-full' : 'w-full md:w-[260px] lg:w-[280px]'} p-5 sm:p-7 bg-white/[0.03] backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-3.5 shrink-0 ${!isVertical ? 'border-t md:border-t-0 md:border-l border-white/5' : ''}`}>
            
            {/* Right Scalloped / Perforated Ticket Edge (Horizontal view only) */}
            {!isVertical && (
              <div className="hidden md:flex absolute right-0 top-0 bottom-0 w-2 flex-col justify-around py-3 pointer-events-none z-20">
                {[...Array(7)].map((_, i) => (
                  <div key={`r-${i}`} className="w-3 h-3 rounded-full bg-[var(--surface,#ffffff)] -mr-2 border border-emerald-500/20 shadow-inner" />
                ))}
              </div>
            )}
            
            {/* QR Code White Card */}
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
              <QRCode
                value={bookingCode}
                size={135}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 135 135`}
              />
            </div>

            {/* Ticket admission text */}
            <div className="space-y-1">
              <div className="text-[11px] font-sans font-extrabold uppercase tracking-widest text-[#7CFFB2]">
                ADMISSION PASS
              </div>
              <div className="font-mono text-xs font-bold text-white tracking-wider">
                {bookingCode}
              </div>
              <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed mx-auto font-sans">
                Tunjukkan QR code ini kepada petugas admin di gerbang mini soccer untuk validasi check-in.
              </p>
            </div>

            {/* Check-in timestamp badge if scanned */}
            {isCheckedIn && booking.checked_in_at && (
              <div className="text-[10px] font-sans text-emerald-300 font-medium bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                Divalidasi: {new Date(booking.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* ACTION BUTTONS (Unduh, Salin, Cetak, Bagikan)             */}
      {/* ======================================================== */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#12A150] to-[#0A803E] hover:from-[#0E9045] hover:to-[#086E34] text-white font-sans font-semibold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan E-Tiket (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-sans font-semibold text-xs shadow-2xs transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#12A150]" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Kode Tersalin!' : 'Salin Kode Tiket'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWA}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30 font-sans font-semibold text-xs transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#25D366]" />
            <span>Bagikan ke WhatsApp</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default ETicketCard;
