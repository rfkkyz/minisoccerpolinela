import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { content } from '../../data/content';

export function AnnouncementBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('polisoccer_announcement_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const announcementData = content?.announcement || {
    text: 'Booking lapangan kini online. Cek jadwal real-time hari ini',
    linkText: 'Lihat jadwal ->',
    linkHref: '#jadwal'
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('polisoccer_announcement_dismissed', 'true');
    } catch {
      // Ignore sessionStorage errors
    }
  };

  const handleLinkClick = (e) => {
    e.preventDefault();
    const target = announcementData.linkHref || '#jadwal';
    if (target.startsWith('#')) {
      if (location.pathname !== '/') {
        navigate('/' + target);
      } else {
        const el = document.querySelector(target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(target);
    }
  };

  if (dismissed || !announcementData.text) {
    return null;
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.aside
          initial={{ height: 36, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full bg-[var(--accent-soft)] text-[var(--ink)] overflow-hidden relative z-40 select-none border-b border-[var(--accent-strong)]/15"
          style={{ height: '36px' }}
          role="region"
          aria-label="Pengumuman"
        >
          <div className="max-w-[1440px] mx-auto h-full px-10 flex items-center justify-center relative">
            {/* Center Announcement Text */}
            <div className="text-[12px] sm:text-[13px] font-medium font-sans text-[var(--ink)] text-center line-clamp-2 sm:line-clamp-1 flex items-center justify-center gap-2 flex-wrap">
              <span>{announcementData.text}</span>
              <a
                href={announcementData.linkHref || '#jadwal'}
                onClick={handleLinkClick}
                className="inline-flex items-center gap-1 font-semibold underline decoration-[var(--accent-strong)]/50 hover:text-[var(--accent-strong)] hover:decoration-[var(--accent-strong)] transition-colors cursor-pointer ml-1"
              >
                <span>{announcementData.linkText || 'Lihat jadwal ->'}</span>
              </a>
            </div>

            {/* Close Button on Right */}
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Tutup pengumuman"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink)] hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default AnnouncementBar;
