import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import cashService from '../../services/cashService';
import Pagination from '../../components/Pagination';
import EditHistoryModal from '../../components/EditHistoryModal';
import DuplicateWarningModal from '../../components/DuplicateWarningModal';
import exportToCsv from '../../utils/exportToCsv';
import {
  Wallet,
  Plus,
  Search,
  Calendar,
  Edit2,
  X,
  RotateCcw,
  Calculator,
  FileText,
  Eye,
  Download,
  History as HistoryIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';

const CashEntry = () => {
  const { user } = useAuth();

  // Active view tab: 'LEDGER' | 'ADDITIONAL' | 'DEPOSIT'
  const [activeTab, setActiveTab] = useState('LEDGER');

  // Summary & Live Calculation State
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Unified Transactions Ledger State
  const [transactions, setTransactions] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(true);
  const [ledgerType, setLedgerType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Forms State
  const initialAdditionalState = {
    date: todayStr,
    amount: '',
    reason: 'Additional Working Cash',
    providedBy: 'Owner',
    remarks: '',
  };
  const [additionalForm, setAdditionalForm] = useState(initialAdditionalState);

  const initialDepositState = {
    date: todayStr,
    amount: '',
    bank: 'Canara Bank',
    account: 'Main Restaurant A/C (Canara)',
    remarks: '',
    depositSlip: null,
  };
  const [depositForm, setDepositForm] = useState(initialDepositState);
  const [slipPreview, setSlipPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Modals State
  const [viewSlipUrl, setViewSlipUrl] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [historyTitle, setHistoryTitle] = useState('');
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    date: '',
    amount: '',
    reason: '',
    providedBy: '',
    bank: '',
    account: '',
    remarks: '',
    editReason: '',
    depositSlip: null,
  });

  // 1. Fetch Date-Wise Cash Summary & Available Balance
  const fetchSummary = async (dateVal) => {
    try {
      setLoadingSummary(true);
      const res = await cashService.getCashSummary(dateVal || selectedDate);
      if (res.success) {
        setSummaryData(res.data);
      }
    } catch (error) {
      console.error('Fetch cash summary error:', error);
      toast.error('Failed to load cash summary');
    } finally {
      setLoadingSummary(false);
    }
  };

  // 2. Fetch Unified Ledger Transactions
  const fetchTransactions = async () => {
    try {
      setLoadingLedger(true);
      const params = {
        page,
        limit,
        type: ledgerType !== 'ALL' ? ledgerType : undefined,
        search: searchTerm || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const res = await cashService.getUnifiedTransactions(params);
      if (res.success) {
        setTransactions(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotalRecords(res.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Fetch unified transactions error:', error);
      toast.error('Failed to load cash ledger');
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchSummary(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    fetchTransactions();
  }, [page, limit, ledgerType, startDate, endDate]);

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  // Reset Ledger Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setLedgerType('ALL');
    setPage(1);
  };

  // -------------------------------------------------------------
  // Submit: Additional Cash
  // -------------------------------------------------------------
  const submitAdditionalCash = async (stayOnForm = false) => {
    if (!additionalForm.amount || Number(additionalForm.amount) <= 0) {
      toast.error('Please enter a valid positive cash amount');
      return;
    }
    if (!additionalForm.reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    if (!additionalForm.providedBy.trim()) {
      toast.error('Please provide who gave the cash');
      return;
    }

    try {
      setSubmitting(true);
      const res = await cashService.createAdditionalCash({
        date: additionalForm.date,
        amount: Number(additionalForm.amount),
        reason: additionalForm.reason,
        providedBy: additionalForm.providedBy,
        remarks: additionalForm.remarks,
      });

      if (res.success) {
        toast.success(`Additional cash of ₹${additionalForm.amount} recorded!`);
        fetchSummary(selectedDate);
        fetchTransactions();

        if (stayOnForm) {
          setAdditionalForm((prev) => ({
            ...prev,
            amount: '',
            remarks: '',
          }));
        } else {
          setAdditionalForm(initialAdditionalState);
          setActiveTab('LEDGER');
        }
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setPendingAction(() => () => submitAdditionalCash(stayOnForm));
        setDuplicateWarningOpen(true);
      } else {
        toast.error(error.response?.data?.message || 'Failed to record additional cash');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Submit: Cash Deposit
  // -------------------------------------------------------------
  const handleSlipChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size cannot exceed 5 MB');
        return;
      }
      setDepositForm((prev) => ({ ...prev, depositSlip: file }));
      if (file.type.startsWith('image/')) {
        setSlipPreview(URL.createObjectURL(file));
      } else {
        setSlipPreview('PDF_DOCUMENT');
      }
    }
  };

  const submitCashDeposit = async (stayOnForm = false) => {
    if (!depositForm.amount || Number(depositForm.amount) <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }
    if (!depositForm.bank.trim()) {
      toast.error('Please enter bank name');
      return;
    }
    if (!depositForm.account.trim()) {
      toast.error('Please enter account identifier');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('date', depositForm.date);
      formData.append('amount', depositForm.amount);
      formData.append('bank', depositForm.bank);
      formData.append('account', depositForm.account);
      formData.append('remarks', depositForm.remarks || '');
      if (depositForm.depositSlip) {
        formData.append('depositSlip', depositForm.depositSlip);
      }

      const res = await cashService.createCashDeposit(formData);

      if (res.success) {
        toast.success(`Bank deposit of ₹${depositForm.amount} saved!`);
        fetchSummary(selectedDate);
        fetchTransactions();

        if (stayOnForm) {
          setDepositForm((prev) => ({
            ...prev,
            amount: '',
            remarks: '',
            depositSlip: null,
          }));
          setSlipPreview(null);
        } else {
          setDepositForm(initialDepositState);
          setSlipPreview(null);
          setActiveTab('LEDGER');
        }
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setPendingAction(() => () => submitCashDeposit(stayOnForm));
        setDuplicateWarningOpen(true);
      } else {
        toast.error(error.response?.data?.message || 'Failed to record bank deposit');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Edit Handler
  // -------------------------------------------------------------
  const openEditModal = (item) => {
    setEditingItem(item);
    setEditForm({
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : todayStr,
      amount: item.amount || '',
      reason: item.raw?.reason || '',
      providedBy: item.raw?.providedBy || '',
      bank: item.raw?.bank || '',
      account: item.raw?.account || '',
      remarks: item.raw?.remarks || '',
      editReason: '',
      depositSlip: null,
    });
    setEditModalOpen(true);
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSubmitting(true);
      let res;
      if (editingItem.type === 'Additional Cash') {
        res = await cashService.updateAdditionalCash(editingItem._id, {
          date: editForm.date,
          amount: Number(editForm.amount),
          reason: editForm.reason,
          providedBy: editForm.providedBy,
          remarks: editForm.remarks,
          editReason: editForm.editReason,
        });
      } else if (editingItem.type === 'Cash Deposit') {
        const formData = new FormData();
        formData.append('date', editForm.date);
        formData.append('amount', editForm.amount);
        formData.append('bank', editForm.bank);
        formData.append('account', editForm.account);
        formData.append('remarks', editForm.remarks);
        formData.append('editReason', editForm.editReason);
        if (editForm.depositSlip) {
          formData.append('depositSlip', editForm.depositSlip);
        }
        res = await cashService.updateCashDeposit(editingItem._id, formData);
      } else {
        toast.error('Edits for sales/expenses should be made in their respective modules');
        setEditModalOpen(false);
        return;
      }

      if (res.success) {
        toast.success('Record updated successfully!');
        setEditModalOpen(false);
        fetchSummary(selectedDate);
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update record');
    } finally {
      setSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // Export Unified Ledger to CSV
  // -------------------------------------------------------------
  const handleExportLedger = async () => {
    try {
      setExporting(true);
      const res = await cashService.getUnifiedTransactions({
        page: 1,
        limit: 2000,
        type: ledgerType !== 'ALL' ? ledgerType : undefined,
        search: searchTerm || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res.success && res.data && res.data.length > 0) {
        const headers = [
          'Entry Code',
          'Date',
          'Transaction Type',
          'Cash Flow',
          'Amount (Rs.)',
          'Summary',
          'Details',
          'Entered By',
          'Edited',
          'Logged At',
        ];

        const rows = res.data.map((item) => [
          item.entryCode || `CSH-${item._id.toString().slice(-4)}`,
          new Date(item.date).toLocaleDateString('en-IN'),
          item.type,
          item.flow === 'IN' ? 'INFLOW (+)' : 'OUTFLOW (-)',
          item.amount,
          item.summary || '',
          item.details || '',
          item.enteredBy?.name || 'Staff',
          item.isEdited ? 'Yes' : 'No',
          new Date(item.createdAt).toLocaleString('en-IN'),
        ]);

        exportToCsv(`Cash_Ledger_${selectedDate}`, headers, rows);
        toast.success(`Exported ${rows.length} cash ledger records!`);
      } else {
        toast.error('No cash records available to export');
      }
    } catch (error) {
      toast.error('Failed to export cash ledger');
    } finally {
      setExporting(false);
    }
  };

  // Helper: Open History Modal
  const openHistory = (item) => {
    setSelectedHistory(item.editHistory || []);
    setHistoryTitle(`${item.type} [${item.entryCode || ''}] Correction Log`);
    setHistoryModalOpen(true);
  };

  // Helper: Date shift
  const handleShiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Chef restricted view check
  if (user?.role === 'CHEF') {
    return (
      <div className="p-8 text-center bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-navy-800 shadow-sm max-w-lg mx-auto mt-10 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-navy-900 dark:text-white mb-1">Access Restricted</h2>
        <p className="text-xs text-navy-500 dark:text-navy-400">
          The Cash Management module is reserved for management roles. Please use the Kitchen Requisitions tab for chef operations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 1. HERO TOP METRICS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Available Cash Hero Card */}
        <div className="bg-gradient-to-br from-[#172033] to-[#263554] text-white rounded-2xl p-5 border border-navy-800 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
              Live Drawer Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <h3 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              ₹{(summaryData?.availableCash || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-gray-300 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-orange-400" /> All-Time Calculated Available Cash
            </p>
          </div>
          <div className="text-[10px] text-gray-400 border-t border-white/10 pt-2 flex items-center justify-between">
            <span>Formula-Driven</span>
            <span className="text-emerald-400 font-bold">100% Dynamic</span>
          </div>
        </div>

        {/* Today's Opening Cash */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-gray-100 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy-400">
              Opening Cash ({selectedDate === todayStr ? 'Today' : selectedDate})
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <h3 className="text-xl lg:text-2xl font-black text-navy-900 dark:text-white">
              ₹{(summaryData?.openingCash || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-navy-400 mt-0.5">Balance prior to {selectedDate}</p>
          </div>
          <div className="text-[10px] text-navy-500 dark:text-navy-400 border-t border-gray-100 dark:border-navy-800 pt-2">
            Prior in - Prior out
          </div>
        </div>

        {/* Cash Inflow */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-gray-100 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Total Inflow (+)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <h3 className="text-xl lg:text-2xl font-black text-emerald-600">
              ₹{((summaryData?.cashCollection || 0) + (summaryData?.additionalCash || 0)).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-navy-400 mt-0.5">
              Sales: ₹{(summaryData?.cashCollection || 0).toLocaleString()} | Add: ₹{(summaryData?.additionalCash || 0).toLocaleString()}
            </p>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold border-t border-gray-100 dark:border-navy-800 pt-2">
            +{(summaryData?.counts?.salesCashEntries || 0) + (summaryData?.counts?.additionalCashEntries || 0)} Inflow entries
          </div>
        </div>

        {/* Cash Outflow */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-gray-100 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">
              Total Outflow (-)
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <h3 className="text-xl lg:text-2xl font-black text-red-600">
              ₹{((summaryData?.cashExpenses || 0) + (summaryData?.cashDeposit || 0)).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-navy-400 mt-0.5">
              Exp: ₹{(summaryData?.cashExpenses || 0).toLocaleString()} | Dep: ₹{(summaryData?.cashDeposit || 0).toLocaleString()}
            </p>
          </div>
          <div className="text-[10px] text-red-600 font-semibold border-t border-gray-100 dark:border-navy-800 pt-2">
            -{(summaryData?.counts?.expenseCashEntries || 0) + (summaryData?.counts?.depositEntries || 0)} Outflow entries
          </div>
        </div>

        {/* Closing Cash */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-gray-100 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
              Closing Cash
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <h3 className="text-xl lg:text-2xl font-black text-orange-600">
              ₹{(summaryData?.closingCash || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-navy-400 mt-0.5">Calculated end of {selectedDate}</p>
          </div>
          <div className="text-[10px] text-navy-500 dark:text-navy-400 border-t border-gray-100 dark:border-navy-800 pt-2">
            Opening + Inflow - Outflow
          </div>
        </div>
      </div>

      {/* 2. DATE-WISE FORMULA BREAKDOWN CARD */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 border border-gray-100 dark:border-navy-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-gray-100 dark:border-navy-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                Phase 7 Cash Audit
              </span>
              <span className="text-xs text-navy-400">Automatic Balance Reconciliation</span>
            </div>
            <h2 className="text-lg font-black text-navy-900 dark:text-white mt-1">
              Date-Wise Cash Summary ({selectedDate})
            </h2>
          </div>

          {/* Date Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-50 dark:bg-navy-800 rounded-xl p-1 border border-gray-200 dark:border-navy-700">
              <button
                onClick={() => handleShiftDate(-1)}
                className="px-2.5 py-1 text-xs font-semibold text-navy-600 dark:text-navy-300 hover:bg-white dark:hover:bg-navy-700 rounded-lg transition"
              >
                ← Prev
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-navy-900 dark:text-white px-2 py-1 outline-none cursor-pointer"
              />
              <button
                onClick={() => handleShiftDate(1)}
                className="px-2.5 py-1 text-xs font-semibold text-navy-600 dark:text-navy-300 hover:bg-white dark:hover:bg-navy-700 rounded-lg transition"
              >
                Next →
              </button>
            </div>

            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                selectedDate === todayStr
                  ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                  : 'bg-white dark:bg-navy-800 text-navy-600 dark:text-navy-300 border-gray-200 dark:border-navy-700 hover:bg-gray-50'
              }`}
            >
              Today
            </button>

            <button
              onClick={() => fetchSummary(selectedDate)}
              className="p-2 text-navy-400 hover:text-navy-700 dark:hover:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-navy-800 transition"
              title="Refresh Summary"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSummary ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Visual Cash Flow Equation */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-navy-800/60 border border-gray-100 dark:border-navy-700">
            <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Opening Cash</p>
            <p className="text-base font-black text-navy-900 dark:text-white mt-1">
              ₹{(summaryData?.openingCash || 0).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              + Cash Sales
            </p>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
              +₹{(summaryData?.cashCollection || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[9px] text-emerald-600 block mt-0.5">
              {summaryData?.counts?.salesCashEntries || 0} sale(s)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              + Add. Cash
            </p>
            <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
              +₹{(summaryData?.additionalCash || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[9px] text-emerald-600 block mt-0.5">
              {summaryData?.counts?.additionalCashEntries || 0} entry(s)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
            <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
              - Cash Expenses
            </p>
            <p className="text-base font-black text-red-600 dark:text-red-400 mt-1">
              -₹{(summaryData?.cashExpenses || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[9px] text-red-600 block mt-0.5">
              {summaryData?.counts?.expenseCashEntries || 0} expense(s)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
            <p className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">
              - Bank Deposits
            </p>
            <p className="text-base font-black text-red-600 dark:text-red-400 mt-1">
              -₹{(summaryData?.cashDeposit || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[9px] text-red-600 block mt-0.5">
              {summaryData?.counts?.depositEntries || 0} deposit(s)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40">
            <p className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
              = Closing Cash
            </p>
            <p className="text-base font-black text-orange-600 dark:text-orange-400 mt-1">
              ₹{(summaryData?.closingCash || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[9px] text-orange-600 block mt-0.5">End of Day Balance</span>
          </div>
        </div>
      </div>

      {/* 3. WORKSPACE NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-navy-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'LEDGER'
                ? 'bg-navy-900 dark:bg-white text-white dark:text-navy-900 shadow-md'
                : 'bg-white dark:bg-navy-900 text-navy-600 dark:text-navy-300 border border-gray-200 dark:border-navy-700 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Unified Cash Ledger
          </button>

          <button
            onClick={() => setActiveTab('ADDITIONAL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'ADDITIONAL'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white dark:bg-navy-900 text-navy-600 dark:text-navy-300 border border-gray-200 dark:border-navy-700 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            Add Additional Cash
          </button>

          <button
            onClick={() => setActiveTab('DEPOSIT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'DEPOSIT'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-navy-900 text-navy-600 dark:text-navy-300 border border-gray-200 dark:border-navy-700 hover:bg-gray-50'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-400" />
            Record Bank Deposit
          </button>
        </div>

        {activeTab === 'LEDGER' && (
          <button
            onClick={handleExportLedger}
            disabled={exporting}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-gray-200 dark:border-navy-700 hover:bg-gray-50 transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Exporting...' : 'Export Ledger CSV'}
          </button>
        )}
      </div>

      {/* 4. TAB 1: UNIFIED CASH LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-navy-800 shadow-sm p-6 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gray-50 dark:bg-navy-800/40 p-3.5 rounded-xl border border-gray-100 dark:border-navy-700/60">
            {/* Type selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'ALL', label: 'All Streams' },
                { id: 'COLLECTION', label: 'Cash Sales' },
                { id: 'ADDITIONAL', label: 'Additional Cash' },
                { id: 'EXPENSE', label: 'Cash Expenses' },
                { id: 'DEPOSIT', label: 'Bank Deposits' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setLedgerType(t.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    ledgerType === t.id
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-white dark:bg-navy-900 text-navy-600 dark:text-navy-300 border border-gray-200 dark:border-navy-700 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search & Date Filter Form */}
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-navy-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white outline-none focus:border-orange-500 w-44"
                />
              </div>

              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white outline-none cursor-pointer"
                title="Start Date"
              />

              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white outline-none cursor-pointer"
                title="End Date"
              />

              {(searchTerm || startDate || endDate || ledgerType !== 'ALL') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-1.5 text-navy-400 hover:text-navy-700 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-navy-900 transition"
                  title="Reset Filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Transactions Table */}
          {loadingLedger ? (
            <SkeletonLoader rows={6} />
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="w-10 h-10 text-navy-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-navy-700 dark:text-navy-300">No cash transactions found</p>
              <p className="text-xs text-navy-400 mt-1">Try clearing your search or date filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-navy-800/60 text-navy-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Entry Code & Type</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Flow</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Summary & Details</th>
                    <th className="p-3">Slip / Attachment</th>
                    <th className="p-3">Entered By</th>
                    <th className="p-3 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                  {transactions.map((item, idx) => {
                    const isInflow = item.flow === 'IN';
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/30 transition">
                        <td className="p-3">
                          <div className="font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                            <span>{item.type}</span>
                            {item.isEdited && (
                              <button
                                onClick={() => openHistory(item)}
                                className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold hover:underline"
                                title="Click to view correction log"
                              >
                                Edited
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-navy-400 font-mono">{item.entryCode}</span>
                        </td>

                        <td className="p-3 text-navy-700 dark:text-navy-300 font-medium">
                          {new Date(item.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide inline-flex items-center gap-1 ${
                              isInflow
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                            }`}
                          >
                            {isInflow ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                            {isInflow ? 'IN' : 'OUT'}
                          </span>
                        </td>

                        <td className="p-3">
                          <span
                            className={`text-sm font-black ${
                              isInflow ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {isInflow ? '+' : '-'}₹{Number(item.amount).toLocaleString('en-IN')}
                          </span>
                        </td>

                        <td className="p-3 max-w-xs">
                          <p className="font-semibold text-navy-800 dark:text-white truncate">{item.summary}</p>
                          <p className="text-[11px] text-navy-400 truncate">{item.details}</p>
                        </td>

                        <td className="p-3">
                          {item.depositSlip ? (
                            <button
                              onClick={() => setViewSlipUrl(item.depositSlip)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-100 transition inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> View Slip
                            </button>
                          ) : (
                            <span className="text-navy-300 text-[10px]">—</span>
                          )}
                        </td>

                        <td className="p-3">
                          <span className="font-semibold text-navy-800 dark:text-white">
                            {item.enteredBy?.name || 'Staff'}
                          </span>
                          <span className="text-[10px] text-navy-400 block">{item.enteredBy?.role || ''}</span>
                        </td>

                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit record for Additional Cash or Deposits */}
                            {(item.type === 'Additional Cash' || item.type === 'Cash Deposit') && (
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1.5 text-navy-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-navy-800 rounded-lg transition"
                                title="Edit Record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* View History */}
                            {item.isEdited && (
                              <button
                                onClick={() => openHistory(item)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-navy-800 rounded-lg transition"
                                title="Audit Log"
                              >
                                <HistoryIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalRecords={totalRecords}
            recordsPerPage={limit}
            onRecordsPerPageChange={(val) => {
              setLimit(val);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* 5. TAB 2: RECORD ADDITIONAL CASH */}
      {activeTab === 'ADDITIONAL' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-navy-800 shadow-sm p-6 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-navy-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900 dark:text-white">Record Additional Cash</h3>
                <p className="text-xs text-navy-400">Log cash provided by owners, managers, or counter float.</p>
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitAdditionalCash(false);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                  Transaction Date *
                </label>
                <input
                  type="date"
                  required
                  value={additionalForm.date}
                  onChange={(e) => setAdditionalForm({ ...additionalForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                  Cash Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="e.g. 5000"
                  value={additionalForm.amount}
                  onChange={(e) => setAdditionalForm({ ...additionalForm, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none focus:border-emerald-500 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                  Reason for Cash *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Additional Working Cash"
                  value={additionalForm.reason}
                  onChange={(e) => setAdditionalForm({ ...additionalForm, reason: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                  Provided / Given By *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Owner, Bank Withdrawal, Main Manager"
                  value={additionalForm.providedBy}
                  onChange={(e) => setAdditionalForm({ ...additionalForm, providedBy: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                Remarks / Details
              </label>
              <textarea
                rows="2"
                placeholder="Optional notes or context..."
                value={additionalForm.remarks}
                onChange={(e) => setAdditionalForm({ ...additionalForm, remarks: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-navy-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdditionalForm(initialAdditionalState)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-600 dark:text-navy-300 hover:bg-gray-50 transition"
              >
                Clear
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => submitAdditionalCash(true)}
                className="px-4 py-2 rounded-xl border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs font-bold transition"
              >
                Save & Add Another
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20"
              >
                {submitting ? 'Saving...' : 'Save & View Ledger'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. TAB 3: RECORD CASH DEPOSIT (BANK) */}
      {activeTab === 'DEPOSIT' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-navy-800 shadow-sm p-6 max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-navy-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900 dark:text-white">Record Bank Cash Deposit</h3>
                <p className="text-xs text-navy-400">
                  Deducts deposited cash from the drawer balance and attaches deposit slip receipts.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitCashDeposit(false);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                  Deposit Date *
                </label>
                <input
                  type="date"
                  required
                  value={depositForm.date}
                  onChange={(e) => setDepositForm({ ...depositForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                  Deposit Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="e.g. 4000"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none focus:border-blue-500 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                  Destination Bank *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Canara Bank, SBI, HDFC"
                  value={depositForm.bank}
                  onChange={(e) => setDepositForm({ ...depositForm, bank: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                  Account Name / Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Restaurant A/C (Canara)"
                  value={depositForm.account}
                  onChange={(e) => setDepositForm({ ...depositForm, account: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Deposit Slip Upload */}
            <div>
              <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                Deposit Slip Receipt (Image or PDF)
              </label>
              <div className="border-2 border-dashed border-gray-200 dark:border-navy-700 rounded-xl p-4 text-center hover:border-blue-400 transition bg-gray-50/50 dark:bg-navy-800/30">
                {slipPreview ? (
                  <div className="flex items-center justify-between bg-white dark:bg-navy-900 p-3 rounded-lg border border-gray-100 dark:border-navy-700">
                    <div className="flex items-center gap-2">
                      {slipPreview === 'PDF_DOCUMENT' ? (
                        <FileText className="w-6 h-6 text-red-500" />
                      ) : (
                        <img src={slipPreview} alt="Slip Preview" className="w-10 h-10 object-cover rounded-md" />
                      )}
                      <span className="text-xs font-semibold text-navy-800 dark:text-white truncate max-w-xs">
                        {depositForm.depositSlip?.name || 'Slip Document'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDepositForm({ ...depositForm, depositSlip: null });
                        setSlipPreview(null);
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <Upload className="w-6 h-6 text-navy-400 mx-auto mb-1" />
                    <span className="text-xs text-blue-600 font-bold hover:underline">Click to upload deposit slip</span>
                    <p className="text-[10px] text-navy-400 mt-0.5">JPG, PNG, WEBP or PDF up to 5MB</p>
                    <input type="file" accept="image/*,.pdf" onChange={handleSlipChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                Remarks / Reference ID
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Deposit slip #789012"
                value={depositForm.remarks}
                onChange={(e) => setDepositForm({ ...depositForm, remarks: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-navy-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDepositForm(initialDepositState);
                  setSlipPreview(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-navy-600 dark:text-navy-300 hover:bg-gray-50 transition"
              >
                Clear
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => submitCashDeposit(true)}
                className="px-4 py-2 rounded-xl border border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs font-bold transition"
              >
                Save & Add Another
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-600/20"
              >
                {submitting ? 'Saving...' : 'Save & View Ledger'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. DEPOSIT SLIP PREVIEW MODAL */}
      {viewSlipUrl && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-xl w-full border border-gray-100 dark:border-navy-800 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-100 dark:border-navy-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-navy-900 dark:text-white">Bank Deposit Slip</h3>
              </div>
              <button
                onClick={() => setViewSlipUrl(null)}
                className="p-1.5 text-navy-400 hover:text-navy-700 dark:hover:text-white rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 text-center max-h-[70vh] overflow-y-auto">
              {viewSlipUrl.endsWith('.pdf') ? (
                <iframe src={viewSlipUrl} className="w-full h-96 rounded-xl border border-gray-200" title="Slip PDF" />
              ) : (
                <img
                  src={viewSlipUrl}
                  alt="Deposit Slip"
                  className="max-h-[60vh] mx-auto rounded-xl shadow-sm object-contain"
                />
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-navy-800 flex justify-between items-center bg-gray-50/50">
              <a
                href={viewSlipUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download Slip
              </a>
              <button
                onClick={() => setViewSlipUrl(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-200 text-navy-800 hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. EDIT RECORD MODAL */}
      {editModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-lg w-full border border-gray-100 dark:border-navy-800 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-100 dark:border-navy-800 flex items-center justify-between bg-orange-50/50 dark:bg-navy-800">
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white">Edit {editingItem.type}</h3>
                <p className="text-xs text-navy-400 font-mono">{editingItem.entryCode}</p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-navy-400 hover:text-navy-700 rounded-lg hover:bg-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRecord} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={editForm.amount}
                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none font-bold"
                  />
                </div>
              </div>

              {editingItem.type === 'Additional Cash' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">Reason</label>
                    <input
                      type="text"
                      required
                      value={editForm.reason}
                      onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                      Provided By
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.providedBy}
                      onChange={(e) => setEditForm({ ...editForm, providedBy: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                    />
                  </div>
                </div>
              )}

              {editingItem.type === 'Cash Deposit' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.bank}
                      onChange={(e) => setEditForm({ ...editForm, bank: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">Account</label>
                    <input
                      type="text"
                      required
                      value={editForm.account}
                      onChange={(e) => setEditForm({ ...editForm, account: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">Remarks</label>
                <input
                  type="text"
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-orange-600 dark:text-orange-400 mb-1">
                  Reason for Correction (Audit Log) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corrected miscalculated cash receipt"
                  value={editForm.editReason}
                  onChange={(e) => setEditForm({ ...editForm, editReason: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-orange-300 dark:border-orange-800 bg-orange-50/40 dark:bg-navy-800 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-navy-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-navy-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition shadow-sm"
                >
                  {submitting ? 'Updating...' : 'Update & Recalculate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. DUPLICATE WARNING MODAL */}
      <DuplicateWarningModal
        isOpen={duplicateWarningOpen}
        onCancel={() => {
          setDuplicateWarningOpen(false);
          setPendingAction(null);
        }}
        onConfirm={() => {
          setDuplicateWarningOpen(false);
          if (pendingAction) pendingAction();
        }}
        title="Similar Cash Entry Detected"
        message="A matching cash transaction with the same amount or bank details was already recorded a moment ago. Do you wish to proceed and record anyway?"
      />

      {/* 10. EDIT HISTORY MODAL */}
      <EditHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        recordTitle={historyTitle}
        editHistory={selectedHistory}
      />
    </div>
  );
};

export default CashEntry;
