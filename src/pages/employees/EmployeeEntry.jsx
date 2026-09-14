import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import employeeService from '../../services/employeeService';
import Pagination from '../../components/Pagination';
import EditHistoryModal from '../../components/EditHistoryModal';
import DuplicateWarningModal from '../../components/DuplicateWarningModal';
import exportToCsv from '../../utils/exportToCsv';
import {
  UserCheck,
  Plus,
  Search,
  Calendar,
  Edit2,
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
  UserX,
  CreditCard,
  DollarSign,
  TrendingDown,
  Building2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Users,
} from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';

const DESIGNATIONS = ['Manager', 'Chef', 'Helper', 'Cashier', 'Waiter', 'Delivery', 'Other'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];

const EmployeeEntry = () => {
  const { user } = useAuth();

  // Active Workspace Tab: 'DIRECTORY' | 'ATTENDANCE' | 'ADVANCES' | 'SALARY_SHEET' | 'SALARY_LEDGER'
  const [activeTab, setActiveTab] = useState('DIRECTORY');

  // Month selector (default current YYYY-MM)
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // Selected date for Daily Attendance
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [attendanceDate, setAttendanceDate] = useState(todayDateStr);

  // Operational Dashboard Counts
  const [summaryCounts, setSummaryCounts] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // 1. Employee Directory State
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [empSearch, setEmpSearch] = useState('');
  const [empStatusFilter, setEmpStatusFilter] = useState('ALL');
  const [empDesigFilter, setEmpDesigFilter] = useState('ALL');
  const [empPage, setEmpPage] = useState(1);
  const [empLimit, setEmpLimit] = useState(15);
  const [empTotalPages, setEmpTotalPages] = useState(1);
  const [empTotal, setEmpTotal] = useState(0);

  // 2. Attendance & Absent State
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [allActiveEmps, setAllActiveEmps] = useState([]);

  // 3. Salary Advances State
  const [advances, setAdvances] = useState([]);
  const [loadingAdvances, setLoadingAdvances] = useState(false);
  const [advPage, setAdvPage] = useState(1);
  const [advLimit, setAdvLimit] = useState(15);
  const [advTotalPages, setAdvTotalPages] = useState(1);
  const [advTotal, setAdvTotal] = useState(0);
  const [advEmpFilter, setAdvEmpFilter] = useState('');

  // 4. Monthly Salary Sheet State
  const [salarySheetData, setSalarySheetData] = useState(null);
  const [loadingSalarySheet, setLoadingSalarySheet] = useState(false);

  // 5. Salary Payments Ledger State
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [payPage, setPayPage] = useState(1);
  const [payLimit, setPayLimit] = useState(15);
  const [payTotalPages, setPayTotalPages] = useState(1);
  const [payTotal, setPayTotal] = useState(0);

  // Modals State
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [empForm, setEmpForm] = useState({
    name: '',
    mobile: '',
    designation: 'Helper',
    joiningDate: todayDateStr,
    salary: '',
    status: 'Active',
    remarks: '',
  });

  const [absentModalOpen, setAbsentModalOpen] = useState(false);
  const [selectedEmpForAbsent, setSelectedEmpForAbsent] = useState(null);
  const [absentForm, setAbsentForm] = useState({
    date: todayDateStr,
    remarks: 'Personal Leave',
  });

  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    employeeId: '',
    amount: '',
    date: todayDateStr,
    remarks: 'Personal requirement',
  });

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedSalaryRow, setSelectedSalaryRow] = useState(null);
  const [payForm, setPayForm] = useState({
    paidAmount: '',
    absentDeduction: '',
    advanceDeduction: '',
    paymentDate: todayDateStr,
    paymentMode: 'Cash',
    remarks: '',
  });

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [fullProfileData, setFullProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [historyTitle, setHistoryTitle] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // ---------------------------------------------------------------------------
  // Data Fetchers
  // ---------------------------------------------------------------------------
  const fetchSummaryCounts = async () => {
    try {
      setLoadingSummary(true);
      const res = await employeeService.getEmployeeSummaryCounts(selectedMonth);
      if (res.success) {
        setSummaryCounts(res.data);
      }
    } catch (error) {
      console.error('Fetch summary counts error:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await employeeService.getAllEmployees({
        page: empPage,
        limit: empLimit,
        status: empStatusFilter,
        designation: empDesigFilter,
        search: empSearch,
      });
      if (res.success) {
        setEmployees(res.data || []);
        setEmpTotalPages(res.pagination?.pages || 1);
        setEmpTotal(res.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Fetch employees error:', error);
      toast.error('Failed to load employee directory');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchActiveEmps = async () => {
    try {
      const res = await employeeService.getAllEmployees({ all: true, status: 'Active' });
      if (res.success) {
        setAllActiveEmps(res.data || []);
      }
    } catch (error) {
      console.error('Fetch active emps error:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoadingAttendance(true);
      const res = await employeeService.getAttendanceRecords({
        date: attendanceDate,
      });
      if (res.success) {
        setAttendanceRecords(res.data || []);
      }
    } catch (error) {
      console.error('Fetch attendance error:', error);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchAdvances = async () => {
    try {
      setLoadingAdvances(true);
      const res = await employeeService.getSalaryAdvances({
        page: advPage,
        limit: advLimit,
        employeeId: advEmpFilter || undefined,
        month: selectedMonth,
      });
      if (res.success) {
        setAdvances(res.data || []);
        setAdvTotalPages(res.pagination?.pages || 1);
        setAdvTotal(res.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Fetch advances error:', error);
    } finally {
      setLoadingAdvances(false);
    }
  };

  const fetchSalarySheet = async () => {
    try {
      setLoadingSalarySheet(true);
      const res = await employeeService.getMonthlySalarySummary(selectedMonth);
      if (res.success) {
        setSalarySheetData(res.data);
      }
    } catch (error) {
      console.error('Fetch salary sheet error:', error);
      toast.error('Failed to load monthly salary sheet');
    } finally {
      setLoadingSalarySheet(false);
    }
  };

  const fetchPaymentsLedger = async () => {
    try {
      setLoadingPayments(true);
      const res = await employeeService.getSalaryPayments({
        page: payPage,
        limit: payLimit,
        salaryMonth: selectedMonth,
      });
      if (res.success) {
        setPayments(res.data || []);
        setPayTotalPages(res.pagination?.pages || 1);
        setPayTotal(res.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Fetch payments error:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchSummaryCounts();
    fetchActiveEmps();
  }, [selectedMonth]);

  useEffect(() => {
    if (activeTab === 'DIRECTORY') fetchEmployees();
    if (activeTab === 'ATTENDANCE') fetchAttendance();
    if (activeTab === 'ADVANCES') fetchAdvances();
    if (activeTab === 'SALARY_SHEET') fetchSalarySheet();
    if (activeTab === 'SALARY_LEDGER') fetchPaymentsLedger();
  }, [
    activeTab,
    empPage,
    empLimit,
    empStatusFilter,
    empDesigFilter,
    attendanceDate,
    selectedMonth,
    advPage,
    advLimit,
    advEmpFilter,
    payPage,
    payLimit,
  ]);

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  // 1. Employee Form Save
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingEmp) {
        const res = await employeeService.updateEmployee(editingEmp._id, empForm);
        if (res.success) {
          toast.success(`${empForm.name} updated successfully!`);
          setEmpModalOpen(false);
          fetchEmployees();
          fetchActiveEmps();
        }
      } else {
        const res = await employeeService.createEmployee(empForm);
        if (res.success) {
          toast.success(`Employee ${empForm.name} added!`);
          setEmpModalOpen(false);
          fetchEmployees();
          fetchActiveEmps();
          fetchSummaryCounts();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Employee Status
  const handleToggleStatus = async (emp) => {
    try {
      const res = await employeeService.toggleEmployeeStatus(emp._id);
      if (res.success) {
        toast.success(`${emp.name} is now ${res.data.status}`);
        fetchEmployees();
        fetchActiveEmps();
        fetchSummaryCounts();
      }
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  // 2. Mark Absent Submit
  const handleMarkAbsentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmpForAbsent) return;
    try {
      setSubmitting(true);
      const res = await employeeService.markAbsent({
        employeeId: selectedEmpForAbsent._id,
        date: absentForm.date,
        remarks: absentForm.remarks,
      });
      if (res.success) {
        toast.success(res.message);
        setAbsentModalOpen(false);
        fetchAttendance();
        if (activeTab === 'SALARY_SHEET') fetchSalarySheet();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark absent');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove Absent
  const handleRemoveAbsent = async (attendanceId) => {
    try {
      const res = await employeeService.removeAbsent(attendanceId);
      if (res.success) {
        toast.success('Absent mark removed');
        fetchAttendance();
        if (activeTab === 'SALARY_SHEET') fetchSalarySheet();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove absent mark');
    }
  };

  // 3. Save Advance Submit
  const handleSaveAdvance = async (stayOnForm = false) => {
    if (!advanceForm.employeeId) {
      toast.error('Please select an employee');
      return;
    }
    if (!advanceForm.amount || Number(advanceForm.amount) <= 0) {
      toast.error('Please enter a valid positive advance amount');
      return;
    }

    try {
      setSubmitting(true);
      const res = await employeeService.createSalaryAdvance({
        employeeId: advanceForm.employeeId,
        amount: Number(advanceForm.amount),
        date: advanceForm.date,
        remarks: advanceForm.remarks,
      });
      if (res.success) {
        toast.success(res.message);
        fetchAdvances();
        fetchSummaryCounts();
        if (stayOnForm) {
          setAdvanceForm((prev) => ({ ...prev, amount: '', remarks: '' }));
        } else {
          setAdvanceModalOpen(false);
          setAdvanceForm({
            employeeId: '',
            amount: '',
            date: todayDateStr,
            remarks: 'Personal requirement',
          });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record salary advance');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Pay Salary Open Modal
  const openPaySalaryModal = (row) => {
    setSelectedSalaryRow(row);
    setPayForm({
      paidAmount: row.finalPayable,
      absentDeduction: row.absentDeduction,
      advanceDeduction: row.advanceDeduction,
      paymentDate: todayDateStr,
      paymentMode: 'Cash',
      remarks: `Salary payment for ${row.salaryMonth}`,
    });
    setPayModalOpen(true);
  };

  // Pay Salary Submit
  const handlePaySalarySubmit = async (e) => {
    e.preventDefault();
    if (!selectedSalaryRow) return;

    try {
      setSubmitting(true);
      const res = await employeeService.paySalary({
        employeeId: selectedSalaryRow.employee._id,
        salaryMonth: selectedSalaryRow.salaryMonth,
        monthlySalary: selectedSalaryRow.monthlySalary,
        absentDays: selectedSalaryRow.absentDays,
        absentDeduction: Number(payForm.absentDeduction) || 0,
        advanceDeduction: Number(payForm.advanceDeduction) || 0,
        paidAmount: Number(payForm.paidAmount) || 0,
        paymentDate: payForm.paymentDate,
        paymentMode: payForm.paymentMode,
        remarks: payForm.remarks,
      });

      if (res.success) {
        toast.success(res.message);
        setPayModalOpen(false);
        fetchSalarySheet();
        fetchSummaryCounts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record salary payment');
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Open Full Profile Modal
  const openFullProfile = async (empId) => {
    try {
      setProfileLoading(true);
      setProfileModalOpen(true);
      const res = await employeeService.getEmployeeFullProfile(empId);
      if (res.success) {
        setFullProfileData(res.data);
      }
    } catch (error) {
      toast.error('Failed to load employee profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Export Directory to CSV
  const handleExportDirectory = () => {
    if (employees.length === 0) return toast.error('No employee records to export');
    const headers = ['Name', 'Mobile', 'Designation', 'Joining Date', 'Monthly Salary (Rs.)', 'Status', 'Remarks'];
    const rows = employees.map((e) => [
      e.name,
      e.mobile,
      e.designation,
      e.joiningDate ? new Date(e.joiningDate).toLocaleDateString('en-IN') : 'N/A',
      e.salary,
      e.status,
      e.remarks || '',
    ]);
    exportToCsv('Employee_Master_Directory', headers, rows);
    toast.success('Employee directory exported!');
  };

  // Export Salary Sheet to CSV
  const handleExportSalarySheet = () => {
    if (!salarySheetData?.salarySheet?.length) return toast.error('No salary records to export');
    const headers = [
      'Employee Name',
      'Mobile',
      'Designation',
      'Month',
      'Base Salary (Rs.)',
      'Absent Days',
      'Absent Deduction (Rs.)',
      'Advance Deducted (Rs.)',
      'Net Payable (Rs.)',
      'Payment Status',
    ];
    const rows = salarySheetData.salarySheet.map((r) => [
      r.employee.name,
      r.employee.mobile,
      r.employee.designation,
      r.salaryMonth,
      r.monthlySalary,
      r.absentDays,
      r.absentDeduction,
      r.advanceDeduction,
      r.finalPayable,
      r.status,
    ]);
    exportToCsv(`Salary_Sheet_${selectedMonth}`, headers, rows);
    toast.success(`Salary sheet for ${selectedMonth} exported!`);
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
          The Employee & Payroll management module is reserved for management roles. Please use the Kitchen Requisitions tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 1. HERO OPERATIONAL SUMMARY BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Active Staff */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-gray-100 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy-400">Active Staff</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <h3 className="text-2xl font-black text-navy-900 dark:text-white">
              {summaryCounts?.activeEmployees ?? allActiveEmps.length}
            </h3>
            <p className="text-[10px] text-navy-400 mt-0.5">Enrolled regular staff</p>
          </div>
          <div className="text-[10px] text-navy-500 border-t border-gray-100 dark:border-navy-800 pt-2">
            Total Staff: {summaryCounts?.totalEmployees ?? employees.length}
          </div>
        </div>

        {/* Advances This Month */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-gray-100 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Advances ({selectedMonth})
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <h3 className="text-2xl font-black text-amber-600">
              ₹{(summaryCounts?.totalAdvances || 0).toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-navy-400 mt-0.5">Disbursed salary advance</p>
          </div>
          <div className="text-[10px] text-amber-600 font-semibold border-t border-gray-100 dark:border-navy-800 pt-2">
            Deductible at payout
          </div>
        </div>

        {/* Pending Salaries */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-gray-100 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
              Pending Payouts
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <h3 className="text-2xl font-black text-orange-600">
              {summaryCounts?.pendingSalaries ?? 0}
            </h3>
            <p className="text-[10px] text-navy-400 mt-0.5">Staff awaiting payout for {selectedMonth}</p>
          </div>
          <div className="text-[10px] text-orange-600 font-semibold border-t border-gray-100 dark:border-navy-800 pt-2">
            Requires disbursement
          </div>
        </div>

        {/* Paid Salaries */}
        <div className="bg-white dark:bg-navy-900 rounded-2xl p-5 border border-gray-100 dark:border-navy-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Paid Payouts
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <h3 className="text-2xl font-black text-emerald-600">
              {summaryCounts?.paidSalariesCount ?? 0}
            </h3>
            <p className="text-[10px] text-navy-400 mt-0.5">Completed salary vouchers</p>
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold border-t border-gray-100 dark:border-navy-800 pt-2">
            Disbursed & logged
          </div>
        </div>
      </div>

      {/* 2. TOP WORKSPACE NAVIGATION & MONTH SWITCHER */}
      <div className="bg-white dark:bg-navy-900 rounded-2xl p-4 border border-gray-100 dark:border-navy-800 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Workspace Tab Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: 'DIRECTORY', label: '👥 Staff Directory', count: empTotal },
            { id: 'ATTENDANCE', label: '📅 Daily Attendance & Absents' },
            { id: 'ADVANCES', label: '💸 Salary Advances', count: advTotal },
            { id: 'SALARY_SHEET', label: '💼 Monthly Salary Sheet' },
            { id: 'SALARY_LEDGER', label: '📜 Payment Ledger', count: payTotal },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-navy-900 dark:bg-white text-white dark:text-navy-900 shadow-sm'
                  : 'bg-gray-50 dark:bg-navy-800 text-navy-600 dark:text-navy-300 hover:bg-gray-100'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 dark:bg-navy-700 text-navy-700 dark:text-navy-200'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Global Month Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-bold text-navy-700 dark:text-navy-300">Salary Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* 3. TAB 1: EMPLOYEE MASTER DIRECTORY */}
      {activeTab === 'DIRECTORY' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-navy-800 shadow-sm p-6 space-y-4">
          {/* Header & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">Staff & Employee Master</h3>
              <p className="text-xs text-navy-400">Manage permanent staff members, designations, and base wages.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDirectory}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-gray-200 dark:border-navy-700 hover:bg-gray-50 transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>

              <button
                onClick={() => {
                  setEditingEmp(null);
                  setEmpForm({
                    name: '',
                    mobile: '',
                    designation: 'Helper',
                    joiningDate: todayDateStr,
                    salary: '',
                    status: 'Active',
                    remarks: '',
                  });
                  setEmpModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-orange-600/20"
              >
                <Plus className="w-4 h-4" /> Add Employee
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 dark:bg-navy-800/40 p-3.5 rounded-xl border border-gray-100 dark:border-navy-700/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-navy-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search staff by name or mobile..."
                value={empSearch}
                onChange={(e) => {
                  setEmpSearch(e.target.value);
                  setEmpPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white outline-none focus:border-orange-500"
              />
            </div>

            <select
              value={empDesigFilter}
              onChange={(e) => {
                setEmpDesigFilter(e.target.value);
                setEmpPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white outline-none"
            >
              <option value="ALL">All Designations</option>
              {DESIGNATIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={empStatusFilter}
              onChange={(e) => {
                setEmpStatusFilter(e.target.value);
                setEmpPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          {/* Directory Table */}
          {loadingEmployees ? (
            <SkeletonLoader rows={5} />
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-navy-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-navy-700 dark:text-navy-300">No employees found</p>
              <p className="text-xs text-navy-400 mt-1">Try changing filters or add your first staff member.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-navy-800/60 text-navy-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Staff Member</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Monthly Base Salary</th>
                    <th className="p-3">Joining Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                  {employees.map((emp, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/30 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 flex items-center justify-center font-black text-xs">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-navy-900 dark:text-white">{emp.name}</p>
                            <p className="text-[11px] text-navy-400 font-mono">{emp.mobile}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-navy-800 text-navy-700 dark:text-navy-300 border border-gray-200 dark:border-navy-700">
                          {emp.designation}
                        </span>
                      </td>

                      <td className="p-3 font-black text-navy-900 dark:text-white">
                        ₹{Number(emp.salary).toLocaleString('en-IN')}
                      </td>

                      <td className="p-3 text-navy-500 dark:text-navy-400">
                        {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-IN') : '—'}
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition ${
                            emp.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                          title="Click to toggle Active/Inactive"
                        >
                          {emp.status}
                        </button>
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openFullProfile(emp._id)}
                            className="p-1.5 text-navy-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-navy-800 rounded-lg transition"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingEmp(emp);
                              setEmpForm({
                                name: emp.name,
                                mobile: emp.mobile,
                                designation: emp.designation,
                                joiningDate: emp.joiningDate
                                  ? new Date(emp.joiningDate).toISOString().split('T')[0]
                                  : todayDateStr,
                                salary: emp.salary,
                                status: emp.status,
                                remarks: emp.remarks || '',
                              });
                              setEmpModalOpen(true);
                            }}
                            className="p-1.5 text-navy-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-navy-800 rounded-lg transition"
                            title="Edit Staff"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            currentPage={empPage}
            totalPages={empTotalPages}
            onPageChange={setEmpPage}
            totalRecords={empTotal}
            recordsPerPage={empLimit}
            onRecordsPerPageChange={(val) => {
              setEmpLimit(val);
              setEmpPage(1);
            }}
          />
        </div>
      )}

      {/* 4. TAB 2: DAILY ATTENDANCE & ABSENT LOG */}
      {activeTab === 'ATTENDANCE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Absent Marker Checklist */}
          <div className="lg:col-span-2 bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-navy-800 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-navy-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white">Daily Attendance Checklist</h3>
                <p className="text-xs text-navy-400">
                  Staff are considered <strong>Present</strong> by default. Mark absent when an employee is off.
                </p>
              </div>

              {/* Date Selector */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-navy-900 dark:text-white outline-none cursor-pointer"
                />
                <button
                  onClick={() => setAttendanceDate(todayDateStr)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 transition"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Staff list for the day */}
            <div className="divide-y divide-gray-100 dark:divide-navy-800">
              {allActiveEmps.map((emp) => {
                const isAbsent = attendanceRecords.find(
                  (a) => a.employee?._id === emp._id || a.employee === emp._id
                );

                return (
                  <div key={emp._id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isAbsent
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}
                      >
                        {isAbsent ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-navy-900 dark:text-white">{emp.name}</p>
                        <p className="text-[10px] text-navy-400 font-mono">
                          {emp.designation} • ₹{emp.salary}/mo
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isAbsent
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        }`}
                      >
                        {isAbsent ? `❌ Absent (${isAbsent.remarks || 'Off'})` : '✓ Present'}
                      </span>

                      {isAbsent ? (
                        <button
                          onClick={() => handleRemoveAbsent(isAbsent._id)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-gray-200 text-navy-600 hover:bg-gray-100 transition"
                          title="Undo absent mark"
                        >
                          Undo
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedEmpForAbsent(emp);
                            setAbsentForm({ date: attendanceDate, remarks: 'Personal Leave' });
                            setAbsentModalOpen(true);
                          }}
                          className="px-3 py-1 text-[11px] font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white transition shadow-2xs"
                        >
                          Mark Absent
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Historical Absent Log Stream */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-navy-800 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-navy-900 dark:text-white">Recent Absent Records</h3>
            <p className="text-xs text-navy-400">Log of recorded employee absences.</p>

            {attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-xs text-navy-400">
                No staff marked absent on {attendanceDate}.
              </div>
            ) : (
              <div className="space-y-2.5">
                {attendanceRecords.map((a) => (
                  <div
                    key={a._id}
                    className="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-navy-900 dark:text-white">
                      <span>{a.employee?.name || 'Staff Member'}</span>
                      <span className="text-[10px] text-red-600 uppercase font-mono">Absent</span>
                    </div>
                    <p className="text-[11px] text-navy-500">{a.remarks || 'No remarks provided'}</p>
                    <div className="flex items-center justify-between text-[10px] text-navy-400 pt-1 border-t border-red-100/60">
                      <span>Marked by: {a.enteredBy?.name || 'Manager'}</span>
                      <span className="font-mono">{a.entryCode}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TAB 3: SALARY ADVANCES */}
      {activeTab === 'ADVANCES' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-navy-800 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">Salary Advance Ledger</h3>
              <p className="text-xs text-navy-400">Track advances given to employees before monthly payroll.</p>
            </div>

            <button
              onClick={() => {
                setAdvanceForm({
                  employeeId: allActiveEmps[0]?._id || '',
                  amount: '',
                  date: todayDateStr,
                  remarks: 'Personal requirement',
                });
                setAdvanceModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-600/20"
            >
              <Plus className="w-4 h-4" /> Record Advance
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-navy-800/40 p-3.5 rounded-xl border border-gray-100 dark:border-navy-700/60">
            <select
              value={advEmpFilter}
              onChange={(e) => {
                setAdvEmpFilter(e.target.value);
                setAdvPage(1);
              }}
              className="px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-navy-900 dark:text-white outline-none"
            >
              <option value="">All Employees</option>
              {allActiveEmps.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.designation})
                </option>
              ))}
            </select>

            <div className="flex items-center justify-end text-xs font-bold text-amber-600">
              Total Advances Logged: ₹{(summaryCounts?.totalAdvances || 0).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Advances Table */}
          {loadingAdvances ? (
            <SkeletonLoader rows={5} />
          ) : advances.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="w-10 h-10 text-navy-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-navy-700 dark:text-navy-300">No salary advances recorded</p>
              <p className="text-xs text-navy-400 mt-1">No advance payments recorded for {selectedMonth}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-navy-800/60 text-navy-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Entry Code & Employee</th>
                    <th className="p-3">Advance Date</th>
                    <th className="p-3">Advance Amount</th>
                    <th className="p-3">Remarks / Reason</th>
                    <th className="p-3">Entered By</th>
                    <th className="p-3 text-right rounded-r-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                  {advances.map((adv, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/30 transition">
                      <td className="p-3">
                        <div className="font-bold text-navy-900 dark:text-white flex items-center gap-1.5">
                          <span>{adv.employee?.name || 'Staff Member'}</span>
                          {adv.isEdited && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">
                              Edited
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-navy-400 font-mono">{adv.entryCode}</span>
                      </td>

                      <td className="p-3 text-navy-700 dark:text-navy-300 font-medium">
                        {new Date(adv.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="p-3 text-sm font-black text-amber-600">
                        ₹{Number(adv.amount).toLocaleString('en-IN')}
                      </td>

                      <td className="p-3 text-navy-600 dark:text-navy-400">{adv.remarks || '—'}</td>

                      <td className="p-3 text-navy-500">
                        <span className="font-semibold">{adv.enteredBy?.name || 'Manager'}</span>
                      </td>

                      <td className="p-3 text-right">
                        {adv.isEdited && (
                          <button
                            onClick={() => {
                              setSelectedHistory(adv.editHistory || []);
                              setHistoryTitle(`Advance [${adv.entryCode}] Correction Log`);
                              setHistoryModalOpen(true);
                            }}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Audit Log"
                          >
                            <HistoryIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            currentPage={advPage}
            totalPages={advTotalPages}
            onPageChange={setAdvPage}
            totalRecords={advTotal}
            recordsPerPage={advLimit}
            onRecordsPerPageChange={(val) => {
              setAdvLimit(val);
              setAdvPage(1);
            }}
          />
        </div>
      )}

      {/* 6. TAB 4: MONTHLY SALARY SHEET & CALCULATION */}
      {activeTab === 'SALARY_SHEET' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-navy-800 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                Monthly Salary Sheet ({selectedMonth})
              </h3>
              <p className="text-xs text-navy-400">
                Formula: Base Salary - Absent Deduction - Advance Deductions = Net Payable
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSalarySheet}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-200 border border-gray-200 dark:border-navy-700 hover:bg-gray-50 transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Salary Sheet
              </button>

              <button
                onClick={fetchSalarySheet}
                className="p-2 rounded-xl border border-gray-200 dark:border-navy-700 text-navy-400 hover:text-navy-700"
                title="Refresh Sheet"
              >
                <RefreshCw className={`w-4 h-4 ${loadingSalarySheet ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Sheet Table */}
          {loadingSalarySheet ? (
            <SkeletonLoader rows={6} />
          ) : !salarySheetData?.salarySheet?.length ? (
            <div className="text-center py-12 text-navy-400 text-xs">
              No active staff found to calculate salary for {selectedMonth}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-navy-800/60 text-navy-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Staff Member</th>
                    <th className="p-3">Base Salary</th>
                    <th className="p-3">Absent Days</th>
                    <th className="p-3">Absent Deduction</th>
                    <th className="p-3">Advances Deducted</th>
                    <th className="p-3">Final Net Payable</th>
                    <th className="p-3">Payout Status</th>
                    <th className="p-3 text-right rounded-r-xl">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                  {salarySheetData.salarySheet.map((row, idx) => {
                    const isPaid = row.status === 'PAID';
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/30 transition">
                        <td className="p-3">
                          <p className="font-bold text-navy-900 dark:text-white">{row.employee.name}</p>
                          <p className="text-[10px] text-navy-400 font-mono">{row.employee.designation}</p>
                        </td>

                        <td className="p-3 font-bold text-navy-800 dark:text-navy-100">
                          ₹{Number(row.monthlySalary).toLocaleString('en-IN')}
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              row.absentDays > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {row.absentDays} day(s)
                          </span>
                        </td>

                        <td className="p-3 text-red-600 font-bold">
                          -₹{Number(row.absentDeduction).toLocaleString('en-IN')}
                        </td>

                        <td className="p-3 text-amber-600 font-bold">
                          -₹{Number(row.advanceDeduction).toLocaleString('en-IN')}
                        </td>

                        <td className="p-3">
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            ₹{Number(row.finalPayable).toLocaleString('en-IN')}
                          </span>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          {isPaid ? (
                            <span className="text-[10px] text-emerald-600 font-bold">
                              ✓ Paid on{' '}
                              {new Date(row.paymentDetails?.paymentDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          ) : (
                            <button
                              onClick={() => openPaySalaryModal(row)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                            >
                              Pay Salary
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
      )}

      {/* 7. TAB 5: SALARY PAYMENT LEDGER */}
      {activeTab === 'SALARY_LEDGER' && (
        <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-100 dark:border-navy-800 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-navy-900 dark:text-white">Salary Payment Ledger</h3>
              <p className="text-xs text-navy-400">Historical records of completed salary disbursements.</p>
            </div>
          </div>

          {loadingPayments ? (
            <SkeletonLoader rows={5} />
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-10 h-10 text-navy-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-navy-700 dark:text-navy-300">No salary payment records</p>
              <p className="text-xs text-navy-400 mt-1">No completed salary vouchers found for {selectedMonth}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-navy-800/60 text-navy-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Voucher & Staff</th>
                    <th className="p-3">Salary Month</th>
                    <th className="p-3">Base Salary</th>
                    <th className="p-3">Deductions</th>
                    <th className="p-3">Paid Net Amount</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3">Payment Date</th>
                    <th className="p-3 text-right rounded-r-xl">Paid By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-navy-800">
                  {payments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-navy-800/30 transition">
                      <td className="p-3">
                        <p className="font-bold text-navy-900 dark:text-white">{p.employee?.name || 'Staff'}</p>
                        <span className="text-[10px] text-navy-400 font-mono">{p.entryCode}</span>
                      </td>

                      <td className="p-3 font-semibold">{p.salaryMonth}</td>

                      <td className="p-3">₹{Number(p.monthlySalary).toLocaleString('en-IN')}</td>

                      <td className="p-3 text-[11px] text-red-600">
                        Absent: -₹{p.absentDeduction} | Adv: -₹{p.advanceDeduction}
                      </td>

                      <td className="p-3 text-sm font-black text-emerald-600">
                        ₹{Number(p.paidAmount).toLocaleString('en-IN')}
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-gray-100 font-semibold">{p.paymentMode}</span>
                      </td>

                      <td className="p-3 text-navy-500">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="p-3 text-right font-semibold text-navy-700 dark:text-navy-300">
                        {p.paidBy?.name || 'Manager'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            currentPage={payPage}
            totalPages={payTotalPages}
            onPageChange={setPayPage}
            totalRecords={payTotal}
            recordsPerPage={payLimit}
            onRecordsPerPageChange={(val) => {
              setPayLimit(val);
              setPayPage(1);
            }}
          />
        </div>
      )}

      {/* 8. MODAL: ADD / EDIT EMPLOYEE */}
      {empModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-lg w-full border border-gray-100 dark:border-navy-800 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-100 dark:border-navy-800 flex items-center justify-between bg-orange-50/50 dark:bg-navy-800">
              <h3 className="text-base font-bold text-navy-900 dark:text-white">
                {editingEmp ? 'Edit Employee' : 'Add New Staff Member'}
              </h3>
              <button onClick={() => setEmpModalOpen(false)} className="p-1.5 text-navy-400 hover:text-navy-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={empForm.name}
                    onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                    Mobile Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="e.g. 9876543210"
                    value={empForm.mobile}
                    onChange={(e) => setEmpForm({ ...empForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">Designation *</label>
                  <select
                    value={empForm.designation}
                    onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                  >
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                    Monthly Base Salary (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="e.g. 15000"
                    value={empForm.salary}
                    onChange={(e) => setEmpForm({ ...empForm, salary: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={empForm.joiningDate}
                    onChange={(e) => setEmpForm({ ...empForm, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">Status</label>
                  <select
                    value={empForm.status}
                    onChange={(e) => setEmpForm({ ...empForm, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Optional staff notes..."
                  value={empForm.remarks}
                  onChange={(e) => setEmpForm({ ...empForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-navy-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEmpModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-navy-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition shadow-sm"
                >
                  {submitting ? 'Saving...' : editingEmp ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL: MARK ABSENT */}
      {absentModalOpen && selectedEmpForAbsent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-md w-full border border-red-200 dark:border-red-900 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-100 dark:border-navy-800 flex items-center justify-between bg-red-50/50 dark:bg-red-950/30">
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-navy-900 dark:text-white">
                  Mark Absent: {selectedEmpForAbsent.name}
                </h3>
              </div>
              <button onClick={() => setAbsentModalOpen(false)} className="p-1.5 text-navy-400 hover:text-navy-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMarkAbsentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">Absent Date *</label>
                <input
                  type="date"
                  required
                  value={absentForm.date}
                  onChange={(e) => setAbsentForm({ ...absentForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                  Reason / Remarks *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Personal Work, Sick Leave, Family Emergency"
                  value={absentForm.remarks}
                  onChange={(e) => setAbsentForm({ ...absentForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-navy-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAbsentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-navy-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition shadow-sm"
                >
                  {submitting ? 'Recording...' : 'Confirm Absent Mark'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL: RECORD SALARY ADVANCE */}
      {advanceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-md w-full border border-gray-100 dark:border-navy-800 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-100 dark:border-navy-800 flex items-center justify-between bg-amber-50/50 dark:bg-navy-800">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-navy-900 dark:text-white">Record Salary Advance</h3>
              </div>
              <button onClick={() => setAdvanceModalOpen(false)} className="p-1.5 text-navy-400 hover:text-navy-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveAdvance(false);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                  Select Employee *
                </label>
                <select
                  required
                  value={advanceForm.employeeId}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 font-bold"
                >
                  <option value="">-- Choose Employee --</option>
                  {allActiveEmps.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation} • ₹{emp.salary}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                    Advance Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    placeholder="e.g. 2000"
                    value={advanceForm.amount}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                    Advance Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={advanceForm.date}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Personal requirement"
                  value={advanceForm.remarks}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-navy-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdvanceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-navy-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveAdvance(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-amber-600 text-amber-600 hover:bg-amber-50 transition"
                >
                  Save & Add Another
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm"
                >
                  {submitting ? 'Saving...' : 'Save Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. MODAL: PAY SALARY */}
      {payModalOpen && selectedSalaryRow && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-lg w-full border border-emerald-200 dark:border-emerald-900 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-100 dark:border-navy-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/30">
              <div>
                <h3 className="text-base font-bold text-navy-900 dark:text-white">
                  Pay Salary: {selectedSalaryRow.employee.name}
                </h3>
                <p className="text-xs text-navy-400">Salary Payout for {selectedSalaryRow.salaryMonth}</p>
              </div>
              <button onClick={() => setPayModalOpen(false)} className="p-1.5 text-navy-400 hover:text-navy-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaySalarySubmit} className="p-6 space-y-4">
              {/* Formula Breakdown Card */}
              <div className="bg-gray-50 dark:bg-navy-800 p-3.5 rounded-xl border border-gray-200 dark:border-navy-700 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-navy-500">Base Monthly Salary:</span>
                  <span className="font-bold text-navy-900 dark:text-white">
                    ₹{selectedSalaryRow.monthlySalary.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-red-600">
                  <span>Absent Deduction ({selectedSalaryRow.absentDays} days):</span>
                  <span>-₹{selectedSalaryRow.absentDeduction.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-amber-600">
                  <span>Total Advance Deducted:</span>
                  <span>-₹{selectedSalaryRow.advanceDeduction.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-navy-700 flex items-center justify-between font-black text-sm text-emerald-600">
                  <span>Calculated Net Payable:</span>
                  <span>₹{selectedSalaryRow.finalPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                    Actual Paid Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={payForm.paidAmount}
                    onChange={(e) => setPayForm({ ...payForm, paidAmount: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={payForm.paymentMode}
                    onChange={(e) => setPayForm({ ...payForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                  Disbursement Date *
                </label>
                <input
                  type="date"
                  required
                  value={payForm.paymentDate}
                  onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-800 dark:text-navy-200 mb-1">
                  Payment Remarks
                </label>
                <input
                  type="text"
                  value={payForm.remarks}
                  onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-navy-700 bg-white dark:bg-navy-800"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-navy-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-navy-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
                >
                  {submitting ? 'Processing...' : 'Confirm & Disburse Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 12. MODAL: EMPLOYEE FULL PROFILE */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-2xl w-full border border-gray-100 dark:border-navy-800 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-100 dark:border-navy-800 flex items-center justify-between bg-gradient-to-r from-orange-50 to-orange-100/40 dark:bg-navy-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-black text-sm">
                  {fullProfileData?.employee?.name?.charAt(0).toUpperCase() || 'E'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy-900 dark:text-white">
                    {fullProfileData?.employee?.name}
                  </h3>
                  <p className="text-xs text-navy-500">
                    {fullProfileData?.employee?.designation} • {fullProfileData?.employee?.mobile}
                  </p>
                </div>
              </div>
              <button onClick={() => setProfileModalOpen(false)} className="p-1.5 text-navy-400 hover:text-navy-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
              {profileLoading || !fullProfileData ? (
                <SkeletonLoader rows={4} />
              ) : (
                <>
                  {/* Basic Stats */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-gray-50 dark:bg-navy-800 rounded-xl">
                      <p className="text-[10px] text-navy-400 font-bold uppercase">Monthly Wage</p>
                      <p className="text-base font-black text-navy-900 dark:text-white mt-0.5">
                        ₹{fullProfileData.employee?.salary?.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50/60 dark:bg-red-950/20 rounded-xl">
                      <p className="text-[10px] text-red-600 font-bold uppercase">Total Absents</p>
                      <p className="text-base font-black text-red-600 mt-0.5">
                        {fullProfileData.totalAbsentDays} days
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl">
                      <p className="text-[10px] text-amber-600 font-bold uppercase">Total Advances</p>
                      <p className="text-base font-black text-amber-600 mt-0.5">
                        ₹{fullProfileData.totalAdvancesAmount?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Attendance Log */}
                  <div>
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider mb-2">
                      Recent Attendance / Absences
                    </h4>
                    {fullProfileData.recentAttendance?.length === 0 ? (
                      <p className="text-xs text-navy-400 italic">No absent marks recorded.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {fullProfileData.recentAttendance.map((a) => (
                          <div
                            key={a._id}
                            className="p-2 rounded-lg bg-gray-50 dark:bg-navy-800 flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold">
                              {new Date(a.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-red-600 font-bold">{a.status}</span>
                            <span className="text-navy-400 text-[11px]">{a.remarks}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Advances Log */}
                  <div>
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider mb-2">
                      Salary Advances History
                    </h4>
                    {fullProfileData.advances?.length === 0 ? (
                      <p className="text-xs text-navy-400 italic">No salary advances taken.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {fullProfileData.advances.map((adv) => (
                          <div
                            key={adv._id}
                            className="p-2 rounded-lg bg-gray-50 dark:bg-navy-800 flex items-center justify-between text-xs"
                          >
                            <span>
                              {new Date(adv.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="font-bold text-amber-600">₹{adv.amount}</span>
                            <span className="text-navy-400 text-[11px]">{adv.remarks}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Salary Payment History */}
                  <div>
                    <h4 className="text-xs font-bold text-navy-900 dark:text-white uppercase tracking-wider mb-2">
                      Paid Salary Receipts
                    </h4>
                    {fullProfileData.salaryPayments?.length === 0 ? (
                      <p className="text-xs text-navy-400 italic">No salary payouts logged yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {fullProfileData.salaryPayments.map((p) => (
                          <div
                            key={p._id}
                            className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between text-xs"
                          >
                            <span className="font-bold">{p.salaryMonth}</span>
                            <span className="font-black text-emerald-600">₹{p.paidAmount}</span>
                            <span className="text-navy-400 text-[10px]">{p.paymentMode}</span>
                            <span className="text-navy-400 text-[10px]">
                              {new Date(p.paymentDate).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-navy-800 flex justify-end bg-gray-50/50">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-navy-900 text-white"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. EDIT HISTORY AUDIT MODAL */}
      <EditHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        recordTitle={historyTitle}
        editHistory={selectedHistory}
      />
    </div>
  );
};

export default EmployeeEntry;
