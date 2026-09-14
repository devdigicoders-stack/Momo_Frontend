import api from './api';

export const authService = {
  // Login user with mobile/email & password
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current session profile
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update current user profile (name, mobile)
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // Change password for current logged-in user
  changePassword: async (passwords) => {
    const response = await api.put('/auth/change-password', passwords);
    return response.data;
  }
};

export default authService;
