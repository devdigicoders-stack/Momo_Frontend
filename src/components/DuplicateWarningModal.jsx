import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

const DuplicateWarningModal = ({
  isOpen,
  onCancel,
  onConfirm,
  title = 'Possible Duplicate Entry',
  message = 'A similar entry with matching amount or details was already recorded for this date. Do you want to proceed and save anyway?',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full border border-amber-200 shadow-2xl overflow-hidden animate-fadeIn">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-[#172033] mb-2">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed mb-6">
            {message}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-xs sm:text-sm font-semibold text-[#374151] hover:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Yes, Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateWarningModal;
