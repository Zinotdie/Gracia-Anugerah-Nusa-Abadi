import api from '../utils/api';

export const stockService = {
  // Ambil semua stok
  getAll: async () => {
    const response = await api.get('/api/stok');
    return response.data;
  },

  // Tambah stok baru
  create: async (stockData) => {
    const response = await api.post('/api/stok', stockData);
    return response.data;
  },

  // Update data stok
  update: async (id, stockData) => {
    const response = await api.put(`/api/stok/${id}`, stockData);
    return response.data;
  },

  // Hapus stok
  delete: async (id) => {
    const response = await api.delete(`/api/stok/${id}`);
    return response.data;
  }
};
