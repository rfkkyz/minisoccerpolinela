import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api';
import { formatDateIndo } from '../utils/format';
import { 
  ArrowLeft, Calendar, User, Share2, Check, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { Button } from '../components/ui/Button';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';

export default function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    apiClient.public.getNewsDetail(id)
      .then((res) => {
        if (res.data) {
          setNews(res.data);
        }
      })
      .catch(() => {
        setError('Berita atau artikel tidak ditemukan.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allImages = news ? [
    ...(news.cover_image ? [news.cover_image] : []),
    ...(Array.isArray(news.gallery_images)
      ? news.gallery_images.map(g => typeof g === 'string' ? g : g.image_url)
      : Array.isArray(news.images)
        ? news.images.map(g => typeof g === 'string' ? g : g.image_url)
        : [])
  ] : [];

  return (
    <PublicLayout>
      <div className="pt-10 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            to="/#berita"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:border-[var(--accent-strong)] font-mono text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[var(--accent-strong)]" />
            <span>KEMBALI KE BERITA & PENGUMUMAN</span>
          </Link>
        </div>

        {loading ? (
          <div className="bg-[var(--surface)] p-8 rounded-[24px] border border-[var(--line)] space-y-6">
            <Skeleton variant="text" className="w-1/4 h-6" />
            <Skeleton variant="text" className="w-3/4 h-10" />
            <Skeleton variant="rect" className="h-64" />
            <Skeleton variant="text" className="h-4" />
            <Skeleton variant="text" className="h-4" />
          </div>
        ) : error || !news ? (
          <ErrorState
            title="Artikel Tidak Ditemukan"
            message={error || 'Berita atau artikel yang Anda cari tidak tersedia.'}
            onRetry={() => navigate('/')}
          />
        ) : (
          <article className="bg-[var(--surface)] rounded-[24px] border border-[var(--line)] overflow-hidden shadow-sm">
            {/* Header */}
            <div className="p-6 sm:p-10 border-b border-[var(--line)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="px-3 py-1 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-strong)]/30 text-[var(--accent-strong)] font-mono text-[11px] font-bold uppercase tracking-wider">
                  {news.category || 'BERITA'}
                </span>

                <button
                  type="button"
                  onClick={handleCopyShare}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-[var(--surface-tint)] border border-[var(--line)] hover:bg-[var(--paper-2)] text-[var(--ink)] font-mono text-xs transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[var(--accent-strong)]" />
                      <span className="text-[var(--accent-strong)] font-semibold">LINK DISALIN</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-[var(--ink-2)]" />
                      <span>BAGIKAN</span>
                    </>
                  )}
                </button>
              </div>

              <h1 className="font-sans font-bold text-2xl sm:text-4xl text-[var(--ink)] tracking-tight leading-tight">
                {news.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[var(--ink-3)] pt-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDateIndo(news.created_at || news.publish_date || new Date())}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>{news.author_name || 'BPU Polinela'}</span>
                </div>
              </div>
            </div>

            {/* Gallery Image Display */}
            {allImages.length > 0 && (
              <div className="relative bg-[var(--paper-2)] border-b border-[var(--line)]">
                <div className="aspect-video w-full max-h-[460px] overflow-hidden flex items-center justify-center">
                  <img
                    src={allImages[activeImageIndex]}
                    alt={news.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {allImages.length > 1 && (
                  <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                      className="pointer-events-auto w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                      className="pointer-events-auto w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Body Article Content */}
            <div className="p-6 sm:p-10 text-[var(--ink)] leading-relaxed text-sm sm:text-base space-y-4">
              {news.content ? (
                news.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="text-[var(--ink)]">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-[var(--ink-2)] italic">Belum ada konten artikel.</p>
              )}
            </div>
          </article>
        )}
      </div>
    </PublicLayout>
  );
}
