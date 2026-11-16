import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';
import Button from './Button';

export function Table({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'Tidak ada data ditemukan.',
  pagination = null,
  onPageChange = null,
  onSort = null,
  sortColumn = null,
  sortDirection = 'asc',
  className = ''
}) {
  const getColKey = (col, idx) => col.key || col.accessor || col.id || `col_${idx}`;
  const getColLabel = (col) => col.label ?? col.header ?? col.title ?? '';

  const renderCellContent = (col, row, idx) => {
    const key = col.key || col.accessor || col.id;
    const val = key !== undefined && row ? row[key] : undefined;

    if (col.render) {
      if (typeof col.render === 'function') {
        try {
          // If function expects 1 argument or was designed for (row), pass row
          // If function expects (val, row) (e.g. length > 1), pass (val, row)
          if (col.render.length === 1) {
            return col.render(row);
          }
          return col.render(val, row);
        } catch (err) {
          try {
            return col.render(row);
          } catch {
            return val ?? '-';
          }
        }
      }
      return col.render;
    }
    return val !== undefined && val !== null ? String(val) : '-';
  };

  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-sm ${className}`}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#F8FAF9] border-b border-emerald-950/10 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              {columns.map((col, idx) => {
                const key = getColKey(col, idx);
                const label = getColLabel(col);
                return (
                  <th
                    key={key}
                    onClick={() => col.sortable && onSort && onSort(key)}
                    className={`py-3.5 px-4 select-none ${col.sortable ? 'cursor-pointer hover:text-emerald-700' : ''} ${col.headerClassName || ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{label}</span>
                      {col.sortable && (
                        <ArrowUpDown className="w-3 h-3 opacity-60 text-emerald-600" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-950/5 text-slate-800">
            {loading ? (
              // Skeleton loading
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((c, cIdx) => (
                    <td key={getColKey(c, cIdx)} className="py-4 px-4">
                      <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400 text-xs font-medium">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-emerald-50/40 transition-colors"
                >
                  {columns.map((col, cIdx) => (
                    <td key={getColKey(col, cIdx)} className={`py-3.5 px-4 ${col.cellClassName || ''}`}>
                      {renderCellContent(col, row, cIdx)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden divide-y divide-emerald-950/5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-3 bg-slate-50 rounded w-3/4" />
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">
            {emptyMessage}
          </div>
        ) : (
          data.map((row, idx) => (
            <div key={row.id || idx} className="p-4 space-y-2.5 text-xs">
              {columns.map((col, cIdx) => (
                <div key={getColKey(col, cIdx)} className="flex justify-between items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    {getColLabel(col)}
                  </span>
                  <div className="text-right font-medium">
                    {renderCellContent(col, row, cIdx)}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Pagination Bar */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-emerald-950/10 bg-[#F8FAF9] text-xs font-medium text-slate-600">
          <div>
            Halaman <span className="font-bold text-slate-900">{pagination.page}</span> dari{' '}
            <span className="font-bold text-slate-900">{pagination.total_pages}</span> ({pagination.total} total)
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange && onPageChange(1)}
              className="text-slate-700 border-slate-200 hover:bg-slate-100"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange && onPageChange(pagination.page - 1)}
              className="text-slate-700 border-slate-200 hover:bg-slate-100"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => onPageChange && onPageChange(pagination.page + 1)}
              className="text-slate-700 border-slate-200 hover:bg-slate-100"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => onPageChange && onPageChange(pagination.total_pages)}
              className="text-slate-700 border-slate-200 hover:bg-slate-100"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;

