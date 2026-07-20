import api from '../utils/api';

export const orderService = {
  // Ambil semua penjualan
  getAll: async () => {
    const response = await api.get('/api/penjualan');
    return response.data;
  },

  // Tambah penjualan baru
  create: async (orderData) => {
    const response = await api.post('/api/penjualan', orderData);
    return response.data;
  },

  // Update data penjualan
  update: async (id, orderData) => {
    const response = await api.put(`/api/penjualan/${id}`, orderData);
    return response.data;
  },

  // Hapus penjualan
  delete: async (id) => {
    const response = await api.delete(`/api/penjualan/${id}`);
    return response.data;
  }
};
