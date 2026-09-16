import React, { useState, useEffect } from 'react';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { SkeletonTable } from '../../components/SkeletonLoader';
import Tooltip from '../../components/Tooltip';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Users as UsersIcon,
  UserPlus,
  Edit2,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  X,
  Lock,
  Phone,
  Mail,
  User,
  Shield,
  Filter,
  RefreshCw
} from 'lucide-react';

const ROLES_LIST = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'MAIN_MANAGER', label: 'Main Manager', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'MANAGER_2', label: 'Manager 2', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'CHEF', label: 'Chef', badgeClass: 'bg-[#FFF0E5] text-[#F97316] border-[#FFEDD5]' }
];

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [selectedUser, setSelectedUser] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'MAIN_MANAGER',
    isActive: true
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async (showToast = false) => {
    try {
      setLoading(true);
      const res = await userService.getAllUsers();
      if (res.success) {
        setUsers(res.users || []);
        if (showToast) {
          toast.success('User records refreshed');
        }
      }
    } catch (err) {
      toast.error('Failed to load users');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      mobile: '',
      password: '',
      role: 'MAIN_MANAGER',
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode('EDIT');
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      mobile: user.mobile,
      password: '',
      role: user.role,
      isActive: user.isActive
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Full Name is required');
      return;
    }

    if (!formData.email.trim() || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email.trim())) {
      toast.error('Please provide a valid email address');
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.mobile.trim())) {
      toast.error('Please provide a valid 10-digit mobile number');
      return;
    }

    if (modalMode === 'CREATE' && (!formData.password || formData.password.length < 6)) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (modalMode === 'EDIT' && formData.password && formData.password.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setFormLoading(true);
      if (modalMode === 'CREATE') {
        const res = await userService.createUser(formData);
        if (res.success) {
          setIsModalOpen(false);
          toast.success(`User "${formData.name}" created successfully!`);
          fetchUsers();
        }
      } else {
        const payload = {
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          role: formData.role,
          isActive: formData.isActive
        };
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        const res = await userService.updateUser(selectedUser._id, payload);
        if (res.success) {
          setIsModalOpen(false);
          toast.success(`User details for "${formData.name}" updated!`);
          fetchUsers();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const confirmToggleStatus = (targetUser) => {
    const isDeactivating = targetUser.isActive;
    const actionText = isDeactivating ? 'Deactivate' : 'Activate';
    const confirmColor = isDeactivating ? '#DC2626' : '#16A34A';

    Swal.fire({
      title: `${actionText} User?`,
      html: `Are you sure you want to <strong>${actionText.toLowerCase()}</strong> <span style="color:#F97316">${targetUser.name}</span> (${targetUser.email})?${
        isDeactivating ? '<br/><small style="color:#6B7280">They will be immediately prevented from logging into the portal.</small>' : ''
      }`,
      icon: isDeactivating ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#94a3b8',
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-2xl shadow-xl border border-[#E5E7EB]',
        title: 'text-[#172033] font-bold text-lg',
        confirmButton: 'rounded-xl text-sm font-semibold px-4 py-2',
        cancelButton: 'rounded-xl text-sm font-semibold px-4 py-2'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await userService.toggleUserStatus(targetUser._id, !targetUser.isActive);
          if (res.success) {
            toast.success(`User ${targetUser.name} ${!targetUser.isActive ? 'activated' : 'deactivated'}`);
            fetchUsers();
          }
        } catch (err) {
          Swal.fire({
            icon: 'error',
            title: 'Action Failed',
            text: err.response?.data?.message || 'Failed to change user status',
            confirmButtonColor: '#F97316'
          });
        }
      }
    });
  };

  const getRoleBadge = (roleCode) => {
    const found = ROLES_LIST.find((r) => r.value === roleCode);
    return found || { label: roleCode, badgeClass: 'bg-slate-100 text-[#374151] border-[#E5E7EB]' };
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.mobile.includes(searchQuery);
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-2xl font-black text-[#172033] tracking-tight flex items-center">
            User Management
            <Tooltip text="Total registered users across all roles" position="right">
              <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF0E5] text-[#F97316] border border-[#FFEDD5] cursor-help">
                {users.length} Total
              </span>
            </Tooltip>
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Configure system users, email credentials, access permissions, and activation states.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-2">
          <Tooltip text="Refresh user list" position="bottom">
            <button
              onClick={() => fetchUsers(true)}
              className="p-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[#374151] hover:text-[#172033] hover:bg-[#FFF0E5] shadow-xs transition-colors"
              aria-label="Refresh user list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </Tooltip>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-bold rounded-xl shadow-md shadow-[#F97316]/20 transition-all transform active:scale-95"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add New User
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FFF8F1] border border-[#E5E7EB] rounded-xl text-sm text-[#172033] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316] transition-all font-medium"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-[#6B7280] hidden sm:block" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-48 px-3.5 py-2.5 bg-[#FFF8F1] border border-[#E5E7EB] rounded-xl text-sm text-[#172033] font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-[#F97316]"
            >
              <option value="ALL">All Roles</option>
              {ROLES_LIST.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chakra UI Styled Modern Data Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF8F1] border-b border-[#E5E7EB] text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280]">
                <th className="py-4 px-4 sm:px-6">User / Name</th>
                <th className="py-4 px-4">Email ID</th>
                <th className="py-4 px-4">Mobile</th>
                <th className="py-4 px-4">Role</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 hidden md:table-cell">Created At</th>
                <th className="py-4 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>

            {loading ? (
              <SkeletonTable rows={5} />
            ) : filteredUsers.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <UsersIcon className="w-12 h-12 text-[#6B7280] mx-auto mb-3" />
                    <h3 className="text-base font-bold text-[#172033]">No matching users found</h3>
                    <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
                      Try searching with a different keyword or reset your role filter.
                    </p>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-[#E5E7EB] text-sm">
                {filteredUsers.map((u) => {
                  const roleObj = getRoleBadge(u.role);
                  const isSelf = currentUser?.id === u._id;

                  return (
                    <tr key={u._id} className="hover:bg-[#FFF0E5]/40 transition-colors group">
                      <td className="py-4 px-4 sm:px-6 font-medium text-[#172033]">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-[#172033] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-[#172033]">{u.name}</span>
                              {isSelf && (
                                <Tooltip text="Your current active session" position="top">
                                  <span className="text-[10px] font-bold text-[#F97316] bg-[#FFF0E5] px-1.5 py-0.2 rounded-md cursor-default">
                                    You
                                  </span>
                                </Tooltip>
                              )}
                            </div>
                            <span className="text-xs text-[#6B7280] md:hidden block font-mono">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[#374151] text-xs font-mono">
                        {u.email || '-'}
                      </td>
                      <td className="py-4 px-4 font-mono text-[#374151] text-xs">
                        {u.mobile}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-lg border ${roleObj.badgeClass}`}>
                          {roleObj.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mr-1.5 animate-pulse"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] mr-1.5"></span>
                            Deactivated
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-[#6B7280] hidden md:table-cell">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Tooltip text="Edit user details" position="top">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-2 rounded-xl text-[#374151] hover:text-[#F97316] hover:bg-[#FFF0E5] transition-colors"
                              aria-label="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </Tooltip>

                          <Tooltip
                            text={
                              isSelf && u.isActive
                                ? 'Cannot deactivate self'
                                : u.isActive
                                ? 'Deactivate account'
                                : 'Activate account'
                            }
                            position="top"
                          >
                            <button
                              onClick={() => confirmToggleStatus(u)}
                              disabled={isSelf && u.isActive}
                              className={`p-2 rounded-xl transition-colors ${
                                u.isActive
                                  ? 'text-[#6B7280] hover:text-[#DC2626] hover:bg-red-50'
                                  : 'text-[#6B7280] hover:text-[#16A34A] hover:bg-emerald-50'
                              } ${isSelf ? 'opacity-30 cursor-not-allowed' : ''}`}
                              aria-label={u.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              {u.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 transition-all duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-[#E5E7EB] animate-in zoom-in-95 duration-150 relative z-[101]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF0E5] text-[#F97316] flex items-center justify-center font-bold border border-[#FFEDD5]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#172033]">
                    {modalMode === 'CREATE' ? 'Add System User' : 'Edit User Details'}
                  </h2>
                  <p className="text-xs text-[#6B7280]">Specify user credentials, role and permissions</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-[#6B7280] hover:text-[#172033] rounded-lg hover:bg-[#FFF0E5] transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Full Name <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#172033] placeholder-slate-400 focus:border-[#F97316] focus:ring-2 focus:ring-[#FFF0E5] focus:outline-none transition-all font-medium"
                  />
                </div>
              </div>

              {/* Email and Mobile 2-column on desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Email Address <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="user@momosbhandar.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#172033] placeholder-slate-400 focus:border-[#F97316] focus:ring-2 focus:ring-[#FFF0E5] focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Mobile Number <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      placeholder="10-digit mobile"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                      className="w-full pl-10 pr-3.5 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#172033] placeholder-slate-400 focus:border-[#F97316] focus:ring-2 focus:ring-[#FFF0E5] focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Password and Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    {modalMode === 'CREATE' ? 'Password *' : 'New Password (Optional)'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      placeholder={modalMode === 'CREATE' ? 'Min 6 chars' : 'Leave empty to keep'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-3.5 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#172033] placeholder-slate-400 focus:border-[#F97316] focus:ring-2 focus:ring-[#FFF0E5] focus:outline-none transition-all font-medium"
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Role Assignment <span className="text-[#DC2626]">*</span>
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full pl-10 pr-8 py-2 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#172033] focus:border-[#F97316] focus:ring-2 focus:ring-[#FFF0E5] focus:outline-none transition-all font-medium appearance-none cursor-pointer"
                    >
                      {ROLES_LIST.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#6B7280]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status toggle in edit mode */}
              {modalMode === 'EDIT' && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#FFF8F1] border border-[#E5E7EB]">
                  <div>
                    <span className="text-xs font-bold text-[#172033] block">
                      Account Status
                    </span>
                    <span className="text-[11px] text-[#6B7280]">
                      {formData.isActive ? 'User can log in and access system' : 'User access is blocked'}
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F97316]"></div>
                    <span className={`ml-2.5 text-xs font-bold ${formData.isActive ? 'text-[#16A34A]' : 'text-[#6B7280]'}`}>
                      {formData.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </label>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#E5E7EB] text-[#374151] text-sm font-semibold rounded-lg hover:bg-[#FFF0E5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow disabled:opacity-60 flex items-center transition-all"
                >
                  {formLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {modalMode === 'CREATE' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
