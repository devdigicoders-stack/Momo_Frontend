import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import chefRequirementService from '../../services/chefRequirementService';
import Pagination from '../../components/Pagination';
import RecordDetailsModal from '../../components/RecordDetailsModal';
import EditHistoryModal from '../../components/EditHistoryModal';
import DuplicateWarningModal from '../../components/DuplicateWarningModal';
import exportToCsv from '../../utils/exportToCsv';
import {
  ChefHat,
  Plus,
  Search,
  Calendar,
  Edit2,
  Trash2,
  X,
  RotateCcw,
  CheckCircle2,
  FileText,
  Eye,
  Download,
  History as HistoryIcon,
} from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const UNITS = ['KG', 'Gram', 'Litre', 'ML', 'Pkt', 'Piece', 'Bunch', 'Box'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const STATUSES = ['Pending', 'Approved', 'Rejected', 'Completed'];

const ChefRequirements = ({ myOnly = false }) => {
  const { user } = useAuth();
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReq, setEditingReq] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);

  // Edit History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [historyTitle, setHistoryTitle] = useState('');

  // Duplicate Warning Modal State
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [pendingSubmitAction, setPendingSubmitAction] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Form state
  const initialFormState = {
    date: new Date().toISOString().split('T')[0],
    itemName: '',
    quantity: '',
    unit: 'KG',
    priority: 'Medium',
    remarks: '',
    reason: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Export Chef Requirements to CSV
  const handleExportRequirements = async () => {
    try {
      setExporting(true);
      const params = {
        page: 1,
        limit: 1000,
        search: searchTerm,
        priority: filterPriority,
        status: filterStatus,
        datePreset,
        fromDate,
        toDate,
        sortBy,
      };
      if (myOnly) params.myOnly = 'true';

      const res = await chefRequirementService.getAllRequirements(params);
      if (res.success && res.data && res.data.length > 0) {
        const headers = ['Entry ID', 'Date', 'Item Name', 'Quantity', 'Unit', 'Priority', 'Status', 'Remarks', 'Edited', 'Requested By', 'Created At'];
        const rows = res.data.map((r) => [
          r.entryCode || `REQ-${r._id.toString().slice(-4)}`,
          new Date(r.date).toLocaleDateString('en-IN'),
          r.itemName,
          r.quantity,
          r.unit,
          r.priority,
          r.status,
          r.remarks || '',
          r.isEdited ? 'Yes' : 'No',
          r.enteredBy?.name || 'N/A',
          new Date(r.createdAt).toLocaleString('en-IN'),
        ]);
        exportToCsv(myOnly ? 'My_Kitchen_Requests' : 'Chef_Requirements', headers, rows);
        toast.success(`Exported ${rows.length} requirements to CSV`);
      } else {
        toast.error('No requirements to export');
      }
    } catch (err) {
      toast.error('Failed to export requirements');
    } finally {
      setExporting(false);
    }
  };

  // Fetch requirements with server pagination
  const fetchRequirements = async (currentPage = page) => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        search: searchTerm,
        priority: filterPriority,
        status: filterStatus,
        datePreset,
        fromDate,
        toDate,
        sortBy,
      };
      if (myOnly) params.myOnly = 'true';

      const res = await chefRequirementService.getAllRequirements(params);
      if (res.success) {
        setRequirements(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load requirements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements(1);
  }, [
    myOnly,
    searchTerm,
    filterPriority,
    filterStatus,
    datePreset,
    fromDate,
    toDate,
    sortBy,
  ]);

  const handlePageChange = (newPage) => {
    fetchRequirements(newPage);
  };

  const handleDatePreset = (preset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      setFromDate('');
      setToDate('');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterPriority('');
    setFilterStatus('');
    setDatePreset('');
    setFromDate('');
    setToDate('');
    setSortBy('newest');
    setPage(1);
  };

  const handleOpenAdd = () => {
    setEditingReq(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingReq(item);
    setFormData({
      date: new Date(item.date).toISOString().split('T')[0],
      itemName: item.itemName,
      quantity: item.quantity,
      unit: item.unit,
      priority: item.priority,
      remarks: item.remarks || '',
      reason: '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReq(null);
    setFormData(initialFormState);
  };

  const openHistory = (item) => {
    setSelectedHistory(item.editHistory || []);
    setHistoryTitle(`Kitchen Request [${item.entryCode || item._id}] Edit Log`);
    setHistoryModalOpen(true);
  };

  // Trigger Save with duplicate warning check
  const triggerSave = async (addAnother = false) => {
    if (!formData.itemName.trim()) {
      toast.error('Please enter the kitchen item name');
      return;
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (!editingReq) {
      const match = requirements.find(
        (r) =>
          new Date(r.date).toISOString().split('T')[0] === formData.date &&
          r.itemName.trim().toLowerCase() === formData.itemName.trim().toLowerCase() &&
          Number(r.quantity) === Number(formData.quantity)
      );
      if (match && !duplicateWarningOpen) {
        setPendingSubmitAction(() => () => executeSave(addAnother));
        setDuplicateWarningOpen(true);
        return;
      }
    }

    await executeSave(addAnother);
  };

  const executeSave = async (addAnother = false) => {
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
      };

      if (editingReq) {
        const res = await chefRequirementService.updateRequirement(editingReq._id, payload);
        if (res.success) {
          toast.success('Requirement updated!');
          fetchRequirements();
          handleCloseModal();
        }
      } else {
        const res = await chefRequirementService.createRequirement(payload);
        if (res.success) {
          toast.success('Kitchen requirement raised successfully!');
          fetchRequirements(1);
          if (addAnother) {
            setFormData({
              ...initialFormState,
              date: formData.date,
              unit: formData.unit,
              priority: formData.priority,
            });
          } else {
            handleCloseModal();
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save requirement');
    } finally {
      setSubmitting(false);
      setDuplicateWarningOpen(false);
    }
  };

  const handleStatusChange = async (reqId, currentStatus) => {
    const { value: newStatus } = await Swal.fire({
      title: 'Update Requirement Status',
      input: 'select',
      inputOptions: {
        Pending: 'Pending',
        Approved: 'Approved',
        Rejected: 'Rejected',
        Completed: 'Completed',
      },
      inputValue: currentStatus,
      showCancelButton: true,
      confirmButtonColor: '#F97316',
      cancelButtonColor: '#172033',
      confirmButtonText: 'Update Status',
    });

    if (newStatus && newStatus !== currentStatus) {
      try {
        const res = await chefRequirementService.updateRequirementStatus(reqId, newStatus);
        if (res.success) {
          toast.success(`Requirement marked as ${newStatus}`);
          fetchRequirements();
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to update status');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-rose-100 text-rose-800 font-extrabold';
      case 'High':
        return 'bg-orange-100 text-orange-800 font-bold';
      case 'Medium':
        return 'bg-amber-100 text-amber-800 font-semibold';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0E5] text-[#F97316] mb-1.5">
            <ChefHat className="w-3.5 h-3.5" />
            <span>{myOnly ? 'My Kitchen Requests' : 'Kitchen Operations & Requisitions'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033]">
            {myOnly ? 'My Kitchen Requirements' : 'Chef Requirements Log'}
          </h1>
          <p className="text-xs text-[#6B7280]">
            {myOnly
              ? 'Track the approval and fulfillment status of items you requested for daily preparation.'
              : 'Audit, search, filter, and approve raw ingredient and vegetable requisitions.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportRequirements}
            disabled={exporting || total === 0}
            className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#FFF0E5] hover:border-[#F97316] text-[#172033] text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-1.5 text-[#F97316]" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-md shadow-[#F97316]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            Raise Requirement
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ingredient, entry code, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">By Priority</option>
              <option value="status">By Status</option>
            </select>

            {(searchTerm ||
              filterPriority ||
              filterStatus ||
              datePreset ||
              fromDate ||
              toDate ||
              sortBy !== 'newest') && (
              <button
                onClick={handleResetFilters}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
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
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
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

      {/* Requirements Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF8F1] border-b border-[#E5E7EB] text-[11px] font-extrabold uppercase tracking-wider text-[#172033]">
                <th className="py-3.5 px-4 sm:px-6">Entry ID & Date</th>
                <th className="py-3.5 px-4 sm:px-6">Item Required</th>
                <th className="py-3.5 px-4 sm:px-6">Quantity</th>
                <th className="py-3.5 px-4 sm:px-6">Priority</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6">Remarks</th>
                <th className="py-3.5 px-4 sm:px-6">Requested By</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-xs font-medium text-[#374151]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-6">
                    <SkeletonLoader rows={4} />
                  </td>
                </tr>
              ) : requirements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm text-[#172033]">No Kitchen Requirements Found</p>
                      <p className="text-xs text-slate-400">Try adjusting your filters or click "+ Raise Requirement".</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requirements.map((item) => (
                  <tr key={item._id} className="hover:bg-[#FFF8F1]/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#172033] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>
                          {new Date(item.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        {item.isEdited && (
                          <button
                            onClick={() => openHistory(item)}
                            className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold hover:underline cursor-pointer flex items-center gap-1"
                            title="View correction audit history"
                          >
                            <HistoryIcon className="w-3 h-3" /> Edited
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {item.entryCode || `REQ-${item._id.slice(-4)}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-[#172033]">
                      {item.itemName}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-[#F97316] whitespace-nowrap">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] ${getPriorityBadge(
                          item.priority
                        )}`}
                      >
                        {item.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-[#6B7280] max-w-xs truncate">
                      {item.remarks || '—'}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <div className="font-semibold text-[#172033]">{item.enteredBy?.name || 'Chef'}</div>
                      <div className="text-[10px] text-[#6B7280]">
                        {item.lastUpdatedBy ? `Edited by ${item.lastUpdatedBy?.name}` : item.enteredBy?.role || ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setViewingRecord(item)}
                          className="p-1.5 text-slate-500 hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg transition-colors cursor-pointer"
                          title="View Record Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {user?.role !== 'CHEF' && (
                          <button
                            onClick={() => handleStatusChange(item._id, item.status)}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg bg-[#FFF0E5] text-[#F97316] hover:bg-[#F97316] hover:text-white transition-colors cursor-pointer"
                          >
                            Status
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-[#F97316] hover:bg-[#FFF0E5] rounded-lg transition-colors cursor-pointer"
                          title="Edit Requirement"
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

        {/* Server Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-[#FFF0E5] text-[#F97316]">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">
                    {editingReq ? 'Edit Requirement' : 'Raise Kitchen Requirement'}
                  </h3>
                  <p className="text-xs text-[#6B7280]">Daily ingredient request</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                triggerSave(false);
              }}
              className="mt-5 space-y-4"
            >
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full pl-9 pr-4 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Item / Ingredient Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Onion, Cabbage, White Flour, Butter"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316]"
                />
              </div>

              {/* Quantity & Unit Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    inputMode="decimal"
                    required
                    placeholder="e.g. 10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#172033] focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Unit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316]"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Priority <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316]"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Remarks / Usage Details
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Required for evening batch prep by 4 PM"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316]"
                ></textarea>
              </div>

              {/* Reason for correction (if editing) */}
              {editingReq && (
                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1.5">
                    Correction Reason / Audit Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Adjusted vegetable quantity requirement"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-medium text-navy-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                {!editingReq && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => triggerSave(true)}
                    className="px-4 py-2 rounded-xl border border-orange-200 bg-orange-50 text-[#F97316] hover:bg-orange-100 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    Save & Add Another
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-md shadow-[#F97316]/20 disabled:opacity-50 flex items-center cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingReq ? 'Update Request' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Details Modal */}
      <RecordDetailsModal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Kitchen Requirement Details"
        data={viewingRecord}
      />

      {/* Edit History Modal */}
      <EditHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        recordTitle={historyTitle}
        editHistory={selectedHistory}
      />

      {/* Duplicate Warning Modal */}
      <DuplicateWarningModal
        isOpen={duplicateWarningOpen}
        onCancel={() => setDuplicateWarningOpen(false)}
        onConfirm={() => {
          if (pendingSubmitAction) pendingSubmitAction();
        }}
        title="Possible Duplicate Kitchen Requisition"
        message={`A kitchen requirement for "${formData.itemName}" (${formData.quantity} ${formData.unit}) is already recorded on ${formData.date}. Do you want to submit anyway?`}
      />
    </div>
  );
};

export default ChefRequirements;
