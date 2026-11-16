import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer = null,
  width = 'max-w-[480px]', // 480px
  className = ''
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--scrim)] backdrop-blur-[6px]"
          />

          {/* Drawer Slide */}
          <div className="fixed inset-y-0 right-0 max-w-full flex">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className={`w-screen ${width} bg-[var(--surface)] sm:rounded-l-[24px] shadow-[var(--shadow-lg)] border-l border-[var(--line)] flex flex-col z-10 overflow-hidden relative ${className}`}
            >
              {/* Header Neon Accent Strip (3px) */}
              <div className="h-1 w-full bg-gradient-to-r from-[var(--accent)] via-[var(--accent-strong)] to-[var(--seg-active)]" />

              {/* Header */}
              <div className="px-6 py-5 border-b border-[var(--line)] bg-[var(--surface)] flex items-start justify-between gap-4 shrink-0">
                <div>
                  <h3 className="font-sans font-bold text-lg text-[var(--ink)]">
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="font-mono text-xs text-[var(--ink-2)] mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-tint)] transition-colors cursor-pointer shrink-0"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body (Scrollable) */}
              <div className="p-6 overflow-y-auto flex-1 text-[var(--ink)]">
                {children}
              </div>

              {/* Optional Sticky Footer */}
              {footer && (
                <div className="p-4 sm:px-6 border-t border-[var(--line)] bg-[var(--paper)] shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Drawer;
