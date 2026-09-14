import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import settingService from '../../services/settingService';
import { momoTypeService } from '../../services/momoPurchaseService';
import { expenseCategoryService } from '../../services/expenseService';
import {
  Settings as SettingsIcon,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  FileText,
  IndianRupee,
  ShoppingBag,
  Layers,
  Plus,
  Check,
  Save,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Restaurant Settings State
  const [formData, setFormData] = useState({
    restaurantName: '',
    tagline: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    fssaiNumber: '',
    currencySymbol: '₹',
    currencyCode: 'INR',
    openingTime: '',
    closingTime: '',
    defaultPaymentMode: 'UPI',
    billFooterNote: '',
  });

  // Momo Types Master State
  const [momoTypes, setMomoTypes] = useState([]);
  const [newMomoType, setNewMomoType] = useState({ name: '', defaultRate: '' });
  const [addingMomoType, setAddingMomoType] = useState(false);

  // Expense Categories Master State
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [settingsRes, momoTypesRes, catRes] = await Promise.all([
        settingService.getSettings(),
        momoTypeService.getAllMomoTypes(),
        expenseCategoryService.getAllCategories(),
      ]);

      if (settingsRes.success && settingsRes.data) {
        setFormData({
          restaurantName: settingsRes.data.restaurantName || '',
          tagline: settingsRes.data.tagline || '',
          phone: settingsRes.data.phone || '',
          email: settingsRes.data.email || '',
          address: settingsRes.data.address || '',
          gstNumber: settingsRes.data.gstNumber || '',
          fssaiNumber: settingsRes.data.fssaiNumber || '',
          currencySymbol: settingsRes.data.currencySymbol || '₹',
          currencyCode: settingsRes.data.currencyCode || 'INR',
          openingTime: settingsRes.data.openingTime || '',
          closingTime: settingsRes.data.closingTime || '',
          defaultPaymentMode: settingsRes.data.defaultPaymentMode || 'UPI',
          billFooterNote: settingsRes.data.billFooterNote || '',
        });
      }

      if (momoTypesRes.success) {
        setMomoTypes(momoTypesRes.data || []);
      }

      if (catRes.success) {
        setCategories(catRes.data || []);
        if (catRes.data && catRes.data.length > 0 && !selectedCatId) {
          setSelectedCatId(catRes.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Settings load error:', error);
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Save Restaurant Profile Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await settingService.updateSettings(formData);
      if (res.success) {
        toast.success('Restaurant profile updated successfully!');
      }
    } catch (error) {
      console.error('Update settings error:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  // Add Momo Type
  const handleAddMomoType = async (e) => {
    e.preventDefault();
    if (!newMomoType.name.trim()) {
      toast.error('Momo type name is required');
      return;
    }
    try {
      setAddingMomoType(true);
      const res = await momoTypeService.createMomoType({
        name: newMomoType.name.trim(),
        defaultRate: Number(newMomoType.defaultRate) || 0,
      });
      if (res.success) {
        toast.success('New momo type added!');
        setNewMomoType({ name: '', defaultRate: '' });
        const updated = await momoTypeService.getAllMomoTypes();
        setMomoTypes(updated.data || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add momo type');
    } finally {
      setAddingMomoType(false);
    }
  };

  // Toggle Momo Type Status
  const handleToggleMomoType = async (id) => {
    try {
      const res = await momoTypeService.toggleMomoTypeStatus(id);
      if (res.success) {
        toast.success(res.message || 'Status updated');
        const updated = await momoTypeService.getAllMomoTypes();
        setMomoTypes(updated.data || []);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Add Expense Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      setAddingCategory(true);
      const res = await expenseCategoryService.createCategory({
        name: newCategoryName.trim(),
        subcategories: [],
      });
      if (res.success) {
        toast.success('New expense category created!');
        setNewCategoryName('');
        const updated = await expenseCategoryService.getAllCategories();
        setCategories(updated.data || []);
        setSelectedCatId(res.data._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  };

  // Add Subcategory to Selected Category
  const handleAddSubcategory = async (e) => {
    e.preventDefault();
    if (!selectedCatId) {
      toast.error('Please select a category first');
      return;
    }
    if (!newSubcategoryName.trim()) {
      toast.error('Subcategory name is required');
      return;
    }

    const currentCat = categories.find((c) => c._id === selectedCatId);
    if (!currentCat) return;

    const existingSubNames = (currentCat.subcategories || []).map((s) =>
      typeof s === 'string' ? s : s.name
    );

    if (existingSubNames.includes(newSubcategoryName.trim())) {
      toast.error('Subcategory already exists in this category');
      return;
    }

    try {
      const updatedSubs = [
        ...(currentCat.subcategories || []),
        { name: newSubcategoryName.trim(), isActive: true },
      ];

      const res = await expenseCategoryService.updateCategory(selectedCatId, {
        subcategories: updatedSubs,
      });

      if (res.success) {
        toast.success(`Added "${newSubcategoryName.trim()}" subcategory`);
        setNewSubcategoryName('');
        const updated = await expenseCategoryService.getAllCategories();
        setCategories(updated.data || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add subcategory');
    }
  };

  const selectedCategory = categories.find((c) => c._id === selectedCatId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#172033] tracking-tight flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-[#F97316]" />
          System Settings & Master Data
        </h1>
        <p className="text-xs font-semibold text-[#6B7280] mt-1">
          Configure restaurant business profile, operating timings, momo item masters, and expense categories
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-[#E5E7EB] space-x-1 overflow-x-auto">
        {[
          { id: 'profile', label: 'Restaurant Profile', icon: Building2 },
          { id: 'momoTypes', label: 'Momo Types Master', icon: ShoppingBag },
          { id: 'categories', label: 'Expense Categories Master', icon: Layers },
          { id: 'preferences', label: 'Billing & Preferences', icon: IndianRupee },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-[#F97316] text-[#F97316] bg-[#FFF0E5]/40'
                  : 'border-transparent text-[#6B7280] hover:text-[#172033] hover:border-[#D1D5DB]'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <SkeletonLoader count={3} />
      ) : (
        <>
          {/* TAB 1: RESTAURANT PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <h2 className="text-sm font-black text-[#172033] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#F97316]" />
                    Business Identification & Contact
                  </h2>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Store
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">
                      Restaurant Name <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.restaurantName}
                      onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">Tagline / Slogan</label>
                    <input
                      type="text"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">
                      Primary Contact Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">
                      Official Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden shadow-2xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">
                      Store Physical Address
                    </label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden shadow-2xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-[#E5E7EB] pt-3 pb-3">
                  <h2 className="text-sm font-black text-[#172033] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#F97316]" />
                    Tax & Statutory Licenses
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">GST Number</label>
                    <input
                      type="text"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                      placeholder="e.g. 09AAACH7409R1ZZ"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">FSSAI License No.</label>
                    <input
                      type="text"
                      value={formData.fssaiNumber}
                      onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value })}
                      placeholder="e.g. 12724055000123"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden shadow-2xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-[#E5E7EB] pt-3 pb-3">
                  <h2 className="text-sm font-black text-[#172033] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#F97316]" />
                    Store Operating Timings
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">Opening Time</label>
                    <input
                      type="text"
                      value={formData.openingTime}
                      onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                      placeholder="e.g. 11:00 AM"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">Closing Time</label>
                    <input
                      type="text"
                      value={formData.closingTime}
                      onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                      placeholder="e.g. 11:00 PM"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs rounded-xl shadow-md shadow-[#F97316]/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MOMO TYPES MASTER */}
          {activeTab === 'momoTypes' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Add New Momo Type Card */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 space-y-4">
                <h2 className="text-sm font-black text-[#172033] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#F97316]" />
                  Add New Momo Variety
                </h2>

                <form onSubmit={handleAddMomoType} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1">
                      Momo Type Name <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paneer Fried Momo"
                      value={newMomoType.name}
                      onChange={(e) => setNewMomoType({ ...newMomoType, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1">
                      Default Rate (₹ / Unit)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="e.g. 5.5"
                      value={newMomoType.defaultRate}
                      onChange={(e) => setNewMomoType({ ...newMomoType, defaultRate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={addingMomoType}
                      className="w-full py-2 bg-[#172033] hover:bg-[#232F48] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 text-[#F97316]" />
                      <span>{addingMomoType ? 'Adding...' : 'Add Variety'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Master Momo Types Table */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFAFA]">
                  <h2 className="text-sm font-black text-[#172033]">Available Momo Varieties</h2>
                  <span className="text-xs font-bold text-[#6B7280]">{momoTypes.length} Active Items</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E5E7EB] bg-[#FFF8F1] text-[#6B7280] font-bold">
                        <th className="px-6 py-3">Variety Name</th>
                        <th className="px-6 py-3">Default Rate</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                      {momoTypes.map((momo) => (
                        <tr key={momo._id} className="hover:bg-[#FFF8F1]/40 transition-colors">
                          <td className="px-6 py-3 font-bold text-[#172033] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                            {momo.name}
                          </td>
                          <td className="px-6 py-3 font-semibold text-[#374151]">
                            ₹{momo.defaultRate || 0} / unit
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                momo.isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {momo.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => handleToggleMomoType(momo._id)}
                              className="text-xs font-semibold text-[#6B7280] hover:text-[#F97316] transition-colors"
                            >
                              {momo.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXPENSE CATEGORIES MASTER */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Add New Category */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 space-y-4">
                <h2 className="text-sm font-black text-[#172033] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#F97316]" />
                  Create New Expense Head / Category
                </h2>

                <form onSubmit={handleAddCategory} className="flex gap-3">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marketing & Promotions"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={addingCategory}
                    className="px-5 py-2 bg-[#172033] hover:bg-[#232F48] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 text-[#F97316]" />
                    <span>{addingCategory ? 'Creating...' : 'Create Category'}</span>
                  </button>
                </form>
              </div>

              {/* Category & Subcategory Split View */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Categories List */}
                <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA] font-bold text-xs text-[#172033]">
                    Categories ({categories.length})
                  </div>
                  <div className="divide-y divide-[#F3F4F6] max-h-96 overflow-y-auto">
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => setSelectedCatId(cat._id)}
                        className={`w-full text-left px-4 py-3 text-xs font-bold transition-all flex items-center justify-between ${
                          selectedCatId === cat._id
                            ? 'bg-[#FFF0E5] text-[#F97316] border-l-4 border-[#F97316]'
                            : 'text-[#374151] hover:bg-slate-50'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-[10px] font-semibold bg-white text-[#6B7280] px-2 py-0.5 rounded-full border border-[#E5E7EB]">
                          {cat.subcategories?.length || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subcategories Management */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 space-y-4">
                  {selectedCategory ? (
                    <>
                      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                        <div>
                          <h3 className="text-sm font-black text-[#172033]">
                            {selectedCategory.name}
                          </h3>
                          <p className="text-[11px] text-[#6B7280]">
                            Manage sub-heads and expense items under this category
                          </p>
                        </div>
                      </div>

                      {/* Add Subcategory Form */}
                      <form onSubmit={handleAddSubcategory} className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Add subcategory (e.g. Packaging Boxes)"
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Sub-head</span>
                        </button>
                      </form>

                      {/* Existing Subcategories Pills */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-[#6B7280] mb-2 uppercase tracking-wider">
                          Configured Subcategories
                        </label>
                        {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedCategory.subcategories.map((sub, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FFF8F1] text-[#374151] border border-[#FFF0E5]"
                              >
                                {typeof sub === 'string' ? sub : sub.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-[#6B7280] italic">
                            No subcategories added yet. Use the input above to add subcategories.
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center text-xs text-[#6B7280]">
                      Select a category from the left column to configure its subcategories.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PREFERENCES & BILLING */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSaveSettings} className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <h2 className="text-sm font-black text-[#172033] flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-[#F97316]" />
                    Currency & Default Billing Configuration
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">Currency Symbol</label>
                    <input
                      type="text"
                      value={formData.currencySymbol}
                      onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">Currency Code</label>
                    <input
                      type="text"
                      value={formData.currencyCode}
                      onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">
                      Default Payment Mode
                    </label>
                    <select
                      value={formData.defaultPaymentMode}
                      onChange={(e) => setFormData({ ...formData, defaultPaymentMode: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden shadow-2xs"
                    >
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Net Banking">Net Banking</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-[#374151] mb-1.5">
                      Receipt / Bill Footer Note
                    </label>
                    <textarea
                      rows={3}
                      value={formData.billFooterNote}
                      onChange={(e) => setFormData({ ...formData, billFooterNote: e.target.value })}
                      placeholder="e.g. Thank you for dining with Momos Bhandar! Visit Again."
                      className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs font-semibold text-[#172033] focus:ring-2 focus:ring-[#F97316] outline-hidden shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-xs rounded-xl shadow-md shadow-[#F97316]/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default Settings;
