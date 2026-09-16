import React from 'react';
import { X, History, Clock, User } from 'lucide-react';

const EditHistoryModal = ({ isOpen, onClose, recordTitle, editHistory = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-[#E5E7EB] shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#172033]">
                Record Edit History
              </h3>
              <p className="text-xs text-[#6B7280]">
                {recordTitle || 'Audit log of corrections and updates'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#6B7280] hover:text-[#172033] rounded-lg hover:bg-white/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {!editHistory || editHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <History className="w-6 h-6" />
              </div>
              <p className="text-sm text-[#172033] font-semibold">
                No edit history recorded yet
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
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
                  className="bg-[#FFF8F1]/60 rounded-xl p-4 border border-[#E5E7EB] space-y-3"
                >
                  <div className="flex items-center justify-between text-xs border-b border-[#E5E7EB] pb-2">
                    <div className="flex items-center gap-1.5 font-semibold text-[#172033]">
                      <User className="w-3.5 h-3.5 text-orange-500" />
                      <span>{item.editedBy?.name || 'Staff / Manager'}</span>
                      {item.editedBy?.role && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-mono">
                          {item.editedBy.role}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[#6B7280]">
                      <Clock className="w-3 h-3" />
                      <span>{editedAt}</span>
                    </div>
                  </div>

                  {item.reason && (
                    <div className="text-xs text-[#4B5563] italic bg-white px-3 py-1.5 rounded-lg border border-[#E5E7EB]">
                      <span className="font-semibold text-[#172033]">Reason:</span>{' '}
                      {item.reason}
                    </div>
                  )}

                  {/* Changes comparison */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-red-50/70 p-2.5 rounded-lg border border-red-100">
                      <span className="font-bold text-red-600 block mb-1">Previous Values:</span>
                      <pre className="text-[11px] text-[#374151] font-sans whitespace-pre-wrap">
                        {item.previousData
                          ? Object.entries(item.previousData)
                              .filter(([k]) => !['_id', '__v', 'createdAt', 'updatedAt'].includes(k))
                              .map(([k, v]) => `${k}: ${v}`)
                              .join('\n')
                          : 'Original data'}
                      </pre>
                    </div>

                    <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100">
                      <span className="font-bold text-emerald-600 block mb-1">Updated Values:</span>
                      <pre className="text-[11px] text-[#374151] font-sans whitespace-pre-wrap">
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
        <div className="p-4 border-t border-[#E5E7EB] flex justify-end bg-gray-50/60">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[#172033] text-white hover:bg-[#232F48] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditHistoryModal;
