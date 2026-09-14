import React from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  CreditCard,
  Paperclip,
  Tag,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from 'lucide-react';

const RecordDetailsModal = ({ isOpen, onClose, title, data = {}, type = 'general' }) => {
  if (!isOpen || !data) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E7EB] animate-in fade-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#FFF0E5] text-[#F97316]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033]">{title}</h3>
              <p className="text-xs text-[#6B7280]">Complete metadata & transaction details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1 text-xs">
          {/* Main Key-Value Grid */}
          <div className="bg-[#FFF8F1] rounded-2xl p-4 border border-[#E5E7EB] space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
              <span className="text-[#6B7280] font-semibold">Transaction Date:</span>
              <span className="font-bold text-[#172033] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
                {formatDate(data.date || data.joiningDate)}
              </span>
            </div>

            {/* Sales specific */}
            {data.amount !== undefined && (
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                <span className="text-[#6B7280] font-semibold">Total Amount:</span>
                <span className="font-extrabold text-[#16A34A] text-sm">
                  ₹{Number(data.amount || data.totalAmount || data.salary || 0).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Expenses specific */}
            {data.category && (
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                <span className="text-[#6B7280] font-semibold">Category / Subcategory:</span>
                <span className="font-bold text-[#172033]">
                  {data.category} {data.subcategory ? `› ${data.subcategory}` : ''}
                </span>
              </div>
            )}

            {data.item && (
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                <span className="text-[#6B7280] font-semibold">Item / Description:</span>
                <span className="font-bold text-[#172033]">{data.item}</span>
              </div>
            )}

            {/* Momo Purchases specific */}
            {data.momoType && (
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                <span className="text-[#6B7280] font-semibold">Momo Type & Quantity:</span>
                <span className="font-bold text-[#F97316]">
                  {data.momoType} ({data.quantity} units @ ₹{data.rate})
                </span>
              </div>
            )}

            {data.supplierName && (
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                <span className="text-[#6B7280] font-semibold">Supplier Name:</span>
                <span className="font-bold text-[#172033]">{data.supplierName}</span>
              </div>
            )}

            {/* Cash Entry specific */}
            {data.openingCash !== undefined && (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280] font-semibold">Opening Float:</span>
                  <span className="font-bold text-slate-700">₹{data.openingCash?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                  <span className="text-emerald-700 font-semibold">+ Cash Received:</span>
                  <span className="font-bold text-emerald-700">+₹{data.cashReceived?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                  <span className="text-rose-700 font-semibold">- Cash Paid Out:</span>
                  <span className="font-bold text-rose-700">-₹{data.cashPaid?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB]">
                  <span className="text-[#F97316] font-extrabold">Closing Drawer Cash:</span>
                  <span className="font-black text-[#F97316] text-sm">₹{data.closingCash?.toLocaleString('en-IN')}</span>
                </div>
              </>
            )}

            {/* Chef Requirements specific */}
            {data.itemName && (
              <>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280] font-semibold">Item & Quantity:</span>
                  <span className="font-bold text-[#172033]">{data.itemName} ({data.quantity} {data.unit})</span>
                </div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280] font-semibold">Priority & Status:</span>
                  <span className="font-bold text-[#F97316]">{data.priority} Priority • {data.status}</span>
                </div>
              </>
            )}

            {/* Employee specific */}
            {data.designation && (
              <>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280] font-semibold">Designation & Mobile:</span>
                  <span className="font-bold text-[#172033]">{data.designation} • {data.mobile}</span>
                </div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                  <span className="text-[#6B7280] font-semibold">Status:</span>
                  <span className="font-bold text-emerald-700">{data.status}</span>
                </div>
              </>
            )}

            {/* Payment Mode */}
            {data.paymentMode && (
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                <span className="text-[#6B7280] font-semibold">Payment Mode:</span>
                <span className="font-bold text-blue-700 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  {data.paymentMode}
                </span>
              </div>
            )}

            {/* Attached Bill Receipt */}
            {data.bill && (
              <div className="flex items-center justify-between pb-2.5 border-b border-[#E5E7EB]">
                <span className="text-[#6B7280] font-semibold">Bill / Receipt File:</span>
                <a
                  href={`http://localhost:5000${data.bill}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#2563EB] hover:underline flex items-center gap-1"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  Open Attachment
                </a>
              </div>
            )}

            {/* Remarks */}
            <div className="pt-1">
              <span className="text-[#6B7280] font-semibold block mb-1">Remarks / Operational Note:</span>
              <p className="p-2.5 bg-white rounded-xl border border-[#E5E7EB] text-slate-700 italic">
                {data.remarks || 'No remarks provided.'}
              </p>
            </div>
          </div>

          {/* Audit Metadata Box: Entered By, Created At, Updated At */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs space-y-2.5 text-[11px]">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#172033] mb-1">
              <ShieldCheck className="w-4 h-4 text-[#F97316]" />
              <span>Data Ownership & Timestamps</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Entered By User:</span>
              <span className="font-bold text-[#172033]">
                {data.enteredBy?.name || 'Staff User'} ({data.enteredBy?.role || 'Staff'})
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Created Timestamp:</span>
              <span className="font-medium text-slate-800 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatDateTime(data.createdAt)}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Last Updated:</span>
              <span className="font-medium text-slate-800 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatDateTime(data.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E5E7EB] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordDetailsModal;
