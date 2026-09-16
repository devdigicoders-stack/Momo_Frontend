import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import auditService from '../../services/auditService';
import Pagination from '../../components/Pagination';
import exportToCsv from '../../utils/exportToCsv';
import {
  ShieldCheck,
  Search,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  X,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  Trash2,
  Plus,
  XCircle,
  ToggleLeft,
  Clock,
  User,
  Layers,
  Sparkles,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react';
import SkeletonLoader, { SkeletonBlock } from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';

const MODULE_LABELS = {
  SALES: { label: 'Sales', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  EXPENSE: { label: 'Expense', color: 'text-rose-700 bg-rose-50 border-rose-200' },
  MOMO_PURCHASE: { label: 'Momo Purchase', color: 'text-amber-800 bg-amber-50 border-amber-200' },
  CASH: { label: 'Cash Entry', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  CHEF_REQUIREMENT: { label: 'Chef Req', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  EMPLOYEE: { label: 'Staff Master', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  ATTENDANCE: { label: 'Attendance', color: 'text-teal-700 bg-teal-50 border-teal-200' },
  SALARY_ADVANCE: { label: 'Salary Advance', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
  SALARY: { label: 'Salary Payout', color: 'text-violet-700 bg-violet-50 border-violet-200' },
  TEMPORARY_STAFF: { label: 'Temp Staff', color: 'text-amber-900 bg-amber-100/60 border-amber-300' },
  TEMPORARY_STAFF_WORK: { label: 'Temp Work Log', color: 'text-lime-800 bg-lime-50 border-lime-200' },
  TEMPORARY_STAFF_PAYMENT: { label: 'Temp Payment', color: 'text-cyan-800 bg-cyan-50 border-cyan-200' },
  SETTING: { label: 'Settings', color: 'text-slate-700 bg-slate-100 border-slate-200' },
  DAILY_CONTROL: { label: 'Daily Control', color: 'text-pink-700 bg-pink-50 border-pink-200' },
  OTHER: { label: 'System', color: 'text-slate-700 bg-slate-100 border-slate-200' },
};

const ACTION_ICONS = {
  EDIT: { icon: Pencil, color: 'text-amber-700 bg-amber-50 border-amber-200', text: 'Edited' },
  CREATE: { icon: Plus, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', text: 'Created' },
  DELETE: { icon: Trash2, color: 'text-rose-700 bg-rose-50 border-rose-200', text: 'Deleted' },
  CANCELLED: { icon: XCircle, color: 'text-orange-700 bg-orange-50 border-orange-200', text: 'Cancelled' },
  STATUS_CHANGE: { icon: ToggleLeft, color: 'text-blue-700 bg-blue-50 border-blue-200', text: 'Status Changed' },
};

const FIELD_LABEL_MAP = {
  amount: 'Amount (₹)',
  date: 'Date',
  paymentMode: 'Payment Mode',
  remarks: 'Remarks',
  category: 'Category',
  subcategory: 'Subcategory',
  item: 'Item / Description',
  bill: 'Bill Attachment',
  quantity: 'Quantity',
  rate: 'Rate',
  totalAmount: 'Total Amount (₹)',
  momoType: 'Momo Type',
  supplierName: 'Supplier Name',
  openingCash: 'Opening Cash (₹)',
  cashReceived: 'Cash Received (₹)',
  cashPaid: 'Cash Paid (₹)',
  closingCash: 'Closing Cash (₹)',
  name: 'Name',
  mobile: 'Mobile',
  status: 'Status',
  designation: 'Designation',
  salary: 'Salary (₹)',
  joiningDate: 'Joining Date',
  dailyWage: 'Daily Wage (₹)',
  paidAmount: 'Paid Amount (₹)',
  payableAmount: 'Payable Amount (₹)',
  daysWorked: 'Days Worked',
};

const formatFieldValue = (key, value) => {
  if (value === null || value === undefined) return '—';
  if (key === 'date' || key === 'joiningDate' || key === 'paymentDate') {
    try {
      return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(value);
    }
  }
  if (['amount', 'totalAmount', 'rate', 'openingCash', 'cashReceived', 'cashPaid', 'closingCash', 'salary', 'dailyWage', 'paidAmount', 'payableAmount'].includes(key)) {
    const n = Number(value);
    return isNaN(n) ? String(value) : `₹${n.toLocaleString('en-IN')}`;
  }
  return String(value);
};

const AuditHistory = () => {
  const { user } = useAuth();

  // Stats
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Audit Logs List
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalPages: 1, total: 0 });

  // Filters
  const [filters, setFilters] = useState({
    module: 'all',
    action: 'all',
    startDate: '',
    endDate: '',
    search: '',
  });

  // Expanded Diff Drawer
  const [expandedRow, setExpandedRow] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // -----------------------------------------------------------------------
  // Fetch Audit Stats
  // -----------------------------------------------------------------------
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await auditService.getAuditStats();
      if (res.success) setStats(res.data);
    } catch (err) {
      console.error('Error fetching audit stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Fetch Audit Logs
  // -----------------------------------------------------------------------
  const fetchAuditLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(filters.module !== 'all' && { module: filters.module }),
        ...(filters.action !== 'all' && { action: filters.action }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.search && { search: filters.search }),
      };
      const res = await auditService.getAuditLogs(params);
      if (res.success) {
        setAuditLogs(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 15, totalPages: 1, total: 0 });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchAuditLogs(1);
  }, [filters]);

  const handleRefresh = () => {
    fetchStats();
    fetchAuditLogs(1);
    toast.success('Audit trail refreshed');
  };

  const handleExport = () => {
    if (!auditLogs.length) return toast.error('No records to export');
    const data = auditLogs.map((log) => ({
      Timestamp: new Date(log.timestamp).toLocaleString('en-IN'),
      'Performed By': log.performedBy?.name || 'Unknown',
      Role: log.performedBy?.role || 'N/A',
      Module: log.module,
      Action: log.action,
      'Entry Code': log.entryCode || 'N/A',
      'Changed Fields': (log.changedFields || []).join(', '),
      Reason: log.reason || '',
    }));
    exportToCsv(data, `AuditTrail_${todayStr}`);
  };

  const handleResetFilters = () => {
    setFilters({ module: 'all', action: 'all', startDate: '', endDate: '', search: '' });
  };

  const getActionConfig = (action) => ACTION_ICONS[action] || ACTION_ICONS.EDIT;
  const getModuleConfig = (module) => MODULE_LABELS[module] || MODULE_LABELS.OTHER;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ----------------------------------------------------------- */}
      {/* 1. Header Banner */}
      {/* ----------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0E5] text-[#F97316] mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Immutable & Secure Audit System</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033]">
            Audit Trail & History Logs
          </h1>
          <p className="text-xs text-[#6B7280]">
            Track every single data edit, status change, and deletion across all restaurant modules with precise difference views.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            disabled={loading || auditLogs.length === 0}
            className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#FFF0E5] hover:border-[#F97316] text-[#172033] text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-[#F97316]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#FFF0E5] hover:border-[#F97316] text-[#172033] transition cursor-pointer"
            title="Refresh Audit Data"
          >
            <RefreshCw className={`w-4 h-4 text-[#F97316] ${loadingStats || loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 2. Metric Summary Cards */}
      {/* ----------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Edits */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs hover:border-[#F97316]/40 transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Total Edits</p>
              <h3 className="text-2xl font-black text-[#172033] mt-1">
                {loadingStats ? '—' : stats?.totalEdits ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-violet-50 text-violet-600 rounded-xl border border-violet-100">
              <Pencil className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-3">All-time tracked modifications</p>
        </div>

        {/* Today's Edits */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs hover:border-[#F97316]/40 transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Today's Edits</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {loadingStats ? '—' : stats?.todayEdits ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-3">Modifications since midnight</p>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs hover:border-[#F97316]/40 transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">This Month</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                {loadingStats ? '—' : stats?.monthEdits ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-3">Current month total edits</p>
        </div>

        {/* Top Module */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-xs hover:border-[#F97316]/40 transition">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Top Module</p>
              <h3 className="text-lg font-black text-[#F97316] mt-1 truncate max-w-[150px]">
                {loadingStats
                  ? '—'
                  : stats?.moduleBreakdown?.[0]
                  ? getModuleConfig(stats.moduleBreakdown[0].module).label
                  : 'None'}
              </h3>
            </div>
            <div className="p-3 bg-[#FFF0E5] text-[#F97316] rounded-xl border border-[#F97316]/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-3">
            {stats?.moduleBreakdown?.[0]
              ? `${stats.moduleBreakdown[0].count} total changes logged`
              : 'No modifications recorded'}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 3. Filter & Search Bar */}
      {/* ----------------------------------------------------------- */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by entry code, reason, or staff..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-4 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] focus:bg-white transition-all"
            />
          </div>

          {/* Module Filter */}
          <select
            value={filters.module}
            onChange={(e) => setFilters((prev) => ({ ...prev, module: e.target.value }))}
            className="bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] focus:bg-white"
          >
            <option value="all">All Modules</option>
            {Object.entries(MODULE_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          {/* Action Filter */}
          <select
            value={filters.action}
            onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
            className="bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] focus:bg-white"
          >
            <option value="all">All Action Types</option>
            <option value="EDIT">Edits (Modifications)</option>
            <option value="CREATE">Creates</option>
            <option value="DELETE">Deletes</option>
            <option value="CANCELLED">Cancellations</option>
            <option value="STATUS_CHANGE">Status Changes</option>
          </select>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-[#6B7280]">
            <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              className="bg-transparent text-[#172033] focus:outline-none text-xs font-medium"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              className="bg-transparent text-[#172033] focus:outline-none text-xs font-medium"
            />
          </div>

          {/* Reset Filters */}
          {(filters.module !== 'all' || filters.action !== 'all' || filters.startDate || filters.endDate || filters.search) && (
            <button
              onClick={handleResetFilters}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Reset All Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 4. Audit Records Table */}
      {/* ----------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF8F1] border-b border-[#E5E7EB] text-[11px] font-extrabold uppercase tracking-wider text-[#172033]">
                <th className="py-3.5 px-4 sm:px-5 w-6"></th>
                <th className="py-3.5 px-4 sm:px-5">Timestamp</th>
                <th className="py-3.5 px-4 sm:px-5">Performed By</th>
                <th className="py-3.5 px-4 sm:px-5">Module</th>
                <th className="py-3.5 px-4 sm:px-5">Action</th>
                <th className="py-3.5 px-4 sm:px-5">Entry Code</th>
                <th className="py-3.5 px-4 sm:px-5">Changed Fields</th>
                <th className="py-3.5 px-4 sm:px-5">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-xs font-medium text-[#374151]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-6">
                    <SkeletonLoader rows={5} columns={8} />
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <ShieldCheck className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm text-[#172033]">No Audit Logs Found</p>
                      <p className="text-xs text-[#6B7280]">
                        No modifications match your filter criteria or no actions have been taken yet.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => {
                  const actionCfg = getActionConfig(log.action);
                  const moduleCfg = getModuleConfig(log.module);
                  const ActionIcon = actionCfg.icon;
                  const isExpanded = expandedRow === log._id;

                  return (
                    <React.Fragment key={log._id}>
                      <tr
                        className={`hover:bg-[#FFF8F1]/40 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-[#FFF8F1]/60 font-semibold' : ''
                        }`}
                        onClick={() => setExpandedRow(isExpanded ? null : log._id)}
                      >
                        {/* Toggle Chevron */}
                        <td className="py-3.5 px-4 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-[#F97316]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                          <div className="font-bold text-[#172033] text-xs">
                            {new Date(log.timestamp).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                          <div className="text-[11px] text-[#6B7280]">
                            {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                        </td>

                        {/* Performed By */}
                        <td className="py-3.5 px-4 sm:px-5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#FFF0E5] border border-[#F97316]/20 flex items-center justify-center text-[#F97316] font-extrabold text-xs">
                              {(log.performedBy?.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-[#172033] text-xs">
                                {log.performedBy?.name || 'System / Auto'}
                              </div>
                              <div className="text-[10px] text-[#6B7280] uppercase tracking-wider">
                                {log.performedBy?.role || 'SYSTEM'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Module Badge */}
                        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${moduleCfg.color}`}
                          >
                            {moduleCfg.label}
                          </span>
                        </td>

                        {/* Action Badge */}
                        <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${actionCfg.color}`}
                          >
                            <ActionIcon className="w-3.5 h-3.5" />
                            {actionCfg.text || log.action}
                          </span>
                        </td>

                        {/* Entry Code */}
                        <td className="py-3.5 px-4 sm:px-5 font-mono text-xs font-bold text-[#172033]">
                          {log.entryCode || '—'}
                        </td>

                        {/* Changed Fields */}
                        <td className="py-3.5 px-4 sm:px-5">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(log.changedFields || []).slice(0, 3).map((field) => (
                              <span
                                key={field}
                                className="px-2 py-0.5 bg-slate-100 border border-[#E5E7EB] text-[#172033] rounded-md text-[10px] font-semibold"
                              >
                                {FIELD_LABEL_MAP[field] || field}
                              </span>
                            ))}
                            {log.changedFields?.length > 3 && (
                              <span className="text-[10px] text-slate-500 font-bold">
                                +{log.changedFields.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="py-3.5 px-4 sm:px-5 max-w-xs">
                          {log.reason ? (
                            <span
                              className="text-xs text-[#172033] font-medium italic truncate block max-w-[180px]"
                              title={log.reason}
                            >
                              "{log.reason}"
                            </span>
                          ) : (
                            <span className="text-xs text-[#9CA3AF] italic">No reason specified</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Diff Drawer */}
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan="8"
                            className="bg-[#FFF8F1]/40 border-t border-b border-[#E5E7EB] px-6 sm:px-10 py-5"
                          >
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs sm:text-sm font-extrabold text-[#172033] flex items-center gap-2">
                                  <ShieldCheck className="w-4 h-4 text-[#F97316]" />
                                  <span>Field Modification Comparison (Before vs After)</span>
                                </h4>
                                <div className="text-xs text-[#6B7280]">
                                  Database Record ID:{' '}
                                  <span className="font-mono text-[#172033] font-semibold">{log.recordId}</span>
                                </div>
                              </div>

                              {log.action === 'EDIT' && log.changedFields?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {log.changedFields.map((field) => (
                                    <div
                                      key={field}
                                      className="bg-white border border-[#E5E7EB] rounded-xl p-3.5 shadow-2xs"
                                    >
                                      <div className="text-[10px] uppercase font-extrabold text-[#6B7280] mb-2 tracking-wider">
                                        {FIELD_LABEL_MAP[field] || field}
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-mono line-through">
                                          {formatFieldValue(field, log.originalValues?.[field])}
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-mono font-bold">
                                          {formatFieldValue(field, log.newValues?.[field])}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : log.action === 'DELETE' || log.action === 'CANCELLED' ? (
                                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs mb-3">
                                    <Trash2 className="w-4 h-4" />
                                    <span>
                                      Record was permanently {log.action.toLowerCase()}. Previous values snapshot:
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                    {Object.entries(log.originalValues || {}).map(([field, val]) => (
                                      <div key={field} className="bg-white p-2.5 rounded-lg border border-rose-100">
                                        <span className="text-[#6B7280] font-medium block text-[10px] uppercase">
                                          {FIELD_LABEL_MAP[field] || field}
                                        </span>
                                        <span className="text-[#172033] font-bold">
                                          {formatFieldValue(field, val)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-[#6B7280] bg-white p-3 rounded-xl border border-[#E5E7EB]">
                                  No field-level diff was required for this operational action.
                                </div>
                              )}

                              {log.reason && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-900 flex items-start gap-2.5">
                                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                                  <div>
                                    <span className="font-bold text-amber-800">Reason Provided for Correction: </span>
                                    <span>{log.reason}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* 5. Pagination */}
        {/* ----------------------------------------------------------- */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-[#E5E7EB]">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalRecords={pagination.total}
              recordsPerPage={pagination.limit}
              onPageChange={(p) => fetchAuditLogs(p)}
            />
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 6. Activity by Module Breakdown */}
      {/* ----------------------------------------------------------- */}
      {stats?.moduleBreakdown?.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#F97316]" />
              <span>Edit & Change Frequency by Module</span>
            </h3>
            <span className="text-xs text-[#6B7280]">
              Overall total: {stats.totalEdits || 0} modifications
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {stats.moduleBreakdown.map((m) => {
              const cfg = getModuleConfig(m.module);
              return (
                <div
                  key={m.module}
                  className="bg-[#FFF8F1]/50 border border-[#E5E7EB] hover:border-[#F97316]/40 rounded-xl p-3.5 text-center transition"
                >
                  <div
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.color} inline-block mb-2`}
                  >
                    {cfg.label}
                  </div>
                  <div className="text-xl font-black text-[#172033]">{m.count}</div>
                  <div className="text-[10px] text-[#6B7280] font-medium">total changes</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditHistory;

