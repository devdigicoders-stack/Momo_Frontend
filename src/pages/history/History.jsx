import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import historyService from '../../services/historyService';
import Pagination from '../../components/Pagination';
import RecordDetailsModal from '../../components/RecordDetailsModal';
import {
  History as HistoryIcon,
  Search,
  Calendar,
  Filter,
  IndianRupee,
  ReceiptIndianRupee,
  ShoppingBag,
  Wallet,
  ChefHat,
  Eye,
  RotateCcw,
  Clock,
  FileText,
  User,
} from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';

const History = () => {
  const { user } = useAuth();
  const role = user?.role;

  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingRecord, setViewingRecord] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Filter state
  const [selectedModule, setSelectedModule] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Fetch History
  const fetchHistory = async (currentPage = page) => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        module: selectedModule,
        search: searchTerm,
        datePreset,
        fromDate,
        toDate,
      };

      const res = await historyService.getHistory(params);
      if (res.success) {
        setHistoryItems(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load history records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, [selectedModule, searchTerm, datePreset, fromDate, toDate]);

  const handlePageChange = (newPage) => {
    fetchHistory(newPage);
  };

  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      setFromDate('');
      setToDate('');
    }
  };

  const handleResetFilters = () => {
    setSelectedModule('');
    setSearchTerm('');
    setDatePreset('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const getModuleIcon = (moduleName) => {
    switch (moduleName) {
      case 'Sales':
        return <IndianRupee className="w-4 h-4 text-emerald-600" />;
      case 'Expenses':
        return <ReceiptIndianRupee className="w-4 h-4 text-rose-600" />;
      case 'Momo Purchases':
        return <ShoppingBag className="w-4 h-4 text-[#F97316]" />;
      case 'Cash Management':
        return <Wallet className="w-4 h-4 text-blue-600" />;
      case 'Chef Requirements':
        return <ChefHat className="w-4 h-4 text-amber-600" />;
      default:
        return <HistoryIcon className="w-4 h-4 text-slate-600" />;
    }
  };

  const getModuleBadgeColor = (moduleName) => {
    switch (moduleName) {
      case 'Sales':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Expenses':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Momo Purchases':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Cash Management':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Chef Requirements':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0E5] text-[#F97316] mb-1.5">
            <HistoryIcon className="w-3.5 h-3.5" />
            <span>Activity Log & Audit Trail</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033]">
            Unified Operational History
          </h1>
          <p className="text-xs text-[#6B7280]">
            Browse chronological data-entry logs across sales, expenses, momo batches, cash tallies, and kitchen requisitions.
          </p>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedModule('')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedModule === ''
              ? 'bg-[#172033] text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#E5E7EB]'
          }`}
        >
          All Modules
        </button>

        {role !== 'MANAGER_2' && role !== 'CHEF' && (
          <button
            onClick={() => setSelectedModule('sales')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedModule === 'sales'
                ? 'bg-[#16A34A] text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#E5E7EB]'
            }`}
          >
            <IndianRupee className="w-3.5 h-3.5" />
            Sales
          </button>
        )}

        {role !== 'CHEF' && (
          <>
            <button
              onClick={() => setSelectedModule('expenses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedModule === 'expenses'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#E5E7EB]'
              }`}
            >
              <ReceiptIndianRupee className="w-3.5 h-3.5" />
              Expenses
            </button>

            <button
              onClick={() => setSelectedModule('purchases')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedModule === 'purchases'
                  ? 'bg-[#F97316] text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#E5E7EB]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Momo Purchases
            </button>

            <button
              onClick={() => setSelectedModule('cash')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedModule === 'cash'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#E5E7EB]'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              Cash Tally
            </button>
          </>
        )}

        <button
          onClick={() => setSelectedModule('chef')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            selectedModule === 'chef'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#E5E7EB]'
          }`}
        >
          <ChefHat className="w-3.5 h-3.5" />
          Chef Requisitions
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search records, items, remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] focus:bg-white transition-all"
            />
          </div>

          {(searchTerm || datePreset || fromDate || toDate || selectedModule) && (
            <button
              onClick={handleResetFilters}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Reset All Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
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
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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

      {/* History Records Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF8F1] border-b border-[#E5E7EB] text-[11px] font-extrabold uppercase tracking-wider text-[#172033]">
                <th className="py-3.5 px-4 sm:px-6">Module</th>
                <th className="py-3.5 px-4 sm:px-6">Date</th>
                <th className="py-3.5 px-4 sm:px-6">Record Information</th>
                <th className="py-3.5 px-4 sm:px-6">Amount / Quantity</th>
                <th className="py-3.5 px-4 sm:px-6">Entered By</th>
                <th className="py-3.5 px-4 sm:px-6">Timestamp</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-xs font-medium text-[#374151]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-6">
                    <SkeletonLoader rows={5} />
                  </td>
                </tr>
              ) : historyItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm text-[#172033]">No Operational Records Found</p>
                      <p className="text-xs text-slate-400">Transactions and daily entries will appear in this unified stream.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                historyItems.map((item) => (
                  <tr key={`${item.module}-${item._id}`} className="hover:bg-[#FFF8F1]/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getModuleBadgeColor(
                          item.module
                        )}`}
                      >
                        {getModuleIcon(item.module)}
                        <span className="ml-1.5">{item.module}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#172033] whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-bold text-[#172033]">{item.title}</div>
                      <div className="text-[11px] text-[#6B7280]">{item.subtitle}</div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold whitespace-nowrap">
                      {item.amount !== null ? (
                        <span className={item.type === 'income' ? 'text-[#16A34A]' : item.type === 'expense' ? 'text-rose-600' : 'text-[#172033]'}>
                          ₹{item.amount.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-[#F97316] font-semibold">{item.status}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <div className="font-semibold text-[#172033]">{item.enteredBy?.name || 'Staff'}</div>
                      <div className="text-[10px] text-[#6B7280]">{item.enteredBy?.role || ''}</div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-slate-500 whitespace-nowrap text-[11px]">
                      {new Date(item.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <button
                        onClick={() => setViewingRecord(item.raw)}
                        className="p-1.5 text-slate-500 hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg transition-colors cursor-pointer"
                        title="View Full Record"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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

      {/* Details Modal */}
      <RecordDetailsModal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Historical Transaction Record"
        data={viewingRecord}
      />
    </div>
  );
};

export default History;
