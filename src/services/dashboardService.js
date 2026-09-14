import api from './api';

export const dashboardService = {
  // Get Phase 4 dashboard summary aggregation
  getSummary: async (params = {}) => {
    const response = await api.get('/dashboard/summary', { params });
    return response.data;
  },

  // Get Phase 2 dashboard stats and daily counters
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

export default dashboardService;
