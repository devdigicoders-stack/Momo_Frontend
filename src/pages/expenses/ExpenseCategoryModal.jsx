import React, { useState } from 'react';
import { Plus, X, Tag, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { expenseCategoryService } from '../../services/expenseService';
import toast from 'react-hot-toast';

const ExpenseCategoryModal = ({ isOpen, onClose, categories, onCategoriesUpdated }) => {
  const [newCatName, setNewCatName] = useState('');
  const [newSubcats, setNewSubcats] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      setSubmitting(true);
      const subcategoryArray = newSubcats
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await expenseCategoryService.createCategory({
        name: newCatName.trim(),
        subcategories: subcategoryArray,
      });

      if (res.success) {
        toast.success(`Category "${newCatName}" created!`);
        setNewCatName('');
        setNewSubcats('');
        onCategoriesUpdated();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (catId) => {
    try {
      const res = await expenseCategoryService.toggleCategoryStatus(catId);
      if (res.success) {
        toast.success(res.message);
        onCategoriesUpdated();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update category');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto transition-all duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#E5E7EB] animate-in fade-in duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-[#FFF0E5] text-[#F97316]">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033]">
                Expense Category & Subcategory Master
              </h3>
              <p className="text-xs text-[#6B7280]">
                Manage dynamic categorization for store expenses
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
        <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1">
          {/* Add New Category Form */}
          <form
            onSubmit={handleCreateCategory}
            className="bg-[#FFF8F1] p-4 rounded-2xl border border-[#E5E7EB] space-y-3"
          >
            <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
              Add New Expense Category
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Packaging, Equipment"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Subcategories (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Boxes, Spoons, Foil"
                  value={newSubcats}
                  onChange={(e) => setNewSubcats(e.target.value)}
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
                {submitting ? 'Creating...' : 'Save Category'}
              </button>
            </div>
          </form>

          {/* Current Master List */}
          <div>
            <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2.5">
              Configured Categories ({categories.length})
            </h4>
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="p-3 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#172033]">{cat.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          cat.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {cat.subcategories.map((sub, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-0.5 bg-[#FFF8F1] text-slate-600 rounded text-[10px] font-medium border border-slate-100"
                          >
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleStatus(cat._id)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                      cat.isActive
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {cat.isActive ? 'Deactivate' : 'Activate'}
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

export default ExpenseCategoryModal;
