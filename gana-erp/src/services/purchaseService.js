import api from '../utils/api';

export const purchaseService = {
  // Ambil semua pembelian
  getAll: async () => {
    const response = await api.get('/api/pembelian');
    return response.data;
  },

  // Tambah pembelian baru
  create: async (purchaseData) => {
    const response = await api.post('/api/pembelian', purchaseData);
    return response.data;
  },

  // Update data pembelian
  update: async (id, purchaseData) => {
    const response = await api.put(`/api/pembelian/${id}`, purchaseData);
    return response.data;
  },

  // Approve QC (Sesuai & Stok Bertambah)
  approveQC: async (id) => {
    const response = await api.put(`/api/pembelian/${id}/approve`);
    return response.data;
  },

  // Reject QC (Cacat/Retur & Stok Tidak Bertambah)
  rejectQC: async (id) => {
    const response = await api.put(`/api/pembelian/${id}/reject`);
    return response.data;
  },

  // Hapus pembelian
  delete: async (id) => {
    const response = await api.delete(`/api/pembelian/${id}`);
    return response.data;
  }
};
