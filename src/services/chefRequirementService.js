import api from './api';

export const chefRequirementService = {
  // Get all requirements
  getAllRequirements: async (params = {}) => {
    const response = await api.get('/chef-requirements', { params });
    return response.data;
  },

  // Get requirement by ID
  getRequirementById: async (id) => {
    const response = await api.get(`/chef-requirements/${id}`);
    return response.data;
  },

  // Create requirement
  createRequirement: async (data) => {
    const response = await api.post('/chef-requirements', data);
    return response.data;
  },

  // Update requirement
  updateRequirement: async (id, data) => {
    const response = await api.put(`/chef-requirements/${id}`, data);
    return response.data;
  },

  // Update requirement status (Manager / Admin only)
  updateRequirementStatus: async (id, status) => {
    const response = await api.patch(`/chef-requirements/${id}/status`, { status });
    return response.data;
  },
};

export default chefRequirementService;
