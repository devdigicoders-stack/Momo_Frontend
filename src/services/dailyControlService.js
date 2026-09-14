import api from './api';

const dailyControlService = {
  getDailyStatus: async (dateStr) => {
    const params = dateStr ? { date: dateStr } : {};
    const res = await api.get('/daily-control/status', { params });
    return res.data;
  },

  toggleStatus: async (date, status, notes) => {
    const res = await api.post('/daily-control/toggle-status', { date, status, notes });
    return res.data;
  },

  toggleLock: async (date, lock, notes) => {
    const res = await api.post('/daily-control/toggle-lock', { date, lock, notes });
    return res.data;
  },

  getMyRecentEntries: async (limit = 15) => {
    const res = await api.get('/daily-control/my-recent-entries', { params: { limit } });
    return res.data;
  },
};

export default dailyControlService;
