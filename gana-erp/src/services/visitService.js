import api from '../utils/api';

export const visitService = {
  // Ambil semua kunjungan
  getAll: async (params) => {
    const response = await api.get('/api/kunjungan', { params });
    return response.data;
  },

  // Tambah kunjungan baru
  create: async (visitData) => {
    const response = await api.post('/api/kunjungan', visitData);
    return response.data;
  },

  // Update data kunjungan
  update: async (id, visitData) => {
    const response = await api.put(`/api/kunjungan/${id}`, visitData);
    return response.data;
  },

  // Hapus kunjungan
  delete: async (id) => {
    const response = await api.delete(`/api/kunjungan/${id}`);
    return response.data;
  }
};
