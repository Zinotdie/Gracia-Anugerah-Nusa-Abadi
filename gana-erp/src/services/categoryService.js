import api from '../utils/api';

export const categoryService = {
  // Ambil semua kategori
  getAll: async () => {
    const response = await api.get('/api/kategori');
    return response.data;
  },

  // Tambah kategori baru
  create: async (categoryData) => {
    const response = await api.post('/api/kategori', categoryData);
    return response.data;
  },

  // Update data kategori
  update: async (id, categoryData) => {
    const response = await api.put(`/api/kategori/${id}`, categoryData);
    return response.data;
  },

  // Hapus kategori
  delete: async (id) => {
    const response = await api.delete(`/api/kategori/${id}`);
    return response.data;
  }
};
