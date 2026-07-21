import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Search, ShoppingCart, Plus, Minus, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';

export default function InputPesanan() {
  const allProducts = [];

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [cart, setCart] = useState([]);
  const [selectedBengkel, setSelectedBengkel] = useState('');
  
  // State for Bengkel List
  const [bengkels, setBengkels] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [products, setProducts] = useState(allProducts);

  useEffect(() => {
    // Load customers
    customerService.getAll()
      .then(res => {
        console.log("[InputPesanan] Received customers response:", res);
        let list = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (res && Array.isArray(res.data)) {
          list = res.data;
        } else if (res && res.data && Array.isArray(res.data.data)) {
          list = res.data.data;
        } else if (res && Array.isArray(res.customers)) {
          list = res.customers;
        }

        setCustomersList(list);
        const activeBengkels = list.filter(c => c.is_active === 1 || c.is_active === true || c.status === 'Active' || c.status === 'Aktif' || c.status === undefined);
        setBengkels(activeBengkels.map(c => c.nama_bengkel || c.name || c.nama || 'Bengkel'));
      })
      .catch(err => {
        console.error("Gagal load pelanggan dari API:", err);
        setCustomersList([]);
        setBengkels([]);
      });

    // Load products
    productService.getAll()
      .then(res => {
        console.log("[InputPesanan] Received products response:", res);
        let list = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (res && Array.isArray(res.data)) {
          list = res.data;
        } else if (res && res.data && Array.isArray(res.data.data)) {
          list = res.data.data;
        } else if (res && Array.isArray(res.products)) {
          list = res.products;
        }

        const mapped = list.map(p => ({
          id: p.id || p.id_produk,
          brand: p.brand || 'Petronas',
          name: p.nama_produk || p.nama || p.name || 'Produk Pelumas',
          variant: p.sae || '',
          size: p.kemasan || '',
          price: Number(p.harga_het !== undefined ? p.harga_het : p.harga) || 0,
          priceFormatted: `Rp ${(Number(p.harga_het !== undefined ? p.harga_het : p.harga) || 0).toLocaleString('id-ID')}`,
          stock: Number(p.stokKarton !== undefined ? p.stokKarton : (p.stok_total_karton !== undefined ? p.stok_total_karton : 0)) || 0,
          headerColor: (p.brand || '').toLowerCase().includes('kixx') ? 'bg-[#EF4444]' : 'bg-[#22C55E]',
          grade: p.grade || '',
          tipe_kendaraan: p.tipe_kendaraan || ''
        }));
        console.log("[InputPesanan] Mapped products count:", mapped.length);
        setProducts(mapped);
      })
      .catch(err => {
        console.error("Gagal load produk dari API:", err);
        setProducts([]);
      });
  }, []);
  const [isAddBengkelOpen, setIsAddBengkelOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    address: '',
    phone: '',
    city: 'Banjarmasin'
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('transfer'); // 'transfer' or 'tempo'
  const [tempoDays, setTempoDays] = useState('14');

  // Custom Alert State
  const [alertModal, setAlertModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlertModal({ isOpen: true, type, title, message });
  };
  
  const closeAlert = () => {
    setAlertModal({ ...alertModal, isOpen: false });
  };

  const handleAddBengkel = (e) => {
    e.preventDefault();
    if(newCustomerForm.name.trim()) {
      const payload = {
        nama: newCustomerForm.name,
        alamat: newCustomerForm.address || '-',
        telepon: newCustomerForm.phone || '-',
        piutang: 0,
        kota: newCustomerForm.city || 'Banjarmasin',
        status: 'Inactive'
      };

      customerService.create(payload)
        .then(() => {
          customerService.getAll()
            .then(resList => {
              const rawData = Array.isArray(resList) ? resList : (resList?.data || resList?.customers || []);
              const data = Array.isArray(rawData) ? rawData : (rawData?.data || []);
              setCustomersList(data);
              const activeBengkels = data.filter(c => c.is_active === 1 || c.is_active === true || c.status === 'Active' || c.status === 'Aktif' || c.status === undefined);
              setBengkels(activeBengkels.map(c => c.nama_bengkel || c.name || c.nama || 'Bengkel'));
              
              setNewCustomerForm({ name: '', address: '', phone: '', city: 'Banjarmasin' });
              setIsAddBengkelOpen(false);
              showAlert('success', 'Bengkel Diajukan!', `Bengkel "${payload.nama}" berhasil diajukan untuk verifikasi. Harap tunggu persetujuan Admin/Owner.`);
            })
            .catch(err => {
              console.error("Gagal refresh pelanggan:", err);
              setIsAddBengkelOpen(false);
            });
        })
        .catch(err => {
          console.error("Gagal menambahkan pelanggan ke API:", err);
          showAlert('error', 'Gagal', 'Gagal menambahkan pelanggan ke database backend.');
        });
    }
  };

  // Filtering Logic
  const selectedCustomerObj = useMemo(() => {
    return customersList.find(c => (c.nama_bengkel || c.name || c.nama) === selectedBengkel);
  }, [selectedBengkel, customersList]);

  const availableProducts = useMemo(() => {
    return products.filter(p => {
      const prodName = p.name || '';
      const matchSearch = prodName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBrand = activeFilter === 'Semua' || (p.brand || '').toLowerCase().includes(activeFilter.toLowerCase());
      return matchSearch && matchBrand;
    });
  }, [products, searchTerm, activeFilter]);

  // Cart Functions
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: (Number(item.qty) || 0) + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const current = Number(item.qty) || 0;
        const newQty = current + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const setDirectQty = (id, targetVal) => {
    if (targetVal === '') {
      setCart(cart.map(item => item.id === id ? { ...item, qty: '' } : item));
      return;
    }
    const parsed = parseInt(targetVal);
    const val = isNaN(parsed) ? '' : Math.max(0, parsed);
    if (val === 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => item.id === id ? { ...item, qty: val } : item));
    }
  };

  const handleQtyBlur = (id) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const num = Number(item.qty);
        return (!num || num <= 0) ? null : { ...item, qty: num };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * (Number(item.qty) || 0)), 0);

  const handleCheckout = () => {
    if (!selectedBengkel || selectedBengkel === '-- Pilih Bengkel --') {
      showAlert('error', 'Gagal', 'Silakan pilih bengkel terlebih dahulu!');
      return;
    }
    if (cart.length === 0) {
      showAlert('error', 'Gagal', 'Keranjang order masih kosong!');
      return;
    }
    
    const customerObj = customersList.find(c => (c.name || c.nama || c.nama_bengkel) === selectedBengkel);
    const customerId = customerObj ? (customerObj.id || customerObj.id_pelanggan) : null;

    let tgl_jatuh_tempo = null;
    if (paymentMethod === 'tempo') {
      const d = new Date();
      d.setDate(d.getDate() + Number(tempoDays));
      tgl_jatuh_tempo = d.toISOString().slice(0, 19).replace('T', ' '); // Format MySQL datetime
    }

    // Build payload for backend API
    const orderPayload = {
      pelanggan_id: customerId,
      id_pelanggan: customerId,
      sales_id: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
      metode_bayar: paymentMethod === 'tempo' ? 'Tempo' : 'Transfer',
      tgl_jatuh_tempo: tgl_jatuh_tempo,
      total_netto: cartTotal,
      bukti_transfer: buktiTransfer || null,
      bukti_bayar: buktiTransfer || null,
      dataDetail: cart.map(item => ({
        produk_id: item.id,
        id_produk: item.id,
        qty: Number(item.qty) || 1,
        qty_beli: Number(item.qty) || 1,
        qty_dus: Number(item.qty) || 1,
        harga: item.price
      }))
    };

    orderService.create(orderPayload)
      .then(() => {
        showAlert('success', 'Pesanan Berhasil!', `Pesanan untuk ${selectedBengkel} senilai Rp ${cartTotal.toLocaleString('id-ID')} telah berhasil diproses.`);
        setCart([]);
        setSelectedBengkel('');
        setPaymentMethod('transfer');
        setBuktiTransfer('');
      })
      .catch(err => {
        console.error("Gagal mengirim pesanan ke API:", err);
        showAlert('error', 'Gagal!', 'Gagal mengirimkan pesanan ke server backend. Pastikan koneksi aktif.');
      });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 relative">
        
        <div>
          <h2 className="text-xl font-bold text-[#1E293B]">Formulir Pesanan Cepat</h2>
          <p className="text-sm text-[#64748B] mt-1">Input pesanan cepat untuk bengkel</p>
        </div>

        {/* Alert Modal */}
        {alertModal.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className={`p-6 text-center ${alertModal.type === 'success' ? 'bg-[#F0FDF4]' : 'bg-[#FEE2E2]'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${alertModal.type === 'success' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FECACA] text-[#DC2626]'}`}>
                  {alertModal.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold text-[#1E293B] mb-2">{alertModal.title}</h3>
                <p className="text-sm text-[#475569]">{alertModal.message}</p>
              </div>
              <div className="p-4 bg-white border-t border-[#E2E8F0]">
                <button 
                  onClick={closeAlert}
                  className={`w-full py-2.5 rounded-xl font-bold text-white transition-colors shadow-sm ${alertModal.type === 'success' ? 'bg-[#16A34A] hover:bg-[#15803D]' : 'bg-[#DC2626] hover:bg-[#B91C1C]'}`}
                >
                  OK, Mengerti
                </button>
              </div>
            </div>
          </div>
        )}



        {/* Modal Tambah Bengkel */}
        {isAddBengkelOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
                <h3 className="font-bold text-[#1E293B]">Tambah Bengkel Baru</h3>
                <button onClick={() => setIsAddBengkelOpen(false)} className="text-[#64748B] hover:text-[#1E293B]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddBengkel} className="p-5">
                <div className="mb-3">
                  <label className="block text-xs font-bold text-[#1E293B] mb-2">Nama Bengkel <span className="text-[#EF4444]">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={newCustomerForm.name}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, name: e.target.value})}
                    placeholder="Masukkan nama bengkel..."
                    className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs font-bold text-[#1E293B] mb-2">Alamat Lengkap <span className="text-[#EF4444]">*</span></label>
                  <textarea 
                    required
                    rows="2"
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm({...newCustomerForm, address: e.target.value})}
                    placeholder="Contoh: Jl. Ahmad Yani Km 5..."
                    className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] resize-none"
                  ></textarea>
                </div>
                <div className="flex gap-3 mb-5">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-[#1E293B] mb-2">No. Telepon <span className="text-[#EF4444]">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={newCustomerForm.phone}
                      onChange={(e) => setNewCustomerForm({...newCustomerForm, phone: e.target.value.replace(/\D/g, '')})}
                      placeholder="0812..."
                      className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-[#1E293B] mb-2">Kota</label>
                    <select 
                      value={newCustomerForm.city}
                      onChange={(e) => setNewCustomerForm({...newCustomerForm, city: e.target.value})}
                      className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    >
                      <option value="Banjarmasin">Banjarmasin</option>
                      <option value="Banjarbaru">Banjarbaru</option>
                      <option value="Martapura">Martapura</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAddBengkelOpen(false)}
                    className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#64748B] rounded-lg font-bold text-sm hover:bg-[#F8FAFC]"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg font-bold text-sm hover:bg-[#4338CA]"
                  >
                    Simpan Bengkel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6 items-start pb-10">
          
          {/* Left Column: Products */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Search and Filters */}
            <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] flex flex-col gap-4 sticky top-[80px] z-10">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input 
                  type="text" 
                  placeholder="Cari produk..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-[#E2E8F0] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                />
              </div>
              <div className="flex items-center gap-2">
                {['Semua', 'Kixx', 'Petronas'].map(filter => (
                  <button 
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      activeFilter === filter 
                        ? 'bg-[#4F46E5] text-white' 
                        : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Compact Product List Layout */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] divide-y divide-[#E2E8F0] overflow-hidden max-h-[440px] overflow-y-auto pr-1">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <div key={p.id} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold text-white shrink-0 ${
                        p.brand === 'Petronas' ? 'bg-[#00A19C]' : 'bg-[#E31E24]'
                      }`}>
                        {p.brand}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[#1E293B] text-sm truncate">{p.name}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[9px] text-[#64748B] font-semibold">{p.variant}</span>
                          <span className="px-1.5 py-0.2 bg-[#F8FAFC] border border-[#E2E8F0] rounded text-[9px] text-[#64748B] font-semibold">{p.size}</span>
                          {p.grade && <span className="px-1.5 py-0.2 bg-[#EEF2FF] border border-[#C7D2FE] rounded text-[9px] text-[#4F46E5] font-semibold">{p.grade}</span>}
                          {p.tipe_kendaraan && <span className="px-1.5 py-0.2 bg-[#F0FDF4] border border-[#BBF7D0] rounded text-[9px] text-[#16A34A] font-semibold">{p.tipe_kendaraan}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className="font-bold text-[#1E293B] text-sm block">{p.priceFormatted}</span>
                        <span className="text-[10px] text-[#64748B]">Stok: {p.stock} dus</span>
                      </div>
                      <button 
                        onClick={() => addToCart(p)}
                        className="px-3.5 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-xs font-bold rounded-lg transition-colors border border-[#C7D2FE]"
                      >
                        + Tambah
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-[#64748B]">
                  Produk tidak ditemukan.
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Cart & Bengkel Selector (Sticky container) */}
          <div className="w-full lg:w-[360px] flex flex-col gap-4 sticky top-[80px] z-20">
            
            {/* Form Select Bengkel */}
            <div className="bg-white p-5 rounded-xl shadow-xl border border-[#E2E8F0] flex flex-col gap-3">
              <label className="block text-xs font-bold text-[#1E293B]">
                Pilih Bengkel <span className="text-[#EF4444]">*</span>
              </label>
              <div className="flex gap-2">
                <select 
                  value={selectedBengkel}
                  onChange={(e) => setSelectedBengkel(e.target.value)}
                  className="flex-1 border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#1E293B] focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] bg-white"
                >
                  <option value="">-- Pilih Bengkel --</option>
                  {bengkels.map((bengkel, idx) => (
                    <option key={idx} value={bengkel}>{bengkel}</option>
                  ))}
                </select>
                <button 
                  onClick={() => setIsAddBengkelOpen(true)}
                  className="flex items-center justify-center p-2.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] rounded-lg font-bold text-sm border border-[#C7D2FE] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {/* Outstanding Balance Warning Card */}
              {selectedCustomerObj && selectedCustomerObj.outstanding > 0 && (
                <div className="bg-[#FFFBEB] border border-[#FDE68A] text-[#B45309] text-xs font-semibold p-3 rounded-lg flex flex-col gap-1 mt-2">
                  <span className="font-bold flex items-center gap-1">⚠️ Bengkel Memiliki Piutang Aktif</span>
                  <span>Piutang berjalan: Rp {Number(selectedCustomerObj.outstanding).toLocaleString('id-ID')}</span>
                  <span className="text-[10px] text-[#9A3412]">Batas maksimal jatuh tempo adalah 45 hari. Harap ingatkan untuk melakukan pembayaran cicilan.</span>
                </div>
              )}
            </div>

            {/* Cart Box */}
            <div className="bg-white rounded-xl shadow-xl border border-[#E2E8F0] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-[#6366F1] to-[#A855F7] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <h3 className="font-bold">Keranjang Order</h3>
              </div>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">{cart.length} item</span>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto">
              {cart.length > 0 ? (
                <div className="flex flex-col">
                  {cart.map((item) => (
                    <div key={item.id} className="p-4 border-b border-[#E2E8F0] flex flex-col gap-3 hover:bg-[#F8FAFC]">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-[#1E293B] text-sm leading-tight">{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-[#EF4444] hover:bg-[#FEE2E2] p-1 rounded transition-colors shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full bg-[#F1F5F9] text-[#475569] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors">
                            <Minus className="w-3 h-3" />
                          </button>
                          <input 
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => setDirectQty(item.id, e.target.value)}
                            onBlur={() => handleQtyBlur(item.id)}
                            className="w-16 text-center border border-[#E2E8F0] rounded-lg py-1 px-1 text-sm font-bold text-[#1E293B] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full bg-[#F1F5F9] text-[#475569] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-[#64748B] block mb-0.5">{item.priceFormatted} x {item.qty}</span>
                          <span className="font-bold text-[#1E293B] text-sm">Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 flex flex-col items-center justify-center min-h-[300px]">
                  <ShoppingCart className="w-12 h-12 text-[#CBD5E1] mb-4" />
                  <p className="text-sm text-[#94A3B8] font-medium">Belum ada item</p>
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col gap-4">
                
                {/* Metode Pembayaran */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#1E293B]">Metode Pembayaran</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPaymentMethod('transfer')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                        paymentMethod === 'transfer' 
                          ? 'bg-[#EEF2FF] border-[#4F46E5] text-[#4F46E5]' 
                          : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
                      }`}
                    >
                      Transfer
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('tempo')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                        paymentMethod === 'tempo' 
                          ? 'bg-[#EEF2FF] border-[#4F46E5] text-[#4F46E5]' 
                          : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-gray-50'
                      }`}
                    >
                      Tempo
                    </button>
                  </div>
                  
                  {paymentMethod === 'transfer' && (
                    <div className="mt-2 bg-white border border-[#E2E8F0] rounded-lg p-3 flex flex-col gap-2">
                      <span className="text-xs font-semibold text-[#1E293B]">Upload Bukti Transfer:</span>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setBuktiTransfer(reader.result);
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-xs text-[#64748B] file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#EEF2FF] file:text-[#4F46E5]"
                      />
                      {buktiTransfer && (
                        <div className="flex items-center gap-2 mt-1">
                          <img src={buktiTransfer} alt="Bukti Transfer" className="w-12 h-12 object-cover rounded border border-[#E2E8F0]" />
                          <span className="text-[10px] text-[#16A34A] font-bold">Bukti transfer terlampir ✓</span>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'tempo' && (
                    <div className="mt-2 flex items-center justify-between bg-white border border-[#E2E8F0] rounded-lg px-3 py-2">
                      <span className="text-xs font-semibold text-[#64748B]">Lama Tempo:</span>
                      <select 
                        value={tempoDays}
                        onChange={(e) => setTempoDays(e.target.value)}
                        className="text-xs font-bold text-[#1E293B] border-none bg-transparent focus:outline-none focus:ring-0"
                      >
                        <option value="14">14 Hari</option>
                        <option value="30">30 Hari (Net 30)</option>
                        <option value="45">45 Hari</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0]">
                  <span className="text-sm font-semibold text-[#64748B]">Total Belanja</span>
                  <span className="text-lg font-bold text-[#16A34A]">Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>
                
                <button 
                  onClick={handleCheckout}
                  className="w-full py-3 bg-[#16A34A] text-white rounded-lg font-bold hover:bg-[#15803D] transition-colors shadow-sm"
                >
                  Proses Order Sekarang
                </button>
              </div>
            )}
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
