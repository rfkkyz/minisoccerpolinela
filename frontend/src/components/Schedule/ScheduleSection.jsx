import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatHourRange } from '../../utils/format';
import { 
  Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, 
  ArrowRight, ShieldCheck, AlertCircle, Info, Sparkles, Check, Moon, Sun
} from 'lucide-react';

export function ScheduleSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Current selected Field (Hanya 1 Lapangan Mini Soccer Polinela)
  const [fields, setFields] = useState([
    { id: 1, name: 'Lapangan Mini Soccer Polinela' }
  ]);
  const [selectedFieldId, setSelectedFieldId] = useState(1);

  // Calendar View State: Year & Month
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12

  // Selected Date string: 'YYYY-MM-DD'
  const todayStr = today.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Month Availability Map: { 'YYYY-MM-DD': { available: 14, total: 18, status: 'available'|'busy'|'full' } }
  const [monthStatus, setMonthStatus] = useState({});
  const [loadingMonth, setLoadingMonth] = useState(false);

  // Hourly slots for the selected date: array of { hour, status: 'available'|'locked'|'pending_hold'|'booked'|'blocked' }
  const [daySlots, setDaySlots] = useState([]);
  const [loadingDay, setLoadingDay] = useState(false);

  // Selected hour chips for quick booking (default 08:00 WIB)
  const [selectedHours, setSelectedHours] = useState([8]);

  // 1. Fetch fields on mount
  useEffect(() => {
    apiClient.public.fields()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.fields) ? res.data.fields : [];
        if (list.length > 0) {
          setFields(list);
          setSelectedFieldId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch Month Availability when field, year, or month changes
  useEffect(() => {
    setLoadingMonth(true);
    apiClient.public.monthAvailability(selectedFieldId, currentYear, currentMonth)
      .then((res) => {
        if (res.data) {
          setMonthStatus(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingMonth(false));
  }, [selectedFieldId, currentYear, currentMonth]);

  // 3. Fetch Day Slots when selectedDate or field changes
  useEffect(() => {
    setLoadingDay(true);
    apiClient.public.availability(selectedFieldId, selectedDate)
      .then((res) => {
        let slots = [];
        if (res.data && Array.isArray(res.data.slots)) {
          slots = res.data.slots;
        } else if (Array.isArray(res.data)) {
          slots = res.data;
        } else {
          // Generate fallback slots 06 to 23
          slots = Array.from({ length: 18 }, (_, i) => ({
            hour: i + 6,
            status: 'available',
            label: `${String(i + 6).padStart(2, '0')}:00 - ${String(i + 7).padStart(2, '0')}:00`,
          }));
        }
        setDaySlots(slots);
        // Automatically ensure selected hours match real available slots
        setSelectedHours(prev => {
          const avail = slots.filter(s => s.status === 'available').map(s => s.hour);
          const valid = prev.filter(h => avail.includes(h));
          if (valid.length > 0) return valid;
          return avail.length > 0 ? [avail[0]] : [];
        });
      })
      .catch(() => {
        const fallback = Array.from({ length: 18 }, (_, i) => ({
          hour: i + 6,
          status: 'available',
          label: `${String(i + 6).padStart(2, '0')}:00 - ${String(i + 7).padStart(2, '0')}:00`,
        }));
        setDaySlots(fallback);
        setSelectedHours([8]);
      })
      .finally(() => setLoadingDay(false));
  }, [selectedFieldId, selectedDate]);

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

  // Month name
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Generate calendar days for current month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sunday

  // Handle Hour chip click (consecutive up to 3 hours max)
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

  const handleProceedBooking = () => {
    const minHour = Math.min(...selectedHours);
    const duration = selectedHours.length;
    const targetUrl = `/dashboard/booking?field_id=${selectedFieldId}&date=${selectedDate}&start_hour=${minHour}&duration=${duration}`;
    if (user) {
      navigate(targetUrl);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    }
  };

  return (
    <section id="jadwal" className="py-20 sm:py-28 bg-[var(--paper)] text-[var(--ink)] px-4 sm:px-6 lg:px-8 relative overflow-hidden scroll-mt-24">
      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[var(--line)]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 border border-[#12A150]/30 text-[#0B7A3B] font-sans font-semibold text-xs tracking-wide uppercase shadow-xs backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#12A150] animate-pulse shrink-0" />
              <span>Kalender Ketersediaan Real-Time</span>
            </div>
            <h2 className="font-zen text-2xl sm:text-4xl lg:text-5xl tracking-tight leading-tight text-[var(--ink)]">
              Cek Jadwal Lapangan <br />
              <span className="text-[var(--accent-strong)]">
                Bebas Antrean &amp; Transparan
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-xl">
              Pilih tanggal untuk melihat slot jam operasional (06:00 - 24:00 WIB). Warna menunjukkan ketersediaan riil yang tersinkronisasi langsung dengan basis data.
            </p>
          </div>

          {/* Field Badge / Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {fields.length > 1 ? (
              fields.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFieldId(f.id)}
                  className={`px-4 py-2.5 rounded-xl font-sans text-xs font-semibold uppercase tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    selectedFieldId === f.id
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)] border border-[var(--accent-strong)]/40 shadow-sm font-semibold'
                      : 'bg-white text-[var(--ink-2)] border border-[var(--line)] hover:border-[var(--line-strong)]'
                  }`}
                >
                  <span>{f.name.split(' (')[0]}</span>
                </button>
              ))
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[var(--line)] text-xs font-sans font-semibold text-[var(--ink)] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-strong)] animate-pulse" />
                <span>{fields[0]?.name || 'Lapangan Mini Soccer Polinela'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-sans font-medium text-[var(--ink-2)] bg-[var(--surface)] p-3.5 rounded-2xl border border-[var(--line)] shadow-xs">
          <div className="flex items-center gap-1.5 text-[var(--ink)] font-bold uppercase tracking-wider text-[11px]">
            <span className="w-1.5 h-3.5 rounded-full bg-[var(--accent-strong)] shrink-0" />
            <span>Indikator Status:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-xs" />
            <span>Tersedia (Bisa Dipesan)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-amber-400" />
            <span>Dalam Proses Pembayaran</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-rose-500" />
            <span>Terisi (Terkonfirmasi)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-slate-400" />
            <span>Terkunci / Maintenance</span>
          </div>
        </div>

        {/* Two-Column Grid: Calendar on Left (5 cols), Hour Chips on Right (7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Monthly Calendar View (5 cols) */}
          <div className="lg:col-span-5 bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-7 border border-[rgba(18,161,80,0.18)] shadow-[0_8px_30px_rgba(14,42,32,0.06)] space-y-6">
            
            {/* Calendar Month Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[#12A150] flex items-center justify-center shrink-0 shadow-xs">
                  <CalendarIcon className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="font-zen text-base sm:text-xl text-[var(--ink)] tracking-tight">
                  {monthNames[currentMonth - 1]} {currentYear}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Bulan sebelumnya"
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-[#12A150] hover:bg-emerald-50 text-[var(--ink)] hover:text-[#12A150] flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Bulan berikutnya"
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:border-[#12A150] hover:bg-emerald-50 text-[var(--ink)] hover:text-[#12A150] flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 cursor-pointer"
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
            <div className="grid grid-cols-7 gap-1.5 text-center">
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
                    className={`relative h-11 p-1 rounded-[14px] flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#12A150] to-[#0A803E] text-white font-extrabold shadow-[0_8px_20px_rgba(18,161,80,0.35)] scale-[1.04] ring-2 ring-emerald-400/50'
                        : isPast
                        ? 'text-slate-300 cursor-not-allowed bg-transparent'
                        : isToday
                        ? 'bg-emerald-50/70 text-[#12A150] font-extrabold border-2 border-[#12A150] hover:bg-emerald-100/60 shadow-xs'
                        : 'bg-slate-50/60 text-[var(--ink)] font-bold text-xs hover:bg-emerald-50 hover:border-emerald-300 border border-slate-100 hover:scale-105 hover:shadow-xs'
                    }`}
                  >
                    <span className="font-sans text-xs leading-none">{dayNum}</span>
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
                <span>Operasional: 06:00 - 24:00 WIB</span>
              </div>
            </div>
          </div>

          {/* Hourly Chips for Selected Date (7 cols) */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-md rounded-[28px] p-6 sm:p-7 border border-[rgba(18,161,80,0.18)] shadow-[0_8px_30px_rgba(14,42,32,0.06)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-sans font-bold uppercase tracking-wider text-[#0B7A3B] mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12A150]" />
                  Tanggal Terpilih
                </span>
                <h3 className="font-zen text-xl sm:text-2xl text-[var(--ink)] tracking-tight">
                  {formatDate(selectedDate)}
                </h3>
              </div>
              <div className="text-xs font-sans font-semibold text-[var(--ink-2)] bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200/80 self-start sm:self-center">
                Pilih satu atau beberapa slot jam:
              </div>
            </div>

            {/* Hour Grid (06:00 to 23:00): 3 columns on mobile! */}
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-3">
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
                    className={`p-2 sm:p-3.5 rounded-[14px] sm:rounded-[18px] border-2 text-left transition-all duration-200 relative flex flex-col justify-between min-h-[58px] sm:min-h-[82px] ${
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
                      <span className={`font-zen text-xs sm:text-sm tracking-tight ${isSelected && isAvailable ? 'text-white' : 'text-[var(--ink)]'}`}>
                        {String(hour).padStart(2, '0')}:00{' '}
                        <span className={`font-sans text-[9px] sm:text-[10px] font-bold ${isSelected && isAvailable ? 'text-emerald-100' : 'text-slate-400'}`}>
                          WIB
                        </span>
                      </span>

                      {isSelected && isAvailable ? (
                        <span className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full bg-white text-[#12A150] flex items-center justify-center shrink-0 shadow-xs">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                        </span>
                      ) : isNight ? (
                        <span className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/80 flex items-center justify-center shrink-0" title="Pencahayaan Malam Gratis">
                          <Moon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </span>
                      ) : isMorning ? (
                        <span className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-md bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0" title="Pagi">
                          <Sun className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </span>
                      ) : null}
                    </div>

                    {/* Bottom Row: Status Badge */}
                    <div className="mt-1 sm:mt-2.5">
                      {isSelected && isAvailable ? (
                        <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-sans font-bold bg-white/20 text-white backdrop-blur-sm">
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
                          <Clock className="w-2 h-2 animate-spin" />
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
            <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-[#0B7A3B] font-sans font-bold text-xs uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-[#12A150]" />
                  <span>Total {selectedHours.length} Jam Dipilih</span>
                  <span className="text-emerald-800 font-semibold normal-case">
                    ({selectedHours.map(h => `${String(h).padStart(2, '0')}:00`).join(', ')})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-sans text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#12A150] shrink-0" />
                  <span>Sistem anti-bentrok aktif: slot Anda terlindungi aman saat menyelesaikan pesanan.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedBooking}
                disabled={selectedHours.length === 0}
                className="group h-[52px] px-8 rounded-2xl bg-gradient-to-r from-[#12A150] to-[#0A803E] hover:from-[#0D8741] hover:to-[#086732] text-white font-sans font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2.5 shadow-[0_10px_25px_rgba(18,161,80,0.30)] hover:shadow-[0_14px_32px_rgba(18,161,80,0.40)] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <span>PESAN JADWAL INI</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}

