import DashboardLayout from '../layouts/DashboardLayout';
import { PackagePlus, Save, Trash2, Search, CheckCircle2, AlertCircle, Edit2, X, Upload, Image as ImageIcon, Eye, Building2, Package, Layers, FileText } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { purchaseService } from '../services/purchaseService';
import { productService } from '../services/productService';

export default function InputStokMasuk() {
  const [products, setProducts] = useState([]);
  const [sjNumber, setSjNumber] = useState(() => localStorage.getItem('gana_incoming_stock_sj') || '');
  const [supplier, setSupplier] = useState(() => localStorage.getItem('gana_incoming_stock_supplier') || '');
  const [fotoSj, setFotoSj] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState('');
  const [uom, setUom] = useState('Karton');
  const [draftItems, setDraftItems] = useState(() => {
    const saved = localStorage.getItem('gana_incoming_stock_draft');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch products from database
  useEffect(() => {
    productService.getAll()
      .then(res => {
        const data = Array.isArray(res) ? res : (res?.data || res?.products || res?.produk || []);
        if (data.length > 0) {
          const mapped = data.map(p => ({
            id: p.id_produk || p.id,
            name: p.nama_produk || p.nama || p.name || '',
            brand: p.brand || '',
            sae: p.sae || '',
            kemasan: p.kemasan || ''
          }));
          setProducts(mapped);
        }
      })
      .catch(err => {
        console.error("Gagal memuat produk dari API, gunakan mock lokal:", err);
      });
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem('gana_incoming_stock_draft', JSON.stringify(draftItems));
  }, [draftItems]);

  useEffect(() => {
    localStorage.setItem('gana_incoming_stock_sj', sjNumber);
  }, [sjNumber]);

  useEffect(() => {
    localStorage.setItem('gana_incoming_stock_supplier', supplier);
  }, [supplier]);
  
  // Modal Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [editUom, setEditUom] = useState('Karton');
  
  // Modal Detail State
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState(null);

  // Search text for filtering products dropdown
  const [searchProductTerm, setSearchProductTerm] = useState('');

  // Calculate formatted total volume dynamically based on UOM
  const formattedTotalVolume = useMemo(() => {
    const totals = {};
    draftItems.forEach(item => {
      totals[item.uom] = (totals[item.uom] || 0) + item.qty;
    });
    
    const parts = Object.entries(totals).map(([uom, qty]) => `${qty} ${uom}`);
    return parts.length > 0 ? parts.join(', ') : '0 Karton';
  }, [draftItems]);

  // Notification State
  const [alert, setAlert] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlert({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  // Filter products by brand and search term
  const availableProducts = useMemo(() => {
    return products.filter(p => {
      // Filter by supplier brand
      if (supplier === 'PT. PLI (Petronas)' && p.brand !== 'Petronas') return false;
      if (supplier === 'PT. ABM (Kixx)' && p.brand !== 'Kixx') return false;
      
      // Filter by search term
      return p.name.toLowerCase().includes(searchProductTerm.toLowerCase());
    });
  }, [supplier, searchProductTerm, products]);

  const handleAddToDraft = (e) => {
    e.preventDefault();
    
    if (!supplier || supplier === '-- Pilih Supplier --') {
      showAlert('error', 'Gagal', 'Silakan pilih Supplier terlebih dahulu.');
      return;
    }

    if (!selectedProductId) {
      showAlert('error', 'Gagal', 'Silakan pilih Produk.');
      return;
    }

    const parsedQty = parseInt(qty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      showAlert('error', 'Gagal', 'Jumlah Qty masuk harus lebih besar dari 0.');
      return;
    }

    const product = products.find(p => String(p.id) === String(selectedProductId));
    if (!product) return;

    // Check if product already exists in draft with same uom & supplier
    const existingIndex = draftItems.findIndex(item => 
      item.name === product.name && 
      item.uom === uom && 
      (item.supplier === supplier || !item.supplier)
    );

    if (existingIndex !== -1) {
      const updated = [...draftItems];
      updated[existingIndex].qty += parsedQty;
      updated[existingIndex].supplier = supplier; // Ensure supplier is set
      setDraftItems(updated);
    } else {
      setDraftItems([...draftItems, {
        id: Date.now(),
        produk_id: product.id || product.id_produk,
        brand: product.brand,
        name: product.name,
        sae: product.sae,
        kemasan: product.kemasan,
        supplier: supplier,
        qty: parsedQty,
        uom: uom
      }]);
    }

    // Reset product selection inputs
    setSelectedProductId('');
    setQty('');
  };

  const handleDeleteDraftItem = (id) => {
    setDraftItems(draftItems.filter(item => item.id !== id));
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditQty(item.qty);
    setEditUom(item.uom);
    setIsEditModalOpen(true);
  };

  const openDetailModal = (item) => {
    setViewingItem(item);
    setIsDetailModalOpen(true);
  };

  const handleUpdateItem = (e) => {
    e.preventDefault();
    const parsedQty = parseInt(editQty);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      showAlert('error', 'Gagal', 'Jumlah Qty masuk harus lebih besar dari 0.');
      return;
    }

    setDraftItems(draftItems.map(item => 
      item.id === editingItem.id 
        ? { ...item, qty: parsedQty, uom: editUom } 
        : item
    ));
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmitToKepalaGudang = () => {
    if (!sjNumber.trim()) {
      showAlert('error', 'Gagal', 'Silakan masukkan No. Surat Jalan / Invoice Supplier.');
      return;
    }

    if (!supplier || supplier === '-- Pilih Supplier --') {
      showAlert('error', 'Gagal', 'Silakan pilih Supplier.');
      return;
    }

    if (draftItems.length === 0) {
      showAlert('error', 'Gagal', 'Draft penerimaan masih kosong. Tambahkan minimal 1 produk.');
      return;
    }

    const totalQty = draftItems.reduce((acc, curr) => acc + curr.qty, 0);

    const itemsList = draftItems.map(item => ({
      id_produk: item.produk_id || item.id_produk,
      produk_id: item.produk_id || item.id_produk,
      qty_beli: parseInt(item.qty || item.qty_beli || 0, 10),
      qty: parseInt(item.qty || item.qty_beli || 0, 10),
      supplier: item.supplier || supplier
    }));

    let numericSupplierId = 1;
    if (supplier && (supplier.includes('Kixx') || supplier.includes('ABM'))) {
      numericSupplierId = 2;
    } else if (supplier && (supplier.includes('Petronas') || supplier.includes('PLI'))) {
      numericSupplierId = 1;
    }

    const receipt = {
      sj: sjNumber,
      no_sj_supplier: sjNumber,
      foto_sj_supplier: fotoSj,
      supplier: supplier,
      id_supplier: numericSupplierId,
      itemsCount: draftItems.length,
      totalQty: totalQty,
      items: itemsList,
      detail_pembelian: itemsList,
      draftList: draftItems
    };

    purchaseService.create(receipt)
      .then(() => {
        showAlert(
          'success',
          'Berhasil Dikirim!',
          `Penerimaan barang dengan No. Surat Jalan "${sjNumber}" senilai total ${totalQty} Karton berhasil dikirim ke Kepala Gudang untuk disetujui.`
        );

        // Reset Form
        setDraftItems([]);
        setSjNumber('');
        setSupplier('');
        setSelectedProductId('');
        setQty('');
        setSearchProductTerm('');
      })
      .catch(err => {
        console.error("Gagal menyimpan ke database:", err);
        const detailedError = err.response?.data?.message || err.message || "Gagal mengirim penerimaan barang ke database backend.";
        showAlert(
          'error',
          'Gagal!',
          `Gagal menyimpan: ${detailedError}`
        );
      });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans relative">
        
        {/* Alert Modal */}
        {alert.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className={`p-6 text-center ${alert.type === 'success' ? 'bg-[#F0FDF4]' : 'bg-[#FEE2E2]'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${alert.type === 'success' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FECACA] text-[#DC2626]'}`}>
                  {alert.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold text-[#1E293B] mb-2">{alert.title}</h3>
                <p className="text-sm text-[#475569]">{alert.message}</p>
              </div>
              <div className="p-4 bg-white border-t border-[#E2E8F0]">
                <button 
                  onClick={closeAlert}
                  className={`w-full py-2.5 rounded-xl font-bold text-white transition-colors shadow-sm ${alert.type === 'success' ? 'bg-[#16A34A] hover:bg-[#15803D]' : 'bg-[#DC2626] hover:bg-[#B91C1C]'}`}
                >
                  OK, Mengerti
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Input Stok Masuk</h2>
            <p className="text-sm text-[#64748B] mt-1">Catat penerimaan barang dari supplier</p>
          </div>
          <button 
            onClick={handleSubmitToKepalaGudang}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-semibold text-sm transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5" />
            Kirim ke Kepala Gudang
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form Input Section */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] p-6 h-max">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[#E2E8F0]">
              <div className="w-8 h-8 bg-[#EEF2FF] rounded-lg flex items-center justify-center">
                <PackagePlus className="w-5 h-5 text-[#4F46E5]" />
              </div>
              <h3 className="font-bold text-[#1E293B] text-lg">Form Penerimaan</h3>
            </div>
            
            <form onSubmit={handleAddToDraft} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#334155]">No. Surat Jalan / Invoice Supplier *</label>
                <input 
                  type="text" 
                  value={sjNumber}
                  onChange={e => setSjNumber(e.target.value)}
                  placeholder="e.g. SJ-2026-001 / INV-2026-001" 
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#334155]">Upload Foto Surat Jalan / Invoice Supplier</label>
                <div className="relative border border-dashed border-[#CBD5E1] rounded-xl p-3 bg-gray-50 flex items-center justify-between">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = (event) => {
                          const img = new Image();
                          img.src = event.target.result;
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            let width = img.width;
                            let height = img.height;
                            const maxWidth = 1200;
                            if (width > maxWidth) {
                              height = Math.round((height * maxWidth) / width);
                              width = maxWidth;
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            setFotoSj(canvas.toDataURL('image/jpeg', 0.7));
                          };
                        };
                      }
                    }}
                    className="hidden" 
                    id="upload-foto-sj"
                  />
                  <label 
                    htmlFor="upload-foto-sj"
                    className="cursor-pointer text-xs font-bold text-[#4F46E5] flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{fotoSj ? 'Foto Resi / SJ Dipilih' : 'Pilih Foto Surat Jalan'}</span>
                  </label>
                  {fotoSj && (
                    <button 
                      type="button" 
                      onClick={() => setFotoSj('')}
                      className="text-[10px] font-bold text-[#EF4444] hover:underline"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                {fotoSj && (
                  <div className="mt-1 h-24 rounded-lg overflow-hidden border border-[#E2E8F0] relative group">
                    <img src={fotoSj} alt="Surat Jalan Supplier" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => setSelectedLightboxPhoto(fotoSj)}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                    >
                      <Eye className="w-4 h-4 mr-1" /> Lihat Foto
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#334155]">Supplier *</label>
                <select 
                  value={supplier}
                  onChange={e => {
                    setSupplier(e.target.value);
                    setSelectedProductId(''); // Reset product when supplier changes
                  }}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]"
                  required
                >
                  <option value="">-- Pilih Supplier --</option>
                  <option value="PT. PLI (Petronas)">PT. PLI (Petronas)</option>
                  <option value="PT. ABM (Kixx)">PT. ABM (Kixx)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-sm font-semibold text-[#334155]">Cari & Pilih Produk *</label>
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-[#94A3B8]" />
                  </div>
                  <input 
                    type="text" 
                    value={searchProductTerm}
                    onChange={e => setSearchProductTerm(e.target.value)}
                    placeholder="Saring nama produk..." 
                    className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]" 
                  />
                </div>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]"
                  required
                >
                  <option value="">-- Pilih Produk --</option>
                  {availableProducts.map(p => (
                    <option key={p.id} value={p.id}>[{p.brand}] {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Qty Masuk *</label>
                  <input 
                    type="number" 
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    placeholder="0" 
                    min="1"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Satuan</label>
                  <select 
                    value={uom}
                    onChange={e => setUom(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]"
                  >
                    <option value="Karton">Karton</option>
                    <option value="Drum">Drum</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full mt-4 bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0] text-[#1E293B] font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <PackagePlus className="w-4 h-4 text-[#4F46E5]" />
                + Tambah ke Draft
              </button>
            </form>
          </div>

          {/* Draft Table Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-center shadow-sm">
                  <Save className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1E293B] text-lg">Draft Penerimaan</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {sjNumber ? `No. SJ: ${sjNumber}` : 'Belum ada No. SJ'} 
                    {supplier ? ` • Supplier: ${supplier}` : ''}
                  </p>
                </div>
              </div>
              <span className="bg-[#E0E7FF] text-[#4F46E5] text-xs font-bold px-3.5 py-1.5 rounded-full border border-[#C7D2FE]">
                {draftItems.length} Item
              </span>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-white text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]">
                    <th className="py-4 px-6">PRODUK</th>
                    <th className="py-4 px-6">SUPPLIER</th>
                    <th className="py-4 px-6 text-center">QTY</th>
                    <th className="py-4 px-6 text-center">SATUAN</th>
                    <th className="py-4 px-6 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {draftItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-[#E2E8F0] hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                              item.brand === 'Kixx' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#DCFCE7] text-[#16A34A]'
                            }`}>
                              {item.brand}
                            </span>
                            {(item.sae || item.kemasan) && (
                              <span className="text-[11px] font-medium text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-md">
                                {[item.sae, item.kemasan].filter(Boolean).join(' • ')}
                              </span>
                            )}
                          </div>
                          <p 
                            onClick={() => openDetailModal(item)} 
                            className="font-bold text-[#1E293B] hover:text-[#4F46E5] cursor-pointer transition-colors"
                          >
                            {item.name}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 font-semibold text-[#334155]">
                          <Building2 className="w-4 h-4 text-[#64748B]" />
                          <span>{item.supplier || supplier || 'PT. PLI (Petronas)'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-[#1E293B]">{item.qty}</td>
                      <td className="py-4 px-6 text-center text-[#64748B] font-medium">{item.uom}</td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => openDetailModal(item)}
                            className="text-[#4F46E5] hover:text-[#3730A3] transition-colors p-1.5 rounded-lg hover:bg-[#EEF2FF]"
                            title="Lihat Detail & Gambar Pesanan"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button 
                            onClick={() => openEditModal(item)}
                            className="text-[#3B82F6] hover:text-[#2563EB] transition-colors p-1.5 rounded-lg hover:bg-[#EFF6FF]"
                            title="Edit Item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteDraftItem(item.id)}
                            className="text-[#EF4444] hover:text-[#B91C1C] transition-colors p-1.5 rounded-lg hover:bg-[#FEE2E2]"
                            title="Hapus Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {draftItems.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-[#94A3B8]">
                        Belum ada item di draft. Silakan tambah produk dari form di samping.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-[#64748B]">Total Volume Draft</span>
                <span className="text-xl font-black text-[#1E293B]">{formattedTotalVolume}</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Modal Detail & Gambar Pesanan Draft */}
      {isDetailModalOpen && viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Modal with Brand Colors */}
            <div className={`p-5 text-white flex items-center justify-between ${
              viewingItem.brand === 'Kixx' ? 'bg-gradient-to-r from-red-600 to-rose-700' : 'bg-gradient-to-r from-teal-600 to-emerald-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Detail Pesanan & Gambar Produk</h3>
                  <p className="text-xs text-white/80 font-medium">Informasi rincian item dalam draft penerimaan</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsDetailModalOpen(false); setViewingItem(null); }} 
                className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
              
              {/* Card Thumbnail Gambar Produk Mockup */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-[#E2E8F0]">
                <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center shrink-0 border shadow-inner ${
                  viewingItem.brand === 'Kixx' 
                    ? 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200 text-red-600' 
                    : 'bg-gradient-to-br from-teal-50 to-emerald-100 border-teal-200 text-teal-700'
                }`}>
                  <Package className="w-10 h-10 mb-1" />
                  <span className="text-[10px] font-extrabold tracking-widest uppercase">{viewingItem.brand}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full w-max ${
                    viewingItem.brand === 'Kixx' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#DCFCE7] text-[#16A34A]'
                  }`}>
                    Brand {viewingItem.brand}
                  </span>
                  <h4 className="font-extrabold text-[#1E293B] text-base leading-snug">{viewingItem.name}</h4>
                  <p className="text-xs text-[#64748B]">Pelumas Mesin Resmi GANA ERP</p>
                </div>
              </div>

              {/* Grid Specifications & Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                  <p className="text-[11px] font-bold text-[#64748B] uppercase mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#4F46E5]" /> Supplier
                  </p>
                  <p className="text-sm font-bold text-[#1E293B]">{viewingItem.supplier || supplier || '-'}</p>
                </div>

                <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                  <p className="text-[11px] font-bold text-[#64748B] uppercase mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#4F46E5]" /> No. Surat Jalan
                  </p>
                  <p className="text-sm font-bold text-[#1E293B]">{sjNumber || '-'}</p>
                </div>

                <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                  <p className="text-[11px] font-bold text-[#64748B] uppercase mb-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#4F46E5]" /> SAE / Kemasan
                  </p>
                  <p className="text-sm font-bold text-[#1E293B]">
                    {[viewingItem.sae, viewingItem.kemasan].filter(Boolean).join(' • ') || '-'}
                  </p>
                </div>

                <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                  <p className="text-[11px] font-bold text-[#64748B] uppercase mb-1 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-[#4F46E5]" /> Qty Pesanan
                  </p>
                  <p className="text-sm font-extrabold text-[#4F46E5]">{viewingItem.qty} {viewingItem.uom}</p>
                </div>
              </div>

              {/* Foto Surat Jalan Preview if attached */}
              {fotoSj && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold text-[#475569]">Foto Surat Jalan / Invoice Supplier Attached:</p>
                  <div 
                    onClick={() => setSelectedLightboxPhoto(fotoSj)}
                    className="relative group rounded-xl overflow-hidden border border-[#E2E8F0] h-36 bg-slate-900 cursor-pointer"
                  >
                    <img src={fotoSj} alt="Foto Surat Jalan" className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-bold gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-4 h-4" /> Klik untuk Ukuran Penuh
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openEditModal(viewingItem);
                }}
                className="px-4 py-2 bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#E0E7FF] rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-4 h-4" /> Edit Qty Item
              </button>
              <button 
                onClick={() => { setIsDetailModalOpen(false); setViewingItem(null); }}
                className="px-5 py-2 bg-[#1E293B] text-white hover:bg-slate-800 rounded-xl text-sm font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Item Draft */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0]">
              <h3 className="font-bold text-lg text-[#1E293B]">Edit Item Draft</h3>
              <button 
                onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }} 
                className="text-[#94A3B8] hover:text-[#1E293B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateItem} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#64748B] mb-1.5">Produk</label>
                <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm text-[#1E293B] font-semibold">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mr-2 inline-block ${editingItem.brand === 'Kixx' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#DCFCE7] text-[#16A34A]'}`}>
                    {editingItem.brand}
                  </span>
                  {editingItem.name}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E293B]">Qty Masuk <span className="text-[#EF4444]">*</span></label>
                  <input 
                    type="number" 
                    value={editQty}
                    onChange={e => setEditQty(e.target.value)}
                    placeholder="0" 
                    min="1"
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#1E293B]">Satuan <span className="text-[#EF4444]">*</span></label>
                  <select 
                    value={editUom}
                    onChange={e => setEditUom(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] bg-white"
                  >
                    <option value="Karton">Karton</option>
                    <option value="Drum">Drum</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#E2E8F0]">
                <button 
                  type="button" 
                  onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#1E293B] transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-[#4F46E5] text-white rounded-lg text-sm font-semibold hover:bg-[#4338CA] transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Photo Viewer */}
      {selectedLightboxPhoto && (
        <div className="fixed inset-0 bg-black/95 z-[70] flex flex-col justify-center items-center p-4">
          <button
            onClick={() => setSelectedLightboxPhoto(null)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all focus:outline-none"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedLightboxPhoto}
            alt="Foto Surat Jalan Supplier"
            className="max-h-[85vh] max-w-full rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-200"
          />
          <p className="text-white/70 text-xs mt-4 font-semibold">Foto Surat Jalan / Invoice Supplier</p>
        </div>
      )}

    </DashboardLayout>
  );
}
