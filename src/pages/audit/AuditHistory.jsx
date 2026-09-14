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
} from 'lucide-react';
import toast from 'react-hot-toast';

const MODULE_LABELS = {
  SALES: { label: 'Sales', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  EXPENSE: { label: 'Expense', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  MOMO_PURCHASE: { label: 'Momo Purchase', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  CASH: { label: 'Cash', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  CHEF_REQUIREMENT: { label: 'Chef Req', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  EMPLOYEE: { label: 'Employee', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  ATTENDANCE: { label: 'Attendance', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  SALARY_ADVANCE: { label: 'Salary Advance', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  SALARY: { label: 'Salary', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  TEMPORARY_STAFF: { label: 'Temp Staff', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  TEMPORARY_STAFF_WORK: { label: 'Temp Work Log', color: 'text-lime-400 bg-lime-500/10 border-lime-500/20' },
  TEMPORARY_STAFF_PAYMENT: { label: 'Temp Payment', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  SETTING: { label: 'Setting', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  DAILY_CONTROL: { label: 'Daily Control', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  OTHER: { label: 'Other', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
};

const ACTION_ICONS = {
  EDIT: { icon: Pencil, color: 'text-amber-400 bg-amber-500/10' },
  CREATE: { icon: Plus, color: 'text-emerald-400 bg-emerald-500/10' },
  DELETE: { icon: Trash2, color: 'text-rose-400 bg-rose-500/10' },
  CANCELLED: { icon: XCircle, color: 'text-orange-400 bg-orange-500/10' },
  STATUS_CHANGE: { icon: ToggleLeft, color: 'text-blue-400 bg-blue-500/10' },
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
    return isNaN(n) ? String(value) : `₹${n.toLocaleString()}`;
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
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalPages: 1, total: 0 });

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
  const currentMonthStr = new Date().toISOString().slice(0, 7);

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
        setAuditLogs(res.data);
        setPagination(res.pagination);
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
    toast.success('Audit data refreshed');
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

  const getActionConfig = (action) => ACTION_ICONS[action] || ACTION_ICONS.EDIT;
  const getModuleConfig = (module) => MODULE_LABELS[module] || MODULE_LABELS.OTHER;

  return (
    <div className="space-y-6 pb-12">
      {/* ----------------------------------------------------------- */}
      {/* Header */}
      {/* ----------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-transparent p-6 rounded-2xl border border-violet-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Phase 10 Module
            </span>
            <span className="text-xs text-slate-400">Immutable & Tamper-Proof Audit System</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-violet-400" /> Complete Edit & Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track every data modification across all modules — who changed what, when, and why.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm border border-slate-700 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin text-violet-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* KPI Stats Cards */}
      {/* ----------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 backdrop-blur">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Edits</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats?.totalEdits ?? '—'}</h3>
            </div>
            <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20">
              <Pencil className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">All-time tracked modifications</p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 backdrop-blur">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Edits</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">{stats?.todayEdits ?? '—'}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Modifications since midnight</p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 backdrop-blur">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">This Month</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">{stats?.monthEdits ?? '—'}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Current month total edits</p>
        </div>

        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 backdrop-blur">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Module</p>
              <h3 className="text-lg font-bold text-blue-400 mt-1">
                {stats?.moduleBreakdown?.[0]
                  ? `${getModuleConfig(stats.moduleBreakdown[0].module).label}`
                  : '—'}
              </h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            {stats?.moduleBreakdown?.[0]
              ? `${stats.moduleBreakdown[0].count} total changes`
              : 'No data yet'}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* Filter Bar */}
      {/* ----------------------------------------------------------- */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by entry code or reason..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Module Filter */}
          <select
            value={filters.module}
            onChange={(e) => setFilters((prev) => ({ ...prev, module: e.target.value }))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Modules</option>
            {Object.entries(MODULE_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Action Filter */}
          <select
            value={filters.action}
            onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Actions</option>
            <option value="EDIT">Edit</option>
            <option value="CREATE">Create</option>
            <option value="DELETE">Delete</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="STATUS_CHANGE">Status Change</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-violet-400" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
              className="bg-transparent text-white focus:outline-none text-sm"
            />
            <span>→</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
              className="bg-transparent text-white focus:outline-none text-sm"
            />
          </div>

          {/* Clear Filters */}
          {(filters.module !== 'all' || filters.action !== 'all' || filters.startDate || filters.endDate || filters.search) && (
            <button
              onClick={() => setFilters({ module: 'all', action: 'all', startDate: '', endDate: '', search: '' })}
              className="px-3 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-medium hover:bg-rose-500/20 transition flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* Audit Log Table */}
      {/* ----------------------------------------------------------- */}
      <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4 font-semibold w-6"></th>
                <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                <th className="py-3.5 px-4 font-semibold">Performed By</th>
                <th className="py-3.5 px-4 font-semibold">Module</th>
                <th className="py-3.5 px-4 font-semibold">Action</th>
                <th className="py-3.5 px-4 font-semibold">Entry Code</th>
                <th className="py-3.5 px-4 font-semibold">Changed Fields</th>
                <th className="py-3.5 px-4 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-400" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    No audit records found for the selected filters.
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
                        className="hover:bg-slate-700/30 transition cursor-pointer"
                        onClick={() => setExpandedRow(isExpanded ? null : log._id)}
                      >
                        {/* Toggle chevron */}
                        <td className="py-3.5 px-4 text-slate-400">
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-violet-400" />
                            : <ChevronRight className="w-4 h-4" />}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-medium text-white text-xs">
                            {new Date(log.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </div>
                        </td>

                        {/* Performed By */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-xs">
                              {(log.performedBy?.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-white text-xs">{log.performedBy?.name || 'System'}</div>
                              <div className="text-[11px] text-slate-400">{log.performedBy?.role || 'N/A'}</div>
                            </div>
                          </div>
                        </td>

                        {/* Module Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${moduleCfg.color}`}>
                            {moduleCfg.label}
                          </span>
                        </td>

                        {/* Action Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 w-fit ${actionCfg.color}`}>
                            <ActionIcon className="w-3.5 h-3.5" />
                            {log.action}
                          </span>
                        </td>

                        {/* Entry Code */}
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                          {log.entryCode || '—'}
                        </td>

                        {/* Changed Fields Summary */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(log.changedFields || []).slice(0, 3).map((field) => (
                              <span key={field} className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 rounded text-[10px]">
                                {FIELD_LABEL_MAP[field] || field}
                              </span>
                            ))}
                            {log.changedFields?.length > 3 && (
                              <span className="text-[10px] text-slate-500">+{log.changedFields.length - 3} more</span>
                            )}
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="py-3.5 px-4 max-w-xs">
                          {log.reason ? (
                            <span className="text-xs text-slate-300 italic truncate block max-w-[160px]" title={log.reason}>
                              "{log.reason}"
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500 italic">No reason provided</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Diff Panel */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="8" className="bg-slate-900/60 border-t border-slate-700/60 px-8 py-5">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                  <ShieldCheck className="w-4 h-4 text-violet-400" />
                                  Detailed Change Diff
                                </h4>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                  <span>Record ID: <span className="font-mono text-slate-300">{log.recordId}</span></span>
                                </div>
                              </div>

                              {log.action === 'EDIT' && log.changedFields?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {log.changedFields.map((field) => (
                                    <div key={field} className="bg-slate-800 border border-slate-700 rounded-xl p-3.5">
                                      <div className="text-[11px] uppercase font-semibold text-slate-400 mb-2">
                                        {FIELD_LABEL_MAP[field] || field}
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2.5 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-mono line-through">
                                          {formatFieldValue(field, log.originalValues?.[field])}
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-mono font-semibold">
                                          {formatFieldValue(field, log.newValues?.[field])}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : log.action === 'DELETE' || log.action === 'CANCELLED' ? (
                                <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                                  <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm mb-3">
                                    <Trash2 className="w-4 h-4" /> Record was {log.action.toLowerCase()}
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                                    {Object.entries(log.originalValues || {}).map(([field, val]) => (
                                      <div key={field}>
                                        <span className="text-slate-400">{FIELD_LABEL_MAP[field] || field}: </span>
                                        <span className="text-slate-200 font-medium">{formatFieldValue(field, val)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-400 italic">No field-level diff available for this action.</div>
                              )}

                              {log.reason && (
                                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-xs text-amber-300 flex items-start gap-2">
                                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-400" />
                                  <div>
                                    <span className="font-semibold text-amber-400">Reason for Edit: </span>
                                    {log.reason}
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-700/80">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(p) => fetchAuditLogs(p)}
            />
          </div>
        )}
      </div>

      {/* ----------------------------------------------------------- */}
      {/* Module Breakdown */}
      {/* ----------------------------------------------------------- */}
      {stats?.moduleBreakdown?.length > 0 && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" /> Edit Activity by Module
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {stats.moduleBreakdown.map((m) => {
              const cfg = getModuleConfig(m.module);
              return (
                <div key={m.module} className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-3 text-center">
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color} inline-block mb-1.5`}>
                    {cfg.label}
                  </div>
                  <div className="text-lg font-bold text-white">{m.count}</div>
                  <div className="text-[11px] text-slate-400">changes</div>
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
