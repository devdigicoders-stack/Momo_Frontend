import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import Tooltip from './Tooltip';
import { 
  Menu, 
  X, 
  LogOut, 
  ChevronDown, 
  ShieldCheck, 
  Store,
  User,
  KeyRound,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lock
} from 'lucide-react';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (error) {
      console.error('Fetch notifications error:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      fetchNotifications();
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'MAIN_MANAGER':
        return { label: 'Main Manager', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'MANAGER_2':
        return { label: 'Manager 2', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'CHEF':
        return { label: 'Chef', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
      default:
        return { label: role || 'Staff', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB] h-16 flex items-center justify-between px-4 sm:px-6 shadow-xs">
      {/* Left section: Hamburger & Mobile Logo */}
      <div className="flex items-center space-x-3">
        <Tooltip text="Toggle sidebar navigation" position="right">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-[#374151] hover:text-[#172033] hover:bg-[#FFF0E5] focus:outline-none lg:hidden"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </Tooltip>

        <div className="flex items-center space-x-2 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-[#F97316] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            MB
          </div>
          <span className="font-extrabold text-[#172033] text-base">Momos Bhandar</span>
        </div>
        
        <div className="hidden lg:flex items-center text-sm font-bold text-[#172033]">
          <Store className="w-4 h-4 mr-2 text-[#F97316]" />
          <span>Momos Bhandar Restaurant Management</span>
        </div>
      </div>

      {/* Right section: Notifications & Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen(!notifOpen);
              if (!notifOpen && unreadCount > 0) handleMarkAllRead();
            }}
            className="p-2 rounded-xl text-[#374151] hover:text-[#F97316] hover:bg-[#FFF0E5] relative transition-colors focus:outline-none"
            title="Operational Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#F97316] text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotifOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2.5 border-b border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-extrabold text-[#172033] uppercase tracking-wider">
                      Operational Notifications
                    </h4>
                    <p className="text-[10px] text-[#6B7280]">Real-time operational activity</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-[#F97316] hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#E5E7EB]/50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#6B7280]">
                      No operational notifications yet.
                    </div>
                  ) : (
                    notifications.map((n, idx) => (
                      <div
                        key={idx}
                        className={`p-3 text-xs flex items-start space-x-2.5 hover:bg-slate-50 transition ${
                          !n.isRead ? 'bg-[#FFF8F1]/60' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          {n.type === 'lock' ? (
                            <Lock className="w-4 h-4 text-red-500" />
                          ) : n.type === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          ) : n.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Info className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-[#172033]">{n.title}</p>
                          <p className="text-[11px] text-[#4B5563] mt-0.5">{n.message}</p>
                          <span className="text-[9px] text-[#9CA3AF] mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
        <Tooltip text="View profile and session options" position="left">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-[#FFF0E5] border border-transparent hover:border-[#E5E7EB] transition-all focus:outline-none"
            aria-label="User profile menu"
          >
            <div className="w-9 h-9 rounded-xl bg-[#F97316] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-[#172033] leading-tight">
                {user?.name || 'User'}
              </p>
              <span className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-md border mt-0.5 ${roleInfo.bg}`}>
                {roleInfo.label}
              </span>
            </div>

            <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </Tooltip>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            ></div>
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#E5E7EB] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-[#E5E7EB]">
                <p className="text-[10px] text-[#6B7280] font-extrabold uppercase tracking-wider">Signed in as</p>
                <p className="text-sm font-bold text-[#172033] truncate mt-0.5">{user?.name}</p>
                <p className="text-xs text-[#374151] font-mono truncate">{user?.email || user?.mobile}</p>
                <div className="mt-1.5">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleInfo.bg}`}>
                    {roleInfo.label}
                  </span>
                </div>
              </div>

              {/* Profile & Change Password Links */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-[#374151] hover:bg-[#FFF0E5] hover:text-[#F97316] flex items-center space-x-2 transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-[#374151] hover:bg-[#FFF0E5] hover:text-[#F97316] flex items-center space-x-2 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Change Password</span>
                </button>
              </div>

              <div className="py-1.5 px-4 border-t border-[#E5E7EB]">
                <div className="text-[11px] text-[#6B7280] font-medium flex items-center">
                  {/* <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-[#16A34A]" /> */}
                  {/* <span>Session Active (JWT)</span> */}
                </div>
              </div>

              <div className="border-t border-[#E5E7EB] pt-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-bold text-[#DC2626] hover:bg-red-50 flex items-center space-x-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </header>
  );
};

export default Header;
