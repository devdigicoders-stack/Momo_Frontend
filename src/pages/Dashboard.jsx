import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService';
import {
  IndianRupee,
  ReceiptIndianRupee,
  ShoppingBag,
  Wallet,
  ChefHat,
  UserCheck,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  CreditCard,
  RotateCcw,
  AlertCircle,
  Clock,
  PlusCircle,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  Hourglass,
  Users,
} from 'lucide-react';
import { SkeletonCard } from '../components/SkeletonLoader';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const isManager2 = role === 'MANAGER_2';
  const isChef = role === 'CHEF';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datePreset, setDatePreset] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [summaryData, setSummaryData] = useState(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (datePreset === 'custom' && customDate) {
        params.date = customDate;
      } else {
        params.datePreset = datePreset;
      }

      const res = await dashboardService.getSummary(params);
      if (res.success) {
        setSummaryData(res.data);
      } else {
        setError('Unable to load dashboard summary.');
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [datePreset, customDate]);

  const getRoleLabel = (r) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'MAIN_MANAGER':
        return 'Main Manager';
      case 'MANAGER_2':
        return 'Manager 2';
      case 'CHEF':
        return 'Chef';
      default:
        return r;
    }
  };

  const sales = summaryData?.sales ?? 0;
  const salesCount = summaryData?.salesCount ?? 0;
  const salesPaymentModes = summaryData?.salesPaymentModes || {};
  const expenses = summaryData?.expenses ?? 0;
  const expenseCount = summaryData?.expenseCount ?? 0;
  const expenseCategories = summaryData?.expenseCategories || [];
  const momoPurchase = summaryData?.momoPurchase ?? 0;
  const momoPurchaseQty = summaryData?.momoPurchaseQty ?? 0;
  const momoPurchasesCount = summaryData?.momoPurchasesCount ?? 0;
  const cash = summaryData?.cash || {
    opening: 0,
    received: 0,
    paid: 0,
    closing: 0,
    cashCollection: 0,
    additionalCash: 0,
    cashExpenses: 0,
    cashDeposit: 0,
    netCashChange: 0,
    availableCash: 0,
    count: 0,
  };
  const chefReqs = summaryData?.chefRequirements || {
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    myRequests: 0,
  };
  const employees = summaryData?.employees || { total: 0, active: 0, inactive: 0 };
  const basicOperatingDifference = summaryData?.basicOperatingDifference ?? 0;

  return (
    <div className="space-y-6">
      {/* 1. Welcome Banner */}
      <div className="bg-gradient-to-r from-[#172033] via-[#1e293b] to-[#172033] rounded-2xl p-6 sm:p-7 text-white shadow-md border border-[#232F48] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#232F48] text-[#F97316] border border-[#334155]/60">
            <Sparkles className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Momos Bhandar • Business Control Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Welcome, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            Signed in as <span className="font-bold text-[#F97316]">{getRoleLabel(role)}</span> (
            {user?.email || user?.mobile}). Live business data summary.
          </p>
        </div>

        <div className="hidden md:flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/15">
          <div className="w-12 h-12 rounded-full bg-white p-0.5 shadow-md shadow-black/20 shrink-0">
            <img 
              src="/logo.png" 
              alt="Momos Bhandar" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">Momos Bhandar</p>
            <p className="text-[11px] text-[#F97316] font-semibold">Good Food • Better Business</p>
          </div>
        </div>
      </div>

      {/* 2. Quick Action Shortcuts */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex flex-wrap gap-2.5 items-center">
        <span className="text-xs font-bold text-[#172033] uppercase tracking-wider mr-2 flex items-center gap-1.5">
          <PlusCircle className="w-4 h-4 text-[#F97316]" />
          Quick Entry:
        </span>
        {!isManager2 && !isChef && (
          <button
            onClick={() => navigate('/sales')}
            className="px-3.5 py-2 rounded-xl bg-[#FFF0E5] hover:bg-[#F97316] text-[#F97316] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <IndianRupee className="w-3.5 h-3.5" />
            + Sales Entry
          </button>
        )}
        {!isChef && (
          <>
            <button
              onClick={() => navigate('/expenses')}
              className="px-3.5 py-2 rounded-xl bg-[#FFF0E5] hover:bg-[#F97316] text-[#F97316] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <ReceiptIndianRupee className="w-3.5 h-3.5" />
              + Expense Entry
            </button>
            <button
              onClick={() => navigate('/momo-purchases')}
              className="px-3.5 py-2 rounded-xl bg-[#FFF0E5] hover:bg-[#F97316] text-[#F97316] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              + Momo Purchase
            </button>
            <button
              onClick={() => navigate('/cash')}
              className="px-3.5 py-2 rounded-xl bg-[#FFF0E5] hover:bg-[#F97316] text-[#F97316] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Wallet className="w-3.5 h-3.5" />
              + Cash Tally
            </button>
          </>
        )}
        <button
          onClick={() => navigate(isChef ? '/kitchen-requirements' : '/chef-requirements')}
          className="px-3.5 py-2 rounded-xl bg-[#FFF0E5] hover:bg-[#F97316] text-[#F97316] hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
        >
          <ChefHat className="w-3.5 h-3.5" />
          + Chef Request
        </button>
      </div>

      {/* 3. Date Selector Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center text-xs font-bold text-[#172033] mr-2">
              <Calendar className="w-4 h-4 mr-1.5 text-[#F97316]" />
              Summary Date:
            </div>
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'custom', label: 'Custom Date' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  datePreset === p.id
                    ? 'bg-[#172033] text-white shadow-xs'
                    : 'bg-[#FFF8F1] text-[#374151] hover:bg-[#FFF0E5] hover:text-[#F97316]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setDatePreset('today');
              setCustomDate('');
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#F97316] px-2.5 py-1.5 rounded-lg hover:bg-[#FFF0E5] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Today
          </button>
        </div>

        {datePreset === 'custom' && (
          <div className="pt-3 border-t border-[#E5E7EB] flex items-center gap-3 animate-fadeIn">
            <label className="text-xs font-bold text-[#374151]">Select Date:</label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="px-3.5 py-1.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden"
            />
          </div>
        )}
      </div>

      {/* 4. Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-red-700 text-xs font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchSummary}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5. Main Content / Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* CHEF VIEW */}
          {isChef ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                      My Requests
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
                      <ChefHat className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-black text-[#172033]">{chefReqs.myRequests}</h3>
                    <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">
                      Items requested by you
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                      Pending Approvals
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center">
                      <Hourglass className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-black text-[#F59E0B]">{chefReqs.pending}</h3>
                    <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">
                      Waiting for manager action
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                      Approved Requests
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-black text-[#2563EB]">{chefReqs.approved}</h3>
                    <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">Approved by store</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                      Purchased / Completed
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-black text-[#16A34A]">{chefReqs.completed}</h3>
                    <p className="text-[11px] font-medium text-[#6B7280] mt-0.5">
                      Procured & delivered
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Need Kitchen Supplies?</h3>
                  <p className="text-xs text-[#6B7280]">
                    Create instant requisition slips for spices, vegetables, packaging, or gas cylinders.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/kitchen-requirements')}
                  className="px-4 py-2 bg-[#F97316] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#ea580c] transition-all"
                >
                  Create Requisition
                </button>
              </div>
            </div>
          ) : (
            /* MANAGERS & SUPER ADMIN VIEW */
            <div className="space-y-6">
              {/* Primary Summary Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* 1. Sales Summary (Hidden for MANAGER_2) */}
                {!isManager2 && (
                  <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                        {datePreset === 'today' ? "Today's Sales" : 'Entered Sales'}
                      </span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                        <IndianRupee className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <h3 className="text-2xl font-black text-[#172033]">
                        ₹{sales.toLocaleString('en-IN')}
                      </h3>
                      <div className="mt-1 flex items-center text-[11px] font-medium text-[#6B7280]">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 mr-2">
                          {salesCount} Entries
                        </span>
                        <span>Based on entered sales</span>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#16A34A]" />
                  </div>
                )}

                {/* 2. Expense Summary */}
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                      {datePreset === 'today' ? "Today's Expenses" : 'Entered Expenses'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#DC2626] flex items-center justify-center">
                      <ReceiptIndianRupee className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-black text-[#172033]">
                      ₹{expenses.toLocaleString('en-IN')}
                    </h3>
                    <div className="mt-1 flex items-center text-[11px] font-medium text-[#6B7280]">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-rose-100 text-rose-800 mr-2">
                        {expenseCount} Vouchers
                      </span>
                      <span>Total recorded costs</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#DC2626]" />
                </div>

                {/* 3. Momo Purchase Summary */}
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                      {datePreset === 'today' ? "Today's Momo Purchase" : 'Momo Purchases'}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-black text-[#172033]">
                      ₹{momoPurchase.toLocaleString('en-IN')}
                    </h3>
                    <div className="mt-1 flex items-center text-[11px] font-medium text-[#6B7280]">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-800 mr-2">
                        {momoPurchaseQty} Units
                      </span>
                      <span>{momoPurchasesCount} Batches</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F59E0B]" />
                </div>

                {/* 4. Cash Entry Summary */}
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                      Available Cash
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-black text-[#172033]">
                      ₹{(cash.availableCash !== undefined ? cash.availableCash : (cash.closing || 0)).toLocaleString('en-IN')}
                    </h3>
                    <div className="mt-1 flex items-center text-[11px] font-medium text-[#6B7280]">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 mr-2">
                        +₹{((cash.cashCollection || 0) + (cash.additionalCash || 0)).toLocaleString('en-IN')}
                      </span>
                      <span>-₹{((cash.cashExpenses || 0) + (cash.cashDeposit || 0)).toLocaleString('en-IN')} Outflow</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2563EB]" />
                </div>

                {/* 5. Chef Requirements Count */}
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                      Chef Requirements
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <ChefHat className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-black text-[#172033]">{chefReqs.total}</h3>
                    <div className="mt-1 flex items-center text-[11px] font-medium text-[#6B7280]">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-purple-100 text-purple-800 mr-2">
                        {chefReqs.pending} Pending
                      </span>
                      <span>{chefReqs.approved} Approved</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
                </div>

                {/* 6. Active Employees */}
                <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                      Active Employees
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-black text-[#172033]">{employees.active}</h3>
                    <div className="mt-1 flex items-center text-[11px] font-medium text-[#6B7280]">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-indigo-100 text-indigo-800 mr-2">
                        {employees.total} Total
                      </span>
                      <span>Staff Enrolled</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
                </div>

                {/* 7. Basic Operating Difference (Hidden for MANAGER_2) */}
                {!isManager2 && (
                  <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                        Basic Operating Difference
                      </span>
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          basicOperatingDifference >= 0
                            ? 'bg-emerald-50 text-[#16A34A]'
                            : 'bg-rose-50 text-[#DC2626]'
                        }`}
                      >
                        {basicOperatingDifference >= 0 ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <h3
                        className={`text-2xl font-black ${
                          basicOperatingDifference >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        ₹{basicOperatingDifference.toLocaleString('en-IN')}
                      </h3>
                      <div className="mt-1 text-[11px] font-medium text-[#6B7280]">
                        <span>Sales (₹{sales}) – Expenses (₹{expenses}) – Momo Purchase (₹{momoPurchase})</span>
                      </div>
                    </div>
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-1 ${
                        basicOperatingDifference >= 0 ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Simple Breakdown Lists / Data Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales Payment Mode Breakdown (Hidden for MANAGER_2) */}
                {!isManager2 && (
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-[#F97316]" />
                        <h2 className="text-sm font-black text-[#172033]">
                          Payment Mode Summary (Sales)
                        </h2>
                      </div>
                      <span className="text-xs font-bold text-[#6B7280]">
                        ₹{sales.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['UPI', 'Cash', 'Card', 'Net Banking'].map((mode) => (
                        <div key={mode} className="bg-[#FFF8F1] p-3 rounded-xl border border-[#FFF0E5]">
                          <span className="text-[11px] font-bold text-[#6B7280] block mb-1">{mode}</span>
                          <span className="text-sm font-black text-[#172033] block">
                            ₹{(salesPaymentModes[mode] || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expense Category Summary */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#F97316]" />
                      <h2 className="text-sm font-black text-[#172033]">Expense Category Summary</h2>
                    </div>
                    <span className="text-xs font-bold text-[#6B7280]">
                      {expenseCategories.length} Heads
                    </span>
                  </div>

                  {expenseCategories.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#6B7280]">
                      No expenses recorded for selected date.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-48 overflow-y-auto">
                      {expenseCategories.map((c, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]"
                        >
                          <span className="text-xs font-bold text-[#172033]">{c.category}</span>
                          <div className="text-right">
                            <span className="text-xs font-black text-[#172033]">
                              ₹{c.totalAmount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-[#6B7280] block">({c.count} bills)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cash Drawer Flow Summary */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-[#F97316]" />
                      <h2 className="text-sm font-black text-[#172033]">Cash Drawer Movement</h2>
                    </div>
                    <span className="text-xs font-bold text-[#6B7280]">
                      {cash.count || 0} Logs
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#F9FAFB] p-2.5 rounded-xl border border-[#E5E7EB]">
                      <span className="text-[10px] font-bold text-[#6B7280] block">
                        {cash.opening !== undefined ? 'Opening' : 'Cash Sales'}
                      </span>
                      <span className="text-xs font-black text-[#172033] block mt-0.5">
                        ₹{(cash.opening ?? cash.cashCollection ?? 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-700 block">
                        {cash.received !== undefined ? 'Received' : 'Additional Inflow'}
                      </span>
                      <span className="text-xs font-black text-[#16A34A] block mt-0.5">
                        +₹{(cash.received ?? cash.additionalCash ?? 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                      <span className="text-[10px] font-bold text-rose-700 block">
                        {cash.paid !== undefined ? 'Paid Out' : 'Cash Expenses'}
                      </span>
                      <span className="text-xs font-black text-[#DC2626] block mt-0.5">
                        -₹{(cash.paid ?? cash.cashExpenses ?? 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-bold text-blue-700 block">
                        {cash.closing !== undefined ? 'Closing' : 'Bank Deposits'}
                      </span>
                      <span className="text-xs font-black text-[#2563EB] block mt-0.5">
                        {cash.closing !== undefined
                          ? `₹${cash.closing.toLocaleString('en-IN')}`
                          : `-₹${(cash.cashDeposit ?? 0).toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chef Requirements Status Counts */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-5 h-5 text-[#F97316]" />
                      <h2 className="text-sm font-black text-[#172033]">
                        Chef Requirements Status
                      </h2>
                    </div>
                    <span className="text-xs font-bold text-[#6B7280]">
                      {chefReqs.total} Total
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                      <span className="text-[10px] font-bold text-amber-700 block">Pending</span>
                      <span className="text-sm font-black text-amber-900 block mt-0.5">
                        {chefReqs.pending}
                      </span>
                    </div>
                    <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-bold text-blue-700 block">Approved</span>
                      <span className="text-sm font-black text-blue-900 block mt-0.5">
                        {chefReqs.approved}
                      </span>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-700 block">Purchased</span>
                      <span className="text-sm font-black text-emerald-900 block mt-0.5">
                        {chefReqs.completed}
                      </span>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                      <span className="text-[10px] font-bold text-rose-700 block">Rejected</span>
                      <span className="text-sm font-black text-rose-900 block mt-0.5">
                        {chefReqs.rejected}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
