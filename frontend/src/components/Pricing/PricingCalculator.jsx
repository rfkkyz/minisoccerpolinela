import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatRupiah } from '../../utils/format';
import { apiClient } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useCountUp } from '../../hooks/useCountUp';
import { TarifCard } from '../ui/TarifCard';
import Button from '../ui/Button';
import { Calculator, Info, ShieldCheck, ArrowRight, Minus, Plus } from 'lucide-react';

export function PricingCalculator({ onSelectTarif }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [fields, setFields] = useState([
    {
      id: 1,
      name: 'Lapangan Mini Soccer Polinela',
      price_umum: 150000,
      price_mahasiswa: 100000,
      price_karyawan: 120000,
      status: 'active'
    }
  ]);

  const [selectedFieldId, setSelectedFieldId] = useState(1);
  const [selectedTier, setSelectedTier] = useState(user?.category || 'mahasiswa');
  const [duration, setDuration] = useState(2);
  const [paymentType, setPaymentType] = useState('dp_50'); // 'dp_50' | 'full_100'

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

  const activeField = useMemo(() => {
    return fields.find(f => f.id === Number(selectedFieldId)) || fields[0];
  }, [fields, selectedFieldId]);

  const pricePerHour = useMemo(() => {
    if (selectedTier === 'mahasiswa') {
      return Number(activeField?.price_mahasiswa || activeField?.prices?.mahasiswa || 100000);
    }
    if (selectedTier === 'karyawan') {
      return Number(activeField?.price_karyawan || activeField?.prices?.karyawan || 120000);
    }
    return Number(activeField?.price_umum || activeField?.prices?.umum || 150000);
  }, [activeField, selectedTier]);

  const total = pricePerHour * duration;
  const payNow = paymentType === 'dp_50' ? Math.round(total / 2) : total;
  const remaining = total - payNow;

  const animatedTotal = useCountUp(total, 400);

  const handleBookingClick = (tier) => {
    const targetTier = tier || selectedTier;
    if (user) {
      navigate(`/dashboard/booking?field_id=${selectedFieldId}&tier=${targetTier}&duration=${duration}`);
    } else {
      navigate(`/daftar?field_id=${selectedFieldId}&tier=${targetTier}`);
    }
  };

  const isMaintenance = activeField?.status === 'maintenance' || activeField?.status === 'perawatan';

  return (
    <section id="tarif" className="py-12 sm:py-24 bg-[var(--paper-2)] relative scroll-mt-24">
      <div className="max-w-[1280px] mx-auto px-3.5 sm:px-12">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/85 border border-[#12A150]/30 text-[#0B7A3B] font-sans font-semibold text-[10px] sm:text-xs tracking-wide uppercase shadow-xs backdrop-blur-md mb-3 sm:mb-4">
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#12A150] animate-pulse shrink-0" />
            <span>Skema Tarif Sewa</span>
          </div>
          <h2 className="font-zen text-2xl sm:text-4xl text-[var(--ink)] tracking-tight">
            Tarif Tetap Transparan <span className="text-[var(--accent-heading)]">Per Kategori</span>
          </h2>
          <p className="mt-2 sm:mt-3 text-xs sm:text-base text-[var(--ink-2)]">
            Tiga tingkatan tarif resmi per jam untuk seluruh sivitas akademika Polinela dan masyarakat umum.
          </p>
        </div>

        {/* Field Selector (Segmented Control) */}
        {fields.length > 1 && (
          <div className="flex justify-center mb-6 sm:mb-10">
            <div className="inline-flex p-1.5 rounded-[16px] bg-[var(--surface)] border border-[var(--line)] shadow-sm">
              {fields.map((f) => {
                const isSelected = f.id === activeField.id;
                const isFieldMaint = f.status === 'maintenance' || f.status === 'perawatan';
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-[12px] font-sans text-xs sm:text-sm font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--accent-strong)] text-white shadow-sm'
                        : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-tint)]'
                    }`}
                  >
                    <span>{f.name}</span>
                    {isFieldMaint && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-100 text-amber-800">
                        Perawatan
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3 Tarif Cards (C1): compact gap on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 lg:gap-8 mb-8 sm:mb-10 items-stretch">
          <TarifCard
            index={0}
            tier="umum"
            price={Number(activeField?.price_umum || activeField?.prices?.umum || 150000)}
            isUserCategory={user?.category === 'umum'}
            isMaintenance={isMaintenance}
            onSelect={() => handleBookingClick('umum')}
          />
          <TarifCard
            index={1}
            tier="mahasiswa"
            price={Number(activeField?.price_mahasiswa || activeField?.prices?.mahasiswa || 100000)}
            isUserCategory={user?.category === 'mahasiswa'}
            isMaintenance={isMaintenance}
            onSelect={() => handleBookingClick('mahasiswa')}
          />
          <TarifCard
            index={2}
            tier="karyawan"
            price={Number(activeField?.price_karyawan || activeField?.prices?.karyawan || 120000)}
            isUserCategory={user?.category === 'karyawan'}
            isMaintenance={isMaintenance}
            onSelect={() => handleBookingClick('karyawan')}
          />
        </div>

        {/* Soft Info Box */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white/80 backdrop-blur-md text-[var(--ink)] border border-[rgba(18,161,80,0.20)] shadow-[0_4px_20px_rgba(18,161,80,0.06)] flex items-center gap-3.5 mb-16 max-w-3xl mx-auto">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#12A150] flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm font-sans font-medium text-[#1F4131] leading-relaxed">
            Pembayaran dapat menggunakan uang muka (DP 50%) untuk mengunci jadwal pemesanan, dan sisa pembayaran diselesaikan di lokasi lapangan sebelum bertanding.
          </p>
        </div>

        {/* Interactive Estimator / Calculator Card (C2) */}
        <div className="bg-[var(--surface)] rounded-[24px] p-6 sm:p-10 border border-[var(--line)] shadow-md max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[var(--line)]">
            <div className="w-10 h-10 rounded-[12px] bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-lg sm:text-xl text-[var(--ink)]">
                Kalkulator Estimasi Biaya
              </h3>
              <p className="text-xs text-[var(--ink-2)]">
                Simulasi biaya sewa resmi berdasarkan durasi dan kategori pemesan
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Controls Left Column */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Kategori Tarif Selector */}
              <div>
                <label className="block text-xs font-sans uppercase tracking-wider text-[var(--ink-2)] mb-2 font-semibold">
                  Kategori Pemesan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'umum', label: 'Umum' },
                    { id: 'mahasiswa', label: 'Mahasiswa' },
                    { id: 'karyawan', label: 'Karyawan' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTier(t.id)}
                      className={`h-11 rounded-[12px] font-sans text-xs font-semibold border transition-all duration-150 cursor-pointer ${
                        selectedTier === t.id
                          ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)] border-[var(--accent-strong)] font-bold shadow-sm'
                          : 'bg-[var(--surface)] text-[var(--ink-2)] border-[var(--line)] hover:bg-[var(--surface-tint)]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Durasi Stepper (1-3 jam) */}
              <div>
                <label className="block text-xs font-sans uppercase tracking-wider text-[var(--ink-2)] mb-2 font-semibold">
                  Durasi Sewa (Maks. 3 Jam)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center p-1 rounded-[12px] bg-[var(--paper-2)] border border-[var(--line)]">
                    <button
                      type="button"
                      onClick={() => setDuration(Math.max(1, duration - 1))}
                      disabled={duration <= 1}
                      className="w-10 h-10 rounded-[10px] bg-[var(--surface)] text-[var(--ink)] flex items-center justify-center hover:bg-[var(--surface-tint)] disabled:opacity-30 disabled:pointer-events-none transition-colors border border-[var(--line)] shadow-xs"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-16 text-center font-sans font-bold text-base text-[var(--ink)] tabular-nums">
                      {duration} Jam
                    </span>
                    <button
                      type="button"
                      onClick={() => setDuration(Math.min(3, duration + 1))}
                      disabled={duration >= 3}
                      className="w-10 h-10 rounded-[10px] bg-[var(--surface)] text-[var(--ink)] flex items-center justify-center hover:bg-[var(--surface-tint)] disabled:opacity-30 disabled:pointer-events-none transition-colors border border-[var(--line)] shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-[var(--ink-3)] font-medium">
                    {formatRupiah(pricePerHour)} / jam
                  </span>
                </div>
              </div>

              {/* Opsi Pembayaran */}
              <div>
                <label className="block text-xs font-sans uppercase tracking-wider text-[var(--ink-2)] mb-2 font-semibold">
                  Metode Pembayaran Saat Reservasi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType('dp_50')}
                    className={`h-11 rounded-[12px] font-sans text-xs font-semibold border transition-all duration-150 cursor-pointer ${
                      paymentType === 'dp_50'
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)] border-[var(--accent-strong)] font-bold shadow-sm'
                        : 'bg-[var(--surface)] text-[var(--ink-2)] border-[var(--line)] hover:bg-[var(--surface-tint)]'
                    }`}
                  >
                    DP 50% (Uang Muka)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('full_100')}
                    className={`h-11 rounded-[12px] font-sans text-xs font-semibold border transition-all duration-150 cursor-pointer ${
                      paymentType === 'full_100'
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)] border-[var(--accent-strong)] font-bold shadow-sm'
                        : 'bg-[var(--surface)] text-[var(--ink-2)] border-[var(--line)] hover:bg-[var(--surface-tint)]'
                    }`}
                  >
                    Pembayaran Penuh 100%
                  </button>
                </div>
              </div>

            </div>

            {/* Breakdown Table Right Column */}
            <div className="lg:col-span-5 rounded-[20px] p-6 border border-[var(--glass-border)] shadow-[var(--shadow-glass)] flex flex-col justify-between"
              style={{
                background: 'linear-gradient(135deg, var(--glass-top) 0%, var(--glass-mid) 100%)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
              }}
            >
              <div>
                <span className="text-xs font-mono uppercase text-[var(--ink-3)] tracking-wider">
                  Total Biaya Sewa
                </span>
                <div className="font-sans font-bold text-3xl sm:text-[40px] text-[var(--ink)] tabular-nums tracking-tight mt-1 mb-6">
                  {formatRupiah(animatedTotal)}
                </div>

                {/* Breakdown Rows */}
                <div className="space-y-0 divide-y divide-[var(--line)] text-xs sm:text-sm">
                  <div className="h-11 flex items-center justify-between">
                    <span className="text-[var(--ink-2)]">Tarif per jam</span>
                    <span className="font-semibold text-[var(--ink)] tabular-nums">{formatRupiah(pricePerHour)}</span>
                  </div>
                  <div className="h-11 flex items-center justify-between">
                    <span className="text-[var(--ink-2)]">Durasi bermain</span>
                    <span className="font-semibold text-[var(--ink)] tabular-nums">{duration} Jam</span>
                  </div>
                  <div className="h-11 flex items-center justify-between">
                    <span className="text-[var(--ink-2)] font-medium">Total biaya</span>
                    <span className="font-bold text-[var(--ink)] tabular-nums">{formatRupiah(total)}</span>
                  </div>
                  <div className="h-11 flex items-center justify-between bg-[var(--accent-soft)]/50 px-3 -mx-3 rounded-lg">
                    <span className="text-[var(--accent-strong)] font-semibold">
                      Bayar sekarang {paymentType === 'dp_50' ? '(DP 50%)' : '(Lunas)'}
                    </span>
                    <span className="font-bold text-[var(--accent-strong)] tabular-nums">{formatRupiah(payNow)}</span>
                  </div>
                  {paymentType === 'dp_50' && (
                    <div className="h-11 flex items-center justify-between">
                      <span className="text-[var(--ink-3)]">Sisa bayar di lapangan</span>
                      <span className="font-medium text-[var(--ink-2)] tabular-nums">{formatRupiah(remaining)}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-6 shadow-sm"
                iconRight={<ArrowRight className="w-4 h-4" />}
                onClick={() => handleBookingClick(selectedTier)}
                disabled={isMaintenance}
              >
                Pesan Jadwal Sekarang
              </Button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default PricingCalculator;
