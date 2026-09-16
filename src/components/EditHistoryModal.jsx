import React from 'react';
import { X, History, Clock, User, ArrowRight } from 'lucide-react';

const EditHistoryModal = ({ isOpen, onClose, recordTitle, editHistory = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200">
      <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-xl w-full border border-gray-100 dark:border-navy-800 shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-navy-800 flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100/30 dark:from-navy-800 dark:to-navy-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-900 dark:text-white">
                Record Edit History
              </h3>
              <p className="text-xs text-navy-500 dark:text-navy-400">
                {recordTitle || 'Audit log of corrections and updates'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-navy-400 hover:text-navy-700 dark:hover:text-white rounded-lg hover:bg-white/60 dark:hover:bg-navy-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {!editHistory || editHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-navy-800 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <History className="w-6 h-6" />
              </div>
              <p className="text-sm text-navy-600 dark:text-navy-300 font-medium">
                No edit history recorded yet
              </p>
              <p className="text-xs text-navy-400 mt-1">
                This record remains in its original creation state.
              </p>
            </div>
          ) : (
            editHistory.map((item, index) => {
              const editedAt = item.editedAt
                ? new Date(item.editedAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'N/A';

              return (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-navy-800/60 rounded-xl p-4 border border-gray-100 dark:border-navy-700/60 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs border-b border-gray-200/60 dark:border-navy-700 pb-2">
                    <div className="flex items-center gap-1.5 font-semibold text-navy-800 dark:text-white">
                      <User className="w-3.5 h-3.5 text-orange-500" />
                      <span>{item.editedBy?.name || 'Staff / Manager'}</span>
                      {item.editedBy?.role && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-mono">
                          {item.editedBy.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-navy-400">
                      <Clock className="w-3 h-3" />
                      <span>{editedAt}</span>
                    </div>
                  </div>

                  {item.reason && (
                    <div className="text-xs text-navy-600 dark:text-navy-300 italic bg-white dark:bg-navy-900 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-navy-800">
                      <span className="font-semibold text-navy-800 dark:text-navy-200">Reason:</span>{' '}
                      {item.reason}
                    </div>
                  )}

                  {/* Changes comparison */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-red-50/50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
                      <span className="font-bold text-red-600 block mb-1">Previous Values:</span>
                      <pre className="text-[11px] text-navy-700 dark:text-navy-300 font-sans whitespace-pre-wrap">
                        {item.previousData
                          ? Object.entries(item.previousData)
                              .filter(([k]) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(k))
                              .map(([k, v]) => `${k}: ${v}`)
                              .join('\n')
                          : 'Original data'}
                      </pre>
                    </div>

                    <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                      <span className="font-bold text-emerald-600 block mb-1">Updated Values:</span>
                      <pre className="text-[11px] text-navy-700 dark:text-navy-300 font-sans whitespace-pre-wrap">
                        {item.updatedData
                          ? Object.entries(item.updatedData)
                              .filter(([k]) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(k))
                              .map(([k, v]) => `${k}: ${v}`)
                              .join('\n')
                          : 'Updated data'}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-navy-800 flex justify-end bg-gray-50/50 dark:bg-navy-900">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-navy-900 dark:bg-white text-white dark:text-navy-900 hover:bg-navy-800 dark:hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditHistoryModal;
