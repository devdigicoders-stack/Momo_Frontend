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
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import dailyControlService from '../../services/dailyControlService';
import toast from 'react-hot-toast';
import EditHistoryModal from '../../components/EditHistoryModal';
import SkeletonLoader from '../../components/SkeletonLoader';

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
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E5E7EB] shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0E5] text-[#F97316] mb-1.5">
            <Activity className="w-3.5 h-3.5" />
            <span>Operations Hub & Daily Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033]">
            Daily Operational Control
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Track daily entry completion, checklists, and quick operational actions.
          </p>
        </div>

        {/* Date Controls & Status Pill */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-[#FFF8F1] rounded-xl p-1 border border-[#E5E7EB]">
            <button
              onClick={() => handleShiftDate(-1)}
              className="px-2.5 py-1 text-xs font-semibold text-[#374151] hover:bg-white rounded-lg transition cursor-pointer"
            >
              ← Prev
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="bg-transparent text-xs sm:text-sm font-bold text-[#172033] px-2 sm:px-3 py-1 outline-none cursor-pointer"
            />
            <button
              onClick={() => handleShiftDate(1)}
              className="px-2.5 py-1 text-xs font-semibold text-[#374151] hover:bg-white rounded-lg transition cursor-pointer"
            >
              Next →
            </button>
          </div>

          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
              selectedDate === todayStr
                ? 'bg-[#F97316] text-white border-[#F97316] shadow-xs'
                : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#FFF0E5]'
            }`}
          >
            Today
          </button>

          {/* Status Badge */}
          <div
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
              isLocked
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isCompleted
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-rose-600" /> LOCKED
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> COMPLETED
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-blue-600" /> OPEN
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
              ? 'bg-rose-50/70 border-rose-200'
              : isCompleted
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-blue-50/70 border-blue-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl mt-0.5 shadow-xs ${
                isLocked
                  ? 'bg-rose-600 text-white'
                  : isCompleted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {isLocked ? <Lock className="w-5 h-5" /> : isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#172033]">
                {isLocked
                  ? `Entries for ${selectedDate} are Locked`
                  : isCompleted
                  ? `Daily Entries for ${selectedDate} are Completed`
                  : `Daily Data Entry is Active for ${selectedDate}`}
              </h3>
              <p className="text-xs text-[#6B7280] mt-0.5">
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  isCompleted
                    ? 'bg-white text-[#172033] border border-[#E5E7EB] hover:bg-gray-50'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  isLocked
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20'
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
          <h2 className="text-xs font-extrabold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#F97316]" />
            Quick Data Entry Launchers
          </h2>
          <span className="text-xs text-[#6B7280]">Directly jump to data entry form</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {user?.role !== 'MANAGER_2' && user?.role !== 'CHEF' && (
            <button
              onClick={() => navigate('/sales')}
              className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs hover:shadow-md hover:border-[#F97316] transition text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-xs text-[#6B7280] font-medium">Daily Revenue</p>
              <p className="text-sm font-bold text-[#172033] flex items-center justify-between mt-0.5">
                Sales Entry
                <Plus className="w-4 h-4 text-[#F97316] group-hover:translate-x-0.5 transition" />
              </p>
            </button>
          )}

          {user?.role !== 'CHEF' && (
            <>
              <button
                onClick={() => navigate('/expenses')}
                className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs hover:shadow-md hover:border-[#F97316] transition text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
                  <DollarSign className="w-5 h-5" />
                </div>
                <p className="text-xs text-[#6B7280] font-medium">Daily Outflow</p>
                <p className="text-sm font-bold text-[#172033] flex items-center justify-between mt-0.5">
                  Expense Entry
                  <Plus className="w-4 h-4 text-[#F97316] group-hover:translate-x-0.5 transition" />
                </p>
              </button>

              <button
                onClick={() => navigate('/momo-purchases')}
                className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs hover:shadow-md hover:border-[#F97316] transition text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F97316] flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <p className="text-xs text-[#6B7280] font-medium">Raw Stock</p>
                <p className="text-sm font-bold text-[#172033] flex items-center justify-between mt-0.5">
                  Momo Purchase
                  <Plus className="w-4 h-4 text-[#F97316] group-hover:translate-x-0.5 transition" />
                </p>
              </button>

              <button
                onClick={() => navigate('/cash-management')}
                className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs hover:shadow-md hover:border-[#F97316] transition text-left group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
                  <Archive className="w-5 h-5" />
                </div>
                <p className="text-xs text-[#6B7280] font-medium">Drawer Balance</p>
                <p className="text-sm font-bold text-[#172033] flex items-center justify-between mt-0.5">
                  Cash Entry
                  <Plus className="w-4 h-4 text-[#F97316] group-hover:translate-x-0.5 transition" />
                </p>
              </button>
            </>
          )}

          <button
            onClick={() => navigate(user?.role === 'CHEF' ? '/kitchen-requirements' : '/chef-requirements')}
            className="p-4 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs hover:shadow-md hover:border-[#F97316] transition text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition">
              <CheckSquare className="w-5 h-5" />
            </div>
            <p className="text-xs text-[#6B7280] font-medium">Kitchen Need</p>
            <p className="text-sm font-bold text-[#172033] flex items-center justify-between mt-0.5">
              Chef Requirement
              <Plus className="w-4 h-4 text-[#F97316] group-hover:translate-x-0.5 transition" />
            </p>
          </button>
        </div>
      </div>

      {/* Daily Checklist & Counts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module Checklist Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-[#E5E7EB] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#172033]">
                Daily Entry Checklist ({selectedDate})
              </h3>
              <p className="text-xs text-[#6B7280]">
                Ensure each operational stream has logged entries for the selected day.
              </p>
            </div>
            <button
              onClick={() => fetchDailyControl(selectedDate)}
              className="p-2 text-[#6B7280] hover:text-[#172033] rounded-lg hover:bg-[#FFF0E5] transition cursor-pointer"
              title="Refresh Checklist"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="divide-y divide-[#E5E7EB]">
            {dailyData?.checklist?.map((item, idx) => (
              <div
                key={idx}
                className="py-3.5 flex items-center justify-between hover:bg-[#FFF8F1]/40 px-3 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                      item.status === 'Added'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {item.status === 'Added' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#172033]">
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-[#6B7280]">
                      {item.count > 0 ? `${item.count} record(s) logged today` : 'No records entered yet for this date'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      item.status === 'Added'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {item.status === 'Added' ? `✓ Added (${item.count})` : '⏳ Pending'}
                  </span>

                  <button
                    onClick={() => navigate(item.route)}
                    className="p-2 text-[#6B7280] hover:text-[#F97316] hover:bg-[#FFF0E5] rounded-lg transition cursor-pointer"
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
        <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#172033] mb-1">
              Today's Entry Counts
            </h3>
            <p className="text-xs text-[#6B7280] mb-4">
              Snapshot of data entries logged for {selectedDate}.
            </p>

            <div className="space-y-2.5">
              {dailyData?.summaryCounts?.sales !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8F1]/60 border border-[#E5E7EB] text-xs">
                  <span className="font-semibold text-[#374151]">Sales Records:</span>
                  <span className="font-bold text-[#172033] text-sm">
                    {dailyData.summaryCounts.sales}
                  </span>
                </div>
              )}

              {dailyData?.summaryCounts?.expenses !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8F1]/60 border border-[#E5E7EB] text-xs">
                  <span className="font-semibold text-[#374151]">Expense Vouchers:</span>
                  <span className="font-bold text-[#172033] text-sm">
                    {dailyData.summaryCounts.expenses}
                  </span>
                </div>
              )}

              {dailyData?.summaryCounts?.momoPurchases !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8F1]/60 border border-[#E5E7EB] text-xs">
                  <span className="font-semibold text-[#374151]">Momo Purchases:</span>
                  <span className="font-bold text-[#172033] text-sm">
                    {dailyData.summaryCounts.momoPurchases}
                  </span>
                </div>
              )}

              {dailyData?.summaryCounts?.cashEntries !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8F1]/60 border border-[#E5E7EB] text-xs">
                  <span className="font-semibold text-[#374151]">Cash Drawer Logs:</span>
                  <span className="font-bold text-[#172033] text-sm">
                    {dailyData.summaryCounts.cashEntries}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8F1]/60 border border-[#E5E7EB] text-xs">
                <span className="font-semibold text-[#374151]">Chef Requisitions:</span>
                <span className="font-bold text-[#172033] text-sm">
                  {dailyData?.summaryCounts?.chefRequirements || 0}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] mt-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#6B7280]">Total Entries Logged:</span>
            <span className="text-xl font-black text-[#F97316]">
              {dailyData?.summaryCounts?.totalEntries || 0}
            </span>
          </div>
        </div>
      </div>

      {/* "My Recent Entries" Stream */}
      <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-[#E5E7EB] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#172033]">
              My Recent Operational Entries
            </h3>
            <p className="text-xs text-[#6B7280]">
              Your latest logged transactions across all permitted modules.
            </p>
          </div>
          <button
            onClick={fetchMyRecent}
            className="p-2 text-[#6B7280] hover:text-[#172033] rounded-lg hover:bg-[#FFF0E5] transition cursor-pointer"
            title="Refresh My Recent Entries"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRecent ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {myRecent.length === 0 ? (
          <div className="text-center py-8 text-[#6B7280] text-xs">
            No recent operational entries found for your account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFF8F1] text-[#172033] font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="p-3">Type & ID</th>
                  <th className="p-3">Summary</th>
                  <th className="p-3">Details / Remarks</th>
                  <th className="p-3">Logged Time</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {myRecent.map((item, idx) => {
                  const timeFormatted = item.createdAt
                    ? new Date(item.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A';

                  return (
                    <tr key={idx} className="hover:bg-[#FFF8F1]/40 transition">
                      <td className="p-3">
                        <div className="font-bold text-[#172033] flex items-center gap-1.5">
                          <span>{item.type}</span>
                          {item.isEdited && (
                            <button
                              onClick={() => openHistory(item)}
                              className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold hover:underline cursor-pointer"
                              title="Click to view edit history"
                            >
                              Edited
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-[#6B7280] font-mono">
                          {item.entryCode}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-[#172033]">
                        {item.summary}
                      </td>
                      <td className="p-3 text-[#6B7280]">
                        {item.details || '—'}
                      </td>
                      <td className="p-3 text-[#6B7280]">
                        {timeFormatted}
                      </td>
                      <td className="p-3 text-right">
                        {item.isEdited && (
                          <button
                            onClick={() => openHistory(item)}
                            className="p-1.5 text-[#F97316] hover:bg-[#FFF0E5] rounded-lg transition text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
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
