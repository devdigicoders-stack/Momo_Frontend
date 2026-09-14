import api from './api';

export const reportService = {
  // Get financial & operational summary report
  getSummary: async (params = {}) => {
    const response = await api.get('/reports/summary', { params });
    return response.data;
  },
};

export default reportService;
