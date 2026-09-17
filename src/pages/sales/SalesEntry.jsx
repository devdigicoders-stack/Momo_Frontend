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
  Coins,
  QrCode,
  Smartphone,
  Building2,
  Wallet,
  Calculator,
  Table as TableIcon,
  LayoutList,
  Layers,
  ArrowUpDown,
  ShieldCheck,
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
  const [viewingDay, setViewingDay] = useState(null);

  // View Mode: 'dpr' (Daily DPR Breakdown) | 'transactions' (Individual Records)
  const [viewMode, setViewMode] = useState('dpr');

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
    cash: '',
    canara: '',
    paytm: '',
    phonePe: '',
    others: '',
    amount: '',
    paymentMode: 'Cash',
    remarks: '',
    reason: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Real-time Auto Calculated Total Sales Amount
  const autoTotalSales = (
    (Number(formData.cash) || 0) +
    (Number(formData.canara) || 0) +
    (Number(formData.paytm) || 0) +
    (Number(formData.phonePe) || 0) +
    (Number(formData.others) || 0)
  );

  // Daily DPR Grouped Data (Day-by-Day Summary with Cash, Canara, Paytm, PhonePe, Others, Total)
  const dailySalesGrouped = React.useMemo(() => {
    const map = new Map();

    sales.forEach((s) => {
      const dateKey = new Date(s.date).toISOString().split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, {
          date: s.date,
          dateKey,
          cash: 0,
          canara: 0,
          paytm: 0,
          phonePe: 0,
          others: 0,
          totalAmount: 0,
          entriesCount: 0,
          isEdited: false,
          enteredBy: s.enteredBy,
          records: [],
        });
      }

      const day = map.get(dateKey);
      const amt = Number(s.amount) || 0;
      day.totalAmount += amt;
      day.entriesCount += 1;
      if (s.isEdited) day.isEdited = true;
      day.records.push(s);

      const mode = (s.paymentMode || '').toLowerCase();
      if (mode.includes('cash')) {
        day.cash += amt;
      } else if (mode.includes('canara') || mode.includes('bank')) {
        day.canara += amt;
      } else if (mode.includes('paytm')) {
        day.paytm += amt;
      } else if (mode.includes('phonepe') || mode.includes('phone pe')) {
        day.phonePe += amt;
      } else {
        day.others += amt;
      }
    });

    return Array.from(map.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [sales]);

  // Totals across grouped items
  const dprTotals = React.useMemo(() => {
    return dailySalesGrouped.reduce(
      (acc, day) => {
        acc.cash += day.cash;
        acc.canara += day.canara;
        acc.paytm += day.paytm;
        acc.phonePe += day.phonePe;
        acc.others += day.others;
        acc.total += day.totalAmount;
        return acc;
      },
      { cash: 0, canara: 0, paytm: 0, phonePe: 0, others: 0, total: 0 }
    );
  }, [dailySalesGrouped]);

  // Export Sales to CSV
  const handleExportSales = async () => {
    try {
      setExporting(true);
      if (viewMode === 'dpr' && dailySalesGrouped.length > 0) {
        const headers = ['Date', 'Cash (Rs.)', 'Canara (Rs.)', 'Paytm (Rs.)', 'PhonePe (Rs.)', 'Others (Rs.)', 'Total Amount (Rs.)', 'Entries Count'];
        const rows = dailySalesGrouped.map((day) => [
          new Date(day.date).toLocaleDateString('en-IN'),
          day.cash.toFixed(2),
          day.canara.toFixed(2),
          day.paytm.toFixed(2),
          day.phonePe.toFixed(2),
          day.others.toFixed(2),
          day.totalAmount.toFixed(2),
          day.entriesCount,
        ]);
        rows.push([
          'GRAND TOTAL',
          dprTotals.cash.toFixed(2),
          dprTotals.canara.toFixed(2),
          dprTotals.paytm.toFixed(2),
          dprTotals.phonePe.toFixed(2),
          dprTotals.others.toFixed(2),
          dprTotals.total.toFixed(2),
          dailySalesGrouped.reduce((a, d) => a + d.entriesCount, 0),
        ]);
        exportToCsv('Daily_Sales_DPR_Report', headers, rows);
        toast.success(`Exported ${dailySalesGrouped.length} DPR day summary records to CSV`);
        return;
      }

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
      ...initialFormState,
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
    if (editingSale) {
      if (!formData.amount || Number(formData.amount) <= 0) {
        toast.error('Please enter a valid sales amount greater than 0');
        return;
      }
      await executeSave(addAnother);
      return;
    }

    // New Entry validation using auto-calculated collection sum
    if (autoTotalSales <= 0) {
      toast.error('Please enter collection amount for at least one payment method (Cash, Canara, Paytm, PhonePe, or Others)');
      return;
    }

    await executeSave(addAnother);
  };

  const executeSave = async (addAnother = false) => {
    try {
      setSubmitting(true);
      if (editingSale) {
        const res = await salesService.updateSales(editingSale._id, {
          date: formData.date,
          amount: Number(formData.amount),
          paymentMode: formData.paymentMode,
          remarks: formData.remarks,
          reason: formData.reason,
        });
        if (res.success) {
          toast.success('Sales entry updated successfully!');
          fetchSales();
          handleCloseModal();
        }
      } else {
        const payload = {
          date: formData.date,
          cash: Number(formData.cash) || 0,
          canara: Number(formData.canara) || 0,
          paytm: Number(formData.paytm) || 0,
          phonePe: Number(formData.phonePe) || 0,
          others: Number(formData.others) || 0,
          totalSales: autoTotalSales,
          remarks: formData.remarks,
        };

        const res = await salesService.createSales(payload);
        if (res.success) {
          toast.success(res.message || 'Sales collection recorded successfully!');
          fetchSales(1);
          if (addAnother) {
            setFormData({
              ...initialFormState,
              date: formData.date,
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

      {/* Table Card with View Switcher */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        {/* Table View Tabs & Info Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 py-3.5 bg-white border-b border-[#E5E7EB] gap-3">
          <div className="flex items-center space-x-1.5 p-1 bg-[#FFF8F1] rounded-xl border border-orange-100/80 self-start">
            <button
              onClick={() => setViewMode('dpr')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'dpr'
                  ? 'bg-[#F97316] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#172033]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Daily DPR Breakdown</span>
            </button>
            <button
              onClick={() => setViewMode('transactions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'transactions'
                  ? 'bg-[#F97316] text-white shadow-xs'
                  : 'text-[#6B7280] hover:text-[#172033]'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>All Entries ({total})</span>
            </button>
          </div>

          <div className="text-xs text-[#6B7280] flex items-center gap-2">
            {viewMode === 'dpr' ? (
              <span className="font-semibold text-slate-600">
                Showing <strong className="text-[#172033]">{dailySalesGrouped.length}</strong> business day(s) summary
              </span>
            ) : (
              <span className="font-semibold text-slate-600">
                Showing <strong className="text-[#172033]">{sales.length}</strong> of {total} transaction records
              </span>
            )}
          </div>
        </div>

        {/* 1. DPR / DAILY BREAKDOWN TABLE (Matching Screenshot 1:1) */}
        {viewMode === 'dpr' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FFF8F1]/80 border-b border-[#E5E7EB] text-[11px] font-extrabold uppercase tracking-wider text-[#172033]">
                  <th className="py-3.5 px-4 sm:px-6">Date ↓</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Cash</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Canara</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Paytm</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">PhonePe</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Others</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right font-black text-[#EA580C]">Total Amount</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-xs font-medium text-[#374151]">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="p-6">
                      <SkeletonLoader rows={5} />
                    </td>
                  </tr>
                ) : dailySalesGrouped.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileText className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-sm text-[#172033]">No Daily Sales Records Found</p>
                        <p className="text-xs text-slate-400">Record a new daily collection entry to populate this table.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dailySalesGrouped.map((day) => (
                    <tr key={day.dateKey} className="hover:bg-[#FFF8F1]/50 transition-colors group">
                      {/* Date */}
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-[#172033] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
                          <span>
                            {new Date(day.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                          {day.isEdited && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 text-[9px] font-bold">
                              Edited
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal pl-5.5">
                          {day.entriesCount} record(s)
                        </div>
                      </td>

                      {/* Cash */}
                      <td className="py-3.5 px-4 sm:px-6 text-right font-semibold text-slate-800 whitespace-nowrap">
                        {day.cash > 0 ? (
                          <span className="text-emerald-700 font-bold">₹{day.cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-slate-400">₹0.00</span>
                        )}
                      </td>

                      {/* Canara */}
                      <td className="py-3.5 px-4 sm:px-6 text-right font-semibold text-slate-800 whitespace-nowrap">
                        {day.canara > 0 ? (
                          <span className="text-blue-700 font-bold">₹{day.canara.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-slate-400">₹0.00</span>
                        )}
                      </td>

                      {/* Paytm */}
                      <td className="py-3.5 px-4 sm:px-6 text-right font-semibold text-slate-800 whitespace-nowrap">
                        {day.paytm > 0 ? (
                          <span className="text-cyan-700 font-bold">₹{day.paytm.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-slate-400">₹0.00</span>
                        )}
                      </td>

                      {/* PhonePe */}
                      <td className="py-3.5 px-4 sm:px-6 text-right font-semibold text-slate-800 whitespace-nowrap">
                        {day.phonePe > 0 ? (
                          <span className="text-purple-700 font-bold">₹{day.phonePe.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-slate-400">₹0.00</span>
                        )}
                      </td>

                      {/* Others */}
                      <td className="py-3.5 px-4 sm:px-6 text-right font-semibold text-slate-800 whitespace-nowrap">
                        {day.others > 0 ? (
                          <span className="text-slate-700 font-bold">₹{day.others.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-slate-400">₹0.00</span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 sm:px-6 text-right font-extrabold text-[#16A34A] text-sm whitespace-nowrap bg-emerald-50/30">
                        ₹{day.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => setViewingDay(day)}
                            className="p-1.5 text-slate-500 hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg transition-colors cursor-pointer"
                            title="View Daily Collection Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingSale(null);
                              setFormData({
                                date: day.dateKey,
                                cash: day.cash > 0 ? String(day.cash) : '',
                                canara: day.canara > 0 ? String(day.canara) : '',
                                paytm: day.paytm > 0 ? String(day.paytm) : '',
                                phonePe: day.phonePe > 0 ? String(day.phonePe) : '',
                                others: day.others > 0 ? String(day.others) : '',
                                amount: '',
                                paymentMode: 'Cash',
                                remarks: day.records[0]?.remarks || '',
                                reason: '',
                              });
                              setShowModal(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-[#F97316] hover:bg-[#FFF0E5] rounded-lg transition-colors cursor-pointer"
                            title="Add / Update Collections for this Date"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {/* Total Footer Row */}
              {dailySalesGrouped.length > 0 && (
                <tfoot>
                  <tr className="bg-[#FFF0E5]/70 border-t-2 border-orange-200 text-xs font-black text-[#172033]">
                    <td className="py-3.5 px-4 sm:px-6 font-black uppercase tracking-wider text-[#EA580C]">
                      Grand Total
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right text-emerald-800">
                      ₹{dprTotals.cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right text-blue-800">
                      ₹{dprTotals.canara.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right text-cyan-800">
                      ₹{dprTotals.paytm.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right text-purple-800">
                      ₹{dprTotals.phonePe.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right text-slate-800">
                      ₹{dprTotals.others.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right text-sm font-black text-[#16A34A] bg-emerald-100/40">
                      ₹{dprTotals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          /* 2. DETAILED INDIVIDUAL TRANSACTIONS TABLE */
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
        )}

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto transition-all duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-[#E5E7EB] animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF0E5] text-[#F97316] flex items-center justify-center font-bold text-lg shadow-xs">
                  ₹
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#172033] leading-tight">
                    {editingSale ? 'Edit Sales Entry' : 'New Sales Entry'}
                  </h3>
                  <p className="text-xs text-[#6B7280]">Daily collection form</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                triggerSave(false);
              }}
              className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1"
            >
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-2xl text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/10 transition"
                  />
                </div>
              </div>

              {/* NEW ENTRY MODE: Collection Breakdown & Auto Calculated Total */}
              {!editingSale ? (
                <>
                  {/* Collection Breakdown Card */}
                  <div className="bg-[#FFF8F1]/60 p-3.5 sm:p-4 rounded-2xl border border-[#FDE68A]/60 space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-orange-100/80">
                      <span className="text-xs font-extrabold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-[#F97316]" />
                        Collection Amount
                      </span>
                      <span className="text-[10px] text-[#6B7280]">Enter payment breakdown</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Cash */}
                      <div>
                        <label className="block text-[11px] font-bold text-[#172033] mb-1">
                          Cash
                        </label>
                        <div className="relative">
                          <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            placeholder="0"
                            value={formData.cash}
                            onChange={(e) => setFormData({ ...formData, cash: e.target.value })}
                            className="w-full pl-6 pr-2.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#172033] focus:outline-none focus:border-[#F97316] transition"
                          />
                        </div>
                      </div>

                      {/* Canara */}
                      <div>
                        <label className="block text-[11px] font-bold text-[#172033] mb-1">
                          Canara
                        </label>
                        <div className="relative">
                          <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            placeholder="0"
                            value={formData.canara}
                            onChange={(e) => setFormData({ ...formData, canara: e.target.value })}
                            className="w-full pl-6 pr-2.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#172033] focus:outline-none focus:border-[#F97316] transition"
                          />
                        </div>
                      </div>

                      {/* Paytm */}
                      <div>
                        <label className="block text-[11px] font-bold text-[#172033] mb-1">
                          Paytm
                        </label>
                        <div className="relative">
                          <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            placeholder="0"
                            value={formData.paytm}
                            onChange={(e) => setFormData({ ...formData, paytm: e.target.value })}
                            className="w-full pl-6 pr-2.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#172033] focus:outline-none focus:border-[#F97316] transition"
                          />
                        </div>
                      </div>

                      {/* PhonePe */}
                      <div>
                        <label className="block text-[11px] font-bold text-[#172033] mb-1">
                          PhonePe
                        </label>
                        <div className="relative">
                          <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            placeholder="0"
                            value={formData.phonePe}
                            onChange={(e) => setFormData({ ...formData, phonePe: e.target.value })}
                            className="w-full pl-6 pr-2.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#172033] focus:outline-none focus:border-[#F97316] transition"
                          />
                        </div>
                      </div>

                      {/* Others */}
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-[#172033] mb-1">
                          Others
                        </label>
                        <div className="relative">
                          <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">₹</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            inputMode="decimal"
                            placeholder="0"
                            value={formData.others}
                            onChange={(e) => setFormData({ ...formData, others: e.target.value })}
                            className="w-full pl-6 pr-2.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#172033] focus:outline-none focus:border-[#F97316] transition"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Sales Amount (Auto Calculate) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-[#172033]">
                        Total Sales Amount (₹) <span className="text-rose-500">*</span>
                      </label>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#F97316]">
                        ⚡ Auto Calculate
                      </span>
                    </div>
                    <div className="relative">
                      <span className="text-sm font-bold text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2">
                        ₹
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={autoTotalSales > 0 ? autoTotalSales.toLocaleString('en-IN') : ''}
                        placeholder="e.g. 14500"
                        className="w-full pl-8 pr-4 py-2.5 bg-[#FFF8F1]/70 border border-orange-200 rounded-2xl text-sm font-extrabold text-[#16A34A] focus:outline-none cursor-default shadow-2xs"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* EDIT EXISTING RECORD MODE */
                <>
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
                        className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-2xl text-sm font-bold text-[#16A34A] focus:outline-none focus:border-[#F97316]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#172033] mb-1.5">
                      Payment Mode <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.paymentMode}
                      onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-2xl text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316]"
                    >
                      {PAYMENT_MODES.map((mode) => (
                        <option key={mode} value={mode}>
                          {mode}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

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
                  className="w-full px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-2xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] transition resize-none"
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
                    className="w-full px-3.5 py-2 bg-amber-50/50 border border-amber-200 rounded-2xl text-xs font-medium text-navy-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-[#E5E7EB] shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#6B7280] hover:text-[#172033] hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                {!editingSale && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => triggerSave(true)}
                    className="px-4 py-2.5 rounded-xl border border-orange-200 bg-[#FFF0E5] text-[#F97316] hover:bg-orange-100 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    Save & Add Another
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-md shadow-[#F97316]/25 transition cursor-pointer disabled:opacity-50 flex items-center"
                >
                  {submitting ? 'Saving...' : editingSale ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Daily Sales Collection Details Modal (for DPR Day View) */}
      {viewingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto transition-all duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#E5E7EB] animate-in fade-in duration-200 max-h-[92vh] flex flex-col my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF0E5] text-[#F97316] flex items-center justify-center font-bold text-lg shadow-xs">
                  ₹
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Daily Sales Collection Details</h3>
                  <p className="text-xs text-[#6B7280]">Complete payment breakdown & audit info</p>
                </div>
              </div>
              <button
                onClick={() => setViewingDay(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="overflow-y-auto py-4 space-y-4 flex-1 text-xs pr-1">
              {/* Top Banner Card: Date & Total Amount */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-4 border border-orange-200/80 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider block">
                    Transaction Date
                  </span>
                  <div className="font-extrabold text-[#172033] text-sm flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-4 h-4 text-[#F97316]" />
                    {new Date(viewingDay.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    {viewingDay.entriesCount} payment entry/entries logged
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Total Day Collection
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#16A34A] block">
                    ₹{viewingDay.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Payment Mode Breakdown Grid */}
              <div className="bg-[#FFF8F1]/60 rounded-2xl p-4 border border-[#E5E7EB] space-y-3">
                <span className="text-[11px] font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-orange-100/80">
                  <Coins className="w-3.5 h-3.5 text-[#F97316]" />
                  Payment Breakdown Summary
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* Cash */}
                  <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs">
                    <span className="text-[11px] font-bold text-emerald-700 block">Cash</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                      ₹{viewingDay.cash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Canara */}
                  <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs">
                    <span className="text-[11px] font-bold text-blue-700 block">Canara</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                      ₹{viewingDay.canara.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Paytm */}
                  <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs">
                    <span className="text-[11px] font-bold text-cyan-700 block">Paytm</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                      ₹{viewingDay.paytm.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* PhonePe */}
                  <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs">
                    <span className="text-[11px] font-bold text-purple-700 block">PhonePe</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                      ₹{viewingDay.phonePe.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Others */}
                  <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] shadow-2xs sm:col-span-2">
                    <span className="text-[11px] font-bold text-slate-700 block">Others</span>
                    <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                      ₹{viewingDay.others.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remarks / Operational Notes */}
              {viewingDay.records.some((r) => r.remarks) && (
                <div className="bg-white rounded-2xl p-3.5 border border-[#E5E7EB] space-y-1.5">
                  <span className="text-[11px] font-bold text-[#172033] block">
                    Remarks / Operational Notes:
                  </span>
                  <div className="space-y-1">
                    {viewingDay.records
                      .filter((r) => r.remarks)
                      .map((r, i) => (
                        <p key={i} className="text-xs text-[#4B5563] bg-[#FFF8F1]/40 p-2 rounded-lg border border-orange-50">
                          <strong className="text-[#172033]">{r.paymentMode}:</strong> {r.remarks}
                        </p>
                      ))}
                  </div>
                </div>
              )}

              {/* Ownership & Timestamps */}
              <div className="bg-white rounded-2xl p-3.5 border border-[#E5E7EB] space-y-2">
                <span className="text-[11px] font-bold text-[#172033] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F97316]" />
                  Data Ownership & Audit Trail
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Entered By:</span>
                    <span className="font-bold text-[#172033]">
                      {viewingDay.enteredBy?.name || viewingDay.records[0]?.enteredBy?.name || 'Staff'}
                      {viewingDay.enteredBy?.role ? ` (${viewingDay.enteredBy.role})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Created Timestamp:</span>
                    <span className="font-medium text-[#172033]">
                      {viewingDay.records[0]?.createdAt
                        ? new Date(viewingDay.records[0].createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  const day = viewingDay;
                  setViewingDay(null);
                  setEditingSale(null);
                  setFormData({
                    date: day.dateKey,
                    cash: day.cash > 0 ? String(day.cash) : '',
                    canara: day.canara > 0 ? String(day.canara) : '',
                    paytm: day.paytm > 0 ? String(day.paytm) : '',
                    phonePe: day.phonePe > 0 ? String(day.phonePe) : '',
                    others: day.others > 0 ? String(day.others) : '',
                    amount: '',
                    paymentMode: 'Cash',
                    remarks: day.records[0]?.remarks || '',
                    reason: '',
                  });
                  setShowModal(true);
                }}
                className="px-4 py-2 rounded-xl border border-orange-200 bg-[#FFF0E5] text-[#F97316] hover:bg-orange-100 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Daily Collection</span>
              </button>

              <button
                onClick={() => setViewingDay(null)}
                className="px-4 py-2 rounded-xl bg-[#172033] hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Details Modal (for individual transaction records) */}
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
