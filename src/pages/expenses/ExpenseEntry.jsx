import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import expenseService, { expenseCategoryService } from '../../services/expenseService';
import ExpenseCategoryModal from './ExpenseCategoryModal';
import Pagination from '../../components/Pagination';
import RecordDetailsModal from '../../components/RecordDetailsModal';
import EditHistoryModal from '../../components/EditHistoryModal';
import DuplicateWarningModal from '../../components/DuplicateWarningModal';
import exportToCsv from '../../utils/exportToCsv';
import {
  ReceiptIndianRupee,
  Plus,
  Search,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  X,
  RotateCcw,
  Tag,
  Paperclip,
  FileText,
  Eye,
  Download,
  History as HistoryIcon,
} from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Net Banking', 'Canara / Bank', 'Paytm', 'PhonePe', 'Other'];

const ExpenseEntry = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

  // Edit History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [historyTitle, setHistoryTitle] = useState('');

  // Duplicate Warning Modal State
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [pendingSubmitAction, setPendingSubmitAction] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Form State
  const initialFormState = {
    date: new Date().toISOString().split('T')[0],
    category: '',
    subcategory: '',
    item: '',
    amount: '',
    paymentMode: 'Cash',
    remarks: '',
    reason: '',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [billFile, setBillFile] = useState(null);

  // File change validation
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
      if (!allowed.includes(file.type)) {
        toast.error('Invalid file type. Please upload a JPG, PNG, WEBP image or PDF document.');
        e.target.value = '';
        setBillFile(null);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit. Please upload a smaller file.');
        e.target.value = '';
        setBillFile(null);
        return;
      }
      setBillFile(file);
      toast.success(`Attached: ${file.name} (${(file.size / 1024).toFixed(0)} KB)`);
    }
  };

  // Export Expenses to CSV
  const handleExportExpenses = async () => {
    try {
      setExporting(true);
      const res = await expenseService.getAllExpenses({
        page: 1,
        limit: 1000,
        search: searchTerm,
        category: filterCategory,
        subcategory: filterSubcategory,
        paymentMode: filterMode,
        datePreset,
        fromDate,
        toDate,
        sortBy,
      });

      if (res.success && res.data && res.data.length > 0) {
        const headers = ['Entry ID', 'Date', 'Category', 'Subcategory', 'Item / Description', 'Amount (Rs.)', 'Payment Mode', 'Remarks', 'Edited', 'Entered By', 'Created At'];
        const rows = res.data.map((e) => [
          e.entryCode || `EXP-${e._id.toString().slice(-4)}`,
          new Date(e.date).toLocaleDateString('en-IN'),
          e.category,
          e.subcategory || '',
          e.item,
          e.amount,
          e.paymentMode,
          e.remarks || '',
          e.isEdited ? 'Yes' : 'No',
          e.enteredBy?.name || 'N/A',
          new Date(e.createdAt).toLocaleString('en-IN'),
        ]);
        exportToCsv('Expense_Records', headers, rows);
        toast.success(`Exported ${rows.length} expense records to CSV`);
      } else {
        toast.error('No expense records to export');
      }
    } catch (err) {
      toast.error('Failed to export expenses');
    } finally {
      setExporting(false);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await expenseCategoryService.getAllCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error('Failed to load expense categories:', error);
    }
  };

  // Fetch Expenses with server pagination & query filters
  const fetchExpenses = async (currentPage = page) => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        search: searchTerm,
        category: filterCategory,
        subcategory: filterSubcategory,
        paymentMode: filterMode,
        datePreset,
        fromDate,
        toDate,
        sortBy,
      };

      const res = await expenseService.getAllExpenses(params);
      if (res.success) {
        setExpenses(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpenses(1);
  }, [
    searchTerm,
    filterCategory,
    filterSubcategory,
    filterMode,
    datePreset,
    fromDate,
    toDate,
    sortBy,
  ]);

  const handlePageChange = (newPage) => {
    fetchExpenses(newPage);
  };

  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      setFromDate('');
      setToDate('');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterSubcategory('');
    setFilterMode('');
    setDatePreset('');
    setFromDate('');
    setToDate('');
    setSortBy('newest');
    setPage(1);
  };

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setFormData(initialFormState);
    setBillFile(null);
    setShowModal(true);
  };

  const handleOpenEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      date: new Date(expense.date).toISOString().split('T')[0],
      category: expense.category,
      subcategory: expense.subcategory || '',
      item: expense.item,
      amount: expense.amount,
      paymentMode: expense.paymentMode,
      remarks: expense.remarks || '',
      reason: '',
    });
    setBillFile(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormData(initialFormState);
    setBillFile(null);
  };

  const openHistory = (item) => {
    setSelectedHistory(item.editHistory || []);
    setHistoryTitle(`Expense [${item.entryCode || item._id}] Edit Audit Log`);
    setHistoryModalOpen(true);
  };

  // Selected Category's subcategories for modal
  const currentCategoryObj = categories.find((c) => c.name === formData.category);
  const availableSubcategories = currentCategoryObj?.subcategories?.filter((s) => s.isActive) || [];

  // Selected Category's subcategories for filter bar
  const filterCategoryObj = categories.find((c) => c.name === filterCategory);
  const filterSubcategories = filterCategoryObj?.subcategories?.filter((s) => s.isActive) || [];

  // Trigger Save with duplicate warning check
  const triggerSave = async (addAnother = false) => {
    if (!formData.category) {
      toast.error('Please select an expense category');
      return;
    }

    if (!formData.item.trim()) {
      toast.error('Please enter the item or description');
      return;
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (!editingExpense) {
      const match = expenses.find(
        (e) =>
          new Date(e.date).toISOString().split('T')[0] === formData.date &&
          e.category === formData.category &&
          Number(e.amount) === Number(formData.amount) &&
          e.item.trim().toLowerCase() === formData.item.trim().toLowerCase()
      );
      if (match && !duplicateWarningOpen) {
        setPendingSubmitAction(() => () => executeSave(addAnother));
        setDuplicateWarningOpen(true);
        return;
      }
    }

    await executeSave(addAnother);
  };

  const executeSave = async (addAnother = false) => {
    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('date', formData.date);
      data.append('category', formData.category);
      data.append('subcategory', formData.subcategory);
      data.append('item', formData.item);
      data.append('amount', formData.amount);
      data.append('paymentMode', formData.paymentMode);
      data.append('remarks', formData.remarks);
      if (formData.reason) {
        data.append('reason', formData.reason);
      }
      if (billFile) {
        data.append('bill', billFile);
      }

      if (editingExpense) {
        const res = await expenseService.updateExpense(editingExpense._id, data);
        if (res.success) {
          toast.success('Expense updated successfully!');
          fetchExpenses();
          handleCloseModal();
        }
      } else {
        const res = await expenseService.createExpense(data);
        if (res.success) {
          toast.success('Expense recorded successfully!');
          fetchExpenses(1);
          if (addAnother) {
            setFormData({
              ...initialFormState,
              date: formData.date,
              category: formData.category,
              paymentMode: formData.paymentMode,
            });
            setBillFile(null);
          } else {
            handleCloseModal();
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
      setDuplicateWarningOpen(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Expense Entry?',
      text: 'Are you sure you want to remove this expense record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#172033',
      confirmButtonText: 'Yes, delete it',
    });

    if (result.isConfirmed) {
      try {
        const res = await expenseService.deleteExpense(id);
        if (res.success) {
          toast.success('Expense record deleted');
          fetchExpenses();
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete record');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0E5] text-[#F97316] mb-1.5">
            <ReceiptIndianRupee className="w-3.5 h-3.5" />
            <span>Store Operations & Outward Flow</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033]">
            Store Expense Records & Entry
          </h1>
          <p className="text-xs text-[#6B7280]">
            Search, filter by categories, inspect attached receipt bills, and manage operational expenditure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExpenses}
            disabled={exporting || total === 0}
            className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#FFF0E5] hover:border-[#F97316] text-[#172033] text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-1.5 text-[#F97316]" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-[#FFF8F1] hover:bg-[#FFF0E5] text-[#172033] border border-[#E5E7EB] text-xs font-bold transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 mr-1.5 text-[#F97316]" />
              Manage Categories
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-md shadow-[#F97316]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            New Expense
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search item, entry code, remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setFilterSubcategory('');
              }}
              className="px-3 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Subcategory Filter */}
            {filterSubcategories.length > 0 && (
              <select
                value={filterSubcategory}
                onChange={(e) => setFilterSubcategory(e.target.value)}
                className="px-3 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
              >
                <option value="">All Subcategories</option>
                {filterSubcategories.map((sub, idx) => (
                  <option key={idx} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>
            )}

            {/* Payment Mode */}
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="px-3 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="">All Payment Modes</option>
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount">Amount (High to Low)</option>
              <option value="item">Item Name (A-Z)</option>
            </select>

            {(searchTerm ||
              filterCategory ||
              filterSubcategory ||
              filterMode ||
              datePreset ||
              fromDate ||
              toDate ||
              sortBy !== 'newest') && (
              <button
                onClick={handleResetFilters}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Date Presets Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E7EB]">
          <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mr-1">
            Date Presets:
          </span>
          {['today', 'yesterday', 'this_week', 'custom'].map((preset) => (
            <button
              key={preset}
              onClick={() => handleDatePreset(datePreset === preset ? '' : preset)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                datePreset === preset
                  ? 'bg-[#F97316] text-white'
                  : 'bg-[#FFF8F1] text-slate-700 hover:bg-slate-100 border border-[#E5E7EB]'
              }`}
            >
              {preset === 'today'
                ? 'Today'
                : preset === 'yesterday'
                ? 'Yesterday'
                : preset === 'this_week'
                ? 'This Week'
                : 'Custom Range'}
            </button>
          ))}

          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 mt-1 sm:mt-0">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-2.5 py-1 bg-[#FFF8F1]/80 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#172033]"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-2.5 py-1 bg-[#FFF8F1]/80 border border-[#E5E7EB] rounded-lg text-xs font-medium text-[#172033]"
              />
            </div>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF8F1] border-b border-[#E5E7EB] text-[11px] font-extrabold uppercase tracking-wider text-[#172033]">
                <th className="py-3.5 px-4 sm:px-6">Entry ID & Date</th>
                <th className="py-3.5 px-4 sm:px-6">Category & Item</th>
                <th className="py-3.5 px-4 sm:px-6">Amount</th>
                <th className="py-3.5 px-4 sm:px-6">Payment Mode</th>
                <th className="py-3.5 px-4 sm:px-6">Bill / Receipt</th>
                <th className="py-3.5 px-4 sm:px-6">Entered By</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-xs font-medium text-[#374151]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-6">
                    <SkeletonLoader rows={4} />
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm text-[#172033]">No Expense Records Found</p>
                      <p className="text-xs text-slate-400">Try changing your search filters or click "+ New Expense".</p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FFF8F1]/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#172033] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>
                          {new Date(item.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {item.isEdited && (
                          <button
                            onClick={() => openHistory(item)}
                            className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold hover:underline cursor-pointer flex items-center gap-1"
                            title="View correction audit history"
                          >
                            <HistoryIcon className="w-3 h-3" /> Edited
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.entryCode || `EXP-${item._id.slice(-4)}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-bold text-[#172033]">{item.item}</div>
                      <div className="text-[11px] text-[#F97316] font-medium flex items-center gap-1">
                        <span>{item.category}</span>
                        {item.subcategory && (
                          <span className="text-slate-400 font-normal">› {item.subcategory}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-rose-600 text-sm whitespace-nowrap">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {item.paymentMode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      {item.bill ? (
                        <a
                          href={`http://localhost:5000${item.bill}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-xs font-semibold text-[#2563EB] hover:underline"
                        >
                          <Paperclip className="w-3.5 h-3.5 mr-1 text-[#2563EB]" />
                          View Receipt
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">— No receipt —</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <div className="font-semibold text-[#172033]">{item.enteredBy?.name || 'Staff'}</div>
                      <div className="text-[10px] text-[#6B7280]">
                        {item.lastUpdatedBy ? `Edited by ${item.lastUpdatedBy?.name}` : item.enteredBy?.role || ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setViewingRecord(item)}
                          className="p-1.5 text-slate-500 hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg transition-colors cursor-pointer"
                          title="View Record Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-[#F97316] hover:bg-[#FFF0E5] rounded-lg transition-colors cursor-pointer"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user?.role !== 'MANAGER_2' && (
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Add / Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto transition-all duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E7EB] animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-[#FFF0E5] text-[#F97316]">
                  <ReceiptIndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">
                    {editingExpense ? 'Edit Expense Entry' : 'New Expense Entry'}
                  </h3>
                  <p className="text-xs text-[#6B7280]">Store cost logging</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                triggerSave(false);
              }}
              className="mt-5 space-y-4"
            >
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              {/* Category & Subcategory Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value, subcategory: '' })
                    }
                    className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316]"
                  >
                    <option value="">Select Category</option>
                    {categories
                      .filter((c) => c.isActive)
                      .map((cat) => (
                        <option key={cat._id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Subcategory
                  </label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316]"
                    disabled={!availableSubcategories.length}
                  >
                    <option value="">Select Subcategory (Optional)</option>
                    {availableSubcategories.map((sub, idx) => (
                      <option key={idx} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Item / Description */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Item / Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5kg Onions, Gas cylinder refill, Daily wages"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              {/* Amount & Payment Mode Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="text-sm font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      inputMode="decimal"
                      required
                      placeholder="e.g. 850"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-8 pr-4 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-sm font-bold text-rose-600 focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Payment Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316]"
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bill / Receipt Upload */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Bill / Receipt Photo (Optional, ≤ 5MB)
                </label>
                <div className="flex items-center space-x-2">
                  <label className="flex-1 cursor-pointer flex items-center justify-center px-4 py-2 bg-[#FFF8F1]/50 border-2 border-dashed border-[#E5E7EB] hover:border-[#F97316] rounded-xl text-xs font-medium text-slate-600 transition-colors">
                    <Paperclip className="w-4 h-4 mr-2 text-[#F97316]" />
                    <span>{billFile ? billFile.name : 'Choose JPG, PNG, or PDF file'}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {billFile && (
                    <button
                      type="button"
                      onClick={() => setBillFile(null)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Optional expense note or invoice number"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316]"
                ></textarea>
              </div>

              {/* Reason for correction (if editing) */}
              {editingExpense && (
                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1.5">
                    Correction Reason / Audit Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Corrected invoice price"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-medium text-navy-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                {!editingExpense && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => triggerSave(true)}
                    className="px-4 py-2 rounded-xl border border-orange-200 bg-orange-50 text-[#F97316] hover:bg-orange-100 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    Save & Add Another
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-md shadow-[#F97316]/20 disabled:opacity-50 flex items-center cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Categories Master Modal */}
      <ExpenseCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories}
        onCategoriesUpdated={() => fetchCategories()}
      />

      {/* Record Details Modal */}
      <RecordDetailsModal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Expense Record Details"
        data={viewingRecord}
      />

      {/* Edit History Modal */}
      <EditHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        recordTitle={historyTitle}
        editHistory={selectedHistory}
      />

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={duplicateWarningOpen}
        onCancel={() => setDuplicateWarningOpen(false)}
        onConfirm={() => {
          if (pendingSubmitAction) pendingSubmitAction();
        }}
        title="Possible Duplicate Expense Voucher"
        message={`An expense for "${formData.item}" (₹${Number(formData.amount).toLocaleString('en-IN')}) under "${formData.category}" is already recorded on ${formData.date}. Do you want to proceed anyway?`}
      />
    </div>
  );
};

export default ExpenseEntry;
