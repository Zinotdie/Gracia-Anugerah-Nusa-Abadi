import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Search, Plus, Edit2, Trash2, Shield, X, Loader2 } from 'lucide-react';
import { userService } from '../services/userService';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const getRoleColors = (role) => {
    switch(role) {
      case 'Admin': return 'bg-[#F3E8FF] text-[#9333EA]';
      case 'Kepala Gudang': return 'bg-[#DBEAFE] text-[#2563EB]';
      case 'Staff Gudang': return 'bg-[#CCFBF1] text-[#0D9488]';
      case 'Owner': return 'bg-[#FFEDD5] text-[#EA580C]';
      case 'Sales': return 'bg-[#DCFCE7] text-[#16A34A]';
      default: return 'bg-[#F1F5F9] text-[#64748B]';
    }
  };

  const loadUsers = () => {
    setIsLoading(true);
    setErrorMsg('');
    userService.getAllUsers()
      .then((data) => {
        const mapped = data.map(u => ({
          id: u.id,
          name: u.name || u.nama || '',
          username: u.username || '',
          role: u.role || 'Admin',
          status: u.status || 'Active',
          created: u.created || (u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'),
          avatarColor: 'bg-[#4F46E5]',
          roleColor: getRoleColors(u.role)
        }));
        setUsers(mapped);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat user:", err);
        setErrorMsg("Gagal memuat data user dari backend.");
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua Role');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({ id: null, name: '', username: '', role: 'Admin', status: 'Active', password: '' });
  const [validationError, setValidationError] = useState('');

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'Semua Role' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Dynamic Stats
  const stats = useMemo(() => {
    const activeUsers = users.filter(u => u.status === 'Active').length;
    const salesTeam = users.filter(u => u.role === 'Sales').length;
    const gudangTeam = users.filter(u => u.role === 'Kepala Gudang' || u.role === 'Staff Gudang').length;
    return {
      total: users.length,
      active: activeUsers,
      sales: salesTeam,
      gudang: gudangTeam
    };
  }, [users]);

  // Handlers
  const confirmDelete = (user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (userToDelete) {
      setIsLoading(true);
      userService.delete(userToDelete.id, userToDelete.role)
        .then(() => {
          loadUsers();
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        })
        .catch((err) => {
          console.error("Gagal menghapus user:", err);
          setErrorMsg("Gagal menghapus user dari backend.");
          setIsLoading(false);
          setIsDeleteModalOpen(false);
        });
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: null, name: '', username: '', role: 'Admin', status: 'Active', password: '' });
    setValidationError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setFormData({ ...user, password: '' });
    setValidationError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setValidationError('');
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    const cleanedName = formData.name.trim();
    const cleanedUsername = formData.username.trim().toLowerCase();
    
    // Strict Input Validation
    if (cleanedName.length < 3) {
      setValidationError('Nama lengkap harus terdiri dari minimal 3 karakter.');
      return;
    }
    
    if (!/^[a-z0-9_]{3,20}$/.test(cleanedUsername)) {
      setValidationError('Username harus 3-20 karakter dan hanya boleh berisi huruf kecil, angka, dan underscore (_).');
      return;
    }
    
    const usernameExists = users.some(u => u.username.toLowerCase() === cleanedUsername && u.id !== formData.id);
    if (usernameExists) {
      setValidationError('Username sudah terdaftar di sistem. Silakan pilih username lain.');
      return;
    }
    
    // Strict Role Validation
    if (formData.role === 'Owner') {
      const isCurrentlyOwner = modalMode === 'edit' && users.find(u => u.id === formData.id)?.role === 'Owner';
      if (!isCurrentlyOwner) {
        setValidationError('Role Owner tidak dapat dibuat baru atau dialihkan.');
        return;
      }
    }

    if (modalMode === 'add' && !formData.password.trim()) {
      setValidationError('Password wajib diisi untuk user baru.');
      return;
    }
    
    const updatedFormData = {
      ...formData,
      name: cleanedName,
      username: cleanedUsername
    };

    setIsLoading(true);

    const payload = {
      nama: updatedFormData.name,
      username: updatedFormData.username,
      role: updatedFormData.role,
      status: updatedFormData.status,
    };

    if (updatedFormData.password) {
      payload.password = updatedFormData.password;
    }

    const apiCall = modalMode === 'add'
      ? userService.create(payload)
      : userService.update(updatedFormData.id, payload);

    apiCall
      .then(() => {
        loadUsers();
        closeModal();
      })
      .catch((err) => {
        console.error("Gagal menyimpan user:", err);
        const errMsg = err.response?.data?.message || err.message || "Gagal menyimpan data user ke backend.";
        setValidationError(errMsg);
        setIsLoading(false);
      });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 relative">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1E293B]">Manajemen Pengguna</h2>
            <p className="text-sm text-[#64748B] mt-1">Kelola hak akses pengguna sistem</p>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg font-semibold text-sm hover:bg-[#4338CA] transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Tambah User
          </button>
        </div>

        {errorMsg && (
          <div className="w-full bg-[#FEE2E2] text-[#DC2626] text-sm font-semibold p-4 rounded-lg border border-[#FCA5A5]">
            {errorMsg}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input 
              type="text" 
              placeholder="Cari nama atau username..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-[#E2E8F0] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)]"
            />
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm text-[#1E293B] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] w-full sm:w-48"
          >
            <option>Semua Role</option>
            <option>Admin</option>
            <option>Kepala Gudang</option>
            <option>Staff Gudang</option>
            <option>Owner</option>
            <option>Sales</option>
          </select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] p-5">
            <p className="text-xs font-semibold text-[#64748B] mb-1">Total Users</p>
            <h3 className="text-2xl font-bold text-[#1E293B]">{stats.total}</h3>
          </div>
          <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] p-5">
            <p className="text-xs font-semibold text-[#64748B] mb-1">Aktif</p>
            <h3 className="text-2xl font-bold text-[#22C55E]">{stats.active}</h3>
          </div>
          <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] p-5">
            <p className="text-xs font-semibold text-[#64748B] mb-1">Sales Team</p>
            <h3 className="text-2xl font-bold text-[#3B82F6]">{stats.sales}</h3>
          </div>
          <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] p-5">
            <p className="text-xs font-semibold text-[#64748B] mb-1">Gudang Team</p>
            <h3 className="text-2xl font-bold text-[#A855F7]">{stats.gudang}</h3>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-4 px-6 border-b border-[#E2E8F0]">USER</th>
                  <th className="py-4 px-6 border-b border-[#E2E8F0]">USERNAME</th>
                  <th className="py-4 px-6 border-b border-[#E2E8F0]">ROLE</th>
                  <th className="py-4 px-6 border-b border-[#E2E8F0]">STATUS</th>
                  <th className="py-4 px-6 border-b border-[#E2E8F0]">DIBUAT</th>
                  <th className="py-4 px-6 border-b border-[#E2E8F0]">AKSI</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-[#64748B]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#4F46E5]" />
                        <span>Memuat data user...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors last:border-0">
                      <td className="py-4 px-6 font-semibold text-[#1E293B] flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${user.avatarColor || 'bg-[#4F46E5]'} text-white flex items-center justify-center text-xs font-bold`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        {user.name}
                      </td>
                      <td className="py-4 px-6 text-[#64748B]">{user.username}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${user.roleColor || getRoleColors(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${(user.status === 'Active' || user.status === 'Aktif' || user.is_active === 1 || user.is_active === true) ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#EF4444]'}`}>
                          {(user.status === 'Active' || user.status === 'Aktif' || user.is_active === 1 || user.is_active === true) ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[#64748B]">{user.created}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEditModal(user)} className="text-[#3B82F6] hover:text-[#2563EB] transition-colors" title="Edit User">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => confirmDelete(user)} 
                            className="text-[#EF4444] hover:text-[#DC2626] transition-colors"
                            title="Hapus User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-[#64748B]">Tidak ada user yang ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Permissions Overview */}
        <div className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-6 mt-2">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-[#4F46E5]" />
            <h3 className="font-bold text-[#1E293B]">Ringkasan Hak Akses Role</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E2E8F0]">
              <h4 className="font-bold text-[#9333EA] mb-2">Admin</h4>
              <p className="text-sm text-[#475569]">Akses penuh - Manajemen data, pengguna, dan transaksi</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E2E8F0]">
              <h4 className="font-bold text-[#2563EB] mb-2">Kepala Gudang</h4>
              <p className="text-sm text-[#475569]">Approval stok masuk, QC, riwayat inventory</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E2E8F0]">
              <h4 className="font-bold text-[#0D9488] mb-2">Staff Gudang</h4>
              <p className="text-sm text-[#475569]">Input stok, pengiriman, surat jalan</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E2E8F0]">
              <h4 className="font-bold text-[#EA580C] mb-2">Owner</h4>
              <p className="text-sm text-[#475569]">Executive dashboard, aging schedule, monitoring piutang</p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-[#E2E8F0]">
              <h4 className="font-bold text-[#16A34A] mb-2">Sales</h4>
              <p className="text-sm text-[#475569]">Input pesanan, laporan kunjungan, target tracking</p>
            </div>
          </div>
        </div>

      </div>

      {/* Modal Tambah/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-lg text-[#1E293B]">
                {modalMode === 'add' ? 'Tambah User Baru' : 'Edit User'}
              </h3>
              <button onClick={closeModal} className="text-[#94A3B8] hover:text-[#1E293B] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              {validationError && (
                <div className="bg-[#FEE2E2] text-[#DC2626] border border-[#FEE2E2] px-4 py-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <span className="text-sm">⚠️</span>
                  <span>{validationError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-2">Nama Lengkap <span className="text-[#EF4444]">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-2">Username <span className="text-[#EF4444]">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={(e) => {
                    const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setFormData({...formData, username: sanitized});
                  }}
                  className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                  placeholder="Contoh: budi_sales"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-2">Role <span className="text-[#EF4444]">*</span></label>
                {modalMode === 'edit' && users.find(u => u.id === formData.id)?.role === 'Owner' ? (
                  <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm text-[#64748B] font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#EA580C]" />
                    <span>Owner (Role utama tidak dapat diubah)</span>
                  </div>
                ) : (
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] bg-white"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Kepala Gudang">Kepala Gudang</option>
                    <option value="Staff Gudang">Staff Gudang</option>
                    <option value="Sales">Sales</option>
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-2">Status <span className="text-[#EF4444]">*</span></label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] mb-4"
                >
                  <option value="Active">Aktif</option>
                  <option value="Inactive">Tidak Aktif</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#1E293B] mb-2 font-sans">
                  Password {modalMode === 'add' ? <span className="text-[#EF4444]">*</span> : <span className="text-[#64748B]">(Kosongkan jika tidak ingin diubah)</span>}
                </label>
                <input 
                  type="password" 
                  value={formData.password || ''}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                  placeholder={modalMode === 'add' ? "Masukkan password..." : "Masukkan password baru..."}
                />
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#E2E8F0]">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#4F46E5] text-white rounded-lg text-sm font-semibold hover:bg-[#4338CA] transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-[#DC2626]" />
            </div>
            <h3 className="text-lg font-bold text-[#1E293B] mb-2">Hapus User?</h3>
            <p className="text-sm text-[#64748B] mb-6">
              Apakah Anda yakin ingin menghapus user <span className="font-bold text-[#1E293B]">{userToDelete?.name}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => {setIsDeleteModalOpen(false); setUserToDelete(null);}} className="flex-1 py-2.5 bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] font-semibold rounded-xl transition-colors">
                Batal
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-[#DC2626] text-white hover:bg-[#B91C1C] font-semibold rounded-xl transition-colors shadow-sm">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
