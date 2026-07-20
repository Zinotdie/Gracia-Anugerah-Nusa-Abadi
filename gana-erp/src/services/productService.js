import api from '../utils/api';

export const productService = {
  // Ambil semua produk
  getAll: async () => {
    const response = await api.get('/api/produk');
    return response.data;
  },

  // Tambah produk baru
  create: async (productData) => {
    const response = await api.post('/api/produk', productData);
    return response.data;
  },

  // Update data produk
  update: async (id, productData) => {
    const response = await api.put(`/api/produk/${id}`, productData);
    return response.data;
  },

  // Hapus produk
  delete: async (id) => {
    const response = await api.delete(`/api/produk/${id}`);
    return response.data;
  }
};
