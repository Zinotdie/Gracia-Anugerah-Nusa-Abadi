import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Search, Plus, Edit, Trash2, Package, X, Loader2, HelpCircle } from 'lucide-react';
import { productService } from '../services/productService';

export default function DataProduk() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('Semua Brand');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadProducts = () => {
    setIsLoading(true);
    setErrorMsg('');
    productService.getAll()
      .then((res) => {
        const data = Array.isArray(res) ? res : (res?.data || res?.products || []);
        setProducts(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat produk dari API:", err);
        setProducts([]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const [selectedStockFilter, setSelectedStockFilter] = useState('Semua Stok');
  const [alert, setAlert] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setAlert({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    id: '', brand: 'Petronas', name: '', sae: '', kemasan: '4L', kategori: 'Gasoline', harga: 0, stokKarton: '', stokLiter: '', grade: '', tipe_kendaraan: ''
  });

  const filteredProducts = products.filter(product => {
    const name = product.name || product.nama || product.nama_produk || '';
    const grade = product.grade || '';
    const tipe_kendaraan = product.tipe_kendaraan || '';
    const stok = parseInt(product.stokKarton !== undefined ? product.stokKarton : product.stok_total_karton) || 0;

    const matchBrand = selectedBrand === 'Semua Brand' || product.brand === selectedBrand;
    const matchCategory = selectedCategory === 'Semua Kategori' || product.kategori === selectedCategory;
    
    let matchStock = true;
    if (selectedStockFilter === 'Stok Menipis') matchStock = stok <= 30 && stok > 0;
    else if (selectedStockFilter === 'Stok Habis') matchStock = stok === 0;

    const term = searchTerm.toLowerCase();
    const matchSearch = name.toLowerCase().includes(term) ||
                        grade.toLowerCase().includes(term) ||
                        tipe_kendaraan.toLowerCase().includes(term);
    return matchBrand && matchCategory && matchStock && matchSearch;
  });

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        ...product,
        name: product.name || product.nama || '',
        brand: product.brand || 'Petronas',
        sae: product.sae || '',
        kemasan: product.kemasan || '4L',
        kategori: product.kategori || 'Gasoline',
        harga: product.harga || 0,
        stokKarton: product.stokKarton || '',
        stokLiter: product.stokLiter || '',
        grade: product.grade || '',
        tipe_kendaraan: product.tipe_kendaraan || ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        id: '', brand: 'Petronas', name: '', sae: '', kemasan: '4L', kategori: 'Gasoline', harga: 0, stokKarton: '', stokLiter: '', grade: '', tipe_kendaraan: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const payload = {
      brand: formData.brand,
      nama_produk: formData.name || formData.nama || formData.nama_produk || '',
      sae: formData.sae || '',
      kemasan: formData.kemasan || '4L',
      kategori: formData.kategori || 'Gasoline',
      harga_het: Number(formData.harga !== undefined ? formData.harga : (formData.harga_het || 0)),
      stok_total_karton: Number(formData.stokKarton !== undefined ? formData.stokKarton : (formData.stok_total_karton || 0)),
      grade: formData.grade || '',
      tipe_kendaraan: formData.tipe_kendaraan || ''
    };

    const targetId = editingProduct ? (editingProduct.id || editingProduct.id_produk) : null;

    const apiCall = editingProduct
      ? productService.update(targetId, payload)
      : productService.create(payload);

    apiCall
      .then(() => {
        loadProducts();
        handleCloseModal();
        setIsLoading(false);
        showAlert(
          'success',
          editingProduct ? 'Produk Berhasil Diperbarui!' : 'Produk Baru Ditambahkan!',
          `Data produk "${payload.nama_produk}" telah berhasil disimpan ke database.`
        );
      })
      .catch((err) => {
        console.error("Gagal menyimpan produk ke API:", err);
        setIsLoading(false);
        showAlert('error', 'Gagal Simpan!', err.response?.data?.message || 'Gagal menyimpan perubahan data produk ke backend.');
      });
  };

  const confirmDelete = (product) => {
    setEditingProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (editingProduct) {
      setIsLoading(true);
      productService.delete(editingProduct.id)
        .then(() => {
          loadProducts();
          setIsDeleteModalOpen(false);
          setEditingProduct(null);
        })
        .catch((err) => {
          console.error("Gagal menghapus produk dari API:", err);
          setIsLoading(false);
          setIsDeleteModalOpen(false);
          setEditingProduct(null);
        });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        
        {/* Header section */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <h1 className="text-2xl font-bold text-[#1E293B]">Produk</h1>
            <p className="text-sm text-[#64748B] mt-1">Kelola data oli Kixx & Petronas dengan kategori SAE dan kemasan</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold text-sm transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </button>
        </div>

        {errorMsg && (
          <div className="w-full bg-[#FEE2E2] text-[#DC2626] text-sm font-semibold p-4 rounded-lg border border-[#FCA5A5]">
            {errorMsg}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-[#EFF6FF] border border-[#BFDBFE] p-5 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2563EB] rounded-lg flex items-center justify-center text-white shrink-0">
                 <Package className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-sm font-semibold text-[#1E40AF]">Total Produk Aktif</p>
                 <h3 className="text-2xl font-bold text-[#1E3A8A]">{products.length}</h3>
              </div>
           </div>
           <div className="bg-[#FEF2F2] border border-[#FECACA] p-5 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-[#DC2626] rounded-lg flex items-center justify-center text-white shrink-0">
                 <Package className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-sm font-semibold text-[#991B1B]">Brand Kixx</p>
                 <h3 className="text-2xl font-bold text-[#7F1D1D]">{products.filter(p => p.brand === 'Kixx').length}</h3>
              </div>
           </div>
           <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-5 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-[#16A34A] rounded-lg flex items-center justify-center text-white shrink-0">
                 <Package className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-sm font-semibold text-[#166534]">Brand Petronas</p>
                 <h3 className="text-2xl font-bold text-[#14532D]">{products.filter(p => p.brand === 'Petronas').length}</h3>
              </div>
           </div>
        </div>

        {/* Card wrapper for content */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden">
          
          {/* Filters Bar */}
          <div className="p-5 flex items-center gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <input 
                type="text" 
                placeholder="Cari produk, brand, SAE..." 
                className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#4F46E5] text-[#334155] placeholder:text-[#94A3B8]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              className="border border-[#E2E8F0] rounded-lg px-4 py-2 text-sm text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white min-w-[150px]"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="Semua Brand">Semua Brand</option>
              <option value="Petronas">Petronas</option>
              <option value="Kixx">Kixx</option>
            </select>

            <select 
              className="border border-[#E2E8F0] rounded-lg px-4 py-2 text-sm text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white min-w-[150px]"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="Semua Kategori">Semua Kategori</option>
              <option value="Gasoline">Gasoline</option>
              <option value="Diesel">Diesel</option>
              <option value="Synthetic">Synthetic</option>
              <option value="Fully Synthetic">Fully Synthetic</option>
              <option value="Semi Synthetic">Semi Synthetic</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-white text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider border-b border-t border-[#E2E8F0]">
                  <th className="py-4 px-6">BRAND</th>
                  <th className="py-4 px-6">NAMA PRODUK</th>
                  <th className="py-4 px-6">SAE</th>
                  <th className="py-4 px-6">KEMASAN</th>
                  <th className="py-4 px-6">KATEGORI</th>
                  <th className="py-4 px-6">STOK (KARTON)</th>
                  <th className="py-4 px-6">HET</th>
                  <th className="py-4 px-6 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-[#64748B]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#4F46E5]" />
                        <span>Memuat data produk...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-[#64748B]">
                      Tidak ada produk ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-[#E2E8F0] hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          product.brand === 'Kixx' 
                            ? 'bg-[#FEE2E2] text-[#DC2626]' 
                            : 'bg-[#DCFCE7] text-[#16A34A]'
                        }`}>
                          {product.brand}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[#1E293B] font-bold">
                        <div className="flex flex-col">
                          <span>{product.name || product.nama}</span>
                          {product.grade && <span className="text-xs text-[#64748B] font-normal mt-0.5">Grade: {product.grade}</span>}
                          {product.tipe_kendaraan && <span className="text-xs text-[#94A3B8] font-normal">Tipe: {product.tipe_kendaraan}</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#64748B]">{product.sae}</td>
                      <td className="py-4 px-6 text-[#64748B]">{product.kemasan}</td>
                      <td className="py-4 px-6 text-[#64748B]">{product.kategori}</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1E293B]">{product.stokKarton} Karton</span>
                          <span className="text-xs text-[#94A3B8]">({product.stokLiter} L)</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#1E293B] font-bold">Rp {Number(product.harga).toLocaleString('id-ID')}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => handleOpenModal(product)} className="text-[#0B56A6] hover:text-blue-800 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => confirmDelete(product)} className="text-[#DC2626] hover:text-red-800 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>


      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[#E2E8F0]">
              <h2 className="text-lg font-bold text-[#1E293B]">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button onClick={handleCloseModal} className="text-[#94A3B8] hover:text-[#334155] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Brand</label>
                  <select 
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]"
                    value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} required
                  >
                    <option value="Petronas">Petronas</option>
                    <option value="Kixx">Kixx</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Nama Produk</label>
                  <input type="text" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-semibold text-[#334155]">SAE</label>
                    <div className="group relative flex items-center">
                      <HelpCircle className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#4F46E5] cursor-help" />
                      <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-56 bg-slate-800 text-white text-[11px] p-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 text-left font-normal leading-snug">
                        Indeks kekentalan oli (contoh: 10W-40, 5W-30). Semakin kecil angka W, semakin encer oli saat dingin.
                      </div>
                    </div>
                  </div>
                  <input type="text" placeholder="e.g. 5W-30" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]" 
                    value={formData.sae} onChange={e => setFormData({...formData, sae: e.target.value})} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Kemasan</label>
                  <input type="text" placeholder="e.g. 4L" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]" 
                    value={formData.kemasan} onChange={e => setFormData({...formData, kemasan: e.target.value})} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Kategori</label>
                  <select className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]"
                    value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} required>
                    <option value="Gasoline">Gasoline</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Synthetic">Synthetic</option>
                    <option value="Fully Synthetic">Fully Synthetic</option>
                    <option value="Semi Synthetic">Semi Synthetic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-semibold text-[#334155]">Grade (e.g. API SN, API CJ-4)</label>
                    <div className="group relative flex items-center">
                      <HelpCircle className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#4F46E5] cursor-help" />
                      <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-56 bg-slate-800 text-white text-[11px] p-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 text-left font-normal leading-snug">
                        Standar kualitas oli (contoh: API SN, API CJ-4). Menunjukkan performa dan kesesuaian teknologi mesin.
                      </div>
                    </div>
                  </div>
                  <input type="text" placeholder="e.g. API SN" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]" 
                    value={formData.grade || ''} onChange={e => setFormData({...formData, grade: e.target.value})} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Tipe Kendaraan</label>
                  <input type="text" placeholder="e.g. Mobil, Motor, Truk" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]" 
                    value={formData.tipe_kendaraan || ''} onChange={e => setFormData({...formData, tipe_kendaraan: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-semibold text-[#334155]">HET</label>
                    <div className="group relative flex items-center">
                      <HelpCircle className="w-3.5 h-3.5 text-[#94A3B8] hover:text-[#4F46E5] cursor-help" />
                      <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-56 bg-slate-800 text-white text-[11px] p-2 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 text-left font-normal leading-snug">
                        Harga Eceran Tertinggi. Harga jual maksimal yang disarankan untuk konsumen akhir.
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-[#64748B] text-sm">Rp</span>
                    </div>
                    <input type="text" placeholder="0" className="w-full pl-9 pr-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]" 
                      value={formData.harga ? Number(formData.harga).toLocaleString('id-ID') : ''} onChange={e => setFormData({...formData, harga: parseInt(e.target.value.replace(/\D/g, ''), 10) || 0})} required />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Stok (Karton)</label>
                  <input type="number" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]" 
                    value={formData.stokKarton} onChange={e => setFormData({...formData, stokKarton: e.target.value})} required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Stok (Liter)</label>
                  <input type="number" className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]" 
                    value={formData.stokLiter} onChange={e => setFormData({...formData, stokLiter: e.target.value})} required />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#E2E8F0]">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-semibold text-[#475569] hover:bg-gray-100 rounded-lg transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-lg transition-colors">
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
            <h3 className="text-lg font-bold text-[#1E293B] mb-2">Hapus Produk?</h3>
            <p className="text-sm text-[#64748B] mb-6">
              Apakah Anda yakin ingin menghapus <span className="font-bold text-[#1E293B]">{editingProduct?.name}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => {setIsDeleteModalOpen(false); setEditingProduct(null);}} className="flex-1 py-2.5 bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] font-semibold rounded-xl transition-colors">
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
