import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Shield,
  KeyRound,
  Lock,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'MAIN_MANAGER':
        return { label: 'Main Manager', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'MANAGER_2':
        return { label: 'Manager 2', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'CHEF':
        return { label: 'Chef', badgeClass: 'bg-[#FFF0E5] text-[#F97316] border-[#FFEDD5]' };
      default:
        return { label: role || 'Staff', badgeClass: 'bg-slate-100 text-[#374151] border-[#E5E7EB]' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  // Handle Profile Update (Name & Mobile)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Full name is required');
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile.trim())) {
      toast.error('Valid 10-digit mobile number is required');
      return;
    }

    try {
      setProfileLoading(true);
      const res = await authService.updateProfile({
        name: name.trim(),
        mobile: mobile.trim()
      });

      if (res.success) {
        toast.success('Profile details updated successfully!');
        const updatedUser = res.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.location.reload();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });

      if (res.success) {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#172033] tracking-tight">
            Account & Security Settings
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage your personal profile information and update your account password.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Summary Card (Left Column) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#172033] text-white flex items-center justify-center font-black text-2xl mx-auto shadow-md mb-4">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            <h2 className="text-lg font-bold text-[#172033]">{user?.name}</h2>
            <p className="text-xs font-mono text-[#6B7280] mt-0.5">{user?.email}</p>

            <div className="mt-3">
              <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-lg border ${roleInfo.badgeClass}`}>
                {roleInfo.label}
              </span>
            </div>

            <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-left space-y-3">
              <div className="flex items-center text-xs text-[#374151]">
                <Phone className="w-4 h-4 text-[#6B7280] mr-2 shrink-0" />
                <span className="font-mono">{user?.mobile}</span>
              </div>
              <div className="flex items-center text-xs text-[#374151]">
                <Shield className="w-4 h-4 text-[#6B7280] mr-2 shrink-0" />
                <span>Role: {roleInfo.label}</span>
              </div>
              <div className="flex items-center text-xs text-[#16A34A] font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] mr-2 shrink-0" />
                <span>Account Status: Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Forms (Right Column) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Profile Details */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center space-x-3 pb-4 border-b border-[#E5E7EB] mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF0E5] text-[#F97316] flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033]">Personal Information</h3>
                <p className="text-xs text-[#6B7280]">Update your public name and contact number</p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#172033] focus:border-[#F97316] focus:ring-2 focus:ring-[#FFF0E5] focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      maxLength={10}
                      required
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#172033] focus:border-[#F97316] focus:ring-2 focus:ring-[#FFF0E5] focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Readonly Email */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Email Address (Primary Login ID)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-[#FFF8F1] border border-[#E5E7EB] rounded-lg text-sm text-[#6B7280] font-mono cursor-not-allowed"
                  />
                </div>
                <span className="text-[11px] text-[#6B7280] mt-1 block">
                  Email is your unique login identifier and can only be modified by Super Admin.
                </span>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-60 flex items-center"
                >
                  {profileLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center space-x-3 pb-4 border-b border-[#E5E7EB] mb-5">
              <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#F59E0B] flex items-center justify-center font-bold">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033]">Change Password</h3>
                <p className="text-xs text-[#6B7280]">Ensure your account uses a strong password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#172033] focus:border-[#F97316] focus:ring-2 focus:ring-[#FFF0E5] focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#172033]"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#172033] focus:border-[#F97316] focus:ring-2 focus:ring-[#FFF0E5] focus:outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#172033]"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      required
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#172033] focus:border-[#F97316] focus:ring-2 focus:ring-[#FFF0E5] focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-60 flex items-center"
                >
                  {passwordLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
