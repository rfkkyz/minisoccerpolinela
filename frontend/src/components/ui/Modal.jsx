import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[var(--scrim)] backdrop-blur-[6px]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`relative w-full ${maxWidth} rounded-[24px] bg-[var(--surface)] shadow-[var(--shadow-lg)] border border-[var(--line)] overflow-hidden z-10 ${className}`}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--line)] bg-[var(--paper-2)]/50">
                <h3 className="font-sans font-bold text-base text-[var(--ink)]">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-tint)] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="p-6 max-h-[85vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
