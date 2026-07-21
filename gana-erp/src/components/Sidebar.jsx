import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  FileText,
  LogOut,
  CheckSquare,
  History,
  Truck,
  Calendar,
  BarChart2,
  DollarSign,
  MapPin,
  TrendingUp
} from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const [role, setRole] = useState(() => localStorage.getItem('userRole') || 'admin');
  const [counts, setCounts] = useState({
    pendingPiutang: 0,
    pendingApprovalStok: 0,
    pendingPelanggan: 0
  });
  const [readMenus, setReadMenus] = useState(() => {
    try {
      const saved = localStorage.getItem('gana_read_sidebar_menus');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleMenuClick = (path) => {
    if (!readMenus.includes(path)) {
      const updated = [...readMenus, path];
      setReadMenus(updated);
      localStorage.setItem('gana_read_sidebar_menus', JSON.stringify(updated));
    }
    if (setIsOpen) setIsOpen(false);
  };

  const navigate = useNavigate();

  useEffect(() => {
    setRole(localStorage.getItem('userRole') || 'admin');

    const fetchPendingCounts = () => {
      Promise.all([
        api.get('/api/penjualan/all-pembayaran').catch(() => ({ data: { data: [] } })),
        api.get('/api/pembelian').catch(() => ({ data: { data: [] } })),
        api.get('/api/pelanggan').catch(() => ({ data: { data: [] } }))
      ]).then(([payRes, pembRes, custRes]) => {
        const allPay = payRes.data?.data || [];
        const allPemb = Array.isArray(pembRes.data) ? pembRes.data : (pembRes.data?.data || []);
        const allCust = Array.isArray(custRes.data) ? custRes.data : (custRes.data?.data || custRes.data?.customers || []);

        const pPiutang = allPay.filter(p => p.status_pembayaran === 'Pending' && typeof p.id_pembayaran === 'number').length;
        const pStok = allPemb.filter(p => p.status_qc === 'Menunggu' || p.status === 'pending').length;
        const pCust = allCust.filter(c => c.is_active === 0 || c.status === 'Inactive').length;

        setCounts({
          pendingPiutang: pPiutang,
          pendingApprovalStok: pStok,
          pendingPelanggan: pCust
        });
      });
    };

    fetchPendingCounts();
    window.addEventListener('pending-counts-updated', fetchPendingCounts);
    const interval = setInterval(fetchPendingCounts, 15000);
    return () => {
      window.removeEventListener('pending-counts-updated', fetchPendingCounts);
      clearInterval(interval);
    };
  }, []);

  const adminMenu = [
    {
      label: 'MENU UTAMA',
      items: [
        { name: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, path: '/dashboard' },
        { name: 'Produk', icon: <Package className="w-[18px] h-[18px]" />, path: '/data-produk' },
        { name: 'Pelanggan', icon: <Users className="w-[18px] h-[18px]" />, path: '/data-pelanggan' },
        { name: 'Manajemen Pengguna', icon: <Users className="w-[18px] h-[18px]" />, path: '/user-management' },
        { name: 'Daftar Penjualan', icon: <ShoppingCart className="w-[18px] h-[18px]" />, path: '/daftar-penjualan' },
        { name: 'Daftar Pembelian', icon: <ShoppingCart className="w-[18px] h-[18px]" />, path: '/daftar-pembelian' },
        { name: 'Monitoring Piutang', icon: <DollarSign className="w-[18px] h-[18px]" />, path: '/monitoring-piutang' },
        { name: 'Riwayat Pembayaran', icon: <DollarSign className="w-[18px] h-[18px]" />, path: '/riwayat-pembayaran' },
        { name: 'Target Penjualan', icon: <TrendingUp className="w-[18px] h-[18px]" />, path: '/target-penjualan' },
      ]
    }
  ];

  const kepalaGudangMenu = [
    {
      label: 'MENU UTAMA',
      items: [
        { name: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, path: '/dashboard' },
        { name: 'Monitor Stok', icon: <Package className="w-[18px] h-[18px]" />, path: '/realtime-stok' },
        { name: 'Approval Stok Masuk', icon: <CheckSquare className="w-[18px] h-[18px]" />, path: '/approval-stok' },
        { name: 'Daftar Pembelian', icon: <ShoppingCart className="w-[18px] h-[18px]" />, path: '/daftar-pembelian' },
        { name: 'Riwayat Stok', icon: <History className="w-[18px] h-[18px]" />, path: '/riwayat-stok' },
        { name: 'Pengiriman Barang', icon: <Truck className="w-[18px] h-[18px]" />, path: '/pengiriman-barang' },
      ]
    }
  ];

  const staffGudangMenu = [
    {
      label: 'MENU UTAMA',
      items: [
        { name: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, path: '/dashboard' },
        { name: 'Monitor Stok', icon: <Package className="w-[18px] h-[18px]" />, path: '/realtime-stok' },
        { name: 'Pengiriman Barang', icon: <Truck className="w-[18px] h-[18px]" />, path: '/pengiriman-barang' },
        { name: 'Input Stok Masuk', icon: <Package className="w-[18px] h-[18px]" />, path: '/input-stok-masuk' },
        { name: 'Daftar Pembelian', icon: <ShoppingCart className="w-[18px] h-[18px]" />, path: '/daftar-pembelian' },
        { name: 'Riwayat Stok', icon: <History className="w-[18px] h-[18px]" />, path: '/riwayat-stok' },
      ]
    }
  ];

  const ownerMenu = [
    {
      label: 'MENU UTAMA',
      items: [
        { name: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, path: '/dashboard' },
        { name: 'Monitor Stok', icon: <Package className="w-[18px] h-[18px]" />, path: '/realtime-stok' },
        { name: 'Jadwal Umur Piutang', icon: <Calendar className="w-[18px] h-[18px]" />, path: '/aging-schedule' },
        { name: 'Laporan Penjualan', icon: <BarChart2 className="w-[18px] h-[18px]" />, path: '/laporan-penjualan' },
        { name: 'Laporan Kunjungan', icon: <MapPin className="w-[18px] h-[18px]" />, path: '/laporan-kunjungan' },
        { name: 'Daftar Pembelian', icon: <ShoppingCart className="w-[18px] h-[18px]" />, path: '/daftar-pembelian' },
        { name: 'Target Penjualan', icon: <TrendingUp className="w-[18px] h-[18px]" />, path: '/target-penjualan' },
      ]
    }
  ];

  const salesMenu = [
    {
      label: 'MENU UTAMA',
      items: [
        { name: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" />, path: '/dashboard' },
        { name: 'Monitor Stok', icon: <Package className="w-[18px] h-[18px]" />, path: '/realtime-stok' },
        { name: 'Input Pesanan', icon: <ShoppingCart className="w-[18px] h-[18px]" />, path: '/input-pesanan' },
        { name: 'Riwayat Pesanan', icon: <ShoppingCart className="w-[18px] h-[18px]" />, path: '/daftar-penjualan' },
        { name: 'Laporan Kunjungan', icon: <MapPin className="w-[18px] h-[18px]" />, path: '/laporan-kunjungan' },
        { name: 'Monitoring Piutang', icon: <DollarSign className="w-[18px] h-[18px]" />, path: '/monitoring-piutang' },
        { name: 'Riwayat Pembayaran', icon: <DollarSign className="w-[18px] h-[18px]" />, path: '/riwayat-pembayaran' },
        { name: 'Target Penjualan', icon: <TrendingUp className="w-[18px] h-[18px]" />, path: '/target-penjualan' },
      ]
    }
  ];

  let menuGroups = adminMenu;
  if (role === 'kepala_gudang') menuGroups = kepalaGudangMenu;
  else if (role === 'staff_gudang') menuGroups = staffGudangMenu;
  else if (role === 'owner') menuGroups = ownerMenu;
  else if (role === 'sales') menuGroups = salesMenu;

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('userRole');
    localStorage.removeItem('userFullName');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 bg-[#2B2D83] text-white flex flex-col`}>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#3730A3] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo-gana.jpg" alt="Logo PT GANA" className="w-10 h-10 object-contain rounded-lg bg-white p-1" />
            <div>
              <h1 className="font-bold text-sm text-white leading-tight">PT GANA ERP</h1>
              <p className="text-[10px] text-indigo-200">Distributor Resmi Kixx & Petronas</p>
            </div>
          </div>
        </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-5 px-4 flex flex-col gap-6">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            <ul className="space-y-1">
              {group.items.map((item, itemIdx) => {
                let badgeCount = 0;
                if (item.path === '/monitoring-piutang' || item.path === '/riwayat-pembayaran') {
                  badgeCount = counts.pendingPiutang;
                } else if (item.path === '/approval-stok' || item.path === '/approval-stok-masuk') {
                  badgeCount = counts.pendingApprovalStok;
                } else if (item.path === '/data-pelanggan') {
                  badgeCount = counts.pendingPelanggan;
                }

                const isRead = readMenus.includes(item.path);

                return (
                  <li key={itemIdx}>
                    <NavLink
                      to={item.path}
                      onClick={() => handleMenuClick(item.path)}
                      className={({ isActive }) => {
                        return `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                          isActive
                          ? 'bg-[#4F46E5] text-white shadow-sm' 
                          : 'text-indigo-100 hover:bg-[#3730A3] hover:text-white'
                        }`
                      }}
                    >
                      {item.icon}
                      <div className="flex-1 flex items-center justify-between">
                        <span>{item.name}</span>
                        {badgeCount > 0 && !isRead && (
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0 border border-white/40 shadow-xs" title={`${badgeCount} Perlu Konfirmasi/Disetujui`} />
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold leading-none">
                              {badgeCount}
                            </span>
                          </span>
                        )}
                      </div>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-[#3730A3] shrink-0">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-indigo-100 hover:bg-red-500 hover:text-white transition-colors w-full font-medium text-sm"
        >
          <LogOut className="w-[18px] h-[18px]" />
          <span>Keluar</span>
        </button>
      </div>
      </aside>
    </>
  );
}
