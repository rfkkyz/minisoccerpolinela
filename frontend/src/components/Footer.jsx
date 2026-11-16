import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { MintBackdrop } from './ui/MintBackdrop';

export function Footer() {
  return (
    <footer className="relative overflow-hidden font-sans border-t border-[rgba(18,161,80,0.20)]">
      <MintBackdrop variant="footer" tone="b" className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[var(--line)]">
            
            {/* Col 1 & 2: Brand & Bio */}
            <div className="lg:col-span-2 space-y-4 pr-0 lg:pr-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1.5 border border-[var(--glass-border)] shadow-xs flex items-center justify-center shrink-0">
                  <img src="/logo-polinela.png" alt="POLINELA" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="font-extrabold text-xl tracking-wider text-[var(--ink)] font-sans">POLISOCCER</span>
                  <span className="block text-[10px] font-sans font-bold text-[var(--accent-text)] tracking-wider uppercase">
                    POLITEKNIK NEGERI LAMPUNG
                  </span>
                </div>
              </div>
              <p className="text-[var(--ink-2)] text-xs sm:text-sm leading-relaxed max-w-sm">
                Sistem Informasi Pengelolaan dan Reservasi Lapangan Mini Soccer Politeknik Negeri Lampung. Memfasilitasi pengecekan jadwal real-time, pemesanan mandiri, verifikasi pembayaran, serta pencegahan bentrok jadwal pemakaian lapangan.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-[var(--accent-strong)]/30 text-xs font-sans font-semibold text-[var(--accent-text)] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-strong)] animate-pulse" />
                <span>STATUS SISTEM: OPERASIONAL 100%</span>
              </div>
            </div>

            {/* Col 3: Navigation */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-3.5 rounded-full bg-[var(--accent-strong)] shrink-0" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--ink)] font-sans">
                  Navigasi Utama
                </h4>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--ink-2)] font-sans font-medium">
                <li>
                  <Link to="/" className="hover:text-[var(--accent-text)] transition-colors">
                    Beranda
                  </Link>
                </li>
                <li>
                  <a href="/#tentang" className="hover:text-[var(--accent-text)] transition-colors">
                    Tentang Sistem
                  </a>
                </li>
                <li>
                  <a href="/#tarif" className="hover:text-[var(--accent-text)] transition-colors">
                    Tarif &amp; Simulasi
                  </a>
                </li>
                <li>
                  <a href="/#jadwal" className="hover:text-[var(--accent-text)] transition-colors">
                    Jadwal Lapangan
                  </a>
                </li>
                <li>
                  <a href="/#berita" className="hover:text-[var(--accent-text)] transition-colors">
                    Berita &amp; Galeri
                  </a>
                </li>
                <li>
                  <Link to="/cek-tiket" className="hover:text-[var(--accent-text)] transition-colors">
                    Cek Status Tiket
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Fasilitas */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-3.5 rounded-full bg-[var(--accent-strong)] shrink-0" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--ink)] font-sans">
                  Fasilitas Lapangan
                </h4>
              </div>
              <ul className="space-y-2.5 text-xs text-[var(--ink-2)] font-sans font-medium">
                <li>Lapangan Rumput Sintetis</li>
                <li>Pencahayaan Operasional Malam</li>
                <li>Ruang Ganti &amp; Toilet Bersih</li>
                <li>Tersedia Bola &amp; Rompi</li>
                <li>Area Parkir Kampus Polinela</li>
                <li>E-Tiket &amp; Verifikasi Admin</li>
              </ul>
            </div>

            {/* Col 5: Kontak & Lokasi */}
            <div className="space-y-3 text-xs font-sans font-medium text-[var(--ink-2)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1.5 h-3.5 rounded-full bg-[var(--accent-strong)] shrink-0" />
                <h4 className="font-bold uppercase tracking-wider text-[var(--ink)] font-sans">
                  Kontak &amp; Lokasi
                </h4>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[var(--accent-strong)] shrink-0 mt-0.5" />
                <span>Jl. Soekarno Hatta No. 10, Rajabasa, Bandar Lampung 35144</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[var(--accent-strong)] shrink-0" />
                <a href="https://wa.me/6282188997766" target="_blank" rel="noreferrer" className="hover:text-[var(--accent-text)]">
                  +62 821-8899-7766 (Admin WA)
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[var(--accent-strong)] shrink-0" />
                <span>minisoccer@polinela.ac.id</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--accent-strong)] shrink-0" />
                <span>Setiap Hari: 06:00 - 24:00 WIB</span>
              </div>
            </div>

          </div>

          {/* Bottom Credits */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-sans font-medium text-[var(--ink-3)] gap-4">
            <p>© 2026 POLISOCCER — Politeknik Negeri Lampung. Proyek Mandiri Program Studi Manajemen Informatika.</p>
            <div className="flex items-center gap-4">
              <span className="text-[var(--accent-text)] font-semibold">Sistem Reservasi Lapangan</span>
              <span>v2.1.0</span>
            </div>
          </div>
        </div>
      </MintBackdrop>
    </footer>
  );
}

export default Footer;
