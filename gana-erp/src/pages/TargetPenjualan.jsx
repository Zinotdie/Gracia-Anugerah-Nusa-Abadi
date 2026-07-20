import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Target, TrendingUp, Package, Loader2, Plus, Trash, AlertCircle, Check } from 'lucide-react';
import { targetService } from '../services/targetService';
import { userService } from '../services/userService';
import { productService } from '../services/productService';

export default function TargetPenjualan() {
  const [role] = useState(() => (localStorage.getItem('userRole') || 'sales').toLowerCase());
  
  // Selection states
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${yyyy}-${mm}`; // default format YYYY-MM
  });
  
  const [salesList, setSalesList] = useState([]);
  const [selectedSalesId, setSelectedSalesId] = useState('');
  const [products, setProducts] = useState([]);

  // Data states
  const [targetData, setTargetData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Modal target setup states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFormData, setModalFormData] = useState({
    target_omset: '',
    target_volume: '',
    focal_products: [] // [{ produk_id: '', target_qty: '' }]
  });

  // Load initial options for Admin & Owner
  useEffect(() => {
    if (role === 'admin' || role === 'owner') {
      userService.getSales()
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.data || res?.sales || []);
          setSalesList(list);
          if (list.length > 0) {
            setSelectedSalesId(list[0].id || list[0].id_sales);
          }
        })
        .catch(err => console.error("Gagal load data sales:", err));

      productService.getAll()
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.data || res?.products || res?.produk || []);
          setProducts(list);
        })
        .catch(err => console.error("Gagal load produk:", err));
    }
  }, [role]);

  // Load target data whenever filter changes
  useEffect(() => {
    loadTarget();
  }, [selectedMonth, selectedSalesId, role]);

  const fetchTargetData = (params) => {
    targetService.get(params)
      .then((res) => {
        // Handle success response
        if (res.success && res.data) {
          setTargetData(res.data);
        } else {
          setTargetData(null);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Gagal load target penjualan:", err);
        // 404 indicates target is not configured yet (normal state, not an error)
        if (err.response?.status === 404) {
          setErrorMessage('');
        } else {
          setErrorMessage("Gagal memuat target penjualan dari server.");
        }
        setTargetData(null);
        setIsLoading(false);
      });
  };

  const loadTarget = () => {
    // If Admin/Owner and no sales selected yet, don't fetch
    if ((role === 'admin' || role === 'owner') && !selectedSalesId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    
    const params = { bulan: selectedMonth };
    if (role === 'admin' || role === 'owner') {
      params.sales_id = selectedSalesId;
      fetchTargetData(params);
    } else {
      // For sales role
      const userId = localStorage.getItem('userId');
      if (userId && userId !== 'dummy-sales-id') {
        params.sales_id = userId;
        fetchTargetData(params);
      } else {
        // Fallback: resolve sales ID by matching the name in the sales list
        userService.getSales()
          .then((res) => {
            const list = Array.isArray(res) ? res : (res?.data || res?.sales || []);
            const currentName = localStorage.getItem('userFullName');
            const matched = list.find(s => 
              (s.nama || s.nama_sales || s.name || '').toLowerCase() === (currentName || '').toLowerCase()
            );
            if (matched) {
              const resolvedId = matched.id || matched.id_sales;
              localStorage.setItem('userId', resolvedId);
              params.sales_id = resolvedId;
              fetchTargetData(params);
            } else {
              fetchTargetData(params);
            }
          })
          .catch((err) => {
            console.error("Gagal load sales list untuk resolve ID:", err);
            fetchTargetData(params);
          });
      }
    }
  };

  const calculatePercentage = (achieved, target) => {
    if (!target) return 0;
    return Math.min(Math.round((achieved / target) * 100), 100);
  };

  // Modal Action Handlers
  const handleOpenConfigureModal = () => {
    if (targetData) {
      setModalFormData({
        target_omset: String(targetData.targetRevenue || targetData.target_omset || 0),
        target_volume: String(targetData.targetDus || targetData.target_volume || 0),
        focal_products: (targetData.focalProducts || []).map(p => ({
          produk_id: p.produk_id || p.id,
          target_qty: String(p.target || p.target_qty || 0)
        }))
      });
    } else {
      setModalFormData({
        target_omset: '',
        target_volume: '',
        focal_products: []
      });
    }
    setIsModalOpen(true);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleAddFocalProduct = () => {
    if (products.length === 0) return;
    setModalFormData(prev => ({
      ...prev,
      focal_products: [
        ...prev.focal_products,
        { produk_id: products[0].id || products[0].id_produk || '', target_qty: '10' }
      ]
    }));
  };

  const handleRemoveFocalProduct = (index) => {
    setModalFormData(prev => ({
      ...prev,
      focal_products: prev.focal_products.filter((_, idx) => idx !== index)
    }));
  };

  const handleFocalProductChange = (index, field, value) => {
    setModalFormData(prev => {
      const updated = [...prev.focal_products];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, focal_products: updated };
    });
  };

  const handleSaveTarget = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload = {
      sales_id: Number(selectedSalesId),
      bulan: selectedMonth,
      target_omset: Number(modalFormData.target_omset),
      target_volume: Number(modalFormData.target_volume),
      focal_products: modalFormData.focal_products.map(p => ({
        produk_id: Number(p.produk_id),
        target_qty: Number(p.target_qty)
      }))
    };

    targetService.createOrUpdate(payload)
      .then(() => {
        setSuccessMessage("Target penjualan berhasil disimpan.");
        setIsModalOpen(false);
        loadTarget();
      })
      .catch((err) => {
        console.error("Gagal menyimpan target:", err);
        setErrorMessage(err.response?.data?.message || "Gagal menyimpan konfigurasi target.");
        setIsLoading(false);
      });
  };

  // Format Month Display
  const formatMonthName = (yyyyMm) => {
    if (!yyyyMm) return '';
    const [year, month] = yyyyMm.split('-');
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  };

  const revenuePercentage = targetData ? calculatePercentage(targetData.achievedRevenue, targetData.targetRevenue) : 0;
  const dusPercentage = targetData ? calculatePercentage(targetData.achievedDus, targetData.targetDus) : 0;
  
  // Find name of currently selected sales representative
  const currentSalesObj = salesList.find(s => String(s.id || s.id_sales) === String(selectedSalesId));
  const currentSalesName = currentSalesObj ? (currentSalesObj.name || currentSalesObj.nama || currentSalesObj.nama_sales) : 'Sales';

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Target Penjualan</h2>
            <p className="text-sm text-[#64748B] mt-1">
              {role === 'sales' ? 'Pantau pencapaian target bulanan Anda' : 'Kelola dan monitor target penjualan mitra sales'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Sales Selector for Admin & Owner */}
            {(role === 'admin' || role === 'owner') && salesList.length > 0 && (
              <div className="flex flex-col gap-1">
                <select 
                  value={selectedSalesId} 
                  onChange={e => setSelectedSalesId(e.target.value)}
                  className="bg-white px-3 py-2 border border-[#E2E8F0] rounded-lg shadow-sm text-sm font-semibold text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                >
                  {salesList.map(s => (
                    <option key={s.id || s.id_sales} value={s.id || s.id_sales}>
                      {s.name || s.nama || s.nama_sales}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Month Selector Dropdown */}
            <div className="flex flex-col gap-1">
              <select 
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-white px-3 py-2 border border-[#E2E8F0] rounded-lg shadow-sm text-sm font-semibold text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] cursor-pointer"
              >
                {[
                  { value: '2026-08', label: 'Agustus 2026' },
                  { value: '2026-07', label: 'Juli 2026' },
                  { value: '2026-06', label: 'Juni 2026' },
                  { value: '2026-05', label: 'Mei 2026' },
                  { value: '2026-04', label: 'April 2026' },
                  { value: '2026-03', label: 'Maret 2026' },
                  { value: '2026-02', label: 'Februari 2026' },
                  { value: '2026-01', label: 'Januari 2026' },
                  { value: '2025-12', label: 'Desember 2025' }
                ].map(m => (
                  <option key={m.value} value={m.value}>
                    {m.label} ({m.value})
                  </option>
                ))}
              </select>
            </div>

            {/* Configure Button for Admin & Owner */}
            {(role === 'admin' || role === 'owner') && (
              <button 
                onClick={handleOpenConfigureModal}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg font-semibold text-sm hover:bg-[#4338CA] transition-colors"
              >
                <Plus className="w-4 h-4" /> Atur Target
              </button>
            )}
          </div>
        </div>

        {/* Success/Error Alerts */}
        {successMessage && (
          <div className="w-full bg-[#DEF7EC] text-[#03543F] text-sm font-semibold p-4 rounded-lg border border-[#BCF0DA] flex items-center gap-2">
            <Check className="w-4 h-4 text-[#0E9F6E]" />
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="w-full bg-[#FDE8E8] text-[#9B1C1C] text-sm font-semibold p-4 rounded-lg border border-[#F8B4B4] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#F05252]" />
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#64748B] gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-[#4F46E5]" />
            <span className="text-sm font-medium">Memuat data target penjualan...</span>
          </div>
        ) : !targetData ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center shadow-sm">
            <Target className="w-16 h-16 text-[#94A3B8] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#1E293B]">Belum Ada Target Penjualan</h3>
            <p className="text-sm text-[#64748B] mt-1 max-w-md mx-auto">
              Target penjualan untuk {role === 'sales' ? 'Anda' : `mitra ${currentSalesName}`} di bulan {formatMonthName(selectedMonth)} belum dikonfigurasi.
            </p>
            {(role === 'admin' || role === 'owner') && (
              <button 
                onClick={handleOpenConfigureModal}
                className="mt-6 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Konfigurasi Sekarang
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Main Target Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Revenue Target (Main Card) */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-white opacity-10 blur-2xl"></div>
                
                <div className="relative z-10">
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Target className="w-6 h-6 text-[#A5B4FC]" />
                        <h3 className="text-lg font-bold text-white">Target Omset Bulanan</h3>
                      </div>
                      {targetData.daysRemaining !== undefined && (
                        <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                          Sisa {targetData.daysRemaining} Hari Lagi
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <p className="text-sm text-[#A5B4FC] font-semibold mb-1">Pencapaian Saat Ini</p>
                      <div className="flex items-end gap-3 mb-2 flex-wrap">
                        <span className="text-4xl font-black">Rp {Number(targetData.achievedRevenue || 0).toLocaleString('id-ID')}</span>
                        <span className="text-lg font-semibold text-[#A5B4FC] mb-1">/ Rp {Number(targetData.targetRevenue || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-8">
                      <div className="flex justify-between text-sm font-bold mb-2">
                        <span>Progress Pencapaian</span>
                        <span>{revenuePercentage}%</span>
                      </div>
                      <div className="w-full bg-black/20 rounded-full h-3">
                        <div 
                          className="bg-[#34D399] h-3 rounded-full transition-all duration-1000 relative"
                          style={{ width: `${revenuePercentage}%` }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_#34D399]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Volume Target (Dus) */}
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] p-6 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 bg-[#F0FDF4] rounded-lg flex items-center justify-center mb-4">
                    <Package className="w-5 h-5 text-[#16A34A]" />
                  </div>
                  <h3 className="text-base font-bold text-[#1E293B] mb-1">Target Volume (Dus)</h3>
                  <p className="text-xs text-[#64748B]">Total dus terjual vs target volume</p>
                </div>
                
                <div className="mt-6 flex flex-col items-center">
                  <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#E2E8F0]"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#16A34A]"
                        strokeWidth="3"
                        strokeDasharray={`${dusPercentage}, 100`}
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-[#1E293B]">{dusPercentage}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-lg font-bold text-[#1E293B]">{targetData.achievedDus || 0}</span>
                    <span className="text-[#64748B] text-sm"> / {targetData.targetDus || 0} Dus</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Focal Products Section */}
            {targetData.focalProducts && targetData.focalProducts.length > 0 && (
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden">
                <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#EA580C]" />
                    <h3 className="font-bold text-[#1E293B] text-lg">Focal Products Bulan Ini</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {targetData.focalProducts.map((product, idx) => {
                      const pct = calculatePercentage(product.achieved, product.target);
                      return (
                        <div key={idx} className="border border-[#E2E8F0] rounded-xl p-5 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded uppercase ${
                                product.brand === 'Kixx' ? 'bg-[#EF4444]' : 'bg-[#22C55E]'
                              }`}>
                                {product.brand || 'Petronas'}
                              </span>
                              <h4 className="font-bold text-[#1E293B] mt-2 leading-tight">{product.name || product.nama}</h4>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                              <span className="text-xs font-bold text-[#475569]">{pct}%</span>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <div className="flex justify-between text-xs font-semibold text-[#64748B] mb-1.5">
                              <span>Pencapaian: {product.achieved || 0} dus</span>
                              <span>Target: {product.target || 0} dus</span>
                            </div>
                            <div className="w-full bg-[#E2E8F0] rounded-full h-2">
                              <div 
                                className={`${pct >= 100 ? 'bg-[#22C55E]' : 'bg-[#4F46E5]'} h-2 rounded-full`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Suggestion / Tips Box */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 bg-[#FEF3C7] rounded-full flex items-center justify-center shrink-0">
                <span className="text-xl">💡</span>
              </div>
              <div>
                <h4 className="font-bold text-[#92400E] mb-1">Tips Meningkatkan Penjualan Bulan Ini</h4>
                <p className="text-sm text-[#B45309] leading-relaxed">
                  Fokuskan kunjungan ke bengkel-bengkel besar di area Banjarmasin untuk menawarkan produk fokus yang baru saja restock. Gunakan skema promo khusus untuk menarik minat pelanggan agar dapat mencapai target volume bulanan lebih cepat!
                </p>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Admin Target Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] shrink-0">
              <div>
                <h3 className="font-bold text-lg text-[#1E293B]">Atur Target Penjualan</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Sales: {currentSalesName} • Bulan: {formatMonthName(selectedMonth)}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#64748B] hover:text-[#1E293B] text-2xl font-semibold leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSaveTarget} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Target Omset (Rp) <span className="text-[#EF4444]">*</span></label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 150.000.000"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]" 
                    value={modalFormData.target_omset ? Number(modalFormData.target_omset).toLocaleString('id-ID') : ''}
                    onChange={e => {
                      const cleanVal = e.target.value.replace(/\D/g, '');
                      setModalFormData({...modalFormData, target_omset: cleanVal ? parseInt(cleanVal, 10) : 0});
                    }}
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Target Volume (Dus) <span className="text-[#EF4444]">*</span></label>
                  <input 
                    type="number" 
                    required 
                    placeholder="e.g. 400"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]" 
                    value={modalFormData.target_volume}
                    onChange={e => setModalFormData({...modalFormData, target_volume: e.target.value})}
                  />
                </div>
              </div>

              {/* Focal Products Dynamic Config */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="text-sm font-bold text-[#1E293B]">Produk Fokus Bulanan</span>
                  <button 
                    type="button"
                    onClick={handleAddFocalProduct}
                    className="flex items-center gap-1 text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Produk
                  </button>
                </div>

                {modalFormData.focal_products.length === 0 ? (
                  <p className="text-xs text-[#64748B] italic py-2">Belum ada produk fokus ditambahkan.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {modalFormData.focal_products.map((fp, idx) => (
                      <div key={idx} className="flex gap-3 items-end bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                        <div className="flex-1 flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-[#475569]">Pilih Produk</label>
                          <select
                            value={fp.produk_id}
                            onChange={e => handleFocalProductChange(idx, 'produk_id', e.target.value)}
                            className="w-full border border-[#E2E8F0] rounded px-2.5 py-1.5 text-xs bg-white text-[#1E293B] focus:outline-none"
                          >
                            {products.map(p => (
                              <option key={p.id || p.id_produk} value={p.id || p.id_produk}>
                                {p.brand} - {p.name || p.nama} ({p.sae || 'SAE'}, {p.kemasan || 'Kemasan'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-[120px] flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-[#475569]">Target (Dus)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={fp.target_qty}
                            onChange={e => handleFocalProductChange(idx, 'target_qty', e.target.value)}
                            className="w-full border border-[#E2E8F0] rounded px-2.5 py-1.5 text-xs focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFocalProduct(idx)}
                          className="p-2 text-[#DC2626] hover:bg-[#FEE2E2] rounded transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#E2E8F0] shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-gray-100 rounded-lg transition-colors border border-[#CBD5E1]"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-lg transition-colors shadow-sm disabled:bg-indigo-300 flex items-center gap-1.5"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
