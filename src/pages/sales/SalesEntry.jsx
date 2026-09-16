import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import salesService from '../../services/salesService';
import Pagination from '../../components/Pagination';
import RecordDetailsModal from '../../components/RecordDetailsModal';
import EditHistoryModal from '../../components/EditHistoryModal';
import DuplicateWarningModal from '../../components/DuplicateWarningModal';
import exportToCsv from '../../utils/exportToCsv';
import { 
  IndianRupee, 
  Plus, 
  Search, 
  Calendar, 
  CreditCard, 
  Edit2, 
  Trash2, 
  X, 
  RotateCcw,
  TrendingUp,
  FileText,
  Eye,
  Download,
  History as HistoryIcon,
} from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Net Banking', 'Canara / Bank', 'Paytm', 'PhonePe', 'Other'];

const SalesEntry = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
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

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Form State
  const initialFormState = {
    date: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMode: 'Cash',
    remarks: '',
    reason: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Export Sales to CSV
  const handleExportSales = async () => {
    try {
      setExporting(true);
      const res = await salesService.getAllSales({
        page: 1,
        limit: 1000,
        search: searchTerm,
        paymentMode: filterMode,
        datePreset,
        fromDate,
        toDate,
        sortBy,
      });

      if (res.success && res.data && res.data.length > 0) {
        const headers = ['Entry ID', 'Date', 'Amount (Rs.)', 'Payment Mode', 'Remarks', 'Edited', 'Entered By', 'Created At'];
        const rows = res.data.map((s) => [
          s.entryCode || `SAL-${s._id.toString().slice(-4)}`,
          new Date(s.date).toLocaleDateString('en-IN'),
          s.amount,
          s.paymentMode,
          s.remarks || '',
          s.isEdited ? 'Yes' : 'No',
          s.enteredBy?.name || 'N/A',
          new Date(s.createdAt).toLocaleString('en-IN'),
        ]);
        exportToCsv('Sales_Records', headers, rows);
        toast.success(`Exported ${rows.length} sales records to CSV`);
      } else {
        toast.error('No sales records to export');
      }
    } catch (err) {
      toast.error('Failed to export sales records');
    } finally {
      setExporting(false);
    }
  };

  // Fetch sales records with query params
  const fetchSales = async (currentPage = page) => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        search: searchTerm,
        paymentMode: filterMode,
        datePreset,
        fromDate,
        toDate,
        sortBy,
      };

      const res = await salesService.getAllSales(params);
      if (res.success) {
        setSales(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load sales records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(1);
  }, [searchTerm, filterMode, datePreset, fromDate, toDate, sortBy]);

  const handlePageChange = (newPage) => {
    fetchSales(newPage);
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
    setFilterMode('');
    setDatePreset('');
    setFromDate('');
    setToDate('');
    setSortBy('newest');
    setPage(1);
  };

  const handleOpenAdd = () => {
    setEditingSale(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleOpenEdit = (sale) => {
    setEditingSale(sale);
    setFormData({
      date: new Date(sale.date).toISOString().split('T')[0],
      amount: sale.amount,
      paymentMode: sale.paymentMode,
      remarks: sale.remarks || '',
      reason: '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSale(null);
    setFormData(initialFormState);
  };

  const openHistory = (item) => {
    setSelectedHistory(item.editHistory || []);
    setHistoryTitle(`Sales Entry [${item.entryCode || item._id}] Edit Log`);
    setHistoryModalOpen(true);
  };

  // Check duplicate and save
  const triggerSave = async (addAnother = false) => {
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Please enter a valid sales amount greater than 0');
      return;
    }

    // Check potential duplicate on same date and same amount (for new entries)
    if (!editingSale) {
      const match = sales.find(
        (s) =>
          new Date(s.date).toISOString().split('T')[0] === formData.date &&
          Number(s.amount) === Number(formData.amount) &&
          s.paymentMode === formData.paymentMode
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
      if (editingSale) {
        const res = await salesService.updateSales(editingSale._id, formData);
        if (res.success) {
          toast.success('Sales entry updated successfully!');
          fetchSales();
          handleCloseModal();
        }
      } else {
        const res = await salesService.createSales(formData);
        if (res.success) {
          toast.success('Sales entry recorded successfully!');
          fetchSales(1);
          if (addAnother) {
            setFormData({
              ...initialFormState,
              date: formData.date,
              paymentMode: formData.paymentMode,
            });
          } else {
            handleCloseModal();
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save sales entry');
    } finally {
      setSubmitting(false);
      setDuplicateWarningOpen(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Sales Record?',
      text: 'Are you sure you want to delete this sales transaction?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#172033',
      confirmButtonText: 'Yes, delete it',
    });

    if (result.isConfirmed) {
      try {
        const res = await salesService.deleteSales(id);
        if (res.success) {
          toast.success('Sales record deleted');
          fetchSales();
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
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Daily Business Revenue</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033]">
            Sales Records & Entry
          </h1>
          <p className="text-xs text-[#6B7280]">
            Browse, search, filter, and review daily sales transactions with detailed audit tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportSales}
            disabled={exporting || total === 0}
            className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#FFF0E5] hover:border-[#F97316] text-[#172033] text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-1.5 text-[#F97316]" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-md shadow-[#F97316]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            <span>New Sales Entry</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar with Date Presets */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
        {/* Top Filter Row: Search, Payment Mode, Sort */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search remarks, entry code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Payment Mode Filter */}
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
            </select>

            {(searchTerm || filterMode || datePreset || fromDate || toDate || sortBy !== 'newest') && (
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

      {/* Sales Records Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF8F1] border-b border-[#E5E7EB] text-[11px] font-extrabold uppercase tracking-wider text-[#172033]">
                <th className="py-3.5 px-4 sm:px-6">Entry ID & Date</th>
                <th className="py-3.5 px-4 sm:px-6">Amount</th>
                <th className="py-3.5 px-4 sm:px-6">Payment Mode</th>
                <th className="py-3.5 px-4 sm:px-6">Remarks</th>
                <th className="py-3.5 px-4 sm:px-6">Entered By</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-xs font-medium text-[#374151]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-6">
                    <SkeletonLoader rows={4} />
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm text-[#172033]">No Sales Records Found</p>
                      <p className="text-xs text-slate-400">Try changing your filters or record a new sales entry.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((item) => (
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
                        {item.entryCode || `SAL-${item._id.slice(-4)}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-[#16A34A] text-sm whitespace-nowrap">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#2563EB]/10 text-[#2563EB]">
                        <CreditCard className="w-3 h-3 mr-1" />
                        {item.paymentMode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-[#6B7280] max-w-xs truncate">
                      {item.remarks || '—'}
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
                        {user?.role === 'SUPER_ADMIN' && (
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

      {/* Add / Edit Sales Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto transition-all duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-[#FFF0E5] text-[#F97316]">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">
                    {editingSale ? 'Edit Sales Entry' : 'New Sales Entry'}
                  </h3>
                  <p className="text-xs text-[#6B7280]">Daily collection form</p>
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
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
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

              {/* Total Sales Amount */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Total Sales Amount (₹) <span className="text-rose-500">*</span>
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
                    placeholder="e.g. 14500"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-4 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-sm font-bold text-[#16A34A] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
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

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Remarks / Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Evening peak shift collection"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316]"
                ></textarea>
              </div>

              {/* Reason for correction (if editing) */}
              {editingSale && (
                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1.5">
                    Correction Reason / Audit Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Adjusted cash discrepancy"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-medium text-navy-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                {!editingSale && (
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
                  {submitting ? 'Saving...' : editingSale ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Details Modal */}
      <RecordDetailsModal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Sales Record Details"
        data={viewingRecord}
      />

      {/* Edit Audit History Modal */}
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
        title="Possible Duplicate Sales Entry"
        message={`A sales entry of ₹${Number(formData.amount).toLocaleString('en-IN')} (${formData.paymentMode}) is already recorded for ${formData.date}. Do you want to continue?`}
      />
    </div>
  );
};

export default SalesEntry;
