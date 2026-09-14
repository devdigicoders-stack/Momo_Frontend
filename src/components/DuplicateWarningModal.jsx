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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-md w-full border border-amber-200 dark:border-amber-900/50 shadow-2xl overflow-hidden animate-fadeIn">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-900/30">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-navy-900 dark:text-white mb-2">
            {title}
          </h3>

          <p className="text-sm text-navy-600 dark:text-navy-300 leading-relaxed mb-6">
            {message}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-navy-700 text-sm font-semibold text-navy-700 dark:text-navy-200 hover:bg-gray-50 dark:hover:bg-navy-800 transition flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-md shadow-amber-600/20"
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
