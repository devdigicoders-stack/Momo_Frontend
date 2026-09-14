import api from './api';

export const expenseCategoryService = {
  // Get all categories & subcategories
  getAllCategories: async () => {
    const response = await api.get('/expense-categories');
    return response.data;
  },

  // Create new category
  createCategory: async (data) => {
    const response = await api.post('/expense-categories', data);
    return response.data;
  },

  // Update category & subcategories
  updateCategory: async (id, data) => {
    const response = await api.put(`/expense-categories/${id}`, data);
    return response.data;
  },

  // Toggle category active status
  toggleCategoryStatus: async (id) => {
    const response = await api.patch(`/expense-categories/${id}/status`);
    return response.data;
  },
};

export const expenseService = {
  // Get all expenses
  getAllExpenses: async (params = {}) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  // Get expense by ID
  getExpenseById: async (id) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  // Create expense entry (with multipart/form-data for optional bill upload)
  createExpense: async (formData) => {
    const response = await api.post('/expenses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update expense entry
  updateExpense: async (id, formData) => {
    const response = await api.put(`/expenses/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete expense entry
  deleteExpense: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },
};

export default expenseService;
