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
  XCircle,
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
import SkeletonLoader, { SkeletonBlock } from '../../components/SkeletonLoader';
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
      <div className="p-8 text-center bg-white rounded-2xl border border-[#E5E7EB] shadow-xs max-w-lg mx-auto mt-10 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-[#172033] mb-1">Access Restricted</h2>
        <p className="text-xs text-[#6B7280]">
          The Employee & Payroll management module is reserved for management roles. Please use the Kitchen Requisitions tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* 0. HEADER & TITLE BANNER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0E5] text-[#F97316] mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Permanent Staff & Payroll Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033] flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#F97316]" /> Staff & Employee Management
          </h1>
          <p className="text-xs text-[#6B7280] mt-1">
            Manage permanent staff records, track daily attendance, record salary advances, and generate monthly payroll.
          </p>
        </div>

        {/* Global Month Selector & Quick Refresh */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 bg-[#FFF8F1] border border-[#E5E7EB] px-3.5 py-2 rounded-xl text-xs">
            <Calendar className="w-4 h-4 text-[#F97316]" />
            <span className="font-bold text-[#6B7280]">Salary Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-[#172033] font-bold text-xs focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              fetchEmployees(empPage);
              fetchSummaryOverview();
              if (activeTab === 'SALARY_SHEET') fetchSalarySheet();
              if (activeTab === 'SALARY_LEDGER') fetchPayments(payPage);
              if (activeTab === 'ADVANCES') fetchAdvances(advPage);
              toast.success('Data refreshed');
            }}
            className="p-2.5 bg-white hover:bg-[#FFF0E5] text-[#172033] rounded-xl border border-[#E5E7EB] hover:border-[#F97316] transition cursor-pointer shadow-2xs"
            title="Refresh All"
          >
            <RefreshCw className={`w-4 h-4 text-[#172033] ${loadingSummary ? 'animate-spin text-[#F97316]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. HERO OPERATIONAL SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Staff */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Active Staff</p>
              <h3 className="text-2xl font-bold text-[#172033] mt-1">
                {summaryCounts?.activeEmployees ?? allActiveEmps.length}{' '}
                <span className="text-xs font-normal text-[#6B7280]">
                  / {summaryCounts?.totalEmployees ?? employees.length} total
                </span>
              </h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[#6B7280] mt-3 flex items-center gap-1.5 font-medium border-t border-[#F3F4F6] pt-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Enrolled regular staff
          </p>
        </div>

        {/* Advances This Month */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Advances ({selectedMonth})</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">
                ₹{(summaryCounts?.totalAdvances || 0).toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5 font-semibold border-t border-[#F3F4F6] pt-2.5">
            Deductible at monthly payout
          </p>
        </div>

        {/* Pending Salaries */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Pending Payouts</p>
              <h3 className="text-2xl font-bold text-[#F97316] mt-1">
                {summaryCounts?.pendingSalaries ?? 0}{' '}
                <span className="text-xs font-normal text-[#6B7280]">staff pending</span>
              </h3>
            </div>
            <div className="p-3 bg-orange-50 text-[#F97316] rounded-xl border border-orange-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-[#F97316] mt-3 flex items-center gap-1.5 font-semibold border-t border-[#F3F4F6] pt-2.5">
            Awaiting disbursement for {selectedMonth}
          </p>
        </div>

        {/* Paid Salaries */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">Paid Payouts</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {summaryCounts?.paidSalariesCount ?? 0}{' '}
                <span className="text-xs font-normal text-[#6B7280]">vouchers</span>
              </h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1.5 font-semibold border-t border-[#F3F4F6] pt-2.5">
            Disbursed & logged in ledger
          </p>
        </div>
      </div>

      {/* 2. TOP WORKSPACE NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2 overflow-x-auto">
        {[
          { id: 'DIRECTORY', label: 'Staff Directory', icon: Users, count: empTotal },
          { id: 'ATTENDANCE', label: 'Daily Attendance & Absents', icon: Calendar },
          { id: 'ADVANCES', label: 'Salary Advances', icon: TrendingDown, count: advTotal },
          { id: 'SALARY_SHEET', label: 'Monthly Salary Sheet', icon: Briefcase },
          { id: 'SALARY_LEDGER', label: 'Payment Ledger', icon: FileText, count: payTotal },
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#F97316] text-white shadow-md shadow-[#F97316]/20'
                  : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#172033] hover:bg-[#FFF0E5]/60'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-[#FFF0E5] text-[#F97316]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: EMPLOYEE MASTER DIRECTORY */}
      {activeTab === 'DIRECTORY' && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 space-y-4">
          {/* Header & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#172033]">Staff & Employee Master</h3>
              <p className="text-xs text-[#6B7280]">Manage permanent staff members, designations, and base wages.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportDirectory}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white text-[#172033] border border-[#E5E7EB] hover:bg-[#FFF0E5] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-[#F97316]" /> Export CSV
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
                className="px-4 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-[#F97316]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Employee
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FFF8F1]/60 p-3.5 rounded-xl border border-[#E5E7EB]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search staff by name or mobile..."
                value={empSearch}
                onChange={(e) => {
                  setEmpSearch(e.target.value);
                  setEmpPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-white text-[#172033] outline-none focus:border-[#F97316] shadow-2xs"
              />
            </div>

            <select
              value={empDesigFilter}
              onChange={(e) => {
                setEmpDesigFilter(e.target.value);
                setEmpPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-white text-[#172033] outline-none focus:border-[#F97316] shadow-2xs font-medium cursor-pointer"
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
              className="px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-white text-[#172033] outline-none focus:border-[#F97316] shadow-2xs font-medium cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>

          {/* Directory Table */}
          {loadingEmployees ? (
            <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F1] text-[#172033] font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Monthly Base Salary</th>
                    <th className="p-3">Joining Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <SkeletonLoader rows={5} columns={6} />
              </table>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#172033]">No employees found</p>
              <p className="text-xs text-[#6B7280] mt-1">Try changing filters or add your first staff member.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F1] text-[#172033] font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Designation</th>
                    <th className="p-3">Monthly Base Salary</th>
                    <th className="p-3">Joining Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {employees.map((emp, idx) => (
                    <tr key={idx} className="hover:bg-[#FFF0E5]/30 transition">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#FFF0E5] text-[#F97316] border border-[#FDBA74] flex items-center justify-center font-black text-xs">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#172033]">{emp.name}</p>
                            <p className="text-[11px] text-[#6B7280] font-mono">{emp.mobile}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF8F1] text-[#172033] border border-[#E5E7EB]">
                          {emp.designation}
                        </span>
                      </td>

                      <td className="p-3 font-black text-[#172033]">
                        ₹{Number(emp.salary).toLocaleString('en-IN')}
                      </td>

                      <td className="p-3 text-[#6B7280]">
                        {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-IN') : '—'}
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => handleToggleStatus(emp)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition cursor-pointer ${
                            emp.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
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
                            className="p-1.5 text-[#6B7280] hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="View Full Profile"
                          >
                            <Eye className="w-4 h-4" />
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
                            className="p-1.5 text-[#6B7280] hover:text-[#F97316] hover:bg-[#FFF0E5] rounded-lg transition cursor-pointer"
                            title="Edit Staff"
                          >
                            <Edit2 className="w-4 h-4" />
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
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
              <div>
                <h3 className="text-base font-bold text-[#172033]">Daily Attendance Checklist</h3>
                <p className="text-xs text-[#6B7280]">
                  Staff are considered <strong className="text-emerald-700 font-bold">Present</strong> by default. Mark absent when an employee is on leave.
                </p>
              </div>

              {/* Date Selector */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#FFF8F1] border border-[#E5E7EB] px-3 py-1.5 rounded-xl">
                  <Calendar className="w-3.5 h-3.5 text-[#F97316]" />
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-transparent text-[#172033] font-bold text-xs outline-none cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => setAttendanceDate(todayDateStr)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white text-[#172033] border border-[#E5E7EB] hover:bg-[#FFF0E5] transition cursor-pointer shadow-2xs"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Staff list for the day */}
            <div className="divide-y divide-[#E5E7EB]">
              {allActiveEmps.map((emp) => {
                const isAbsent = attendanceRecords.find(
                  (a) => a.employee?._id === emp._id || a.employee === emp._id
                );

                return (
                  <div key={emp._id} className="py-3.5 flex items-center justify-between hover:bg-[#FFF0E5]/20 px-2 rounded-xl transition">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          isAbsent
                            ? 'bg-rose-50 text-rose-600 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}
                      >
                        {isAbsent ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-bold text-[#172033]">{emp.name}</p>
                        <p className="text-[11px] text-[#6B7280]">
                          <span className="font-medium text-[#172033]">{emp.designation}</span> • Base: ₹{Number(emp.salary).toLocaleString('en-IN')}/mo
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          isAbsent
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isAbsent ? (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>Absent ({isAbsent.remarks || 'Off'})</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Present</span>
                          </>
                        )}
                      </span>

                      {isAbsent ? (
                        <button
                          onClick={() => handleRemoveAbsent(isAbsent._id)}
                          className="px-3 py-1 text-xs font-bold rounded-lg border border-[#E5E7EB] bg-white text-[#172033] hover:bg-gray-50 transition cursor-pointer shadow-2xs"
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
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition shadow-2xs cursor-pointer"
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
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-[#172033]">Recent Absent Records</h3>
            <p className="text-xs text-[#6B7280]">Log of recorded employee absences for {attendanceDate}.</p>

            {attendanceRecords.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#9CA3AF] bg-[#FFF8F1]/40 rounded-xl border border-dashed border-[#E5E7EB]">
                No staff marked absent on this date.
              </div>
            ) : (
              <div className="space-y-2.5">
                {attendanceRecords.map((a) => (
                  <div
                    key={a._id}
                    className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold text-[#172033]">
                      <span>{a.employee?.name || 'Staff Member'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200/60 text-rose-800 uppercase font-mono font-bold">Absent</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280]">{a.remarks || 'No remarks provided'}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#9CA3AF] pt-1.5 border-t border-rose-200/50">
                      <span>Marked by: {a.enteredBy?.name || 'Manager'}</span>
                      <span className="font-mono font-bold text-[#6B7280]">{a.entryCode}</span>
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
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#172033]">Salary Advance Ledger</h3>
              <p className="text-xs text-[#6B7280]">Track advances disbursed to permanent employees before payroll.</p>
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
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Record Advance
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#FFF8F1]/60 p-3.5 rounded-xl border border-[#E5E7EB]">
            <select
              value={advEmpFilter}
              onChange={(e) => {
                setAdvEmpFilter(e.target.value);
                setAdvPage(1);
              }}
              className="px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-white text-[#172033] outline-none focus:border-[#F97316] shadow-2xs font-medium cursor-pointer"
            >
              <option value="">All Employees</option>
              {allActiveEmps.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.designation})
                </option>
              ))}
            </select>

            <div className="flex items-center justify-end text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
              Total Advances Logged: ₹{(summaryCounts?.totalAdvances || 0).toLocaleString('en-IN')}
            </div>
          </div>

          {/* Advances Table */}
          {loadingAdvances ? (
            <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F1] text-[#172033] font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-3">Entry Code & Employee</th>
                    <th className="p-3">Advance Date</th>
                    <th className="p-3">Advance Amount</th>
                    <th className="p-3">Remarks / Reason</th>
                    <th className="p-3">Entered By</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <SkeletonLoader rows={5} columns={6} />
              </table>
            </div>
          ) : advances.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#172033]">No salary advances recorded</p>
              <p className="text-xs text-[#6B7280] mt-1">No advance payments recorded for {selectedMonth}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F1] text-[#172033] font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-3">Entry Code & Employee</th>
                    <th className="p-3">Advance Date</th>
                    <th className="p-3">Advance Amount</th>
                    <th className="p-3">Remarks / Reason</th>
                    <th className="p-3">Entered By</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {advances.map((adv, idx) => (
                    <tr key={idx} className="hover:bg-[#FFF0E5]/30 transition">
                      <td className="p-3">
                        <div className="font-bold text-[#172033] flex items-center gap-1.5">
                          <span>{adv.employeeId?.name || 'Unknown Staff'}</span>
                          {adv.isEdited && (
                            <button
                              onClick={() => openHistory(adv)}
                              className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 text-[10px] font-bold hover:underline"
                              title="Click to view correction log"
                            >
                              Edited
                            </button>
                          )}
                        </div>
                        <span className="text-[10px] text-[#6B7280] font-mono">{adv.entryCode}</span>
                      </td>

                      <td className="p-3 text-[#374151] font-medium">
                        {new Date(adv.date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="p-3 font-bold text-amber-700">
                        ₹{adv.amount.toLocaleString('en-IN')}
                      </td>

                      <td className="p-3 text-[#6B7280] max-w-xs truncate" title={adv.remarks}>
                        {adv.remarks || '-'}
                      </td>

                      <td className="p-3 text-[#6B7280]">
                        {adv.enteredBy?.name || 'System'}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditAdvanceModal(adv)}
                            className="p-1.5 text-[#6B7280] hover:text-[#F97316] hover:bg-[#FFF0E5] rounded-lg transition"
                            title="Edit Advance"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {adv.isEdited && (
                            <button
                              onClick={() => openHistory(adv)}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Audit Log"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#172033]">
                Monthly Salary Sheet ({selectedMonth})
              </h3>
              <p className="text-xs text-[#6B7280]">
                Formula: <span className="font-mono font-medium text-[#172033]">Base Salary - Absent Deduction - Advance Deductions = Net Payable</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSalarySheet}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-white text-[#172033] border border-[#E5E7EB] hover:bg-[#FFF0E5] transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-[#F97316]" /> Export Salary Sheet
              </button>

              <button
                onClick={fetchSalarySheet}
                className="p-2 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:text-[#172033] hover:bg-[#FFF0E5] transition cursor-pointer shadow-2xs"
                title="Refresh Sheet"
              >
                <RefreshCw className={`w-4 h-4 text-[#172033] ${loadingSalarySheet ? 'animate-spin text-[#F97316]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Sheet Table */}
          {loadingSalarySheet ? (
            <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F1] text-[#172033] font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Base Salary</th>
                    <th className="p-3">Absent Days</th>
                    <th className="p-3">Absent Deduction</th>
                    <th className="p-3">Advance Deduction</th>
                    <th className="p-3 font-extrabold text-emerald-800">Net Payable</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Disburse</th>
                  </tr>
                </thead>
                <SkeletonLoader rows={6} columns={8} />
              </table>
            </div>
          ) : !salarySheetData?.salarySheet?.length ? (
            <div className="text-center py-12 text-[#9CA3AF] text-xs bg-[#FFF8F1]/40 rounded-xl border border-dashed border-[#E5E7EB]">
              No active staff found to calculate salary for {selectedMonth}.
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F1] text-[#172033] font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Base Salary</th>
                    <th className="p-3">Absent Days</th>
                    <th className="p-3">Absent Deduction</th>
                    <th className="p-3">Advances Deducted</th>
                    <th className="p-3">Final Net Payable</th>
                    <th className="p-3">Payout Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {salarySheetData.salarySheet.map((row, idx) => {
                    const isPaid = row.status === 'PAID';
                    return (
                      <tr key={idx} className="hover:bg-[#FFF0E5]/30 transition">
                        <td className="p-3">
                          <p className="font-bold text-[#172033]">{row.employee.name}</p>
                          <p className="text-[11px] text-[#6B7280] font-mono">{row.employee.designation}</p>
                        </td>

                        <td className="p-3 font-bold text-[#172033]">
                          ₹{Number(row.monthlySalary).toLocaleString('en-IN')}
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              row.absentDays > 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {row.absentDays} day(s)
                          </span>
                        </td>

                        <td className="p-3 text-rose-600 font-bold">
                          -₹{Number(row.absentDeduction).toLocaleString('en-IN')}
                        </td>

                        <td className="p-3 text-amber-600 font-bold">
                          -₹{Number(row.advanceDeduction).toLocaleString('en-IN')}
                        </td>

                        <td className="p-3">
                          <span className="text-sm font-black text-emerald-600">
                            ₹{Number(row.finalPayable).toLocaleString('en-IN')}
                          </span>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              isPaid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-orange-50 text-[#F97316] border border-orange-200'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          {isPaid ? (
                            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                              ✓ Paid on{' '}
                              {new Date(row.paymentDetails?.paymentDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          ) : (
                            <button
                              onClick={() => openPaySalaryModal(row)}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
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
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#172033]">Salary Payment Ledger</h3>
              <p className="text-xs text-[#6B7280]">Historical records of completed salary disbursements.</p>
            </div>
          </div>

          {loadingPayments ? (
            <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F1] text-[#172033] font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-3">Voucher & Staff</th>
                    <th className="p-3">Salary Month</th>
                    <th className="p-3">Base Wage</th>
                    <th className="p-3">Deductions</th>
                    <th className="p-3">Net Paid</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3">Disbursed Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <SkeletonLoader rows={5} columns={8} />
              </table>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-10 h-10 text-[#9CA3AF] mx-auto mb-2" />
              <p className="text-sm font-bold text-[#172033]">No salary payment records</p>
              <p className="text-xs text-[#6B7280] mt-1">No completed salary vouchers found for {selectedMonth}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#E5E7EB] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFF8F1] text-[#172033] font-bold uppercase tracking-wider border-b border-[#E5E7EB]">
                  <tr>
                    <th className="p-3">Voucher & Staff</th>
                    <th className="p-3">Salary Month</th>
                    <th className="p-3">Base Salary</th>
                    <th className="p-3">Deductions</th>
                    <th className="p-3">Paid Net Amount</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3">Payment Date</th>
                    <th className="p-3 text-right">Paid By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {payments.map((p, idx) => (
                    <tr key={idx} className="hover:bg-[#FFF0E5]/30 transition">
                      <td className="p-3">
                        <p className="font-bold text-[#172033]">{p.employee?.name || 'Staff'}</p>
                        <span className="text-[10px] text-[#6B7280] font-mono">{p.entryCode}</span>
                      </td>

                      <td className="p-3 font-semibold text-[#172033]">{p.salaryMonth}</td>

                      <td className="p-3 text-[#172033] font-medium">₹{Number(p.monthlySalary).toLocaleString('en-IN')}</td>

                      <td className="p-3 text-[11px] text-rose-600 font-medium">
                        Absent: -₹{p.absentDeduction} | Adv: -₹{p.advanceDeduction}
                      </td>

                      <td className="p-3 text-sm font-black text-emerald-600">
                        ₹{Number(p.paidAmount).toLocaleString('en-IN')}
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#FFF8F1] text-[#172033] border border-[#E5E7EB] font-semibold text-[11px]">
                          {p.paymentMode}
                        </span>
                      </td>

                      <td className="p-3 text-[#6B7280]">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="p-3 text-right font-semibold text-[#172033]">
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E5E7EB] shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FFF8F1]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#F97316]" />
                <h3 className="text-base font-bold text-[#172033]">
                  {editingEmp ? 'Edit Employee Details' : 'Add New Staff Member'}
                </h3>
              </div>
              <button
                onClick={() => setEmpModalOpen(false)}
                className="p-1.5 text-[#6B7280] hover:text-[#172033] hover:bg-[#FFF0E5] rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={empForm.name}
                    onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FFF8F1]/50 text-[#172033] outline-none focus:border-[#F97316] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Mobile Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="e.g. 9876543210"
                    value={empForm.mobile}
                    onChange={(e) => setEmpForm({ ...empForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FFF8F1]/50 text-[#172033] outline-none focus:border-[#F97316] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">Designation *</label>
                  <select
                    value={empForm.designation}
                    onChange={(e) => setEmpForm({ ...empForm, designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FFF8F1]/50 text-[#172033] outline-none focus:border-[#F97316] font-medium cursor-pointer"
                  >
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FFF8F1]/50 text-[#172033] outline-none focus:border-[#F97316] font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={empForm.joiningDate}
                    onChange={(e) => setEmpForm({ ...empForm, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FFF8F1]/50 text-[#172033] outline-none focus:border-[#F97316] font-medium cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">Status</label>
                  <select
                    value={empForm.status}
                    onChange={(e) => setEmpForm({ ...empForm, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FFF8F1]/50 text-[#172033] outline-none focus:border-[#F97316] font-medium cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="Optional staff notes..."
                  value={empForm.remarks}
                  onChange={(e) => setEmpForm({ ...empForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FFF8F1]/50 text-[#172033] outline-none focus:border-[#F97316]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEmpModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-[#6B7280] hover:bg-[#FFF0E5] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white transition shadow-md shadow-[#F97316]/20 cursor-pointer"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-rose-200 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-rose-50/70">
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-[#172033]">
                  Mark Absent: {selectedEmpForAbsent.name}
                </h3>
              </div>
              <button
                onClick={() => setAbsentModalOpen(false)}
                className="p-1.5 text-[#6B7280] hover:text-[#172033] rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMarkAbsentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Absent Date *</label>
                <input
                  type="date"
                  required
                  value={absentForm.date}
                  onChange={(e) => setAbsentForm({ ...absentForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FFF8F1]/50 text-[#172033] outline-none focus:border-rose-500 font-medium cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Reason / Remarks *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Personal Work, Sick Leave, Family Emergency"
                  value={absentForm.remarks}
                  onChange={(e) => setAbsentForm({ ...absentForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FFF8F1]/50 text-[#172033] outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAbsentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-[#6B7280] hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#E5E7EB] shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-amber-50/70">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-[#172033]">Record Salary Advance</h3>
              </div>
              <button
                onClick={() => setAdvanceModalOpen(false)}
                className="p-1.5 text-[#6B7280] hover:text-[#172033] rounded-lg transition cursor-pointer"
              >
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
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Select Employee *
                </label>
                <select
                  required
                  value={advanceForm.employeeId}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FFF8F1]/50 text-[#172033] outline-none focus:border-amber-500 font-bold cursor-pointer"
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
                  <label className="block text-xs font-bold text-[#172033] mb-1">
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FFF8F1]/50 text-[#172033] outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Advance Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={advanceForm.date}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FFF8F1]/50 text-[#172033] outline-none focus:border-amber-500 font-medium cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Personal requirement"
                  value={advanceForm.remarks}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-[#FFF8F1]/50 text-[#172033] outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdvanceModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-[#6B7280] hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveAdvance(true)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-amber-600 text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                >
                  Save & Add Another
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-emerald-200 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-emerald-50/70">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Pay Salary: {selectedSalaryRow.employee.name}
                </h3>
                <p className="text-xs text-[#6B7280]">Salary Payout for {selectedSalaryRow.salaryMonth}</p>
              </div>
              <button
                onClick={() => setPayModalOpen(false)}
                className="p-1.5 text-[#6B7280] hover:text-[#172033] rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaySalarySubmit} className="p-6 space-y-4">
              {/* Formula Breakdown Card */}
              <div className="bg-[#FFF8F1]/70 p-4 rounded-xl border border-[#E5E7EB] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#6B7280]">Base Monthly Salary:</span>
                  <span className="font-bold text-[#172033]">
                    ₹{selectedSalaryRow.monthlySalary.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-rose-600 font-medium">
                  <span>Absent Deduction ({selectedSalaryRow.absentDays} days):</span>
                  <span>-₹{selectedSalaryRow.absentDeduction.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-amber-600 font-medium">
                  <span>Total Advance Deducted:</span>
                  <span>-₹{selectedSalaryRow.advanceDeduction.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between font-black text-sm text-emerald-600">
                  <span>Calculated Net Payable:</span>
                  <span>₹{selectedSalaryRow.finalPayable.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Actual Paid Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={payForm.paidAmount}
                    onChange={(e) => setPayForm({ ...payForm, paidAmount: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-white text-[#172033] outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={payForm.paymentMode}
                    onChange={(e) => setPayForm({ ...payForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-white text-[#172033] outline-none focus:border-emerald-500 font-semibold cursor-pointer"
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
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Disbursement Date *
                </label>
                <input
                  type="date"
                  required
                  value={payForm.paymentDate}
                  onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-white text-[#172033] outline-none focus:border-emerald-500 font-medium cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Payment Remarks
                </label>
                <input
                  type="text"
                  placeholder="Optional voucher remarks..."
                  value={payForm.remarks}
                  onChange={(e) => setPayForm({ ...payForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] bg-white text-[#172033] outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-[#6B7280] hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-md shadow-emerald-600/20 cursor-pointer"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E5E7EB] shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-gradient-to-r from-[#FFF0E5] to-[#FFF8F1]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F97316] text-white flex items-center justify-center font-black text-sm shadow-sm">
                  {fullProfileData?.employee?.name?.charAt(0).toUpperCase() || 'E'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">
                    {fullProfileData?.employee?.name}
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    {fullProfileData?.employee?.designation} • {fullProfileData?.employee?.mobile}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 text-[#6B7280] hover:text-[#172033] rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
              {profileLoading || !fullProfileData ? (
                <SkeletonBlock rows={4} />
              ) : (
                <>
                  {/* Basic Stats */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-[#FFF8F1] rounded-xl border border-[#E5E7EB]">
                      <p className="text-[10px] text-[#6B7280] font-bold uppercase">Monthly Wage</p>
                      <p className="text-base font-black text-[#172033] mt-0.5">
                        ₹{fullProfileData.employee?.salary?.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                      <p className="text-[10px] text-rose-600 font-bold uppercase">Total Absents</p>
                      <p className="text-base font-black text-rose-600 mt-0.5">
                        {fullProfileData.totalAbsentDays} days
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <p className="text-[10px] text-amber-600 font-bold uppercase">Total Advances</p>
                      <p className="text-base font-black text-amber-600 mt-0.5">
                        ₹{fullProfileData.totalAdvancesAmount?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Attendance Log */}
                  <div>
                    <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                      Recent Attendance / Absences
                    </h4>
                    {fullProfileData.recentAttendance?.length === 0 ? (
                      <p className="text-xs text-[#9CA3AF] italic">No absent marks recorded.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto border border-[#E5E7EB] p-2 rounded-xl">
                        {fullProfileData.recentAttendance.map((a) => (
                          <div
                            key={a._id}
                            className="p-2 rounded-lg bg-[#FFF8F1]/60 flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold text-[#172033]">
                              {new Date(a.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="text-rose-600 font-bold">{a.status}</span>
                            <span className="text-[#6B7280] text-[11px]">{a.remarks}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Advances Log */}
                  <div>
                    <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                      Salary Advances History
                    </h4>
                    {fullProfileData.advances?.length === 0 ? (
                      <p className="text-xs text-[#9CA3AF] italic">No salary advances taken.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto border border-[#E5E7EB] p-2 rounded-xl">
                        {fullProfileData.advances.map((adv) => (
                          <div
                            key={adv._id}
                            className="p-2 rounded-lg bg-[#FFF8F1]/60 flex items-center justify-between text-xs"
                          >
                            <span className="text-[#172033]">
                              {new Date(adv.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span className="font-bold text-amber-600">₹{adv.amount}</span>
                            <span className="text-[#6B7280] text-[11px]">{adv.remarks}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Salary Payment History */}
                  <div>
                    <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider mb-2">
                      Paid Salary Receipts
                    </h4>
                    {fullProfileData.salaryPayments?.length === 0 ? (
                      <p className="text-xs text-[#9CA3AF] italic">No salary payouts logged yet.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto border border-[#E5E7EB] p-2 rounded-xl">
                        {fullProfileData.salaryPayments.map((p) => (
                          <div
                            key={p._id}
                            className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-[#172033]">{p.salaryMonth}</span>
                            <span className="font-black text-emerald-600">₹{p.paidAmount}</span>
                            <span className="text-[#6B7280] text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-200 font-semibold">{p.paymentMode}</span>
                            <span className="text-[#6B7280] text-[10px]">
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

            <div className="p-4 border-t border-[#E5E7EB] flex justify-end bg-[#FFF8F1]/40">
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-[#172033] hover:bg-black text-white cursor-pointer transition shadow-xs"
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
