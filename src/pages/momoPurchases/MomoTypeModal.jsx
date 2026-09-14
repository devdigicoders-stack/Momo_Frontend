import React, { useState } from 'react';
import { Plus, X, Layers, Trash2, CheckCircle2 } from 'lucide-react';
import { momoTypeService } from '../../services/momoPurchaseService';
import toast from 'react-hot-toast';

const MomoTypeModal = ({ isOpen, onClose, momoTypes, onTypesUpdated }) => {
  const [newTypeName, setNewTypeName] = useState('');
  const [newDefaultRate, setNewDefaultRate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreateType = async (e) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      toast.error('Momo type name is required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await momoTypeService.createMomoType({
        name: newTypeName.trim(),
        defaultRate: newDefaultRate ? Number(newDefaultRate) : 0,
      });

      if (res.success) {
        toast.success(`Momo type "${newTypeName}" created!`);
        setNewTypeName('');
        setNewDefaultRate('');
        onTypesUpdated();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create momo type');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (typeId) => {
    try {
      const res = await momoTypeService.toggleMomoTypeStatus(typeId);
      if (res.success) {
        toast.success(res.message);
        onTypesUpdated();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update momo type');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E7EB] animate-in fade-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-[#FFF0E5] text-[#F97316]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033]">
                Momo Types Master
              </h3>
              <p className="text-xs text-[#6B7280]">
                Configure momo varieties and default rates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
          {/* Add New Form */}
          <form
            onSubmit={handleCreateType}
            className="bg-[#FFF8F1] p-4 rounded-2xl border border-[#E5E7EB] space-y-3"
          >
            <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Add New Momo Type
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Variety Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cheese Corn Momo"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Default Rate (₹ / plate or unit)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 45"
                  value={newDefaultRate}
                  onChange={(e) => setNewDefaultRate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316]"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                {submitting ? 'Adding...' : 'Add Variety'}
              </button>
            </div>
          </form>

          {/* Current Master List */}
          <div>
            <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2.5">
              Available Types ({momoTypes.length})
            </h4>
            <div className="space-y-2">
              {momoTypes.map((type) => (
                <div
                  key={type._id}
                  className="p-3 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#172033]">{type.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          type.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {type.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      Default Rate: <span className="font-bold text-[#172033]">₹{type.defaultRate || 0}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleStatus(type._id)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                      type.isActive
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {type.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#E5E7EB] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MomoTypeModal;
