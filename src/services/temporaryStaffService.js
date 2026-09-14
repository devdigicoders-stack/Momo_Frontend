import api from './api';

export const temporaryStaffService = {
  // 1. Staff Master CRUD
  getStaffList: async (params = {}) => {
    const response = await api.get('/temporary-staff', { params });
    return response.data;
  },

  createStaff: async (data) => {
    const response = await api.post('/temporary-staff', data);
    return response.data;
  },

  updateStaff: async (id, data) => {
    const response = await api.put(`/temporary-staff/${id}`, data);
    return response.data;
  },

  // 2. Work Entries (Worked Dates)
  getWorkEntries: async (params = {}) => {
    const response = await api.get('/temporary-staff/work/entries', { params });
    return response.data;
  },

  createWorkEntry: async (data) => {
    const response = await api.post('/temporary-staff/work/entries', data);
    return response.data;
  },

  updateWorkEntry: async (id, data) => {
    const response = await api.put(`/temporary-staff/work/entries/${id}`, data);
    return response.data;
  },

  deleteWorkEntry: async (id) => {
    const response = await api.delete(`/temporary-staff/work/entries/${id}`);
    return response.data;
  },

  // 3. Summary & Payout Overview
  getSummaryOverview: async (params = {}) => {
    const response = await api.get('/temporary-staff/summary/overview', { params });
    return response.data;
  },

  // 4. Payments
  getPayments: async (params = {}) => {
    const response = await api.get('/temporary-staff/payments/records', { params });
    return response.data;
  },

  createPayment: async (data) => {
    const response = await api.post('/temporary-staff/payments/records', data);
    return response.data;
  },

  // 5. Staff 360 Profile
  getStaffProfile: async (id) => {
    const response = await api.get(`/temporary-staff/profile/${id}`);
    return response.data;
  },
};

export default temporaryStaffService;
