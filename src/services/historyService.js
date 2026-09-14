import api from './api';

export const historyService = {
  // Get unified history logs across modules
  getHistory: async (params = {}) => {
    const response = await api.get('/history', { params });
    return response.data;
  },
};

export default historyService;
