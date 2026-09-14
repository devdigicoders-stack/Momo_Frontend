import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 10,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#FFF8F1]/50 border-t border-[#E5E7EB] text-xs">
      <div className="text-[#6B7280]">
        Showing <span className="font-bold text-[#172033]">{startRecord}</span> to{' '}
        <span className="font-bold text-[#172033]">{endRecord}</span> of{' '}
        <span className="font-bold text-[#172033]">{total}</span> records
      </div>

      <div className="flex items-center space-x-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#172033] font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </button>

        <div className="flex items-center space-x-1 px-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === totalPages ||
                (p >= page - 1 && p <= page + 1)
            )
            .map((p, idx, arr) => {
              const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
              return (
                <React.Fragment key={p}>
                  {showEllipsis && <span className="text-slate-400 px-1">...</span>}
                  <button
                    onClick={() => onPageChange(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                      page === p
                        ? 'bg-[#F97316] text-white shadow-xs'
                        : 'bg-white border border-[#E5E7EB] text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#172033] font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
