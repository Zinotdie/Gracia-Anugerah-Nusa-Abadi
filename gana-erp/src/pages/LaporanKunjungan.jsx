import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { MapPin, Image as ImageIcon, Calendar, Plus, Camera, Check, DollarSign, X, Upload, Loader2 } from 'lucide-react';
import { visitService } from '../services/visitService';
import { customerService } from '../services/customerService';
import { userService } from '../services/userService';

import ConfirmDialog from '../components/ConfirmDialog';

export default function LaporanKunjungan() {
  const [visits, setVisits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [selectedSalesId, setSelectedSalesId] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [modalErrorMsg, setModalErrorMsg] = useState('');
  const [selectedDetailVisit, setSelectedDetailVisit] = useState(null);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState(null);

  const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
  const isOwner = userRole === 'owner';
  const isOwnerOrAdmin = userRole === 'owner' || userRole === 'admin';

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: 'danger',
    title: '',
    message: '',
    confirmText: 'Ya, Lanjutkan',
    cancelText: 'Batal',
    showCancel: true,
    onConfirm: () => {}
  });

  const [selectedMonth, setSelectedMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));

  const months = [
    { value: 'all', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];

  const years = ['2024', '2025', '2026', '2027'];

  const formatDateTime = (val) => {
    if (!val) return '-';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} • ${timeStr}`;
  };

  const loadCustomers = () => {
    return customerService.getAll()
      .then((res) => {
        const data = Array.isArray(res) ? res : (res?.data || res?.customers || res?.pelanggan || []);
        setCustomers(data);
      })
      .catch((err) => {
        console.error("Gagal memuat pelanggan dari BE:", err);
        setCustomers([]);
      });
  };

  const loadSalesList = () => {
    return userService.getSales()
      .then((res) => {
        const data = Array.isArray(res) ? res : (res?.data || res?.sales || []);
        setSalesList(data);
      })
      .catch((err) => {
        console.error("Gagal memuat sales list:", err);
        setSalesList([]);
      });
  };

  const loadVisits = (monthKey, salesIdFilter = selectedSalesId) => {
    setIsLoading(true);
    const selectedKey = monthKey || (selectedMonth === 'all' ? 'all' : `${selectedYear}-${selectedMonth}`);
    const params = { bulan: selectedKey };
    if (salesIdFilter && salesIdFilter !== 'all') {
      params.sales_id = salesIdFilter;
    }

    visitService.getAll(params)
      .then((res) => {
        const data = Array.isArray(res) ? res : (res?.data || res?.visits || []);
        const mapped = data.map(v => ({
          id: v.id_laporan || v.id_kunjungan || v.id,
          id_pelanggan: v.id_pelanggan || null,
          salesName: v.nama_sales || v.salesName || 'Sales',
          name: v.bengkelName || v.name || v.bengkel || v.nama_bengkel || '',
          datetime: formatDateTime(v.date || v.datetime || v.created_at || v.tanggal || v.tgl_kunjungan),
          description: v.note || v.description || v.keterangan || v.hasil_diskusi || v.catatan || '',
          orderValue: v.orderValue || v.nilai_order || v.order_value || null,
          hasOrder: !!(v.hasOrder || v.has_order || v.nilai_order || v.orderValue || v.status_order === 'Y'),
          photoUrl: v.image || v.photoUrl || v.foto || v.photo || v.foto_visit || null
        }));
        setVisits(mapped);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat kunjungan:", err);
        setVisits([]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadSalesList();
    loadCustomers().finally(() => {
      const monthKey = selectedMonth === 'all' ? 'all' : `${selectedYear}-${selectedMonth}`;
      loadVisits(monthKey, selectedSalesId);
    });
  }, [selectedMonth, selectedYear, selectedSalesId]);

  const mappedVisits = useMemo(() => {
    return visits.map(v => {
      const matchedCust = customers.find(c => String(c.id_pelanggan || c.id) === String(v.id_pelanggan));
      const customerName = matchedCust ? (matchedCust.nama || matchedCust.name) : (v.name || v.bengkel || v.nama_bengkel || 'Bengkel');
      return {
        ...v,
        resolvedName: customerName
      };
    });
  }, [visits, customers]);

  // Computing Summary Stats
  const totalVisitsCount = mappedVisits.length;
  const orderVisitsCount = mappedVisits.filter(v => v.hasOrder).length;
  const conversionRate = totalVisitsCount > 0 ? Math.round((orderVisitsCount / totalVisitsCount) * 100) : 0;
  const totalEstimatedOrderValue = mappedVisits.reduce((acc, v) => acc + (Number(v.orderValue) || 0), 0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisitId, setEditingVisitId] = useState(null);
  const [newVisit, setNewVisit] = useState({
    id_pelanggan: '',
    name: '',
    description: '',
    hasOrder: false,
    orderValue: '',
    photoUrl: null
  });

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewVisit(prev => ({ ...prev, photoUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddVisit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setModalErrorMsg('');
    
    const payload = {
      sales_id: localStorage.getItem('userId') ? Number(localStorage.getItem('userId')) : null,
      id_pelanggan: newVisit.id_pelanggan || null,
      pelanggan_id: newVisit.id_pelanggan || null,
      catatan: newVisit.description,
      keterangan: newVisit.description,
      has_order: newVisit.hasOrder ? 1 : 0,
      nilai_order: newVisit.hasOrder ? Number(String(newVisit.orderValue).replace(/[^0-9]/g, '')) : 0,
      tgl_kunjungan: new Date().toISOString().slice(0, 19).replace('T', ' '),
      foto_visit: newVisit.photoUrl // fallback preview local
    };

    const isEdit = !!editingVisitId;
    const savePromise = isEdit
      ? visitService.update(editingVisitId, payload)
      : visitService.create(payload);

    savePromise
      .then(() => {
        loadVisits(`${selectedYear}-${selectedMonth}`);
        setIsModalOpen(false);
        setEditingVisitId(null);
        setNewVisit({ id_pelanggan: '', name: '', description: '', hasOrder: false, orderValue: '', photoUrl: null });
        setModalErrorMsg('');
      })
      .catch((err) => {
        console.error("Gagal menyimpan kunjungan:", err);
        const detailedError = err.response?.data?.message || err.message || "Silakan coba lagi.";
        setModalErrorMsg(`Gagal menyimpan kunjungan: ${detailedError}`);
        setIsLoading(false);
      });
  };

  const handleEditClick = (visit) => {
    setEditingVisitId(visit.id);
    setNewVisit({
      id_pelanggan: visit.id_pelanggan || '',
      name: visit.name || '',
      description: visit.description || '',
      hasOrder: visit.hasOrder,
      orderValue: visit.orderValue ? String(visit.orderValue) : '',
      photoUrl: visit.photoUrl || null
    });
    setModalErrorMsg('');
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setConfirmDialog({
      isOpen: true,
      type: 'danger',
      title: 'Hapus Laporan Kunjungan',
      message: 'Apakah Anda yakin ingin menghapus laporan kunjungan ini?',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: () => {
        visitService.delete(id)
          .then(() => {
            loadVisits(`${selectedYear}-${selectedMonth}`);
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          })
          .catch(err => {
            console.error("Gagal menghapus kunjungan:", err);
            setConfirmDialog({
              isOpen: true,
              type: 'error',
              title: 'Gagal Hapus',
              message: 'Terjadi kesalahan saat menghapus laporan kunjungan.',
              confirmText: 'Tutup',
              showCancel: false,
              onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
            });
          });
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Header Section & Filter */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1E293B]">Laporan Kunjungan</h2>
            <p className="text-sm text-[#64748B] mt-1">Sales Activity Log dengan foto kunjungan & analisis periode</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {isOwnerOrAdmin && (
              <select 
                value={selectedSalesId}
                onChange={(e) => setSelectedSalesId(e.target.value)}
                className="border border-[#E2E8F0] bg-white rounded-lg px-3 py-2 text-xs font-bold text-[#1E293B] shadow-sm outline-none focus:ring-1 focus:ring-[#4F46E5]"
              >
                <option value="all">Semua Tim Sales</option>
                {salesList.map((s) => (
                  <option key={s.id || s.id_sales} value={s.id || s.id_sales}>
                    {s.nama || s.nama_sales || s.name}
                  </option>
                ))}
              </select>
            )}
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-[#E2E8F0] bg-white rounded-lg px-3 py-2 text-xs font-bold text-[#1E293B] shadow-sm outline-none focus:ring-1 focus:ring-[#4F46E5]"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-[#E2E8F0] bg-white rounded-lg px-3 py-2 text-xs font-bold text-[#1E293B] shadow-sm outline-none focus:ring-1 focus:ring-[#4F46E5]"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {!isOwner && (
              <button 
                onClick={() => { 
                  setEditingVisitId(null);
                  setNewVisit({ id_pelanggan: '', name: '', description: '', hasOrder: false, orderValue: '', photoUrl: null });
                  setModalErrorMsg(''); 
                  setIsModalOpen(true); 
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-lg font-semibold text-sm hover:bg-[#4338CA] transition-colors w-full sm:w-auto shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Catat Kunjungan
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="w-full bg-[#FEE2E2] text-[#DC2626] text-sm font-semibold p-4 rounded-lg border border-[#FCA5A5]">
            {errorMsg}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-sm">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#3B82F6] mb-1">Total Kunjungan Periode</p>
              <h3 className="text-2xl font-bold text-[#1E3A8A]">{totalVisitsCount} Kunjungan</h3>
            </div>
          </div>
          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#10B981] mb-1">Kunjungan Ada Order</p>
              <h3 className="text-2xl font-bold text-[#065F46]">{orderVisitsCount} Kunjungan ({conversionRate}%)</h3>
            </div>
          </div>
          <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center shrink-0 shadow-sm">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#D97706] mb-1">Estimasi Nilai Order</p>
              <h3 className="text-2xl font-bold text-[#92400E]">Rp {totalEstimatedOrderValue.toLocaleString('id-ID')}</h3>
            </div>
          </div>
        </div>

        {/* Riwayat Kunjungan List */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden">
          <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
            <h3 className="font-bold text-[#1E293B]">Riwayat Activity Log Kunjungan</h3>
            <span className="text-xs text-[#64748B] font-semibold">{totalVisitsCount} Data Ditampilkan</span>
          </div>
          <div className="flex flex-col divide-y divide-[#E2E8F0]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-[#64748B] gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
                <span className="text-sm font-medium">Memuat riwayat kunjungan...</span>
              </div>
            ) : mappedVisits.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-[#64748B]">
                <span className="text-sm font-medium">Belum ada riwayat kunjungan dicatat.</span>
              </div>
            ) : (
              mappedVisits.map((visit, index) => (
                <div key={visit.id} className="flex flex-col sm:flex-row gap-5 p-6 hover:bg-[#F8FAFC] transition-colors">
                  
                  {/* Left: Photo / Placeholder */}
                  <div 
                    onClick={() => visit.photoUrl && setSelectedLightboxPhoto(visit.photoUrl)}
                    className="w-full sm:w-[120px] h-[120px] bg-[#E2E8F0] rounded-xl flex flex-col items-center justify-center text-[#94A3B8] shrink-0 border border-[#CBD5E1] overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    {visit.photoUrl ? (
                      <img src={visit.photoUrl} alt="Foto Kunjungan" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 mb-2" />
                    )}
                  </div>

                  {/* Middle: Info */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
                      <div>
                        <h4 className="font-bold text-lg text-[#1E293B]">{visit.resolvedName || visit.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#64748B] mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {visit.datetime}
                        </div>
                      </div>
                      {/* Tags for Mobile / Desktop Right */}
                      <div className="flex items-center gap-2 shrink-0">
                        {visit.photoUrl && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F1F5F9] text-[#64748B] text-[11px] font-bold border border-[#E2E8F0]">
                            <Camera className="w-3.5 h-3.5" /> Foto
                          </div>
                        )}
                        {visit.hasOrder ? (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold border border-[#BBF7D0]">
                            <Check className="w-3.5 h-3.5" /> Ada Order
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#F1F5F9] text-[#64748B] text-[11px] font-bold border border-[#E2E8F0]">
                            Kunjungan
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-[#475569] mb-4">{visit.description}</p>
                    
                    <div className="mt-auto flex items-center justify-between gap-2">
                      {visit.orderValue ? (
                        <div className="flex items-center gap-1.5 bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-1.5 rounded-lg text-xs font-bold text-[#16A34A]">
                          <DollarSign className="w-3.5 h-3.5" />
                          Order Value: {typeof visit.orderValue === 'number' ? `Rp ${visit.orderValue.toLocaleString('id-ID')}` : visit.orderValue}
                        </div>
                      ) : <div></div>}

                      <div className="flex gap-2">
                        {!isOwner && (
                          <>
                            <button
                              onClick={() => handleEditClick(visit)}
                              className="px-3 py-1.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] text-xs font-bold rounded-lg transition-colors border border-[#FDE68A]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(visit.id)}
                              className="px-3 py-1.5 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#EF4444] text-xs font-bold rounded-lg transition-colors border border-[#FCA5A5]"
                            >
                              Hapus
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedDetailVisit(visit)}
                          className="px-3 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-xs font-bold rounded-lg transition-colors border border-[#C7D2FE]"
                        >
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal Catat Kunjungan */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] shrink-0">
              <h3 className="font-bold text-[#1E293B]">
                {editingVisitId ? 'Edit Laporan Kunjungan' : 'Catat Kunjungan Baru'}
              </h3>
              <button onClick={() => { setModalErrorMsg(''); setIsModalOpen(false); }} className="text-[#64748B] hover:text-[#1E293B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <form id="kunjungan-form" onSubmit={handleAddVisit} className="flex flex-col gap-4">
                
                {modalErrorMsg && (
                  <div className="w-full bg-[#FEE2E2] text-[#DC2626] text-xs font-semibold p-3 rounded-lg border border-[#FCA5A5] shrink-0">
                    {modalErrorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-2">Nama Bengkel <span className="text-[#EF4444]">*</span></label>
                  <select 
                    required
                    value={newVisit.id_pelanggan}
                    onChange={(e) => setNewVisit({...newVisit, id_pelanggan: e.target.value})}
                    className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] bg-white text-[#1E293B]"
                  >
                    <option value="">-- Pilih Bengkel / Pelanggan --</option>
                    {customers.map((c) => {
                      const idVal = c.id_pelanggan || c.id;
                      const nameVal = c.nama || c.name;
                      return (
                        <option key={idVal} value={idVal}>
                          {nameVal} ({c.city || c.alamat || c.kota || 'Banjarmasin'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-2">Deskripsi / Hasil Diskusi <span className="text-[#EF4444]">*</span></label>
                  <textarea 
                    required
                    rows="3"
                    value={newVisit.description}
                    onChange={(e) => setNewVisit({...newVisit, description: e.target.value})}
                    placeholder="Apa hasil kunjungan hari ini?"
                    className="w-full border border-[#E2E8F0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                  ></textarea>
                </div>

                {/* Foto Upload */}
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-2">Foto Kunjungan</label>
                  <div className="border-2 border-dashed border-[#CBD5E1] rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-[#F8FAFC] transition-colors relative cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    {newVisit.photoUrl ? (
                      <div className="w-full h-32 rounded-lg overflow-hidden border border-[#E2E8F0]">
                        <img src={newVisit.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#E0E7FF] text-[#4F46E5] flex items-center justify-center mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-[#4F46E5]">Upload Foto (Opsional)</p>
                        <p className="text-xs text-[#64748B] mt-1">JPG, PNG up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Order Toggle */}
                <div className="flex items-center gap-3 mt-2">
                  <input 
                    type="checkbox" 
                    id="hasOrder"
                    checked={newVisit.hasOrder}
                    onChange={(e) => setNewVisit({...newVisit, hasOrder: e.target.checked})}
                    className="w-4 h-4 text-[#4F46E5] rounded border-[#CBD5E1] focus:ring-[#4F46E5]"
                  />
                  <label htmlFor="hasOrder" className="text-sm font-bold text-[#1E293B]">Kunjungan menghasilkan Order Baru?</label>
                </div>

                {newVisit.hasOrder && (
                  <div className="mt-2">
                    <label className="block text-xs font-bold text-[#1E293B] mb-2">Estimasi Nilai Order <span className="text-[#EF4444]">*</span></label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] font-bold text-sm">Rp</span>
                      <input 
                        type="text" 
                        required={newVisit.hasOrder}
                        value={newVisit.orderValue}
                        onChange={(e) => {
                          const rawVal = e.target.value.replace(/[^0-9]/g, '');
                          const formattedVal = rawVal ? Number(rawVal).toLocaleString('id-ID') : '';
                          setNewVisit({...newVisit, orderValue: formattedVal});
                        }}
                        placeholder="5.000.000"
                        className="w-full border border-[#E2E8F0] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
                      />
                    </div>
                  </div>
                )}
                
              </form>
            </div>

            <div className="p-5 border-t border-[#E2E8F0] flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => { setModalErrorMsg(''); setIsModalOpen(false); }}
                className="px-4 py-2 bg-white border border-[#CBD5E1] text-[#64748B] rounded-lg font-bold text-sm hover:bg-[#F8FAFC]"
              >
                Batal
              </button>
              <button 
                type="submit"
                form="kunjungan-form"
                className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg font-bold text-sm hover:bg-[#4338CA]"
              >
                Simpan Kunjungan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Kunjungan */}
      {selectedDetailVisit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="font-bold text-lg text-[#1E293B]">Detail Kunjungan Sales</h3>
              </div>
              <button onClick={() => setSelectedDetailVisit(null)} className="text-[#64748B] hover:text-[#1E293B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              {selectedDetailVisit.photoUrl ? (
                <div 
                  onClick={() => setSelectedLightboxPhoto(selectedDetailVisit.photoUrl)}
                  className="w-full h-56 bg-slate-900 rounded-xl overflow-hidden border border-[#CBD5E1] shadow-inner flex items-center justify-center cursor-pointer hover:opacity-95 transition-opacity"
                >
                  <img src={selectedDetailVisit.photoUrl} alt="Foto Dokumentasi" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-full h-32 bg-slate-100 rounded-xl border border-dashed border-[#CBD5E1] flex flex-col items-center justify-center text-[#94A3B8]">
                  <Camera className="w-8 h-8 mb-1" />
                  <span className="text-xs font-semibold">Tidak Ada Foto Dokumentasi</span>
                </div>
              )}

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl flex flex-col gap-2">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Nama Bengkel</span>
                <span className="text-lg font-black text-[#1E293B]">{selectedDetailVisit.resolvedName || selectedDetailVisit.name}</span>
                <span className="text-xs font-semibold text-[#4F46E5] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {selectedDetailVisit.datetime}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Hasil Diskusi / Catatan Sales</span>
                <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl text-sm leading-relaxed text-[#334155]">
                  {selectedDetailVisit.description}
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#EEF2FF] border border-[#C7D2FE] p-4 rounded-xl mt-2">
                <span className="text-xs font-bold text-[#3730A3]">Status Penjualan</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black ${
                  selectedDetailVisit.hasOrder ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-slate-200 text-slate-700'
                }`}>
                  {selectedDetailVisit.hasOrder ? `Ada Order (Rp ${Number(selectedDetailVisit.orderValue || 0).toLocaleString('id-ID')})` : 'Kunjungan Rutin'}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button 
                onClick={() => setSelectedDetailVisit(null)}
                className="px-5 py-2 bg-[#4F46E5] text-white font-bold text-xs rounded-xl hover:bg-[#4338CA] transition-colors shadow-sm"
              >
                Tutup Detail
              </button>
            </div>
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
            alt="Foto Dokumentasi Kunjungan"
            className="max-h-[85vh] max-w-full rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-200"
          />
          <p className="text-white/70 text-xs mt-4 font-semibold">Foto Dokumentasi Kunjungan Sales</p>
        </div>
      )}

      {/* Custom Confirmation & Notification Modal */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        type={confirmDialog.type}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        showCancel={confirmDialog.showCancel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </DashboardLayout>
  );
}
