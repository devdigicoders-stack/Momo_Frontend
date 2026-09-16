import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Database,
  Layers,
  UserCheck,
  FileBarChart,
  History,
  Settings,
  IndianRupee,
  ReceiptIndianRupee,
  ShoppingBag,
  Wallet,
  ChefHat,
  UtensilsCrossed,
  ClipboardList,
  User,
  LogOut,
  X,
  Flame,
  ShieldCheck,
} from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const role = user?.role;

  const getNavItems = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Daily Operations Hub', path: '/daily-entry', icon: ClipboardList },
          { name: 'User Management', path: '/users', icon: Users },
          { name: 'Sales Entry', path: '/sales', icon: IndianRupee },
          { name: 'Expenses', path: '/expenses', icon: ReceiptIndianRupee },
          { name: 'Momo Purchase', path: '/momo-purchases', icon: ShoppingBag },
          { name: 'Cash Management', path: '/cash-management', icon: Wallet },
          { name: 'Chef Requirements', path: '/chef-requirements', icon: ChefHat },
          { name: 'Employees', path: '/employees', icon: UserCheck },
          { name: 'Temp / Extra Staff', path: '/temporary-staff', icon: Users },
          { name: 'Operation History', path: '/history', icon: History },
          { name: 'Reports', path: '/reports', icon: FileBarChart },
          { name: 'Audit Trail', path: '/audit-history', icon: ShieldCheck },
          { name: 'Settings', path: '/settings', icon: Settings },
          { name: 'My Profile & Security', path: '/profile', icon: User },
        ];

      case 'MAIN_MANAGER':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Daily Operations Hub', path: '/daily-entry', icon: ClipboardList },
          { name: 'Sales', path: '/sales', icon: IndianRupee },
          { name: 'Expenses', path: '/expenses', icon: ReceiptIndianRupee },
          { name: 'Momo Purchase', path: '/momo-purchases', icon: ShoppingBag },
          { name: 'Cash Management', path: '/cash-management', icon: Wallet },
          { name: 'Chef Requirements', path: '/chef-requirements', icon: ChefHat },
          { name: 'Employees', path: '/employees', icon: UserCheck },
          { name: 'Temp / Extra Staff', path: '/temporary-staff', icon: Users },
          { name: 'History', path: '/history', icon: History },
          { name: 'Audit Trail', path: '/audit-history', icon: ShieldCheck },
          { name: 'My Profile & Security', path: '/profile', icon: User },
        ];

      case 'MANAGER_2':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Daily Operations Hub', path: '/daily-entry', icon: ClipboardList },
          // IMPORTANT: MANAGER_2 must NOT see Sales
          { name: 'Expenses', path: '/expenses', icon: ReceiptIndianRupee },
          { name: 'Momo Purchase', path: '/momo-purchases', icon: ShoppingBag },
          { name: 'Cash Management', path: '/cash-management', icon: Wallet },
          { name: 'Chef Requirements', path: '/chef-requirements', icon: ChefHat },
          { name: 'Employees', path: '/employees', icon: UserCheck },
          { name: 'Temp / Extra Staff', path: '/temporary-staff', icon: Users },
          { name: 'History', path: '/history', icon: History },
          { name: 'Audit Trail', path: '/audit-history', icon: ShieldCheck },
          { name: 'My Profile & Security', path: '/profile', icon: User },
        ];

      case 'CHEF':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Daily Operations Hub', path: '/daily-entry', icon: ClipboardList },
          { name: 'Kitchen Requirements', path: '/kitchen-requirements', icon: UtensilsCrossed },
          { name: 'My Requirements', path: '/my-requirements', icon: ClipboardList },
          { name: 'History', path: '/history', icon: History },
          { name: 'My Profile & Security', path: '/profile', icon: User },
        ];

      default:
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'My Profile & Security', path: '/profile', icon: User }
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-md lg:hidden transition-all duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container with #172033 Deep Navy Background */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#172033] text-white flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 border-r border-[#232F48] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-[#232F48]">
            <div className="flex items-center space-x-2 overflow-hidden">
              <img 
                src="/panel-logo.png" 
                alt="RK Food Ventures" 
                className="h-10 w-auto max-w-[185px] object-contain rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/app-logo.png';
                }}
              />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-4 overflow-y-auto max-h-[calc(100vh-140px)]">
            <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5">
              Menu Navigation
            </p>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#F97316] text-white font-bold shadow-lg shadow-[#F97316]/25 translate-x-1'
                          : 'text-slate-300 hover:bg-[#232F48] hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 mr-3 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer with Logout */}
        <div className="p-3 border-t border-[#232F48] bg-[#121929]">
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
