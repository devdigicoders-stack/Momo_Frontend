import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import momoPurchaseService, { momoTypeService } from '../../services/momoPurchaseService';
import MomoTypeModal from './MomoTypeModal';
import Pagination from '../../components/Pagination';
import RecordDetailsModal from '../../components/RecordDetailsModal';
import EditHistoryModal from '../../components/EditHistoryModal';
import DuplicateWarningModal from '../../components/DuplicateWarningModal';
import exportToCsv from '../../utils/exportToCsv';
import {
  ShoppingBag,
  Plus,
  Search,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  X,
  RotateCcw,
  Layers,
  Calculator,
  FileText,
  Eye,
  Download,
  Lock,
  History as HistoryIcon,
} from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Net Banking', 'Canara / Bank', 'Paytm', 'PhonePe', 'Other'];

const DEFAULT_MOMO_TYPES = [
  { name: 'Veg', defaultRate: 5.00, isActive: true },
  { name: 'Paneer', defaultRate: 6.67, isActive: true },
  { name: 'Butter Cheese Sweetcorn', defaultRate: 7.50, isActive: true },
  { name: 'Chaap', defaultRate: 7.50, isActive: true },
  { name: 'Mushroom', defaultRate: 8.33, isActive: true },
];

const MomoPurchaseEntry = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [momoTypes, setMomoTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
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

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [datePreset, setDatePreset] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Form state
  const initialFormState = {
    date: new Date().toISOString().split('T')[0],
    momoType: '',
    quantity: '',
    rate: '',
    remarks: '',
    reason: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Export Momo Purchases to CSV
  const handleExportPurchases = async () => {
    try {
      setExporting(true);
      const res = await momoPurchaseService.getAllPurchases({
        page: 1,
        limit: 1000,
        search: searchTerm,
        momoType: filterType,
        datePreset,
        fromDate,
        toDate,
        sortBy,
      });

      if (res.success && res.data && res.data.length > 0) {
        const headers = ['Entry ID', 'Date', 'Momo Type', 'Total Qty (Pcs)', 'Payable Qty (90%)', 'Rate (Rs.)', 'Total Amount (Rs.)', 'Remarks', 'Edited', 'Entered By', 'Created At'];
        const rows = res.data.map((p) => [
          p.entryCode || `MOM-${p._id.toString().slice(-4)}`,
          new Date(p.date).toLocaleDateString('en-IN'),
          p.momoType,
          p.quantity,
          (p.quantity * 0.9).toFixed(0),
          p.rate,
          p.totalAmount,
          p.remarks || '',
          p.isEdited ? 'Yes' : 'No',
          p.enteredBy?.name || 'N/A',
          new Date(p.createdAt).toLocaleString('en-IN'),
        ]);
        exportToCsv('Momo_Purchases', headers, rows);
        toast.success(`Exported ${rows.length} momo purchases to CSV`);
      } else {
        toast.error('No momo purchases to export');
      }
    } catch (err) {
      toast.error('Failed to export momo purchases');
    } finally {
      setExporting(false);
    }
  };

  // Fetch Types
  const fetchTypes = async () => {
    try {
      const res = await momoTypeService.getAllMomoTypes();
      if (res.success && res.data && res.data.length > 0) {
        setMomoTypes(res.data);
      } else {
        setMomoTypes(DEFAULT_MOMO_TYPES);
      }
    } catch (error) {
      console.error('Failed to load momo types:', error);
      setMomoTypes(DEFAULT_MOMO_TYPES);
    }
  };

  // Fetch Purchases with server pagination
  const fetchPurchases = async (currentPage = page) => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit,
        search: searchTerm,
        momoType: filterType,
        datePreset,
        fromDate,
        toDate,
        sortBy,
      };

      const res = await momoPurchaseService.getAllPurchases(params);
      if (res.success) {
        setPurchases(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load momo purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  useEffect(() => {
    fetchPurchases(1);
  }, [searchTerm, filterType, datePreset, fromDate, toDate, sortBy]);

  const handlePageChange = (newPage) => {
    fetchPurchases(newPage);
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
    setFilterType('');
    setDatePreset('');
    setFromDate('');
    setToDate('');
    setSortBy('newest');
    setPage(1);
  };

  const handleTypeSelect = (typeName) => {
    const selected = momoTypes.find((t) => t.name === typeName);
    setFormData((prev) => ({
      ...prev,
      momoType: typeName,
      rate: selected && selected.defaultRate !== undefined ? selected.defaultRate : prev.rate,
    }));
  };

  // Payment Quantity Rule: Pay for 90% of total momo quantity (e.g. 1000 pcs -> pay for 900 pcs)
  const rawQuantity = Number(formData.quantity) || 0;
  const payableQuantity = rawQuantity * 0.90;
  const calculatedTotal = Number((payableQuantity * (Number(formData.rate) || 0)).toFixed(2));

  const handleOpenAdd = () => {
    setEditingPurchase(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingPurchase(item);
    setFormData({
      date: new Date(item.date).toISOString().split('T')[0],
      momoType: item.momoType,
      quantity: item.quantity,
      rate: item.rate,
      supplierName: item.supplierName || '',
      paymentMode: item.paymentMode,
      remarks: item.remarks || '',
      reason: '',
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPurchase(null);
    setFormData(initialFormState);
  };

  const openHistory = (item) => {
    setSelectedHistory(item.editHistory || []);
    setHistoryTitle(`Momo Purchase [${item.entryCode || item._id}] Edit Log`);
    setHistoryModalOpen(true);
  };

  // Trigger Save with duplicate warning check
  const triggerSave = async (addAnother = false) => {
    if (!formData.momoType) {
      toast.error('Please select a momo type');
      return;
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      toast.error('Please enter a valid quantity greater than 0');
      return;
    }

    if (formData.rate === '' || Number(formData.rate) < 0) {
      toast.error('Please enter a valid rate');
      return;
    }

    if (!editingPurchase) {
      const match = purchases.find(
        (p) =>
          new Date(p.date).toISOString().split('T')[0] === formData.date &&
          p.momoType === formData.momoType &&
          Number(p.quantity) === Number(formData.quantity)
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
        rate: Number(formData.rate),
        totalAmount: calculatedTotal,
      };

      if (editingPurchase) {
        const res = await momoPurchaseService.updatePurchase(editingPurchase._id, payload);
        if (res.success) {
          toast.success('Momo purchase updated!');
          fetchPurchases();
          handleCloseModal();
        }
      } else {
        const res = await momoPurchaseService.createPurchase(payload);
        if (res.success) {
          toast.success('Momo purchase entry recorded!');
          fetchPurchases(1);
          if (addAnother) {
            setFormData({
              ...initialFormState,
              date: formData.date,
              momoType: formData.momoType,
              rate: formData.rate,
              paymentMode: formData.paymentMode,
            });
          } else {
            handleCloseModal();
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record purchase');
    } finally {
      setSubmitting(false);
      setDuplicateWarningOpen(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Momo Purchase?',
      text: 'Are you sure you want to remove this purchase record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#172033',
      confirmButtonText: 'Yes, delete it',
    });

    if (result.isConfirmed) {
      try {
        const res = await momoPurchaseService.deletePurchase(id);
        if (res.success) {
          toast.success('Purchase record deleted');
          fetchPurchases();
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete record');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0E5] text-[#F97316] mb-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Procurement & Batch Inward</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172033]">
            Momo Purchase Records
          </h1>
          <p className="text-xs text-[#6B7280]">
            Track raw momo batch inward procurement with locked predefined rates and audit tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPurchases}
            disabled={exporting || total === 0}
            className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] hover:bg-[#FFF0E5] hover:border-[#F97316] text-[#172033] text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-1.5 text-[#F97316]" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>

          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setShowTypeModal(true)}
              className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-[#FFF8F1] hover:bg-[#FFF0E5] text-[#172033] border border-[#E5E7EB] text-xs font-bold transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 mr-1.5 text-[#F97316]" />
              Momo Types Master
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-md shadow-[#F97316]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5 stroke-[2.5]" />
            New Momo Purchase
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
              placeholder="Search supplier, entry code, remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Momo Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-[#FFF8F1]/60 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316] cursor-pointer"
            >
              <option value="">All Momo Types</option>
              {momoTypes.map((type) => (
                <option key={type._id} value={type.name}>
                  {type.name}
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
              <option value="amount">Total Amount (High to Low)</option>
              <option value="quantity">Quantity (High to Low)</option>
            </select>

            {(searchTerm ||
              filterType ||
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

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF8F1] border-b border-[#E5E7EB] text-[11px] font-extrabold uppercase tracking-wider text-[#172033]">
                <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">Entry ID & Date</th>
                <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">Momo Type</th>
                <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">Total Qty (Pcs)</th>
                <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">Payable Qty (90%)</th>
                <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">Rate (₹)</th>
                <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">Total Amount</th>
                <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap">Entered By</th>
                <th className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-xs font-medium text-[#374151]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-6">
                    <SkeletonLoader rows={4} />
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm text-[#172033]">No Momo Purchases Found</p>
                      <p className="text-xs text-slate-400">Try adjusting your filters or record a new purchase.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                purchases.map((item) => (
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
                        {item.entryCode || `MOM-${item._id.slice(-4)}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-[#F97316] whitespace-nowrap">
                      {item.momoType}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-[#172033] whitespace-nowrap text-right">
                      {item.quantity?.toLocaleString('en-IN')} pcs
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 font-bold text-xs">
                        {(item.quantity * 0.90).toFixed(0)} pcs
                      </span>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-600 whitespace-nowrap text-right">
                      ₹{item.rate}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-[#16A34A] text-sm whitespace-nowrap text-right">
                      ₹{item.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <div className="font-semibold text-[#172033]">{item.enteredBy?.name || 'Staff'}</div>
                      <div className="text-[10px] text-[#6B7280]">
                        {item.lastUpdatedBy ? `Edited by ${item.lastUpdatedBy?.name}` : item.enteredBy?.role || ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setViewingRecord(item)}
                          className="p-1.5 text-slate-500 hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg transition-colors cursor-pointer"
                          title="View Record Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-[#F97316] hover:bg-[#FFF0E5] rounded-lg transition-colors cursor-pointer"
                          title="Edit Entry"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {user?.role !== 'MANAGER_2' && (
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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

      {/* Add / Edit Momo Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto transition-all duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E7EB] animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-[#FFF0E5] text-[#F97316]">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">
                    {editingPurchase ? 'Edit Momo Purchase' : 'New Momo Purchase'}
                  </h3>
                  <p className="text-xs text-[#6B7280]">Batch procurement entry</p>
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

              {/* Momo Type */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Momo Type / Variety <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={formData.momoType}
                  onChange={(e) => handleTypeSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:outline-none focus:border-[#F97316]"
                >
                  <option value="">Select Momo Type</option>
                  {momoTypes
                    .filter((t) => t.isActive)
                    .map((type) => (
                      <option key={type._id} value={type.name}>
                        {type.name} (Default ₹{type.defaultRate || 0})
                      </option>
                    ))}
                </select>
              </div>

              {/* Quantity & Rate Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    required
                    placeholder="e.g. 50"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#172033] focus:outline-none focus:border-[#F97316]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1 flex items-center justify-between">
                    <span>Rate (₹ per item)</span>
                    <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> Predefined Rate
                    </span>
                  </label>
                  <div className="relative">
                    <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      readOnly
                      placeholder="Auto rate"
                      value={formData.rate}
                      className="w-full pl-7 pr-4 py-2 bg-slate-100 border border-[#E5E7EB] rounded-xl text-xs font-bold text-[#374151] cursor-not-allowed outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Calculated Total Amount Box (90% Quantity Rule) */}
              <div className="p-3.5 bg-[#FFF0E5] rounded-2xl border border-[#F97316]/30 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#172033]">
                  <div className="flex items-center space-x-2">
                    <Calculator className="w-4 h-4 text-[#F97316]" />
                    <span>Calculated Total Amount:</span>
                  </div>
                  <div className="text-base font-black text-[#F97316]">
                    ₹{calculatedTotal.toLocaleString('en-IN')}
                  </div>
                </div>
                {rawQuantity > 0 && (
                  <div className="text-[11px] text-[#6B7280] font-medium pt-1 border-t border-[#F97316]/20 flex items-center justify-between">
                    <span>Payable for 90% Qty: <b>{payableQuantity.toFixed(1)} pcs</b> (out of {rawQuantity} pcs)</span>
                    <span className="text-orange-600 font-bold">₹{formData.rate || 0}/pc</span>
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Remarks / Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Batch delivered fresh at 11 AM"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-[#FFF8F1]/40 border border-[#E5E7EB] rounded-xl text-xs font-medium text-[#172033] focus:outline-none focus:border-[#F97316]"
                ></textarea>
              </div>

              {/* Reason for correction (if editing) */}
              {editingPurchase && (
                <div>
                  <label className="block text-xs font-bold text-amber-800 mb-1.5">
                    Correction Reason / Audit Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Corrected batch plate count"
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
                {!editingPurchase && (
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
                  {submitting ? 'Saving...' : editingPurchase ? 'Update Purchase' : 'Save Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Momo Types Master Modal */}
      <MomoTypeModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        momoTypes={momoTypes}
        onTypesUpdated={() => fetchTypes()}
      />

      {/* Record Details Modal */}
      <RecordDetailsModal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Momo Purchase Record Details"
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
        title="Possible Duplicate Momo Purchase"
        message={`A purchase of ${formData.quantity} units of ${formData.momoType} is already recorded on ${formData.date}. Do you want to proceed anyway?`}
      />
    </div>
  );
};

export default MomoPurchaseEntry;
