import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface TablePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 15, 25, 50],
  itemLabel = 'mục'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const optionsToRender = React.useMemo(() => {
    if (pageSize && !pageSizeOptions.includes(pageSize)) {
      return [...pageSizeOptions, pageSize].sort((a, b) => a - b);
    }
    return pageSizeOptions;
  }, [pageSizeOptions, pageSize]);

  const getPageNumbers = (current: number, total: number) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      pages.push(current - 1);
      pages.push(current);
      pages.push(current + 1);
      pages.push('...');
      pages.push(total);
    }
    return pages;
  };

  return (
    <div className="px-4 py-2 bg-white border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 select-none">
      <div className="flex items-center gap-3">
        {totalItems > 0 ? (
          <span>
            Hiển thị <span className="font-semibold text-slate-900">{startIndex + 1}</span> -{' '}
            <span className="font-semibold text-slate-900">{endIndex}</span> trên{' '}
            <span className="font-semibold text-slate-900">{totalItems}</span> {itemLabel}
          </span>
        ) : (
          <span>0 {itemLabel}</span>
        )}

        {onPageSizeChange && totalItems > 10 && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Số dòng:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="border border-slate-200 rounded-md px-1.5 py-0.5 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#E53935]"
            >
              {optionsToRender.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers(currentPage, totalPages).map((pNum, pIdx) =>
              pNum === '...' ? (
                <span key={`ellipsis-${pIdx}`} className="px-1 text-slate-400">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${pNum}`}
                  type="button"
                  onClick={() => onPageChange(Number(pNum))}
                  className={`min-w-[26px] h-6 px-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    currentPage === pNum
                      ? 'bg-[#E53935] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pNum}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            title="Trang sau"
          >
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>
      )}
    </div>
  );
};
