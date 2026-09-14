import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import temporaryStaffService from '../../services/temporaryStaffService';
import Pagination from '../../components/Pagination';
import EditHistoryModal from '../../components/EditHistoryModal';
import exportToCsv from '../../utils/exportToCsv';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  Calendar,
  Edit2,
  Trash2,
  X,
  RotateCcw,
  Phone,
  Briefcase,
  FileText,
  Eye,
  Download,
  History as HistoryIcon,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  IndianRupee,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  TrendingUp,
  Wallet,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];

const TemporaryStaffManagement = () => {
  const { user } = useAuth();

  // Navigation Tabs: 'DIRECTORY' | 'WORK_LOG' | 'SUMMARY' | 'PAYMENTS'
  const [activeTab, setActiveTab] = useState('DIRECTORY');

  // Month & Date Range Filters (Default Current Month)
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const todayDateStr = new Date().toISOString().split('T')[0];

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [dateRangeMode, setDateRangeMode] = useState('MONTH'); // 'MONTH' | 'CUSTOM'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Top Metrics
  const [metrics, setMetrics] = useState({
    activeStaffCount: 0,
    totalStaffCount: 0,
    totalDaysWorked: 0,
    totalPayable: 0,
    totalPaid: 0,
    pendingPayouts: 0,
  });
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Tab 1: Staff Directory State
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffStatusFilter, setStaffStatusFilter] = useState('all');
  const [staffPagination, setStaffPagination] = useState({ page: 1, limit: 15, totalPages: 1, total: 0 });

  // Tab 2: Work Log State
  const [workEntries, setWorkEntries] = useState([]);
  const [workLoading, setWorkLoading] = useState(false);
  const [workStaffFilter, setWorkStaffFilter] = useState('all');
  const [workPagination, setWorkPagination] = useState({ page: 1, limit: 15, totalPages: 1, total: 0 });

  // Tab 3: Monthly / Range Summary State
  const [summaryList, setSummaryList] = useState([]);
  const [summaryStaffFilter, setSummaryStaffFilter] = useState('all');

  // Tab 4: Payments Ledger State
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentStaffFilter, setPaymentStaffFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [paymentPagination, setPaymentPagination] = useState({ page: 1, limit: 15, totalPages: 1, total: 0 });

  // Modals
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    mobile: '',
    status: 'Active',
    remarks: '',
  });

  const [showWorkModal, setShowWorkModal] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [workFormData, setWorkFormData] = useState({
    staffId: '',
    date: todayDateStr,
    dailyWage: '',
    remarks: '',
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    staffId: '',
    staffName: '',
    paymentMonth: currentMonthStr,
    startDate: '',
    endDate: '',
    daysWorked: 0,
    payableAmount: 0,
    paidAmount: '',
    paymentDate: todayDateStr,
    paymentMode: 'Cash',
    remarks: '',
  });

  const [profileModalData, setProfileModalData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [editHistoryData, setEditHistoryData] = useState(null);

  // -------------------------------------------------------------------------
  // Fetch Summary Overview & Metrics
  // -------------------------------------------------------------------------
  const fetchSummaryOverview = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const params = {};
      if (dateRangeMode === 'MONTH') {
        params.month = selectedMonth;
      } else {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      if (summaryStaffFilter !== 'all') {
        params.staffId = summaryStaffFilter;
      }

      const res = await temporaryStaffService.getSummaryOverview(params);
      if (res.success && res.data) {
        setMetrics(res.data.metrics);
        setSummaryList(res.data.summaryList || []);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load summary');
    } finally {
      setLoadingSummary(false);
    }
  }, [dateRangeMode, selectedMonth, startDate, endDate, summaryStaffFilter]);

  // -------------------------------------------------------------------------
  // Fetch Staff List
  // -------------------------------------------------------------------------
  const fetchStaffList = useCallback(async (page = 1) => {
    setStaffLoading(true);
    try {
      const params = {
        page,
        limit: staffPagination.limit,
        status: staffStatusFilter,
        search: staffSearch,
      };
      const res = await temporaryStaffService.getStaffList(params);
      if (res.success) {
        setStaffList(res.data);
        setStaffPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load temporary staff');
    } finally {
      setStaffLoading(false);
    }
  }, [staffStatusFilter, staffSearch, staffPagination.limit]);

  // -------------------------------------------------------------------------
  // Fetch Work Log Entries
  // -------------------------------------------------------------------------
  const fetchWorkEntries = useCallback(async (page = 1) => {
    setWorkLoading(true);
    try {
      const params = {
        page,
        limit: workPagination.limit,
        staffId: workStaffFilter,
      };
      if (dateRangeMode === 'MONTH') {
        params.month = selectedMonth;
      } else {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await temporaryStaffService.getWorkEntries(params);
      if (res.success) {
        setWorkEntries(res.data);
        setWorkPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load work entries');
    } finally {
      setWorkLoading(false);
    }
  }, [workPagination.limit, workStaffFilter, dateRangeMode, selectedMonth, startDate, endDate]);

  // -------------------------------------------------------------------------
  // Fetch Payment Records
  // -------------------------------------------------------------------------
  const fetchPayments = useCallback(async (page = 1) => {
    setPaymentsLoading(true);
    try {
      const params = {
        page,
        limit: paymentPagination.limit,
        staffId: paymentStaffFilter,
        status: paymentStatusFilter,
      };
      if (dateRangeMode === 'MONTH') {
        params.month = selectedMonth;
      } else {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await temporaryStaffService.getPayments(params);
      if (res.success) {
        setPayments(res.data);
        setPaymentPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load payments');
    } finally {
      setPaymentsLoading(false);
    }
  }, [paymentPagination.limit, paymentStaffFilter, paymentStatusFilter, dateRangeMode, selectedMonth, startDate, endDate]);

  // Initial Load & Refresh on Tab Change
  useEffect(() => {
    fetchSummaryOverview();
  }, [fetchSummaryOverview]);

  useEffect(() => {
    if (activeTab === 'DIRECTORY') {
      fetchStaffList(1);
    } else if (activeTab === 'WORK_LOG') {
      fetchWorkEntries(1);
    } else if (activeTab === 'SUMMARY') {
      fetchSummaryOverview();
    } else if (activeTab === 'PAYMENTS') {
      fetchPayments(1);
    }
  }, [activeTab, fetchStaffList, fetchWorkEntries, fetchSummaryOverview, fetchPayments]);

  // -------------------------------------------------------------------------
  // Staff Master Actions (Create / Edit)
  // -------------------------------------------------------------------------
  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setStaffFormData({
      name: '',
      mobile: '',
      status: 'Active',
      remarks: '',
    });
    setShowStaffModal(true);
  };

  const handleOpenEditStaff = (staff) => {
    setEditingStaff(staff);
    setStaffFormData({
      name: staff.name || '',
      mobile: staff.mobile || '',
      status: staff.status || 'Active',
      remarks: staff.remarks || '',
    });
    setShowStaffModal(true);
  };

  const handleSaveStaff = async (e, saveAndAddAnother = false) => {
    if (e) e.preventDefault();
    if (!staffFormData.name.trim()) {
      toast.error('Staff name is required');
      return;
    }

    try {
      if (editingStaff) {
        const res = await temporaryStaffService.updateStaff(editingStaff._id, staffFormData);
        if (res.success) {
          toast.success('Temporary staff updated successfully');
          setShowStaffModal(false);
          fetchStaffList(staffPagination.page);
          fetchSummaryOverview();
        }
      } else {
        const res = await temporaryStaffService.createStaff(staffFormData);
        if (res.success) {
          toast.success('Temporary staff added successfully');
          if (saveAndAddAnother) {
            setStaffFormData({ name: '', mobile: '', status: 'Active', remarks: '' });
          } else {
            setShowStaffModal(false);
          }
          fetchStaffList(1);
          fetchSummaryOverview();
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save staff');
    }
  };

  // -------------------------------------------------------------------------
  // Work Log Actions (Create / Edit / Delete)
  // -------------------------------------------------------------------------
  const handleOpenAddWork = (prefillStaffId = '') => {
    setEditingWork(null);
    setWorkFormData({
      staffId: prefillStaffId || (staffList.find((s) => s.status === 'Active')?._id || ''),
      date: todayDateStr,
      dailyWage: '',
      remarks: '',
    });
    setShowWorkModal(true);
  };

  const handleOpenEditWork = (entry) => {
    setEditingWork(entry);
    setWorkFormData({
      staffId: entry.staff?._id || entry.staff,
      date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : todayDateStr,
      dailyWage: entry.dailyWage || '',
      remarks: entry.remarks || '',
    });
    setShowWorkModal(true);
  };

  const handleSaveWork = async (e, saveAndAddAnother = false) => {
    if (e) e.preventDefault();
    if (!workFormData.staffId) {
      toast.error('Please select a temporary staff member');
      return;
    }
    if (!workFormData.date) {
      toast.error('Worked date is required');
      return;
    }
    const wage = Number(workFormData.dailyWage);
    if (isNaN(wage) || wage <= 0) {
      toast.error('Daily wage must be a valid positive amount');
      return;
    }

    try {
      if (editingWork) {
        const res = await temporaryStaffService.updateWorkEntry(editingWork._id, workFormData);
        if (res.success) {
          toast.success('Work entry updated successfully');
          setShowWorkModal(false);
          fetchWorkEntries(workPagination.page);
          fetchSummaryOverview();
        }
      } else {
        const res = await temporaryStaffService.createWorkEntry(workFormData);
        if (res.success) {
          toast.success('Worked date entry recorded successfully');
          if (saveAndAddAnother) {
            setWorkFormData((prev) => ({ ...prev, dailyWage: '', remarks: '' }));
          } else {
            setShowWorkModal(false);
          }
          fetchWorkEntries(1);
          fetchSummaryOverview();
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record work entry');
    }
  };

  const handleDeleteWork = async (id) => {
    if (!window.confirm('Are you sure you want to delete this worked date entry?')) return;
    try {
      const res = await temporaryStaffService.deleteWorkEntry(id);
      if (res.success) {
        toast.success('Work entry deleted successfully');
        fetchWorkEntries(workPagination.page);
        fetchSummaryOverview();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete work entry');
    }
  };

  // -------------------------------------------------------------------------
  // Payment Actions (Record Payout)
  // -------------------------------------------------------------------------
  const handleOpenRecordPayment = (summaryItem) => {
    const defaultPaid = summaryItem.pendingBalance > 0 ? summaryItem.pendingBalance : summaryItem.totalPayable;
    setPaymentFormData({
      staffId: summaryItem.staff._id,
      staffName: summaryItem.staff.name,
      paymentMonth: dateRangeMode === 'MONTH' ? selectedMonth : '',
      startDate: dateRangeMode === 'CUSTOM' ? startDate : '',
      endDate: dateRangeMode === 'CUSTOM' ? endDate : '',
      daysWorked: summaryItem.daysWorked,
      payableAmount: summaryItem.totalPayable,
      paidAmount: defaultPaid > 0 ? defaultPaid : '',
      paymentDate: todayDateStr,
      paymentMode: 'Cash',
      remarks: `Payout for ${summaryItem.daysWorked} days worked (${summaryItem.staff.name})`,
    });
    setShowPaymentModal(true);
  };

  const handleSavePayment = async (e) => {
    if (e) e.preventDefault();
    const paid = Number(paymentFormData.paidAmount);
    if (isNaN(paid) || paid <= 0) {
      toast.error('Paid amount must be greater than 0');
      return;
    }

    try {
      const res = await temporaryStaffService.createPayment(paymentFormData);
      if (res.success) {
        toast.success('Payment recorded successfully');
        setShowPaymentModal(false);
        fetchSummaryOverview();
        if (activeTab === 'PAYMENTS') fetchPayments(1);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    }
  };

  // -------------------------------------------------------------------------
  // 360 Staff Profile
  // -------------------------------------------------------------------------
  const handleOpenStaffProfile = async (staffId) => {
    setLoadingProfile(true);
    setProfileModalData(null);
    try {
      const res = await temporaryStaffService.getStaffProfile(staffId);
      if (res.success) {
        setProfileModalData(res.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load staff profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  // -------------------------------------------------------------------------
  // Export CSV Helpers
  // -------------------------------------------------------------------------
  const handleExportStaff = () => {
    if (!staffList.length) return toast.error('No staff records to export');
    const data = staffList.map((s) => ({
      Code: s.entryCode,
      Name: s.name,
      Mobile: s.mobile || 'N/A',
      Status: s.status,
      Remarks: s.remarks || '',
      'Created Date': new Date(s.createdAt).toLocaleDateString(),
    }));
    exportToCsv(data, `Temporary_Staff_List_${todayDateStr}`);
  };

  const handleExportWork = () => {
    if (!workEntries.length) return toast.error('No work entries to export');
    const data = workEntries.map((w) => ({
      Code: w.entryCode,
      Date: new Date(w.date).toLocaleDateString(),
      'Staff Name': w.staff?.name || 'N/A',
      'Mobile': w.staff?.mobile || 'N/A',
      'Daily Wage (INR)': w.dailyWage,
      Remarks: w.remarks || '',
      'Entered By': w.enteredBy?.name || 'N/A',
    }));
    exportToCsv(data, `Temporary_Staff_Work_Log_${todayDateStr}`);
  };

  const handleExportSummary = () => {
    if (!summaryList.length) return toast.error('No summary data to export');
    const data = summaryList.map((item) => ({
      Code: item.staff?.entryCode,
      'Staff Name': item.staff?.name,
      'Mobile': item.staff?.mobile || 'N/A',
      'Status': item.staff?.status,
      'Days Worked': item.daysWorked,
      'Total Payable (INR)': item.totalPayable,
      'Total Paid (INR)': item.totalPaid,
      'Pending Balance (INR)': item.pendingBalance,
      'Payment Status': item.status,
    }));
    exportToCsv(data, `Temporary_Staff_Summary_${selectedMonth || todayDateStr}`);
  };

  const handleExportPayments = () => {
    if (!payments.length) return toast.error('No payment records to export');
    const data = payments.map((p) => ({
      Receipt: p.entryCode,
      'Payment Date': new Date(p.paymentDate).toLocaleDateString(),
      'Staff Name': p.staff?.name || 'N/A',
      'Period': p.paymentMonth || 'Custom Range',
      'Days Worked': p.daysWorked,
      'Payable (INR)': p.payableAmount,
      'Paid (INR)': p.paidAmount,
      'Mode': p.paymentMode,
      'Status': p.status,
      'Paid By': p.paidBy?.name || 'N/A',
      Remarks: p.remarks || '',
    }));
    exportToCsv(data, `Temporary_Staff_Payments_${todayDateStr}`);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* ------------------------------------------------------------------- */}
      {/* 1. Header & Quick Controls */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0E5] text-[#F97316] mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daily Wage & Extra Staff Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#F97316]" /> Temporary / Extra Staff Management
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Track daily work dates, calculate variable daily wages, record payouts and maintain complete disbursement history.
          </p>
        </div>

        {/* Global Date & Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#FFF8F1] border border-[#E5E7EB] rounded-xl p-1 text-xs">
            <button
              onClick={() => setDateRangeMode('MONTH')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                dateRangeMode === 'MONTH' ? 'bg-[#F97316] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#172033]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setDateRangeMode('CUSTOM')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                dateRangeMode === 'CUSTOM' ? 'bg-[#F97316] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#172033]'
              }`}
            >
              Date Range
            </button>
          </div>

          {dateRangeMode === 'MONTH' ? (
            <div className="flex items-center gap-2 bg-[#FFF8F1]/80 border border-[#E5E7EB] px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-[#F97316]" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-[#172033] font-semibold text-xs focus:outline-none cursor-pointer"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#FFF8F1]/80 border border-[#E5E7EB] px-3 py-1.5 rounded-xl text-xs text-[#172033]">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="From"
                className="bg-transparent text-[#172033] font-semibold focus:outline-none cursor-pointer"
              />
              <span className="text-[#9CA3AF]">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="To"
                className="bg-transparent text-[#172033] font-semibold focus:outline-none cursor-pointer"
              />
            </div>
          )}

          <button
            onClick={() => {
              fetchSummaryOverview();
              if (activeTab === 'DIRECTORY') fetchStaffList(staffPagination.page);
              if (activeTab === 'WORK_LOG') fetchWorkEntries(workPagination.page);
              if (activeTab === 'PAYMENTS') fetchPayments(paymentPagination.page);
              toast.success('Data refreshed');
            }}
            className="p-2.5 bg-white hover:bg-[#FFF0E5] text-[#172033] rounded-xl border border-[#E5E7EB] hover:border-[#F97316] transition cursor-pointer shadow-2xs"
            title="Refresh All"
          >
            <RefreshCw className={`w-4 h-4 text-[#172033] ${loadingSummary ? 'animate-spin text-[#F97316]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 2. Top Summary KPI Cards */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Staff */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Active Staff</p>
              <h3 className="text-2xl font-bold text-[#172033] mt-1">
                {metrics.activeStaffCount}{' '}
                <span className="text-xs font-normal text-[#6B7280]">/ {metrics.totalStaffCount} total</span>
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[#6B7280] mt-3 flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Ready for daily assignment
          </p>
        </div>

        {/* Card 2: Days Worked */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Days Worked</p>
              <h3 className="text-2xl font-bold text-[#16A34A] mt-1">
                {metrics.totalDaysWorked} <span className="text-xs font-normal text-[#6B7280]">shifts</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[#6B7280] mt-3 font-medium">
            In {dateRangeMode === 'MONTH' ? selectedMonth : 'selected period'}
          </p>
        </div>

        {/* Card 3: Total Payable */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Total Wage Payable</p>
              <h3 className="text-2xl font-bold text-[#F97316] mt-1">
                ₹{Number(metrics.totalPayable || 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-[#6B7280] mt-3 font-medium">
            <span>Disbursed: ₹{Number(metrics.totalPaid || 0).toLocaleString()}</span>
            <span className="text-emerald-600 font-bold">
              {metrics.totalPayable > 0
                ? `${Math.round((metrics.totalPaid / metrics.totalPayable) * 100)}%`
                : '100%'}
            </span>
          </div>
        </div>

        {/* Card 4: Pending Payouts */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Pending Balance</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">
                ₹{Number(metrics.pendingPayouts || 0).toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[#6B7280] mt-3 flex items-center gap-1.5 font-medium">
            {metrics.pendingPayouts > 0 ? (
              <span className="text-amber-600 flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> Payout required
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5" /> All cleared
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3. Navigation Tabs */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('DIRECTORY')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === 'DIRECTORY'
              ? 'bg-[#F97316] text-white shadow-md shadow-[#F97316]/20'
              : 'text-[#6B7280] hover:text-[#172033] hover:bg-[#FFF0E5]/60'
          }`}
        >
          <Users className="w-4 h-4" /> Staff Directory
        </button>

        <button
          onClick={() => setActiveTab('WORK_LOG')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === 'WORK_LOG'
              ? 'bg-[#F97316] text-white shadow-md shadow-[#F97316]/20'
              : 'text-[#6B7280] hover:text-[#172033] hover:bg-[#FFF0E5]/60'
          }`}
        >
          <Calendar className="w-4 h-4" /> Daily Work Log
        </button>

        <button
          onClick={() => setActiveTab('SUMMARY')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === 'SUMMARY'
              ? 'bg-[#F97316] text-white shadow-md shadow-[#F97316]/20'
              : 'text-[#6B7280] hover:text-[#172033] hover:bg-[#FFF0E5]/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Monthly Payout Sheet
        </button>

        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === 'PAYMENTS'
              ? 'bg-[#F97316] text-white shadow-md shadow-[#F97316]/20'
              : 'text-[#6B7280] hover:text-[#172033] hover:bg-[#FFF0E5]/60'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Payment Ledger
        </button>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 4. TAB 1: STAFF DIRECTORY */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff name or mobile..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="w-full bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-[#172033] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <select
                value={staffStatusFilter}
                onChange={(e) => setStaffStatusFilter(e.target.value)}
                className="bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExportStaff}
                className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#FFF0E5] hover:border-[#F97316] text-[#172033] text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 mr-1.5 text-[#F97316]" /> Export CSV
              </button>

              <button
                onClick={handleOpenAddStaff}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-md shadow-[#F97316]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Add Temporary Staff
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FFF8F1] border-b border-[#E5E7EB] text-[11px] font-extrabold uppercase tracking-wider text-[#172033]">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Staff Details</th>
                    <th className="py-3.5 px-4 sm:px-6">Mobile Number</th>
                    <th className="py-3.5 px-4 sm:px-6">Status</th>
                    <th className="py-3.5 px-4 sm:px-6">Remarks / Role</th>
                    <th className="py-3.5 px-4 sm:px-6">Registered By</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-xs font-medium text-[#374151]">
                  {staffLoading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-[#6B7280]">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F97316]" />
                        Loading temporary staff...
                      </td>
                    </tr>
                  ) : staffList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-[#6B7280]">
                        <Users className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
                        No temporary staff found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    staffList.map((staff) => (
                      <tr key={staff._id} className="hover:bg-[#FFF8F1]/40 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#172033]">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F97316] border border-orange-200 flex items-center justify-center font-bold text-sm">
                              {staff.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-[#172033] flex items-center gap-2">
                                {staff.name}
                                {staff.isEdited && (
                                  <span
                                    onClick={() => setEditHistoryData(staff)}
                                    className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-200 cursor-pointer hover:bg-amber-100"
                                    title="View edit history"
                                  >
                                    Edited
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#6B7280] font-normal">{staff.entryCode || 'TST'}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-[#172033]">
                          {staff.mobile ? (
                            <span className="flex items-center gap-1.5 font-mono text-xs font-semibold">
                              <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" /> {staff.mobile}
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF] text-xs italic">Not provided</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
                              staff.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                staff.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'
                              }`}
                            ></span>
                            {staff.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-[#4B5563] max-w-xs truncate">
                          {staff.remarks || <span className="text-[#9CA3AF] text-xs italic">None</span>}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-xs text-[#6B7280]">
                          <div className="font-semibold text-[#172033]">{staff.enteredBy?.name || 'System'}</div>
                          <div className="text-[11px] text-[#9CA3AF]">
                            {new Date(staff.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {staff.status === 'Active' && (
                              <button
                                onClick={() => handleOpenAddWork(staff._id)}
                                className="p-1.5 bg-orange-50 hover:bg-orange-100 text-[#F97316] rounded-lg border border-orange-200 transition cursor-pointer"
                                title="Log Daily Work Entry"
                              >
                                <Calendar className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleOpenStaffProfile(staff._id)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-[#4B5563] hover:text-[#172033] rounded-lg border border-[#E5E7EB] transition cursor-pointer"
                              title="View Full 360° Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEditStaff(staff)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-200 transition cursor-pointer"
                              title="Edit Staff Details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {staffPagination.totalPages > 1 && (
              <div className="p-4 border-t border-[#E5E7EB]">
                <Pagination
                  currentPage={staffPagination.page}
                  totalPages={staffPagination.totalPages}
                  onPageChange={(p) => fetchStaffList(p)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 5. TAB 2: DAILY WORK LOG */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'WORK_LOG' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={workStaffFilter}
                onChange={(e) => setWorkStaffFilter(e.target.value)}
                className="bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
              >
                <option value="all">All Temporary Staff</option>
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExportWork}
                className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#FFF0E5] hover:border-[#F97316] text-[#172033] text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 mr-1.5 text-[#F97316]" /> Export CSV
              </button>

              <button
                onClick={() => handleOpenAddWork()}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-md shadow-[#F97316]/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" /> Log Worked Date
              </button>
            </div>
          </div>

          {/* Work Log Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FFF8F1] border-b border-[#E5E7EB] text-[11px] font-extrabold uppercase tracking-wider text-[#172033]">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Worked Date</th>
                    <th className="py-3.5 px-4 sm:px-6">Staff Member</th>
                    <th className="py-3.5 px-4 sm:px-6">Daily Wage (₹)</th>
                    <th className="py-3.5 px-4 sm:px-6">Remarks</th>
                    <th className="py-3.5 px-4 sm:px-6">Entry Code</th>
                    <th className="py-3.5 px-4 sm:px-6">Entered By</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-xs font-medium text-[#374151]">
                  {workLoading ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-[#6B7280]">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F97316]" />
                        Loading work entries...
                      </td>
                    </tr>
                  ) : workEntries.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-[#6B7280]">
                        <Calendar className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
                        No worked date entries found for the selected period.
                      </td>
                    </tr>
                  ) : (
                    workEntries.map((entry) => (
                      <tr key={entry._id} className="hover:bg-[#FFF8F1]/40 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#172033]">
                          <div className="font-bold text-[#172033]">
                            {new Date(entry.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[11px] text-[#6B7280] font-normal">
                            {new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-bold text-[#172033] flex items-center gap-1.5">
                            {entry.staff?.name || 'Unknown'}
                            {entry.isEdited && (
                              <span
                                onClick={() => setEditHistoryData(entry)}
                                className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-200 cursor-pointer hover:bg-amber-100"
                                title="View edit history"
                              >
                                Edited
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#6B7280]">{entry.staff?.mobile || 'No Mobile'}</div>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="font-bold text-[#16A34A] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            ₹{Number(entry.dailyWage).toLocaleString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-[#4B5563] max-w-xs truncate">
                          {entry.remarks || <span className="text-[#9CA3AF] text-xs italic">Regular duty</span>}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 font-mono text-xs text-[#6B7280]">{entry.entryCode}</td>

                        <td className="py-3.5 px-4 sm:px-6 text-xs text-[#6B7280]">
                          <div className="font-semibold text-[#172033]">{entry.enteredBy?.name || 'Manager'}</div>
                          <div className="text-[11px] text-[#9CA3AF]">{entry.enteredBy?.role || ''}</div>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditWork(entry)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border border-blue-200 transition cursor-pointer"
                              title="Edit Entry"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteWork(entry._id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 transition cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {workPagination.totalPages > 1 && (
              <div className="p-4 border-t border-[#E5E7EB]">
                <Pagination
                  currentPage={workPagination.page}
                  totalPages={workPagination.totalPages}
                  onPageChange={(p) => fetchWorkEntries(p)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 6. TAB 3: MONTHLY & PERIOD SUMMARY */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'SUMMARY' && (
        <div className="space-y-4">
          {/* Summary Control Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={summaryStaffFilter}
                onChange={(e) => setSummaryStaffFilter(e.target.value)}
                className="bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
              >
                <option value="all">All Temporary Staff</option>
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <span className="text-xs text-[#6B7280]">
                Active Period:{' '}
                <span className="font-bold text-[#172033]">
                  {dateRangeMode === 'MONTH' ? selectedMonth : `${startDate || 'Start'} → ${endDate || 'Now'}`}
                </span>
              </span>
            </div>

            <button
              onClick={handleExportSummary}
              className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#FFF0E5] hover:border-[#F97316] text-[#172033] text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 mr-1.5 text-[#F97316]" /> Export Payout Summary
            </button>
          </div>

          {/* Summary Sheet Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FFF8F1] border-b border-[#E5E7EB] text-[11px] font-extrabold uppercase tracking-wider text-[#172033]">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold">Staff Member</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold text-center">Days Worked</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold text-right">Total Payable (₹)</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold text-right">Total Paid (₹)</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold text-right">Pending Balance (₹)</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold text-center">Payment Status</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-xs font-medium text-[#374151]">
                  {loadingSummary ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-[#6B7280]">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F97316]" />
                        Calculating monthly summaries and payables...
                      </td>
                    </tr>
                  ) : summaryList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-[#6B7280]">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
                        No staff records found for summary calculation.
                      </td>
                    </tr>
                  ) : (
                    summaryList.map((item) => (
                      <tr key={item.staff._id} className="hover:bg-[#FFF8F1]/40 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-bold text-[#172033] flex items-center gap-2">
                            {item.staff.name}
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                item.staff.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.staff.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#6B7280]">{item.staff.mobile || 'No Mobile'}</div>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-center">
                          <span className="font-bold text-[#172033] px-2.5 py-1 bg-[#FFF8F1] rounded-lg border border-[#E5E7EB]">
                            {item.daysWorked} {item.daysWorked === 1 ? 'day' : 'days'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-[#F97316]">
                          ₹{Number(item.totalPayable).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-[#16A34A]">
                          ₹{Number(item.totalPaid).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-rose-600">
                          ₹{Number(item.pendingBalance).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                              item.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'Partially Paid'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.pendingBalance > 0 ? (
                              <button
                                onClick={() => handleOpenRecordPayment(item)}
                                className="px-3 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1 cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" /> Pay
                              </button>
                            ) : item.totalPayable > 0 ? (
                              <span className="text-xs text-emerald-600 flex items-center gap-1 font-bold">
                                <CheckCircle2 className="w-4 h-4" /> Settled
                              </span>
                            ) : (
                              <span className="text-xs text-[#9CA3AF] italic">No shifts</span>
                            )}

                            <button
                              onClick={() => handleOpenStaffProfile(item.staff._id)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-[#4B5563] hover:text-[#172033] rounded-lg border border-[#E5E7EB] transition cursor-pointer"
                              title="View Staff Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 7. TAB 4: PAYMENT LEDGER */}
      {/* ------------------------------------------------------------------- */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={paymentStaffFilter}
                onChange={(e) => setPaymentStaffFilter(e.target.value)}
                className="bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
              >
                <option value="all">All Staff</option>
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <button
              onClick={handleExportPayments}
              className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#FFF0E5] hover:border-[#F97316] text-[#172033] text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 mr-1.5 text-[#F97316]" /> Export Payment Ledger
            </button>
          </div>

          {/* Payments Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FFF8F1] border-b border-[#E5E7EB] text-[11px] font-extrabold uppercase tracking-wider text-[#172033]">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold">Receipt / Date</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold">Staff Member</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold">Period / Days</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold text-right">Payable (₹)</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold text-right">Paid Amount (₹)</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold">Mode</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 font-semibold">Paid By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] text-xs font-medium text-[#374151]">
                  {paymentsLoading ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-[#6B7280]">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#F97316]" />
                        Loading payment ledger...
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-[#6B7280]">
                        <CreditCard className="w-8 h-8 mx-auto mb-2 text-[#9CA3AF]" />
                        No payment records found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p._id} className="hover:bg-[#FFF8F1]/40 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#172033]">
                          <div className="font-mono text-xs text-[#F97316] font-bold">{p.entryCode}</div>
                          <div className="text-[11px] text-[#6B7280] font-normal">
                            {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#172033]">
                          <div className="font-bold text-[#172033]">{p.staff?.name || 'Unknown'}</div>
                          <div className="text-[11px] text-[#6B7280] font-normal">{p.staff?.mobile || 'No Mobile'}</div>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-xs text-[#4B5563]">
                          <div className="font-bold text-[#172033]">{p.paymentMonth || 'Date Range'}</div>
                          <div className="text-[#6B7280]">{p.daysWorked} days worked</div>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right font-medium text-[#4B5563]">
                          ₹{Number(p.payableAmount).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-[#16A34A]">
                          ₹{Number(p.paidAmount).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF8F1] text-[#172033] border border-[#E5E7EB]">
                            {p.paymentMode}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                              p.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-xs text-[#6B7280]">
                          <div className="font-semibold text-[#172033]">{p.paidBy?.name || 'Manager'}</div>
                          <div className="text-[11px] text-[#9CA3AF] truncate max-w-[120px]">{p.remarks}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {paymentPagination.totalPages > 1 && (
              <div className="p-4 border-t border-[#E5E7EB]">
                <Pagination
                  currentPage={paymentPagination.page}
                  totalPages={paymentPagination.totalPages}
                  onPageChange={(p) => fetchPayments(p)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 8. MODAL: ADD / EDIT TEMPORARY STAFF */}
      {/* ------------------------------------------------------------------- */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-[#172033]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] bg-[#FFF8F1]">
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#F97316]" />
                {editingStaff ? 'Edit Temporary Staff' : 'Add Temporary Staff'}
              </h3>
              <button
                onClick={() => setShowStaffModal(false)}
                className="text-[#6B7280] hover:text-[#172033] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveStaff(e, false)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Staff Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={staffFormData.name}
                  onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                  className="w-full bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#172033] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Mobile Number (Optional)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={staffFormData.mobile}
                  onChange={(e) => setStaffFormData({ ...staffFormData, mobile: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#172033] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStaffFormData({ ...staffFormData, status: 'Active' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      staffFormData.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                        : 'bg-[#FFF8F1]/40 text-[#6B7280] border-[#E5E7EB] hover:text-[#172033]'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffFormData({ ...staffFormData, status: 'Inactive' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      staffFormData.status === 'Inactive'
                        ? 'bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                        : 'bg-[#FFF8F1]/40 text-[#6B7280] border-[#E5E7EB] hover:text-[#172033]'
                    }`}
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Remarks / Role Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kitchen Helper, Weekend Server"
                  value={staffFormData.remarks}
                  onChange={(e) => setStaffFormData({ ...staffFormData, remarks: e.target.value })}
                  className="w-full bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#172033] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                {!editingStaff && (
                  <button
                    type="button"
                    onClick={(e) => handleSaveStaff(e, true)}
                    className="px-4 py-2.5 bg-white hover:bg-[#FFF8F1] text-[#172033] border border-[#E5E7EB] rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Save & Add Another
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold shadow-md shadow-[#F97316]/20 transition cursor-pointer"
                >
                  {editingStaff ? 'Update Staff' : 'Save Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 9. MODAL: LOG WORKED DATE ENTRY */}
      {/* ------------------------------------------------------------------- */}
      {showWorkModal && (
        <div className="fixed inset-0 z-50 bg-[#172033]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] bg-[#FFF8F1]">
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#F97316]" />
                {editingWork ? 'Edit Work Entry' : 'Log Worked Date'}
              </h3>
              <button
                onClick={() => setShowWorkModal(false)}
                className="text-[#6B7280] hover:text-[#172033] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveWork(e, false)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Select Staff <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  disabled={!!editingWork}
                  value={workFormData.staffId}
                  onChange={(e) => setWorkFormData({ ...workFormData, staffId: e.target.value })}
                  className="w-full bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316] disabled:opacity-60 cursor-pointer"
                >
                  <option value="">Select an active staff</option>
                  {staffList
                    .filter((s) => s.status === 'Active' || s._id === workFormData.staffId)
                    .map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.status})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Worked Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={workFormData.date}
                  onChange={(e) => setWorkFormData({ ...workFormData, date: e.target.value })}
                  className="w-full bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Daily Wage (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="e.g. 500"
                    value={workFormData.dailyWage}
                    onChange={(e) => setWorkFormData({ ...workFormData, dailyWage: e.target.value })}
                    className="w-full bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl pl-8 pr-4 py-2.5 text-xs font-bold text-[#16A34A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Remarks / Task Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kitchen helper during rush hour"
                  value={workFormData.remarks}
                  onChange={(e) => setWorkFormData({ ...workFormData, remarks: e.target.value })}
                  className="w-full bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#172033] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                {!editingWork && (
                  <button
                    type="button"
                    onClick={(e) => handleSaveWork(e, true)}
                    className="px-4 py-2.5 bg-white hover:bg-[#FFF8F1] text-[#172033] border border-[#E5E7EB] rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Save & Add Another
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-xl text-xs font-bold shadow-md shadow-[#F97316]/20 transition cursor-pointer"
                >
                  {editingWork ? 'Update Entry' : 'Record Work'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 10. MODAL: RECORD PAYMENT (PAYOUT) */}
      {/* ------------------------------------------------------------------- */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-[#172033]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] bg-[#FFF8F1]">
              <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#16A34A]" /> Record Temporary Staff Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-[#6B7280] hover:text-[#172033] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="p-5 space-y-4">
              <div className="bg-[#FFF8F1] p-4 rounded-xl border border-[#E5E7EB] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#6B7280]">Staff Member:</span>
                  <span className="text-xs font-bold text-[#172033]">{paymentFormData.staffName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#6B7280]">Days Worked:</span>
                  <span className="text-xs font-bold text-[#172033]">{paymentFormData.daysWorked} days</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#E5E7EB]">
                  <span className="text-xs text-[#6B7280]">Total Wage Payable:</span>
                  <span className="text-sm font-bold text-[#F97316]">
                    ₹{Number(paymentFormData.payableAmount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Paid Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] font-bold">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="e.g. 2500"
                      value={paymentFormData.paidAmount}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, paidAmount: e.target.value })}
                      className="w-full bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl pl-8 pr-4 py-2.5 text-xs font-bold text-[#16A34A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1.5">
                    Payment Mode
                  </label>
                  <select
                    value={paymentFormData.paymentMode}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMode: e.target.value })}
                    className="w-full bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Payment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={paymentFormData.paymentDate}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                  className="w-full bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Remarks / Disbursement Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cleared full wage via UPI"
                  value={paymentFormData.remarks}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, remarks: e.target.value })}
                  className="w-full bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#172033] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2.5 bg-white hover:bg-[#FFF8F1] text-[#172033] border border-[#E5E7EB] rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#16A34A] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Disburse Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 11. MODAL: 360 STAFF DETAIL PROFILE */}
      {/* ------------------------------------------------------------------- */}
      {profileModalData && (
        <div className="fixed inset-0 z-50 bg-[#172033]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] bg-[#FFF8F1]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#F97316] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {profileModalData.staff.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                    {profileModalData.staff.name}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        profileModalData.staff.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {profileModalData.staff.status}
                    </span>
                  </h3>
                  <p className="text-xs text-[#6B7280] flex items-center gap-3 mt-0.5">
                    <span className="font-semibold">{profileModalData.staff.entryCode}</span>
                    {profileModalData.staff.mobile && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-[#9CA3AF]" /> {profileModalData.staff.mobile}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalData(null)}
                className="text-[#6B7280] hover:text-[#172033] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scrollable Area */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Lifetime Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FFF8F1] p-3.5 rounded-xl border border-[#E5E7EB]">
                  <span className="text-[11px] uppercase font-bold text-[#6B7280]">Total Shifts</span>
                  <div className="text-xl font-bold text-[#172033] mt-1">
                    {profileModalData.totals.lifetimeDaysWorked} days
                  </div>
                </div>

                <div className="bg-[#FFF8F1] p-3.5 rounded-xl border border-[#E5E7EB]">
                  <span className="text-[11px] uppercase font-bold text-[#6B7280]">Lifetime Wages</span>
                  <div className="text-xl font-bold text-[#F97316] mt-1">
                    ₹{Number(profileModalData.totals.lifetimePayable).toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#FFF8F1] p-3.5 rounded-xl border border-[#E5E7EB]">
                  <span className="text-[11px] uppercase font-bold text-[#6B7280]">Lifetime Paid</span>
                  <div className="text-xl font-bold text-[#16A34A] mt-1">
                    ₹{Number(profileModalData.totals.lifetimePaid).toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#FFF8F1] p-3.5 rounded-xl border border-[#E5E7EB]">
                  <span className="text-[11px] uppercase font-bold text-[#6B7280]">Net Due Balance</span>
                  <div className="text-xl font-bold text-rose-600 mt-1">
                    ₹{Number(profileModalData.totals.balanceRemaining).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Monthly Summary Breakdown */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#F97316]" /> Monthly Summary Breakdown
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {profileModalData.monthlyBreakdown.length === 0 ? (
                    <div className="col-span-full py-4 text-center text-xs text-[#9CA3AF] italic">
                      No worked history recorded yet.
                    </div>
                  ) : (
                    profileModalData.monthlyBreakdown.map((m) => (
                      <div key={m.month} className="bg-white p-3.5 rounded-xl border border-[#E5E7EB] shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#172033] text-sm">{m.month}</span>
                          <span className="text-xs bg-[#FFF8F1] border border-[#E5E7EB] px-2 py-0.5 rounded text-[#172033] font-bold">
                            {m.daysWorked} days
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#E5E7EB] text-xs">
                          <span className="text-[#6B7280]">Payable:</span>
                          <span className="font-bold text-[#F97316]">₹{Number(m.totalPayable).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Payment Receipts */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#16A34A]" /> Payout Disbursement History
                </h4>
                <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FFF8F1] text-[#6B7280] uppercase border-b border-[#E5E7EB] text-[10px] font-extrabold">
                      <tr>
                        <th className="p-3">Receipt / Date</th>
                        <th className="p-3">Period</th>
                        <th className="p-3 text-right">Amount (₹)</th>
                        <th className="p-3">Mode</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB] font-medium text-[#374151]">
                      {profileModalData.paymentHistory.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-4 text-center text-[#9CA3AF] italic">
                            No payment history available.
                          </td>
                        </tr>
                      ) : (
                        profileModalData.paymentHistory.map((p) => (
                          <tr key={p._id} className="hover:bg-[#FFF8F1]/40">
                            <td className="p-3">
                              <div className="font-mono font-bold text-[#F97316]">{p.entryCode}</div>
                              <div className="text-[#9CA3AF] text-[11px]">
                                {new Date(p.paymentDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="p-3">{p.paymentMonth || 'Range'}</td>
                            <td className="p-3 text-right font-bold text-[#16A34A]">
                              ₹{Number(p.paidAmount).toLocaleString()}
                            </td>
                            <td className="p-3">{p.paymentMode}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 12. AUDIT / EDIT HISTORY MODAL */}
      {/* ------------------------------------------------------------------- */}
      {editHistoryData && (
        <EditHistoryModal item={editHistoryData} onClose={() => setEditHistoryData(null)} />
      )}
    </div>
  );
};

export default TemporaryStaffManagement;
