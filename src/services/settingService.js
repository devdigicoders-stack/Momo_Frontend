import api from './api';

export const settingService = {
  // Get restaurant & system settings
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  // Update restaurant settings (Super Admin only)
  updateSettings: async (settingsData) => {
    const response = await api.put('/settings', settingsData);
    return response.data;
  },
};

export default settingService;
