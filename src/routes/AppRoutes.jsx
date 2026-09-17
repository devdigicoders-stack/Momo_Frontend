import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/Dashboard';
import Users from '../pages/users/Users';
import Profile from '../pages/Profile';
import Unauthorized from '../pages/Unauthorized';
import PlaceholderPage from '../components/PlaceholderPage';

// Phase 2 Data Entry Pages
import SalesEntry from '../pages/sales/SalesEntry';
import ExpenseEntry from '../pages/expenses/ExpenseEntry';
import MomoPurchaseEntry from '../pages/momoPurchases/MomoPurchaseEntry';
import CashEntry from '../pages/cash/CashEntry';
import ChefRequirements from '../pages/chef/ChefRequirements';
import EmployeeEntry from '../pages/employees/EmployeeEntry';
import TemporaryStaffManagement from '../pages/temporaryStaff/TemporaryStaffManagement';

import History from '../pages/history/History';

// Phase 6 Daily Operational Hub
import DailyEntryHub from '../pages/dailyEntry/DailyEntryHub';

// Dynamic Reports & Settings Pages
import Reports from '../pages/reports/Reports';
import Settings from '../pages/settings/Settings';

// Phase 10 – Audit Trail
import AuditHistory from '../pages/audit/AuditHistory';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes inside Dashboard Layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Dashboard & Profile & Daily Hub accessible to all authenticated roles */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/daily-entry" element={<DailyEntryHub />} />

          {/* Super Admin ONLY */}
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
            <Route path="/users" element={<Users />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/data-entry"
              element={
                <PlaceholderPage
                  moduleName="Data Entry Overview"
                  subtitle="Phase 2 individual data entry modules are available in the navigation menu."
                />
              }
            />
            <Route
              path="/masters"
              element={
                <PlaceholderPage
                  moduleName="Masters"
                  subtitle="Master records configuration (Phase 2 categories and momo types are managed within their modules)."
                />
              }
            />
          </Route>

          {/* Reports: SUPER_ADMIN, MAIN_MANAGER, MANAGER_2 */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'MAIN_MANAGER', 'MANAGER_2']}
              />
            }
          >
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-history" element={<AuditHistory />} />
          </Route>

          {/* Sales: Super Admin & Main Manager ONLY (Manager 2 is strictly excluded) */}
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MAIN_MANAGER']} />}>
            <Route path="/sales" element={<SalesEntry />} />
            <Route path="/salesManager" element={<SalesEntry />} />
            <Route path="/sales-manager" element={<SalesEntry />} />
          </Route>

          {/* Expenses, Momo Purchases, Cash, Chef Reqs, Employees: Super Admin, Main Manager, Manager 2 */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'MAIN_MANAGER', 'MANAGER_2']}
              />
            }
          >
            <Route path="/expenses" element={<ExpenseEntry />} />
            <Route path="/momo-purchases" element={<MomoPurchaseEntry />} />
            <Route path="/cash" element={<CashEntry />} />
            <Route path="/cash-management" element={<CashEntry />} />
            <Route path="/chef-requirements" element={<ChefRequirements />} />
            <Route path="/employees" element={<EmployeeEntry />} />
            <Route path="/temporary-staff" element={<TemporaryStaffManagement />} />
          </Route>

          {/* Chef Requirements (Chef view: Kitchen Requirements & My Requirements) */}
          <Route element={<ProtectedRoute allowedRoles={['CHEF']} />}>
            <Route
              path="/kitchen-requirements"
              element={<ChefRequirements myOnly={false} />}
            />
            <Route
              path="/my-requirements"
              element={<ChefRequirements myOnly={true} />}
            />
          </Route>

          {/* Operational History across permitted roles */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'MAIN_MANAGER', 'MANAGER_2', 'CHEF']}
              />
            }
          >
            <Route path="/history" element={<History />} />
          </Route>
        </Route>
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
