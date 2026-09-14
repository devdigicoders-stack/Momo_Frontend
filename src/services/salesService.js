import api from './api';

export const salesService = {
  // Get all sales
  getAllSales: async (params = {}) => {
    const response = await api.get('/sales', { params });
    return response.data;
  },

  // Get sales by ID
  getSalesById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  // Create sales entry
  createSales: async (data) => {
    const response = await api.post('/sales', data);
    return response.data;
  },

  // Update sales entry
  updateSales: async (id, data) => {
    const response = await api.put(`/sales/${id}`, data);
    return response.data;
  },

  // Delete sales entry (Super Admin only)
  deleteSales: async (id) => {
    const response = await api.delete(`/sales/${id}`);
    return response.data;
  },
};

export default salesService;
