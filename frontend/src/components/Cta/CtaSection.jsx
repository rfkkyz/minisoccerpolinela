import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MintBackdrop } from '../ui/MintBackdrop';
import { ArrowRight, UserPlus, LogIn, Sparkles, CheckCircle2 } from 'lucide-react';

export function CtaSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative w-full overflow-hidden border-t border-[rgba(18,161,80,0.18)]">
      <MintBackdrop
        variant="landing"
        tone="b"
        beams="top"
        className="w-full py-24 sm:py-32 lg:py-36 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      >
        {/* Subtle Ambient Radial Highlight in Center */}
        <div 
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full blur-[110px] opacity-70 z-0"
          style={{
            background: 'radial-gradient(circle, rgba(124, 255, 178, 0.50) 0%, rgba(18, 161, 80, 0.18) 55%, transparent 75%)'
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-emerald-500/25 text-[#0A803E] text-xs font-bold uppercase tracking-wider shadow-xs backdrop-blur-md mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#12A150]" />
            <span>RESERVASI LAPANGAN ONLINE</span>
          </div>

          {/* Main Headline */}
          <h2 className="font-zen text-2xl sm:text-4xl lg:text-5xl text-[#062319] tracking-tight leading-[1.25] mb-6">
            Siap Bertanding di Arena <br />
            <span className="text-[#12A150]">
              Mini Soccer Polinela?
            </span>
          </h2>

          {/* Sub-headline / Clean description */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Pesan jadwal pertandingan tim Anda secara instan, bebas bentrok, dan nikmati fasilitas rumput sintetis berstandar dengan tarif resmi sivitas akademika.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-12">
            {user ? (
              <button
                onClick={() => {
                  if (user.role === 'superadmin') navigate('/superadmin');
                  else if (user.role === 'admin') navigate('/admin');
                  else navigate('/dashboard');
                }}
                className="group w-full sm:w-auto py-4 px-10 rounded-2xl bg-gradient-to-r from-[#12A150] to-[#0A803E] hover:from-[#0E9045] hover:to-[#086E34] text-white font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(18,161,80,0.32)] hover:shadow-[0_14px_32px_rgba(18,161,80,0.42)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer border border-emerald-400/30"
              >
                <span>BUKA DASHBOARD ({user.role?.toUpperCase()})</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/daftar')}
                  className="group w-full sm:w-auto py-4 px-10 rounded-2xl bg-gradient-to-r from-[#12A150] to-[#0A803E] hover:from-[#0E9045] hover:to-[#086E34] text-white font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_10px_25px_rgba(18,161,80,0.32)] hover:shadow-[0_14px_32px_rgba(18,161,80,0.42)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer border border-emerald-400/30"
                >
                  <UserPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>DAFTAR AKUN GRATIS</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="group w-full sm:w-auto py-4 px-10 rounded-2xl bg-white/95 hover:bg-white text-[#0A4D2E] border border-emerald-200/80 font-sans font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(18,161,80,0.12)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer backdrop-blur-md"
                >
                  <LogIn className="w-4 h-4 text-[#12A150] transition-transform group-hover:translate-x-0.5" />
                  <span>MASUK SEBAGAI SIVITAS</span>
                </button>
              </>
            )}
          </div>

          {/* Feature Pills */}
          <div className="pt-8 border-t border-emerald-900/10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-semibold text-slate-700 w-full">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-emerald-500/15 backdrop-blur-xs shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#12A150]" />
              <span>Bebas Antre & Anti Bentrok</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-emerald-500/15 backdrop-blur-xs shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#12A150]" />
              <span>Tarif Resmi Sivitas Polinela</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-emerald-500/15 backdrop-blur-xs shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#12A150]" />
              <span>Gratis Lampu Sorot Malam</span>
            </div>
          </div>

        </div>
      </MintBackdrop>
    </section>
  );
}

export default CtaSection;
