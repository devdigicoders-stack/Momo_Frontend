import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  Plus,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Archive,
  CheckSquare,
  AlertCircle,
  Eye,
  History,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import dailyControlService from '../../services/dailyControlService';
import toast from 'react-hot-toast';
import EditHistoryModal from '../../components/EditHistoryModal';

const DailyEntryHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState(null);
  const [myRecent, setMyRecent] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [historyTitle, setHistoryTitle] = useState('');

  const fetchDailyControl = async (dateStr) => {
    try {
      setLoading(true);
      const res = await dailyControlService.getDailyStatus(dateStr);
      if (res.success) {
        setDailyData(res.data);
      }
    } catch (error) {
      console.error('Fetch daily status error:', error);
      toast.error('Failed to load daily status');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRecent = async () => {
    try {
      setLoadingRecent(true);
      const res = await dailyControlService.getMyRecentEntries(10);
      if (res.success) {
        setMyRecent(res.data || []);
      }
    } catch (error) {
      console.error('Fetch my recent error:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  useEffect(() => {
    fetchDailyControl(selectedDate);
    fetchMyRecent();
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleShiftDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToggleStatus = async () => {
    if (!dailyData) return;
    try {
      setActionLoading(true);
      const newStatus = dailyData.status === 'COMPLETED' ? 'OPEN' : 'COMPLETED';
      const res = await dailyControlService.toggleStatus(selectedDate, newStatus);
      if (res.success) {
        toast.success(`Date marked as ${newStatus}`);
        fetchDailyControl(selectedDate);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update daily status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleLock = async () => {
    if (!dailyData) return;
    try {
      setActionLoading(true);
      const shouldLock = dailyData.status !== 'LOCKED';
      const res = await dailyControlService.toggleLock(selectedDate, shouldLock);
      if (res.success) {
        toast.success(`Date ${shouldLock ? 'LOCKED' : 'UNLOCKED'} successfully`);
        fetchDailyControl(selectedDate);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle date lock');
    } finally {
      setActionLoading(false);
    }
  };

  const openHistory = (item) => {
    setSelectedHistory(item.raw?.editHistory || []);
    setHistoryTitle(`${item.type} [${item.entryCode}] Edit Audit Log`);
    setHistoryModalOpen(true);
  };

  const isLocked = dailyData?.status === 'LOCKED';
  const isCompleted = dailyData?.status === 'COMPLETED';

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner & Date Selector */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 border border-gray-100 dark:border-navy-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
              Operations Hub
            </span>
            <span className="text-xs text-navy-400">Daily Data Entry & Control</span>
          </div>
          <h1 className="text-2xl font-black text-navy-900 dark:text-white tracking-tight">
            Daily Operational Control
          </h1>
          <p className="text-sm text-navy-500 dark:text-navy-400 mt-0.5">
            Track daily entry completion, checklists, and quick operational actions.
          </p>
        </div>

        {/* Date Controls & Status Pill */}
        <div className="flex flex-wrap items-center gap-3">
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
              onChange={handleDateChange}
              className="bg-transparent text-sm font-bold text-navy-900 dark:text-white px-3 py-1 outline-none cursor-pointer"
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

          {/* Status Badge */}
          <div
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isLocked
                ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50'
                : isCompleted
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50'
                : 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50'
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5" /> LOCKED
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> COMPLETED
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" /> OPEN
              </>
            )}
          </div>
        </div>
      </div>

      {/* Date Status Banner & Management Controls */}
      {dailyData && (
        <div
          className={`rounded-2xl p-5 border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            isLocked
              ? 'bg-red-50/70 border-red-200 dark:bg-red-950/20 dark:border-red-900/30'
              : isCompleted
              ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30'
              : 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl mt-0.5 ${
                isLocked
                  ? 'bg-red-500 text-white'
                  : isCompleted
                  ? 'bg-emerald-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {isLocked ? <Lock className="w-5 h-5" /> : isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                {isLocked
                  ? `Entries for ${selectedDate} are Locked`
                  : isCompleted
                  ? `Daily Entries for ${selectedDate} are Completed`
                  : `Daily Data Entry is Active for ${selectedDate}`}
              </h3>
              <p className="text-xs text-navy-600 dark:text-navy-300 mt-0.5">
                {isLocked
                  ? 'Normal users cannot add or modify records for this locked date. Super Admin can unlock when necessary.'
                  : isCompleted
                  ? `Marked as completed by ${dailyData.completedBy?.name || 'Manager'}. All required modules have been logged.`
                  : 'Data entry is open. Ensure all sales, expenses, momo purchases, cash drawer and chef requirements are logged.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'MAIN_MANAGER') && !isLocked && (
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                  isCompleted
                    ? 'bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-gray-200 dark:border-navy-700 hover:bg-gray-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                {isCompleted ? 'Reopen Entry' : 'Mark as Completed'}
              </button>
            )}

            {user?.role === 'SUPER_ADMIN' && (
              <button
                onClick={handleToggleLock}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                  isLocked
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isLocked ? 'Unlock Date' : 'Lock Date'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Launch Action Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-navy-900 dark:text-white uppercase tracking-wider">
            Quick Data Entry Launchers
          </h2>
          <span className="text-xs text-navy-400">Directly jump to data entry form</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {user?.role !== 'MANAGER_2' && user?.role !== 'CHEF' && (
            <button
              onClick={() => navigate('/sales')}
              className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm hover:shadow-md hover:border-orange-300 transition text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-xs text-navy-400 font-medium">Daily Revenue</p>
              <p className="text-sm font-black text-navy-900 dark:text-white flex items-center justify-between mt-0.5">
                Sales Entry
                <Plus className="w-4 h-4 text-orange-500 group-hover:translate-x-0.5 transition" />
              </p>
            </button>
          )}

          {user?.role !== 'CHEF' && (
            <>
              <button
                onClick={() => navigate('/expenses')}
                className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm hover:shadow-md hover:border-orange-300 transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-xs text-navy-400 font-medium">Daily Outflow</p>
                <p className="text-sm font-black text-navy-900 dark:text-white flex items-center justify-between mt-0.5">
                  Expense Entry
                  <Plus className="w-4 h-4 text-orange-500 group-hover:translate-x-0.5 transition" />
                </p>
              </button>

              <button
                onClick={() => navigate('/momo-purchases')}
                className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm hover:shadow-md hover:border-orange-300 transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <p className="text-xs text-navy-400 font-medium">Raw Stock</p>
                <p className="text-sm font-black text-navy-900 dark:text-white flex items-center justify-between mt-0.5">
                  Momo Purchase
                  <Plus className="w-4 h-4 text-orange-500 group-hover:translate-x-0.5 transition" />
                </p>
              </button>

              <button
                onClick={() => navigate('/cash')}
                className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm hover:shadow-md hover:border-orange-300 transition text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
                  <Archive className="w-5 h-5" />
                </div>
                <p className="text-xs text-navy-400 font-medium">Drawer Balance</p>
                <p className="text-sm font-black text-navy-900 dark:text-white flex items-center justify-between mt-0.5">
                  Cash Entry
                  <Plus className="w-4 h-4 text-orange-500 group-hover:translate-x-0.5 transition" />
                </p>
              </button>
            </>
          )}

          <button
            onClick={() => navigate('/chef')}
            className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-gray-100 dark:border-navy-800 shadow-sm hover:shadow-md hover:border-orange-300 transition text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
              <CheckSquare className="w-5 h-5" />
            </div>
            <p className="text-xs text-navy-400 font-medium">Kitchen Need</p>
            <p className="text-sm font-black text-navy-900 dark:text-white flex items-center justify-between mt-0.5">
              Chef Requirement
              <Plus className="w-4 h-4 text-orange-500 group-hover:translate-x-0.5 transition" />
            </p>
          </button>
        </div>
      </div>

      {/* Daily Checklist & Counts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Checklist Table */}
        <div className="lg:col-span-2 bg-white dark:bg-navy-900 rounded-2xl p-6 border border-gray-100 dark:border-navy-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Daily Entry Checklist ({selectedDate})
              </h3>
              <p className="text-xs text-navy-400">
                Ensure each operational stream has logged entries for the selected day.
              </p>
            </div>
            <button
              onClick={() => fetchDailyControl(selectedDate)}
              className="p-2 text-navy-400 hover:text-navy-700 dark:hover:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-navy-800 transition"
              title="Refresh Checklist"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-navy-800">
            {dailyData?.checklist?.map((item, idx) => (
              <div
                key={idx}
                className="py-3.5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-navy-800/30 px-3 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      item.status === 'Added'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}
                  >
                    {item.status === 'Added' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy-900 dark:text-white">
                      {item.label}
                    </h4>
                    <p className="text-xs text-navy-400">
                      {item.count > 0 ? `${item.count} record(s) logged today` : 'No records entered yet for this date'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'Added'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                    }`}
                  >
                    {item.status === 'Added' ? `✓ Added (${item.count})` : '⏳ Pending'}
                  </span>

                  <button
                    onClick={() => navigate(item.route)}
                    className="p-2 text-navy-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-navy-800 rounded-lg transition"
                    title={`Open ${item.label}`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Entry Summary Counts Widget */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 border border-gray-100 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white mb-1">
              Today's Entry Counts
            </h3>
            <p className="text-xs text-navy-400 mb-4">
              Snapshot of data entries logged for {selectedDate}.
            </p>

            <div className="space-y-3">
              {dailyData?.summaryCounts?.sales !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-navy-800/60 text-xs">
                  <span className="font-semibold text-navy-700 dark:text-navy-300">Sales Records:</span>
                  <span className="font-bold text-navy-900 dark:text-white text-sm">
                    {dailyData.summaryCounts.sales}
                  </span>
                </div>
              )}

              {dailyData?.summaryCounts?.expenses !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-navy-800/60 text-xs">
                  <span className="font-semibold text-navy-700 dark:text-navy-300">Expense Vouchers:</span>
                  <span className="font-bold text-navy-900 dark:text-white text-sm">
                    {dailyData.summaryCounts.expenses}
                  </span>
                </div>
              )}

              {dailyData?.summaryCounts?.momoPurchases !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-navy-800/60 text-xs">
                  <span className="font-semibold text-navy-700 dark:text-navy-300">Momo Purchases:</span>
                  <span className="font-bold text-navy-900 dark:text-white text-sm">
                    {dailyData.summaryCounts.momoPurchases}
                  </span>
                </div>
              )}

              {dailyData?.summaryCounts?.cashEntries !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-navy-800/60 text-xs">
                  <span className="font-semibold text-navy-700 dark:text-navy-300">Cash Drawer Logs:</span>
                  <span className="font-bold text-navy-900 dark:text-white text-sm">
                    {dailyData.summaryCounts.cashEntries}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-navy-800/60 text-xs">
                <span className="font-semibold text-navy-700 dark:text-navy-300">Chef Requisitions:</span>
                <span className="font-bold text-navy-900 dark:text-white text-sm">
                  {dailyData?.summaryCounts?.chefRequirements || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-navy-800 mt-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-navy-500">Total Entries Logged:</span>
            <span className="text-lg font-black text-orange-600">
              {dailyData?.summaryCounts?.totalEntries || 0}
            </span>
          </div>
        </div>
      </div>

      {/* "My Recent Entries" Stream */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 border border-gray-100 dark:border-navy-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-navy-900 dark:text-white">
              My Recent Operational Entries
            </h3>
            <p className="text-xs text-navy-400">
              Your latest logged transactions across all permitted modules.
            </p>
          </div>
          <button
            onClick={fetchMyRecent}
            className="p-2 text-navy-400 hover:text-navy-700 dark:hover:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-navy-800 transition"
            title="Refresh My Recent Entries"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRecent ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {myRecent.length === 0 ? (
          <div className="text-center py-8 text-navy-400 text-xs">
            No recent operational entries found for your account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-navy-800/60 text-navy-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3 rounded-l-xl">Type & ID</th>
                  <th className="p-3">Summary</th>
                  <th className="p-3">Details / Remarks</th>
                  <th className="p-3">Logged Time</th>
                  <th className="p-3 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                {myRecent.map((item, idx) => {
                  const timeFormatted = item.createdAt
                    ? new Date(item.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A';

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/30 transition">
                      <td className="p-3">
                        <div className="font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.type}</span>
                          {item.isEdited && (
                            <button
                              onClick={() => openHistory(item)}
                              className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold hover:underline cursor-pointer"
                              title="Click to view edit history"
                            >
                              Edited
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-navy-400 font-mono">
                          {item.entryCode}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-navy-800 dark:text-navy-100">
                        {item.summary}
                      </td>
                      <td className="p-3 text-navy-500 dark:text-navy-400">
                        {item.details || '—'}
                      </td>
                      <td className="p-3 text-navy-500 dark:text-navy-400">
                        {timeFormatted}
                      </td>
                      <td className="p-3 text-right">
                        {item.isEdited && (
                          <button
                            onClick={() => openHistory(item)}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-navy-800 rounded-lg transition text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <History className="w-3.5 h-3.5" /> History
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit History Modal */}
      <EditHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        recordTitle={historyTitle}
        editHistory={selectedHistory}
      />
    </div>
  );
};

export default DailyEntryHub;
