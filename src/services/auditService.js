import api from './api';

export const auditService = {
  // 1. Get filtered & paginated audit logs
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/audit', { params });
    return response.data;
  },

  // 2. Get chronological audit history for a specific record
  getRecordAuditHistory: async (recordId) => {
    const response = await api.get(`/audit/record/${recordId}`);
    return response.data;
  },

  // 3. Get aggregate audit metrics & stats
  getAuditStats: async () => {
    const response = await api.get('/audit/summary/stats');
    return response.data;
  },
};

export default auditService;
