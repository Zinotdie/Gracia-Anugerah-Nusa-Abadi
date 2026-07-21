import DashboardLayout from '../layouts/DashboardLayout';
import { Package, AlertTriangle, Search, CheckCircle, RefreshCw, Loader2, ArrowUpRight } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';

export default function RealtimeStock() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('semua');
  const [filterStockStatus, setFilterStockStatus] = useState('semua');

  // Fetch stock from database API
  const fetchStock = (showRefreshLoader = false) => {
    if (showRefreshLoader) setIsRefreshing(true);
    
    productService.getAll()
      .then(res => {
        const data = Array.isArray(res) ? res : (res?.data || res?.products || []);
        const mapped = data.map(p => ({
          id: p.id_produk || p.id,
          name: p.nama_produk || p.nama || p.name || '',
          brand: p.brand || 'Umum',
          packaging: p.kemasan || 'Karton',
          stock: parseInt(p.stokKarton || p.stok_total_karton || p.stok || 0, 10)
        }));

        setProducts(mapped);
        setLastUpdated(new Date());
        setIsLoading(false);
        setIsRefreshing(false);
      })
      .catch(err => {
        console.error("Gagal memuat stok real-time dari API:", err);
        setProducts([]);
        setIsLoading(false);
        setIsRefreshing(false);
      });
  };

  // Polling every 5 seconds for real-time updates
  useEffect(() => {
    fetchStock(false);

    const intervalId = setInterval(() => {
      fetchStock(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Compute stats (< 30 for low stock threshold)
  const stats = useMemo(() => {
    let totalSKUs = products.length;
    let totalVolume = products.reduce((acc, curr) => acc + curr.stock, 0);
    let lowStockCount = products.filter(p => p.stock > 0 && p.stock < 30).length;
    let outOfStockCount = products.filter(p => p.stock === 0).length;

    return { totalSKUs, totalVolume, lowStockCount, outOfStockCount };
  }, [products]);

  // Unique list of brands for filtering
  const brandsList = useMemo(() => {
    const brands = products.map(p => p.brand);
    return ['semua', ...new Set(brands)];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchBrand = filterBrand === 'semua' || p.brand === filterBrand;
      
      let matchStatus = true;
      if (filterStockStatus === 'low') {
        matchStatus = p.stock > 0 && p.stock < 30;
      } else if (filterStockStatus === 'empty') {
        matchStatus = p.stock === 0;
      } else if (filterStockStatus === 'good') {
        matchStatus = p.stock >= 30;
      }

      return matchSearch && matchBrand && matchStatus;
    });
  }, [products, searchTerm, filterBrand, filterStockStatus]);

  const handleManualRefresh = () => {
    fetchStock(true);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        
        {/* Title Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B] flex items-center gap-2">
              Real-Time Stock Monitor
            </h2>
            <p className="text-sm text-[#64748B] mt-1">Status inventori pelumas ter-update secara otomatis langsung dari gudang</p>
          </div>
        </div>

        {/* Real-time Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#64748B] uppercase">Total Varian (SKU)</p>
              <p className="text-2xl font-black text-[#1E293B]">{stats.totalSKUs}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#64748B] uppercase">Volume Stok Total</p>
              <p className="text-2xl font-black text-[#1E293B]">{stats.totalVolume} Karton</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#64748B] uppercase">Stok Menipis (&lt;30)</p>
              <p className="text-2xl font-black text-[#D97706]">{stats.lowStockCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#64748B] uppercase">Stok Habis (0)</p>
              <p className="text-2xl font-black text-[#DC2626]">{stats.outOfStockCount}</p>
            </div>
          </div>
        </div>

        {/* Action / Filtering Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
          <div className="relative flex-1 min-w-[220px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#94A3B8]" />
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama pelumas atau brand..." 
              className="w-full pl-10 pr-4 py-2 border-none rounded-lg text-sm focus:outline-none focus:ring-0 text-[#334155] placeholder:text-[#94A3B8] bg-transparent"
            />
          </div>
          
          <div className="w-px h-8 bg-[#E2E8F0] hidden sm:block"></div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#64748B] font-bold">Brand:</span>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs font-semibold text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white w-[130px]"
              >
                {brandsList.map(b => (
                  <option key={b} value={b}>{b === 'semua' ? 'Semua Brand' : b}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#64748B] font-bold">Kondisi Stok:</span>
              <select
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value)}
                className="border border-[#E2E8F0] rounded-xl px-4 py-2 text-xs font-semibold text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white w-[150px]"
              >
                <option value="semua">Semua Kondisi</option>
                <option value="good">Stok Melimpah (&ge;30)</option>
                <option value="low">Stok Menipis (&lt;30)</option>
                <option value="empty">Stok Habis (0)</option>
              </select>
            </div>
            
            {((localStorage.getItem('userRole') || '').toLowerCase() !== 'sales') && (
              <Link 
                to="/riwayat-stok" 
                className="flex items-center gap-1.5 px-4 py-2 bg-[#4F46E5] text-white rounded-xl text-xs font-bold hover:bg-[#4338CA] transition-colors ml-auto shadow-2xs"
              >
                <span>Riwayat Stok</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Real-time Inventory Table */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden">
          <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
            <h3 className="font-bold text-[#1E293B]">Daftar Stok Fisik Gudang</h3>
            <span className="text-xs text-[#64748B]">
              Terakhir diperbarui: {lastUpdated.toLocaleTimeString('id-ID')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#334155]">
              <thead className="bg-[#F8FAFC] text-xs font-bold text-[#64748B] uppercase border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Brand</th>
                  <th className="py-4 px-6">Nama Pelumas</th>
                  <th className="py-4 px-6 text-center">Kemasan</th>
                  <th className="py-4 px-6 text-right">Stok Fisik</th>
                  <th className="py-4 px-6 text-center">Status Inventori</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-[#64748B]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#4F46E5]" />
                        <span>Mengambil data inventori real-time...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((p, idx) => {
                    const isLow = p.stock > 0 && p.stock < 30;
                    const isEmpty = p.stock === 0;

                    return (
                      <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-[#64748B]">#PRD-{String(p.id).padStart(3, '0')}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.brand === 'Kixx' ? 'bg-[#FEE2E2] text-[#DC2626]' : 
                            p.brand === 'Gs Caltex' ? 'bg-[#DCFCE7] text-[#16A34A]' : 
                            'bg-slate-100 text-[#475569]'
                          }`}>
                            {p.brand}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-[#1E293B]">{p.name}</td>
                        <td className="py-4 px-6 text-center text-[#475569]">{p.packaging}</td>
                        <td className="py-4 px-6 text-right">
                          <span className={`font-black text-base ${isEmpty ? 'text-[#EF4444]' : isLow ? 'text-[#D97706]' : 'text-[#1E293B]'}`}>
                            {p.stock}
                          </span>
                          <span className="text-xs text-[#64748B] font-medium ml-1">Karton</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            {isEmpty ? (
                              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626] flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Stok Habis
                              </span>
                            ) : isLow ? (
                              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> Stok Menipis
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#2E7D32] flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Stok Melimpah
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-[#64748B]">
                      Tidak ada data pelumas yang sesuai dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
