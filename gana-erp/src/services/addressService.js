import api from '../utils/api';

export const addressService = {
  // Ambil semua alamat
  getAll: async () => {
    const response = await api.get('/api/alamat');
    return response.data;
  },

  // Tambah alamat baru
  create: async (addressData) => {
    const response = await api.post('/api/alamat', addressData);
    return response.data;
  },

  // Update alamat
  update: async (id, addressData) => {
    const response = await api.put(`/api/alamat/${id}`, addressData);
    return response.data;
  },

  // Hapus alamat
  delete: async (id) => {
    const response = await api.delete(`/api/alamat/${id}`);
    return response.data;
  }
};
