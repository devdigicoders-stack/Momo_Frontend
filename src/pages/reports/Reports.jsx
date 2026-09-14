import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import reportService from '../../services/reportService';
import {
  FileBarChart,
  Calendar,
  IndianRupee,
  ReceiptIndianRupee,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  Printer,
  RotateCcw,
  CheckCircle2,
  PieChart,
  Layers,
  CreditCard,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';

const Reports = () => {
  const { user } = useAuth();
  const role = user?.role;
  const isManager2 = role === 'MANAGER_2';

  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState('today');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = { datePreset };
      if (datePreset === 'custom') {
        if (fromDate) params.fromDate = fromDate;
        if (toDate) params.toDate = toDate;
      }

      const res = await reportService.getSummary(params);
      if (res.success) {
        setReportData(res.data);
      }
    } catch (error) {
      console.error('Fetch reports error:', error);
      toast.error('Failed to load reports summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [datePreset, fromDate, toDate]);

  const handleResetFilters = () => {
    setDatePreset('today');
    setFromDate('');
    setToDate('');
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const rows = [
      ['Momos Bhandar - Operational & Financial Report'],
      ['Generated On', new Date().toLocaleString('en-IN')],
      ['Date Filter', datePreset.toUpperCase()],
      ['From Date', fromDate || 'N/A'],
      ['To Date', toDate || 'N/A'],
      [],
      ['=== KEY METRICS ==='],
      ['Metric', 'Amount / Quantity', 'Count'],
      !isManager2 ? ['Total Sales Collection', `Rs. ${reportData.kpis?.totalSales || 0}`, reportData.kpis?.salesCount || 0] : [],
      ['Total Expenses', `Rs. ${reportData.kpis?.totalExpenses || 0}`, reportData.kpis?.expenseCount || 0],
      ['Total Momo Purchases', `Rs. ${reportData.kpis?.totalMomoPurchasesCost || 0} (${reportData.kpis?.totalMomoPurchasesQty || 0} units)`, reportData.kpis?.momoPurchasesCount || 0],
      !isManager2 ? ['Net Operational Flow', `Rs. ${reportData.kpis?.netFlow || 0}`, ''] : [],
      [],
      ['=== EXPENSE BY CATEGORY ==='],
      ['Category', 'Amount (Rs.)', 'Count', 'Share %'],
      ...(reportData.expenseCategoryBreakdown || []).map((c) => [
        c.category,
        c.totalAmount,
        c.count,
        `${c.percentage}%`,
      ]),
      [],
      ['=== MOMO PURCHASES BY TYPE ==='],
      ['Momo Type', 'Total Units', 'Total Cost (Rs.)', 'Avg Rate (Rs./unit)'],
      ...(reportData.momoTypeBreakdown || []).map((m) => [
        m.momoType,
        m.totalQuantity,
        m.totalAmount,
        m.avgRate,
      ]),
      [],
      ['=== CASH DRAWER TALLY ==='],
      ['Opening Cash', `Rs. ${reportData.cashSummary?.openingCash || 0}`],
      ['Cash Received', `Rs. ${reportData.cashSummary?.cashReceived || 0}`],
      ['Cash Paid Out', `Rs. ${reportData.cashSummary?.cashPaid || 0}`],
      ['Closing Cash', `Rs. ${reportData.cashSummary?.closingCash || 0}`],
    ].filter((row) => row.length > 0);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Momos_Bhandar_Report_${datePreset}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Report exported to CSV successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const kpis = reportData?.kpis || {};
  const expenseCategories = reportData?.expenseCategoryBreakdown || [];
  const momoBreakdown = reportData?.momoTypeBreakdown || [];
  const cashSummary = reportData?.cashSummary || {};
  const salesModes = reportData?.salesPaymentModes || {};
  const expenseModes = reportData?.expensePaymentModes || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#172033] tracking-tight flex items-center gap-2.5">
            <FileBarChart className="w-7 h-7 text-[#F97316]" />
            Reports & Analytics
          </h1>
          <p className="text-xs font-semibold text-[#6B7280] mt-1">
            Consolidated financial summaries, category expenditures, and inventory procurements
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white text-[#172033] border border-[#E5E7EB] hover:bg-[#FFF0E5] hover:border-[#F97316] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-[#F97316]" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={loading || !reportData}
            className="px-4 py-2 bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs rounded-xl shadow-md shadow-[#F97316]/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center text-xs font-bold text-[#172033] mr-2">
              <Calendar className="w-4 h-4 mr-1.5 text-[#F97316]" />
              Period:
            </div>
            {['today', 'yesterday', 'this_week', 'this_month', 'custom'].map((preset) => (
              <button
                key={preset}
                onClick={() => setDatePreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  datePreset === preset
                    ? 'bg-[#172033] text-white shadow-xs'
                    : 'bg-[#FFF8F1] text-[#374151] hover:bg-[#FFF0E5] hover:text-[#F97316]'
                }`}
              >
                {preset === 'today'
                  ? 'Today'
                  : preset === 'yesterday'
                  ? 'Yesterday'
                  : preset === 'this_week'
                  ? 'This Week'
                  : preset === 'this_month'
                  ? 'This Month'
                  : 'Custom Range'}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#F97316] px-2.5 py-1.5 rounded-lg hover:bg-[#FFF0E5] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        </div>

        {/* Custom Date Range Inputs */}
        {datePreset === 'custom' && (
          <div className="pt-3 border-t border-[#E5E7EB] flex flex-wrap items-center gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[#374151]">From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#F97316] outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-[#374151]">To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#F97316] outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonLoader count={4} />
      ) : (
        <>
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sales Collection (Hidden for MANAGER_2) */}
            {!isManager2 && (
              <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                    Total Sales Collection
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-[#172033]">
                    ₹{(kpis.totalSales || 0).toLocaleString('en-IN')}
                  </h3>
                  <div className="mt-1 flex items-center text-xs font-medium text-[#6B7280]">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 mr-2">
                      {kpis.salesCount || 0} Bills
                    </span>
                    <span>Direct Collections</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#16A34A]" />
              </div>
            )}

            {/* Total Expenses */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                  Total Expenses
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#DC2626] flex items-center justify-center">
                  <ReceiptIndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-[#172033]">
                  ₹{(kpis.totalExpenses || 0).toLocaleString('en-IN')}
                </h3>
                <div className="mt-1 flex items-center text-xs font-medium text-[#6B7280]">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 mr-2">
                    {kpis.expenseCount || 0} Entries
                  </span>
                  <span>Operational Costs</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#DC2626]" />
            </div>

            {/* Momo Purchases */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                  Momo Procurement
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-black text-[#172033]">
                  ₹{(kpis.totalMomoPurchasesCost || 0).toLocaleString('en-IN')}
                </h3>
                <div className="mt-1 flex items-center text-xs font-medium text-[#6B7280]">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 mr-2">
                    {kpis.totalMomoPurchasesQty || 0} Units
                  </span>
                  <span>{kpis.momoPurchasesCount || 0} Batches</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F59E0B]" />
            </div>

            {/* Net Balance / Cash Flow (Hidden for MANAGER_2) */}
            {!isManager2 ? (
              <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                    Net Balance (Flow)
                  </span>
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      (kpis.netFlow || 0) >= 0
                        ? 'bg-blue-50 text-[#2563EB]'
                        : 'bg-rose-50 text-[#DC2626]'
                    }`}
                  >
                    {(kpis.netFlow || 0) >= 0 ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5" />
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <h3
                    className={`text-2xl font-black ${
                      (kpis.netFlow || 0) >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                    }`}
                  >
                    ₹{(kpis.netFlow || 0).toLocaleString('en-IN')}
                  </h3>
                  <div className="mt-1 flex items-center text-xs font-medium text-[#6B7280]">
                    <span>Sales – (Exp + Purchase)</span>
                  </div>
                </div>
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 ${
                    (kpis.netFlow || 0) >= 0 ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
                  }`}
                />
              </div>
            ) : (
              /* Cash Drawer Summary Card for MANAGER_2 */
              <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                    Cash Drawer Closing
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="text-2xl font-black text-[#172033]">
                    ₹{(cashSummary.closingCash || 0).toLocaleString('en-IN')}
                  </h3>
                  <div className="mt-1 flex items-center text-xs font-medium text-[#6B7280]">
                    <span>In Drawer Tally</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2563EB]" />
              </div>
            )}
          </div>

          {/* Section 2: Expense Category Breakdown & Momo Purchases Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Expense Categories Breakdown */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#F97316]" />
                  <h2 className="text-sm font-black text-[#172033] tracking-tight">
                    Expenses by Category
                  </h2>
                </div>
                <span className="text-xs font-bold text-[#6B7280]">
                  {expenseCategories.length} Categories
                </span>
              </div>

              <div className="p-4">
                {expenseCategories.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#6B7280]">
                    No expense records found for selected period.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {expenseCategories.map((cat, idx) => (
                      <div key={idx} className="p-3 bg-[#FFF8F1] rounded-xl border border-[#FFF0E5]">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#172033]">{cat.category}</span>
                            <span className="text-[10px] font-semibold text-[#6B7280] bg-white px-2 py-0.5 rounded-full border border-[#E5E7EB]">
                              {cat.count} bills
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-[#172033]">
                              ₹{cat.totalAmount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[11px] font-bold text-[#F97316] ml-2">
                              {cat.percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-[#E5E7EB] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#F97316] h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(5, parseFloat(cat.percentage)))}%` }}
                          />
                        </div>

                        {/* Subcategories preview */}
                        {cat.subcategories && Object.keys(cat.subcategories).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-[#FFF0E5] flex flex-wrap gap-1.5">
                            {Object.entries(cat.subcategories).map(([sub, amount], subIdx) => (
                              <span
                                key={subIdx}
                                className="text-[10px] font-medium bg-white text-[#4B5563] px-2 py-0.5 rounded-md border border-[#E5E7EB]"
                              >
                                {sub}: ₹{amount.toLocaleString('en-IN')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Momo Purchases Breakdown */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#F97316]" />
                  <h2 className="text-sm font-black text-[#172033] tracking-tight">
                    Momo Purchases by Type
                  </h2>
                </div>
                <span className="text-xs font-bold text-[#6B7280]">
                  {momoBreakdown.length} Varieties
                </span>
              </div>

              <div className="p-4">
                {momoBreakdown.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#6B7280]">
                    No momo purchases recorded for selected period.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E5E7EB] text-[#6B7280] font-bold">
                          <th className="pb-2.5">Momo Type</th>
                          <th className="pb-2.5 text-center">Total Units</th>
                          <th className="pb-2.5 text-right">Avg Rate</th>
                          <th className="pb-2.5 text-right">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F3F4F6]">
                        {momoBreakdown.map((m, idx) => (
                          <tr key={idx} className="hover:bg-[#FFF8F1]/50 transition-colors">
                            <td className="py-2.5 font-bold text-[#172033] flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                              {m.momoType}
                            </td>
                            <td className="py-2.5 text-center font-semibold text-[#374151]">
                              <span className="bg-[#FFF0E5] text-[#F97316] font-bold px-2 py-0.5 rounded-md">
                                {m.totalQuantity}
                              </span>
                            </td>
                            <td className="py-2.5 text-right font-medium text-[#6B7280]">
                              ₹{m.avgRate}/unit
                            </td>
                            <td className="py-2.5 text-right font-black text-[#172033]">
                              ₹{m.totalAmount.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Payment Modes & Cash Drawer Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Modes Analysis */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#F97316]" />
                  <h2 className="text-sm font-black text-[#172033] tracking-tight">
                    Payment Mode Distribution
                  </h2>
                </div>
                <span className="text-xs font-bold text-[#6B7280]">Collections & Outflows</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['UPI', 'Cash', 'Card', 'Net Banking'].map((mode) => (
                  <div key={mode} className="bg-[#FFF8F1] p-3 rounded-xl border border-[#FFF0E5]">
                    <span className="text-[11px] font-bold text-[#6B7280] block mb-1">{mode}</span>
                    {!isManager2 && (
                      <div className="text-xs font-black text-[#16A34A]">
                        +₹{(salesModes[mode] || 0).toLocaleString('en-IN')}
                        <span className="text-[10px] font-semibold text-emerald-600 block">Sales In</span>
                      </div>
                    )}
                    <div className="text-xs font-bold text-[#DC2626] mt-1 pt-1 border-t border-[#E5E7EB]">
                      -₹{(expenseModes[mode] || 0).toLocaleString('en-IN')}
                      <span className="text-[10px] font-semibold text-rose-600 block">Expense Out</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash Drawer Flow */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#F97316]" />
                  <h2 className="text-sm font-black text-[#172033] tracking-tight">
                    Daily Cash Drawer Tally
                  </h2>
                </div>
                <span className="text-xs font-bold text-[#6B7280]">
                  {cashSummary.entriesCount || 0} Drawer Shifts
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#F9FAFB] p-3 rounded-xl border border-[#E5E7EB]">
                  <span className="text-[11px] font-bold text-[#6B7280] block">Opening Cash</span>
                  <span className="text-sm font-black text-[#172033] mt-1 block">
                    ₹{(cashSummary.openingCash || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-700 block">Cash Received</span>
                  <span className="text-sm font-black text-[#16A34A] mt-1 block">
                    +₹{(cashSummary.cashReceived || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                  <span className="text-[11px] font-bold text-rose-700 block">Cash Paid Out</span>
                  <span className="text-sm font-black text-[#DC2626] mt-1 block">
                    -₹{(cashSummary.cashPaid || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <span className="text-[11px] font-bold text-blue-700 block">Closing Cash</span>
                  <span className="text-sm font-black text-[#2563EB] mt-1 block">
                    ₹{(cashSummary.closingCash || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
