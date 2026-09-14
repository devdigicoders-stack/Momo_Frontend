import api from './api';

export const momoTypeService = {
  // Get all momo types
  getAllMomoTypes: async () => {
    const response = await api.get('/momo-types');
    return response.data;
  },

  // Create new momo type
  createMomoType: async (data) => {
    const response = await api.post('/momo-types', data);
    return response.data;
  },

  // Update momo type
  updateMomoType: async (id, data) => {
    const response = await api.put(`/momo-types/${id}`, data);
    return response.data;
  },

  // Toggle momo type status
  toggleMomoTypeStatus: async (id) => {
    const response = await api.patch(`/momo-types/${id}/status`);
    return response.data;
  },
};

export const momoPurchaseService = {
  // Get all purchases
  getAllPurchases: async (params = {}) => {
    const response = await api.get('/momo-purchases', { params });
    return response.data;
  },

  // Get single purchase
  getPurchaseById: async (id) => {
    const response = await api.get(`/momo-purchases/${id}`);
    return response.data;
  },

  // Create purchase
  createPurchase: async (data) => {
    const response = await api.post('/momo-purchases', data);
    return response.data;
  },

  // Update purchase
  updatePurchase: async (id, data) => {
    const response = await api.put(`/momo-purchases/${id}`, data);
    return response.data;
  },

  // Delete purchase
  deletePurchase: async (id) => {
    const response = await api.delete(`/momo-purchases/${id}`);
    return response.data;
  },
};

export default momoPurchaseService;
