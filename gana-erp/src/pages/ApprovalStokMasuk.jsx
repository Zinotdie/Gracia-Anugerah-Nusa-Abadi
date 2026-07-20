import DashboardLayout from '../layouts/DashboardLayout';
import { ShieldCheck, XCircle, CheckCircle2, Clock, Search, ChevronDown, ChevronUp, Eye, Camera, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { purchaseService } from '../services/purchaseService';

export default function ApprovalStokMasuk() {
  const [approvals, setApprovals] = useState([]);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState(null);

  const loadApprovals = () => {
    purchaseService.getAll()
      .then(res => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        setApprovals(data);
      })
      .catch(err => {
        console.error("Gagal load approvals dari API:", err);
        setApprovals([]);
      });
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');

  const isWithin24Hours = (item) => {
    const timeLimit = 24 * 60 * 60 * 1000; // 24 hours in ms
    let baseTime = null;
    if (item.updatedAt) {
      baseTime = new Date(item.updatedAt).getTime();
    } else if (item.createdAt) {
      baseTime = new Date(item.createdAt).getTime();
    } else if (item.date) {
      try {
        const monthsId = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
        const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let normalized = item.date.replace("WITA", "").trim();
        monthsId.forEach((m, idx) => {
          normalized = normalized.replace(m, monthsEn[idx]);
        });
        baseTime = Date.parse(normalized);
      } catch (e) {
        baseTime = null;
      }
    }
    if (baseTime && !isNaN(baseTime)) {
      const diff = Date.now() - baseTime;
      return diff <= timeLimit && diff >= 0;
    }
    return false;
  };

  const filteredApprovals = approvals.filter(item => {
    const matchSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'semua' || item.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleApprove = (id) => {
    purchaseService.update(id, { status: 'approved' })
      .then(() => loadApprovals())
      .catch(err => {
        console.error("Gagal approve:", err);
      });
  };

  const handleReject = (id) => {
    purchaseService.update(id, { status: 'rejected' })
      .then(() => loadApprovals())
      .catch(err => {
        console.error("Gagal reject:", err);
      });
  };

  const toggleExpand = (id) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Approval Stok Masuk</h2>
            <p className="text-sm text-[#64748B] mt-1">Verifikasi penerimaan barang dari supplier sebelum masuk ke master stok</p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-[#E2E8F0]">
            <div className="text-center px-4 border-r border-[#E2E8F0]">
              <p className="text-[10px] font-bold text-[#64748B] uppercase">Menunggu</p>
              <p className="text-lg font-black text-[#F59E0B]">{approvals.filter(a => a.status === 'pending').length}</p>
            </div>
            <div className="text-center px-4">
              <p className="text-[10px] font-bold text-[#64748B] uppercase">Disetujui Hari Ini</p>
              <p className="text-lg font-black text-[#16A34A]">{approvals.filter(a => a.status === 'approved' && isWithin24Hours(a)).length}</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#94A3B8]" />
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari No Penerimaan atau Supplier..." 
              className="w-full pl-10 pr-4 py-2 border-none rounded-lg text-sm focus:outline-none focus:ring-0 text-[#334155] placeholder:text-[#94A3B8] bg-transparent"
            />
          </div>
          <div className="w-px h-8 bg-[#E2E8F0] hidden sm:block"></div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#475569] bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg focus:outline-none transition-colors"
          >
            <option value="semua">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Disetujui</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>

        {/* Data List */}
        <div className="flex flex-col gap-4">
          {filteredApprovals.map((item, idx) => (
            <div key={idx} className={`bg-white rounded-2xl shadow-sm border ${item.status === 'pending' ? 'border-[#E2E8F0] hover:border-[#CBD5E1]' : item.status === 'approved' ? 'border-[#BBF7D0] opacity-90' : 'border-[#FECACA] opacity-90'} overflow-hidden transition-all duration-300`}>
              <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-6">
                
                {/* Info Section */}
                <div className="flex items-center gap-5 flex-1 w-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    item.status === 'pending' ? 'bg-[#FEF3C7] text-[#D97706]' :
                    item.status === 'approved' ? 'bg-[#DCFCE7] text-[#16A34A]' :
                    'bg-[#FEE2E2] text-[#DC2626]'
                  }`}>
                    {item.status === 'pending' && <Clock className="w-6 h-6" />}
                    {item.status === 'approved' && <CheckCircle2 className="w-6 h-6" />}
                    {item.status === 'rejected' && <XCircle className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-[#1E293B] text-lg">{item.id}</h3>
                      <span className="text-xs font-bold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">{item.date}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#475569]">
                      <span className="font-semibold text-[#3B82F6]">{item.sj}</span>
                      <span className="w-1 h-1 bg-[#CBD5E1] rounded-full"></span>
                      <span>{item.supplier}</span>
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="flex items-center gap-8 bg-[#F8FAFC] px-6 py-3 rounded-xl border border-[#E2E8F0]">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-[#64748B] uppercase mb-0.5">Jenis Item</p>
                    <p className="font-bold text-[#1E293B]">{item.items} Produk</p>
                  </div>
                  <div className="w-px h-8 bg-[#E2E8F0]"></div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-[#64748B] uppercase mb-0.5">Total Qty</p>
                    <p className="font-black text-[#1E293B]">{item.totalQty} Karton</p>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex gap-3 w-full md:w-auto justify-end items-center">
                  <button 
                    onClick={() => toggleExpand(item.id)}
                    className="px-3.5 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    {expandedCardId === item.id ? (
                      <>Tutup Rincian <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>Lihat Rincian <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>

                  {item.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleReject(item.id)}
                        className="px-4 py-2 bg-white border border-[#FECACA] text-[#DC2626] hover:bg-[#FEF2F2] font-semibold text-sm rounded-xl transition-colors flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Tolak
                      </button>
                      <button 
                        onClick={() => handleApprove(item.id)}
                        className="px-6 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-sm rounded-xl shadow-sm transition-colors flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4" /> Setujui
                      </button>
                    </>
                  ) : item.status === 'approved' ? (
                    <span className="text-[#16A34A] font-bold text-sm flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Disetujui</span>
                  ) : (
                    <span className="text-[#DC2626] font-bold text-sm flex items-center gap-1"><XCircle className="w-4 h-4"/> Ditolak</span>
                  )}
                </div>

              </div>

              {/* Expandable Details Section */}
              {expandedCardId === item.id && (
                <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] px-6 py-4 animate-in slide-in-from-top-2 duration-200">
                  {item.foto_sj_supplier && (
                    <div className="mb-4 p-3 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[#4F46E5]" />
                        <span className="text-xs font-bold text-[#1E293B]">Dokumentasi Foto Surat Jalan Supplier</span>
                      </div>
                      <button
                        onClick={() => setSelectedLightboxPhoto(item.foto_sj_supplier)}
                        className="text-xs font-bold text-[#4F46E5] hover:underline flex items-center gap-1 focus:outline-none"
                      >
                        <Eye className="w-3.5 h-3.5" /> Lihat Foto
                      </button>
                    </div>
                  )}

                  <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Daftar Produk Masuk</h4>
                  <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl bg-white shadow-inner">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead>
                        <tr className="bg-[#F1F5F9] text-[#475569] font-bold border-b border-[#E2E8F0]">
                          <th className="py-2.5 px-4">BRAND</th>
                          <th className="py-2.5 px-4">NAMA PRODUK</th>
                          <th className="py-2.5 px-4 text-right">QTY MASUK</th>
                          <th className="py-2.5 px-4">SATUAN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.draftList && item.draftList.length > 0 ? (
                          item.draftList.map((prod, pIdx) => (
                            <tr key={pIdx} className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC]">
                              <td className="py-2.5 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  prod.brand === 'Kixx' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#DCFCE7] text-[#16A34A]'
                                }`}>
                                  {prod.brand}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 font-semibold text-[#1E293B]">{prod.name}</td>
                              <td className="py-2.5 px-4 text-right font-bold text-[#1E293B]">{prod.qty}</td>
                              <td className="py-2.5 px-4 text-[#64748B]">{prod.uom}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-[#64748B] font-medium">
                              Tidak ada rincian produk untuk penerimaan ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>

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
