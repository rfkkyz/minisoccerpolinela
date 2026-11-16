import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiClient } from '../../api';
import { formatDate } from '../../utils/format';
import { Newspaper, Calendar, ArrowRight, Tag, Image as ImageIcon } from 'lucide-react';

const SAMPLE_NEWS = [
  {
    id: 1,
    title: 'Penyusunan Jadwal Operasional Lapangan Mini Soccer Politeknik Negeri Lampung',
    excerpt: 'Pengelola lapangan mini soccer Polinela membuka pendaftaran dan jadwal pemanfaatan lapangan bagi seluruh civitas akademika dan masyarakat umum.',
    category: 'kegiatan',
    cover_image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Kesiapan Fasilitas Lapangan Mini Soccer Rumput Sintetis Polinela',
    excerpt: 'Fasilitas lapangan mini soccer baru Politeknik Negeri Lampung telah siap beroperasi mendukung aktivitas olahraga mahasiswa, dosen, dan staf.',
    category: 'berita',
    cover_image: 'https://images.unsplash.com/photo-1529900245534-47fbfb57835a?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Sosialisasi Alur Reservasi Online dan Skema Tiga Tingkatan Tarif',
    excerpt: 'Penerapan sistem informasi reservasi digital memastikan proses booking lapangan berlangsung tertib, transparan, dan bebas bentrok jadwal.',
    category: 'pengumuman',
    cover_image: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=800&q=80',
    created_at: new Date().toISOString(),
  },
];

/** Safe array extractor: always returns [] if the value is not a plain array */
function extractArray(res) {
  if (Array.isArray(res?.data?.news)) return res.data.news;
  if (Array.isArray(res?.data?.rows)) return res.data.rows;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.news)) return res.news;
  if (Array.isArray(res?.rows)) return res.rows;
  if (Array.isArray(res)) return res;
  return [];
}

export function NewsSection() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('semua');
  const [newsList, setNewsList] = useState(SAMPLE_NEWS);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'semua', label: 'SEMUA' },
    { id: 'berita', label: 'BERITA' },
    { id: 'kegiatan', label: 'KEGIATAN' },
    { id: 'pengumuman', label: 'PENGUMUMAN' },
  ];

  useEffect(() => {
    setLoading(true);
    // Backend uses "type" param, not "category"
    const typeParam = activeTab === 'semua' ? undefined : activeTab;
    apiClient.public.news(typeParam ? { type: typeParam } : undefined)
      .then((res) => {
        const items = extractArray(res);
        setNewsList(items.length > 0 ? items : SAMPLE_NEWS);
      })
      .catch(() => {
        setNewsList(SAMPLE_NEWS);
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  const displayNews = Array.isArray(newsList) ? newsList : [];

  return (
    <section id="berita" className="py-12 sm:py-24 bg-[var(--paper-2)] px-3.5 sm:px-6 lg:px-8 border-b border-[var(--line)] scroll-mt-24">
      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
        
        {/* Section Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-[var(--line)]">
          <div className="space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/85 border border-[#12A150]/30 text-[#0B7A3B] font-sans font-semibold text-[10px] sm:text-xs tracking-wide uppercase shadow-xs backdrop-blur-md">
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-[#12A150] shrink-0" />
              <span>Informasi &amp; Dokumentasi</span>
            </div>
            <h2 className="font-zen text-2xl sm:text-4xl lg:text-5xl tracking-tight text-[var(--ink)] leading-tight">
              Berita, Kegiatan &amp; Galeri
            </h2>
            <p className="text-xs sm:text-sm text-[var(--ink-2)] max-w-xl">
              Simak pengumuman operasional terbaru, liputan turnamen kampus, jadwal perawatan rutin, dan dokumentasi visual arena Mini Soccer Polinela.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 bg-white p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-[var(--line)] shadow-xs overflow-x-auto max-w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-sans text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-text)] shadow-xs font-bold'
                    : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* News Grid (Compact horizontal cards on mobile, 3-column vertical grid on lg) */}
        {loading ? (
          <div className="py-16 text-center font-mono text-xs text-[var(--ink-3)]">
            <div className="w-8 h-8 border-2 border-[var(--accent-strong)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            MEMUAT BERITA TERBARU...
          </div>
        ) : displayNews.length === 0 ? (
          <div className="py-12 text-center text-sm font-mono text-[var(--ink-2)] bg-white rounded-2xl border border-[var(--line)]">
            Belum ada artikel pada kategori ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 lg:gap-8">
            {displayNews.map((item, idx) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: idx * 0.1 }}
                className="bg-[var(--surface)] rounded-[18px] sm:rounded-[20px] overflow-hidden border border-[var(--line)] hover:shadow-lg hover:border-[var(--accent-strong)]/40 transition-all duration-300 flex flex-row sm:flex-col justify-between group cursor-pointer"
                onClick={() => navigate(`/berita/${item.id}`)}
              >
                {/* Thumbnail Cover: Square 110px on mobile, full width 16/10 on sm+ */}
                <div className="relative w-28 sm:w-full h-28 sm:h-auto sm:aspect-[16/10] bg-[var(--mint-100)] overflow-hidden shrink-0">
                  <img
                    src={item.cover_image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5">
                    <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-white/90 backdrop-blur-md text-[var(--accent-text)] border border-[var(--glass-border)] font-sans text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-xs">
                      {item.category || 'BERITA'}
                    </span>
                  </div>
                </div>

                {/* Body Content Container */}
                <div className="p-3 sm:p-6 flex-1 flex flex-col justify-between min-w-0">
                  <div className="space-y-1 sm:space-y-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-sans font-medium text-[var(--ink-3)]">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--accent-strong)] shrink-0" />
                      <span>{formatDate(item.created_at)}</span>
                    </div>

                    <h3 className="text-xs sm:text-lg font-bold text-[var(--ink)] line-clamp-2 leading-snug group-hover:text-[var(--accent-strong)] transition-colors">
                      {item.title}
                    </h3>

                    <p className="hidden sm:block text-xs text-[var(--ink-2)] line-clamp-3 leading-relaxed">
                      {item.excerpt || item.content}
                    </p>
                  </div>

                  {/* Footer Link */}
                  <div className="pt-2 sm:pt-4">
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-sans font-bold text-[var(--accent-strong)] group-hover:gap-2.5 transition-all">
                      <span>BACA SELENGKAPNYA</span>
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}

