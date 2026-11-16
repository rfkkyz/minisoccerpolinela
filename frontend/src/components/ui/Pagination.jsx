import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className = ''
}) {
  if (totalPages <= 1 && totalItems <= pageSize) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-2 text-xs font-mono text-[var(--ink-2)] select-none ${className}`}>
      {/* Item range count */}
      <div>
        Menampilkan <span className="font-semibold text-[var(--ink)]">{startItem}-{endItem}</span> dari <span className="font-semibold text-[var(--ink)]">{totalItems}</span> data
      </div>

      {/* Page navigation buttons */}
      <div className="flex items-center gap-1">
        {/* First */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          className="w-8 h-8 rounded-[8px] flex items-center justify-center border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-tint)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Halaman Pertama"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Prev */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 rounded-[8px] flex items-center justify-center border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-tint)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Sebelumnya"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Numbers */}
        {getPageNumbers().map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-[var(--ink-3)]">
                …
              </span>
            );
          }

          const isCurrent = page === currentPage;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-[8px] font-semibold flex items-center justify-center transition-colors cursor-pointer ${
                isCurrent
                  ? 'bg-[var(--seg-active)] text-white shadow-xs'
                  : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--surface-tint)]'
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Next */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 rounded-[8px] flex items-center justify-center border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-tint)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Berikutnya"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          className="w-8 h-8 rounded-[8px] flex items-center justify-center border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-tint)] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Halaman Terakhir"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;

