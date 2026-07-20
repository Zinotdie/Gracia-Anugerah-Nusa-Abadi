import api from '../utils/api';

export const customerService = {
  // Ambil semua pelanggan
  getAll: async () => {
    const response = await api.get('/api/pelanggan');
    return response.data;
  },

  // Tambah pelanggan baru
  create: async (customerData) => {
    const response = await api.post('/api/pelanggan', customerData);
    return response.data;
  },

  // Update data pelanggan
  update: async (id, customerData) => {
    const response = await api.put(`/api/pelanggan/${id}`, customerData);
    return response.data;
  },

  // Hapus pelanggan
  delete: async (id) => {
    const response = await api.delete(`/api/pelanggan/${id}`);
    return response.data;
  }
};
