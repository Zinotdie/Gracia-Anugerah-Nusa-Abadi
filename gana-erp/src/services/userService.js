import api from '../utils/api';

export const userService = {
  // Ambil data admin
  getAdmins: async () => {
    const response = await api.get('/api/admins');
    return response.data;
  },

  // Ambil data sales
  getSales: async () => {
    const response = await api.get('/api/sales');
    return response.data;
  },

  // Ambil data owner
  getOwners: async () => {
    const response = await api.get('/api/owners');
    return response.data;
  },

  // Ambil data staff
  getStaff: async () => {
    const response = await api.get('/api/staff');
    return response.data;
  },

  // Ambil data kepala gudang
  getKepala: async () => {
    const response = await api.get('/api/kepala');
    return response.data;
  },

  // Ambil semua user secara gabungan (paralel) untuk halaman User Management
  getAllUsers: async () => {
    try {
      const [adminsRes, salesRes, ownersRes, staffRes, kepalaRes] = await Promise.all([
        api.get('/api/admins').catch(() => ({ data: [] })),
        api.get('/api/sales').catch(() => ({ data: [] })),
        api.get('/api/owners').catch(() => ({ data: [] })),
        api.get('/api/staff').catch(() => ({ data: [] })),
        api.get('/api/kepala').catch(() => ({ data: [] }))
      ]);

      const admins = (adminsRes.data?.data || adminsRes.data || []).map(u => ({ ...u, role: 'Admin', name: u.nama_admin || u.nama || u.name }));
      const sales = (salesRes.data?.data || salesRes.data || []).map(u => ({ ...u, role: 'Sales', name: u.nama_sales || u.nama || u.name }));
      const owners = (ownersRes.data?.data || ownersRes.data || []).map(u => ({ ...u, role: 'Owner', name: u.nama_owner || u.nama || u.name }));
      const staff = (staffRes.data?.data || staffRes.data || []).map(u => ({ ...u, role: 'Staff Gudang', name: u.nama_staff || u.nama || u.name }));
      const kepala = (kepalaRes.data?.data || kepalaRes.data || []).map(u => ({ ...u, role: 'Kepala Gudang', name: u.nama_kepala || u.nama || u.name }));

      return [...admins, ...sales, ...owners, ...staff, ...kepala];
    } catch (error) {
      console.error("Gagal menggabungkan data user:", error);
      return [];
    }
  },

  // Tambah user baru berdasarkan role
  create: async (userData) => {
    let endpoint = '/api/admins';
    if (userData.role === 'Sales') endpoint = '/api/sales';
    else if (userData.role === 'Owner') endpoint = '/api/owners';
    else if (userData.role === 'Staff Gudang') endpoint = '/api/staff';
    else if (userData.role === 'Kepala Gudang') endpoint = '/api/kepala';

    const payload = {
      username: userData.username,
      nama: userData.nama || userData.name,
      role: userData.role,
      status: userData.status,
      password: userData.password
    };

    const response = await api.post(endpoint, payload);
    return response.data;
  },

  // Update user berdasarkan role
  update: async (id, userData) => {
    let endpoint = `/api/admins/${id}`;
    if (userData.role === 'Sales') endpoint = `/api/sales/${id}`;
    else if (userData.role === 'Owner') endpoint = `/api/owners/${id}`;
    else if (userData.role === 'Staff Gudang') endpoint = `/api/staff/${id}`;
    else if (userData.role === 'Kepala Gudang') endpoint = `/api/kepala/${id}`;

    const payload = {
      username: userData.username,
      nama: userData.nama || userData.name,
      role: userData.role,
      status: userData.status
    };
    if (userData.password) {
      payload.password = userData.password;
    }

    const response = await api.put(endpoint, payload);
    return response.data;
  },

  // Hapus user berdasarkan role
  delete: async (id, role) => {
    let endpoint = `/api/admins/${id}`;
    if (role === 'Sales') endpoint = `/api/sales/${id}`;
    if (role === 'Owner') endpoint = `/api/owners/${id}`;
    if (role === 'Staff Gudang') endpoint = `/api/staff/${id}`;
    if (role === 'Kepala Gudang') endpoint = `/api/kepala/${id}`;

    const response = await api.delete(endpoint);
    return response.data;
  }
};
