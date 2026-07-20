import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  const navigate = useNavigate();

  useEffect(() => {
    setRole(localStorage.getItem('userRole') || 'admin');
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

      <div className={`
        fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#312E81] text-white flex flex-col shrink-0
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#3730A3] shrink-0 gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-base font-bold text-white leading-tight">GANA</h1>
          <p className="text-[10px] text-indigo-200 leading-none">Distribusi Pelumas</p>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-5 px-4 flex flex-col gap-6">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            <h2 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide mb-2 px-3 hidden">
              {group.label}
            </h2>
            <ul className="space-y-1">
              {group.items.map((item, itemIdx) => (
                <li key={itemIdx}>
                  <NavLink
                    to={item.path}
                    onClick={() => setIsOpen && setIsOpen(false)}
                    className={({ isActive }) => {
                      return `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                        isActive
                        ? 'bg-[#4F46E5] text-white shadow-sm' 
                        : 'text-indigo-100 hover:bg-[#3730A3] hover:text-white'
                      }`
                    }}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              ))}
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
      </div>
    </>
  );
}
