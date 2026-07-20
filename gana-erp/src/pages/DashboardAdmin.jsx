import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import { Users, UserCheck, Package, CircleDollarSign, ShoppingCart, Loader2, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function DashboardAdmin() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [availableMonths, setAvailableMonths] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    activeSalesCount: 0,
    registeredCustomersCount: 0,
    activeProductsCount: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);

  const fetchDashboardData = (month) => {
    setIsLoading(true);
    api.get(`/api/admin/dashboard?bulan=${month}`)
      .then(res => {
        if (res.data && res.data.success) {
          setStats(res.data.stats);
          setRecentTransactions(res.data.recentTransactions);
          setSelectedMonth(res.data.selectedMonth);
          if (res.data.availableMonths && res.data.availableMonths.length > 0) {
            setAvailableMonths(res.data.availableMonths);
          }
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Gagal memuat dashboard admin data:", err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData(selectedMonth);
  }, []);

  const handleMonthChange = (e) => {
    const newMonth = e.target.value;
    setSelectedMonth(newMonth);
    fetchDashboardData(newMonth);
  };

  const formatMonth = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        
        {/* Title Section (Clean Light Header) */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Dashboard Admin</h2>
            <p className="text-sm text-[#64748B] mt-1">Ringkasan sistem dan manajemen data</p>
          </div>
          
          {/* Month Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#64748B]">Periode:</span>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs font-bold text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white min-w-[140px] shadow-2xs"
            >
              {availableMonths.length > 0 ? (
                availableMonths.map((m) => (
                  <option key={m} value={m}>{formatMonth(m)}</option>
                ))
              ) : (
                <option value={selectedMonth}>{formatMonth(selectedMonth)}</option>
              )}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">Memuat data dashboard admin...</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Penjualan Bulan Ini" 
                value={`Rp ${stats.totalSales.toLocaleString('id-ID')}`} 
                icon={<CircleDollarSign className="w-5 h-5 text-emerald-600" />} 
                bgColor="bg-emerald-50"
                textColor="text-emerald-600"
              />
              <StatCard 
                title="Tim Sales Aktif" 
                value={stats.activeSalesCount.toString()} 
                icon={<Users className="w-5 h-5 text-blue-600" />} 
                bgColor="bg-blue-50"
                textColor="text-blue-600"
              />
              <StatCard 
                title="Bengkel Terdaftar" 
                value={stats.registeredCustomersCount.toString()} 
                icon={<ShoppingCart className="w-5 h-5 text-purple-600" />} 
                bgColor="bg-purple-50"
                textColor="text-purple-600"
              />
              <StatCard 
                title="Produk Aktif" 
                value={stats.activeProductsCount.toString()} 
                icon={<Package className="w-5 h-5 text-amber-600" />} 
                bgColor="bg-amber-50"
                textColor="text-amber-600"
              />
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Link 
                to="/data-produk" 
                className="group relative bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white p-6 rounded-3xl shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                 <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                 <div className="flex items-center justify-between mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
                     <Package className="w-6 h-6 text-white" />
                   </div>
                   <ArrowUpRight className="w-5 h-5 text-indigo-200 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </div>
                 <div>
                   <h3 className="font-extrabold text-xl mb-1 text-white">Kelola Produk</h3>
                   <p className="text-xs text-indigo-100 opacity-90">Katalog pelumas Kixx & Petronas, harga, dan varian</p>
                 </div>
              </Link>

              <Link 
                to="/data-pelanggan" 
                className="group relative bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-6 rounded-3xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                 <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                 <div className="flex items-center justify-between mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
                     <Users className="w-6 h-6 text-white" />
                   </div>
                   <ArrowUpRight className="w-5 h-5 text-purple-200 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </div>
                 <div>
                   <h3 className="font-extrabold text-xl mb-1 text-white">Kelola Pelanggan</h3>
                   <p className="text-xs text-purple-100 opacity-90">Data bengkel mitra, lokasi alamat, & verifikasi akun</p>
                 </div>
              </Link>

              <Link 
                to="/user-management" 
                className="group relative bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white p-6 rounded-3xl shadow-lg hover:shadow-amber-500/25 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                 <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                 <div className="flex items-center justify-between mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
                     <UserCheck className="w-6 h-6 text-white" />
                   </div>
                   <ArrowUpRight className="w-5 h-5 text-amber-200 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </div>
                 <div>
                   <h3 className="font-extrabold text-xl mb-1 text-white">Manajemen Pengguna</h3>
                   <p className="text-xs text-amber-100 opacity-90">Pengaturan akun Sales, Gudang, & hak akses sistem</p>
                 </div>
              </Link>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 overflow-hidden mt-2">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Transaksi Penjualan Terbaru</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Daftar transaksi pesanan (SO) pada periode terpilih</p>
                </div>
                <Link to="/daftar-penjualan" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors">
                  Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                    <tr>
                      <th className="py-4 px-6">NO INVOICE</th>
                      <th className="py-4 px-6">BENGKEL</th>
                      <th className="py-4 px-6">TOTAL</th>
                      <th className="py-4 px-6">STATUS</th>
                      <th className="py-4 px-6">TANGGAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentTransactions.length > 0 ? (
                      recentTransactions.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-900">{tx.invoiceId}</td>
                          <td className="py-4 px-6 font-semibold text-slate-700">{tx.customer}</td>
                          <td className="py-4 px-6 font-black text-slate-900">Rp {tx.total.toLocaleString('id-ID')}</td>
                          <td className="py-4 px-6">
                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                              tx.statusBayar === 'Lunas' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                                : 'bg-amber-50 text-amber-700 border-amber-200/60'
                            }`}>
                              {tx.statusBayar}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-slate-500">{tx.date}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-10 text-center text-slate-500 text-sm">Tidak ada transaksi untuk bulan ini.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}
