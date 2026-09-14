import api from './api';

const notificationService = {
  getNotifications: async () => {
    const res = await api.get('/notifications');
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await api.post('/notifications/mark-read');
    return res.data;
  },
};

export default notificationService;
