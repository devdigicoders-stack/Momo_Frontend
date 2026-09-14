import api from './api';

export const employeeService = {
  // 1. Employee Master CRUD
  getAllEmployees: async (params = {}) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  getEmployeeById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },

  updateEmployee: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },

  toggleEmployeeStatus: async (id) => {
    const response = await api.patch(`/employees/${id}/toggle-status`);
    return response.data;
  },

  // 2. Operational Summary Counts
  getEmployeeSummaryCounts: async (month) => {
    const params = month ? { month } : {};
    const response = await api.get('/employees/summary/counts', { params });
    return response.data;
  },

  // 3. Attendance & Absent Tracking
  markAbsent: async (data) => {
    const response = await api.post('/employees/attendance/absent', data);
    return response.data;
  },

  removeAbsent: async (id) => {
    const response = await api.delete(`/employees/attendance/${id}`);
    return response.data;
  },

  getAttendanceRecords: async (params = {}) => {
    const response = await api.get('/employees/attendance', { params });
    return response.data;
  },

  getEmployeeAbsentCount: async (id, month) => {
    const params = month ? { month } : {};
    const response = await api.get(`/employees/${id}/absent-count`, { params });
    return response.data;
  },

  // 4. Salary Advance
  createSalaryAdvance: async (data) => {
    const response = await api.post('/employees/advance', data);
    return response.data;
  },

  getSalaryAdvances: async (params = {}) => {
    const response = await api.get('/employees/advance', { params });
    return response.data;
  },

  getSalaryAdvanceById: async (id) => {
    const response = await api.get(`/employees/advance/${id}`);
    return response.data;
  },

  updateSalaryAdvance: async (id, data) => {
    const response = await api.put(`/employees/advance/${id}`, data);
    return response.data;
  },

  // 5. Monthly Salary Calculation & Payments
  getMonthlySalarySummary: async (month) => {
    const params = month ? { month } : {};
    const response = await api.get('/employees/salary/summary', { params });
    return response.data;
  },

  getEmployeeSalaryCalculation: async (id, month) => {
    const params = month ? { month } : {};
    const response = await api.get(`/employees/${id}/salary-calculation`, { params });
    return response.data;
  },

  paySalary: async (data) => {
    const response = await api.post('/employees/salary/pay', data);
    return response.data;
  },

  getSalaryPayments: async (params = {}) => {
    const response = await api.get('/employees/salary/payments', { params });
    return response.data;
  },

  getEmployeeSalaryHistory: async (id) => {
    const response = await api.get(`/employees/${id}/salary-history`);
    return response.data;
  },

  // 6. Full Employee Profile
  getEmployeeFullProfile: async (id) => {
    const response = await api.get(`/employees/${id}/full-profile`);
    return response.data;
  },
};

export default employeeService;
