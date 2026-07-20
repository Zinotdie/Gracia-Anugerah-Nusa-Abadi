import api from '../utils/api';

export const targetService = {
  // Ambil target & pencapaian (GET)
  // params: { bulan: 'YYYY-MM', sales_id: X }
  get: async (params = {}) => {
    const response = await api.get('/api/target-penjualan', { params });
    return response.data;
  },

  // Buat atau update target penjualan (POST)
  // payload: { sales_id, bulan, target_omset, target_volume, focal_products: [{ produk_id, target_qty }] }
  createOrUpdate: async (payload) => {
    const response = await api.post('/api/target-penjualan', payload);
    return response.data;
  }
};
