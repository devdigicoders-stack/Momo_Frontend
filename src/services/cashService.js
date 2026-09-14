import api from './api';

const cashService = {
  // 1. Dynamic Cash Balance & Summary
  getCashSummary: async (date) => {
    const params = date ? { date } : {};
    const response = await api.get('/cash/summary', { params });
    return response.data;
  },

  getAvailableCash: async () => {
    const response = await api.get('/cash/available');
    return response.data;
  },

  // 2. Unified Transaction Ledger across all 4 streams
  getUnifiedTransactions: async (params = {}) => {
    const response = await api.get('/cash/transactions', { params });
    return response.data;
  },

  // 3. Additional Cash Received
  createAdditionalCash: async (data) => {
    const response = await api.post('/cash/additional', data);
    return response.data;
  },

  getAdditionalCashList: async (params = {}) => {
    const response = await api.get('/cash/additional', { params });
    return response.data;
  },

  getAdditionalCashById: async (id) => {
    const response = await api.get(`/cash/additional/${id}`);
    return response.data;
  },

  updateAdditionalCash: async (id, data) => {
    const response = await api.put(`/cash/additional/${id}`, data);
    return response.data;
  },

  // 4. Cash Deposit (Bank) with File Upload
  createCashDeposit: async (formData) => {
    const response = await api.post('/cash/deposit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getCashDepositList: async (params = {}) => {
    const response = await api.get('/cash/deposit', { params });
    return response.data;
  },

  getCashDepositById: async (id) => {
    const response = await api.get(`/cash/deposit/${id}`);
    return response.data;
  },

  updateCashDeposit: async (id, formData) => {
    const response = await api.put(`/cash/deposit/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // 5. Legacy Snapshot APIs
  create: async (data) => {
    const response = await api.post('/cash', data);
    return response.data;
  },

  getAll: async (params = {}) => {
    const response = await api.get('/cash', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/cash/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/cash/${id}`, data);
    return response.data;
  },
};

export default cashService;
