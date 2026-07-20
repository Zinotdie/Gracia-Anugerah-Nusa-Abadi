import DashboardLayout from '../layouts/DashboardLayout';
import { DollarSign, Search, Clock, CheckCircle2, XCircle, RefreshCw, Calendar, FileText, Eye, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';

export default function RiwayatPembayaran() {
  const [role] = useState(() => (localStorage.getItem('userRole') || 'sales').toLowerCase());
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [selectedDetailModal, setSelectedDetailModal] = useState(null);

  const fetchPayments = () => {
    setIsLoading(true);
    api.get('/api/penjualan/all-pembayaran')
      .then(res => {
        setPayments(res.data?.data || []);
        setLastRefreshed(new Date());
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Gagal memuat riwayat pembayaran:", err);
        setIsLoading(false);
      });
  };

  const handleUpdateStatus = (idPembayaran, newStatus) => {
    api.put(`/api/penjualan/pembayaran/${idPembayaran}`, { status_pembayaran: newStatus })
      .then(res => {
        fetchPayments();
      })
      .catch(err => {
        console.error("Gagal update status pembayaran:", err);
      });
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const stats = useMemo(() => {
    const approvedPayments = payments.filter(p => p.status_pembayaran === 'Disetujui');
    const totalReceived = approvedPayments.reduce((acc, curr) => acc + curr.jumlah_bayar, 0);
    const pendingCount = payments.filter(p => p.status_pembayaran === 'Pending').length;
    const approvedCount = approvedPayments.length;
    
    return {
      totalReceived,
      pendingCount,
      approvedCount,
      totalCount: payments.length
    };
  }, [payments]);

  const [selectedMonth, setSelectedMonth] = useState('Semua Bulan');
  const [selectedYear, setSelectedYear] = useState('Semua Tahun');

  const filteredPayments = useMemo(() => {
    const list = payments.filter(p => {
      const bengkelName = (p.nama_bengkel || p.bengkel || p.customer || '').toLowerCase();
      const matchSearch = bengkelName.includes(searchTerm.toLowerCase()) || 
                          String(p.id_penjualan || p.no_so || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          String(p.id_pembayaran || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const methodStr = (p.metode_bayar || '').toLowerCase();
      const matchMethod = filterMethod === 'Semua' || 
                           (filterMethod === 'Cash' && methodStr.includes('cash')) ||
                           (filterMethod === 'Transfer' && !methodStr.includes('cash'));
                           
      const statusVal = p.status_pembayaran || 'Menunggu';
      const matchStatus = filterStatus === 'Semua' || statusVal === filterStatus || (filterStatus === 'Pending' && (statusVal === 'Menunggu' || statusVal === 'Pending'));

      let matchMonth = true;
      let matchYear = true;

      const dateVal = p.tgl_pembayaran || p.tgl_bayar || p.created_at;
      if (dateVal) {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) {
          if (selectedMonth !== 'Semua Bulan') {
            const m = String(d.getMonth() + 1).padStart(2, '0');
            matchMonth = m === selectedMonth;
          }
          if (selectedYear !== 'Semua Tahun') {
            const y = String(d.getFullYear());
            matchYear = y === selectedYear;
          }
        }
      }

      return matchSearch && matchMethod && matchStatus && matchMonth && matchYear;
    });

    // Priority sorting: Pending payments at the top
    return list.sort((a, b) => {
      const statusA = a.status_pembayaran || 'Menunggu';
      const statusB = b.status_pembayaran || 'Menunggu';
      if ((statusA === 'Pending' || statusA === 'Menunggu') && !(statusB === 'Pending' || statusB === 'Menunggu')) return -1;
      if (!(statusA === 'Pending' || statusA === 'Menunggu') && (statusB === 'Pending' || statusB === 'Menunggu')) return 1;
      return 0;
    });
  }, [payments, searchTerm, filterMethod, filterStatus, selectedMonth, selectedYear]);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(num);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        
        {/* Title Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Riwayat Pembayaran</h2>
            <p className="text-sm text-[#64748B] mt-1">Daftar rekonsiliasi seluruh pembayaran masuk baik Cash (COD) maupun Tempo (Transfer/Giro)</p>
          </div>

        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase">Dana Masuk (Lunas)</p>
              <p className="text-xl font-black text-[#1E293B]">Rp {formatCurrency(stats.totalReceived)}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase">Menunggu Verifikasi</p>
              <p className="text-xl font-black text-[#D97706]">{stats.pendingCount} Transaksi</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase">Pembayaran Disetujui</p>
              <p className="text-xl font-black text-[#1E293B]">{stats.approvedCount} Item</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#64748B] uppercase">Total Log Logistik</p>
              <p className="text-xl font-black text-[#1E293B]">{stats.totalCount} Catatan</p>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs (3 Tampilan: Pending, Disetujui, Ditolak) */}
        <div className="flex gap-2 border-b border-[#E2E8F0] pb-2">
          {[
            { id: 'Semua', label: 'Semua Status', count: payments.length, color: 'bg-slate-100 text-slate-700' },
            { id: 'Pending', label: 'Pending (Menunggu Konfirmasi)', count: stats.pendingCount, color: 'bg-amber-100 text-amber-800' },
            { id: 'Disetujui', label: 'Disetujui (Lunas)', count: stats.approvedCount, color: 'bg-emerald-100 text-emerald-800' },
            { id: 'Ditolak', label: 'Ditolak', count: payments.filter(p => p.status_pembayaran === 'Ditolak').length, color: 'bg-red-100 text-red-800' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                filterStatus === tab.id 
                  ? 'bg-[#4F46E5] text-white shadow-md' 
                  : 'bg-white text-[#64748B] hover:bg-slate-50 border border-[#E2E8F0]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${filterStatus === tab.id ? 'bg-white/20 text-white' : tab.color}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#94A3B8]" />
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari Bengkel, No SO, ID..." 
              className="w-full pl-10 pr-4 py-2 border-none rounded-lg text-sm focus:outline-none focus:ring-0 text-[#334155] placeholder:text-[#94A3B8] bg-transparent"
            />
          </div>
          
          <div className="w-px h-8 bg-[#E2E8F0] hidden sm:block"></div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#334155] bg-white"
            >
              <option value="Semua Bulan">Semua Bulan</option>
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>

            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-bold text-[#334155] bg-white"
            >
              <option value="Semua Tahun">Semua Tahun</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#64748B] font-bold">Metode:</span>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#334155] bg-white"
              >
                <option value="Semua">Semua Metode</option>
                <option value="Transfer">Transfer / Giro</option>
              </select>
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="py-4 px-6">ID BAYAR</th>
                  <th className="py-4 px-6">NO INVOICE</th>
                  <th className="py-4 px-6">PELANGGAN / BENGKEL</th>
                  <th className="py-4 px-6 text-right">JUMLAH DIBAYAR (RP)</th>
                  <th className="py-4 px-6 text-center">METODE</th>
                  <th className="py-4 px-6 text-center">STATUS</th>
                  <th className="py-4 px-6">TANGGAL</th>
                  <th className="py-4 px-6 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-xs font-bold text-[#64748B]">
                      Mengambil data riwayat pembayaran...
                    </td>
                  </tr>
                ) : filteredPayments.length > 0 ? (
                  filteredPayments.map((p, idx) => {
                    return (
                      <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-gray-50/50 transition-colors">
                        <td className="py-4 px-6 font-bold text-[#64748B]">{p.id_pembayaran}</td>
                        <td className="py-4 px-6 font-bold text-[#1E293B]">#INV-{String(p.id_penjualan).padStart(4, '0')}</td>
                        <td className="py-4 px-6 font-bold text-[#1E293B]">{p.nama_bengkel}</td>
                        <td className="py-4 px-6 text-right font-black text-[#1E293B]">
                          Rp {formatCurrency(p.jumlah_bayar)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            {p.metode_bayar || 'Transfer'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col items-center gap-1">
                            {p.status_pembayaran === 'Pending' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            ) : p.status_pembayaran === 'Ditolak' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> Ditolak
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Disetujui
                              </span>
                            )}

                            {/* Konfirmasi Pembayaran oleh Admin */}
                            {role === 'admin' && p.status_pembayaran === 'Pending' && (
                              <div className="flex gap-1 mt-1">
                                <button
                                  onClick={() => handleUpdateStatus(p.id_pembayaran, 'Disetujui')}
                                  className="px-2 py-0.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded text-[10px] font-bold shadow-sm"
                                  title="Konfirmasi Lunas"
                                >
                                  Setujui
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(p.id_pembayaran, 'Ditolak')}
                                  className="px-2 py-0.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded text-[10px] font-bold shadow-sm"
                                  title="Tolak Pembayaran"
                                >
                                  Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[#64748B] font-medium">{formatDate(p.tgl_bayar)}</td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => setSelectedDetailModal(p)}
                            className="bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] border border-[#C7D2FE] px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 mx-auto"
                            title="Lihat Detail Rincian Pembayaran"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Detail</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="py-10 text-center text-xs font-semibold text-[#64748B]">
                      Tidak ada catatan riwayat pembayaran.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[10px] text-[#94A3B8] italic text-right mt-[-10px] mb-4">
          Terakhir diperbarui: {lastRefreshed.toLocaleTimeString('id-ID')}
        </p>

        {/* Detail Pembayaran Modal (Compact & Sleek) */}
        {selectedDetailModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3">
            <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-xl border border-[#E2E8F0] animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center pb-2.5 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-sm font-bold text-[#1E293B]">Detail Pembayaran</h3>
                  <p className="text-[10px] text-[#64748B]">ID: {selectedDetailModal.id_pembayaran}</p>
                </div>
                <button 
                  onClick={() => setSelectedDetailModal(null)}
                  className="p-1 rounded-lg text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-3 flex flex-col gap-2.5 overflow-y-auto">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-bold text-[#64748B] uppercase">Bengkel</p>
                    <p className="text-xs font-bold text-[#1E293B] truncate max-w-[170px]">{selectedDetailModal.nama_bengkel}</p>
                    <p className="text-[10px] text-[#4F46E5] font-semibold">#INV-{String(selectedDetailModal.id_penjualan).padStart(4, '0')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-[#64748B] uppercase">Nominal</p>
                    <p className="text-sm font-black text-[#16A34A]">Rp {formatCurrency(selectedDetailModal.jumlah_bayar)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5">
                    <p className="text-[9px] font-bold text-[#64748B] uppercase">Metode</p>
                    <p className="text-[11px] font-bold text-[#1E293B] mt-0.5">{selectedDetailModal.metode_bayar || 'Transfer Bank'}</p>
                  </div>
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5">
                    <p className="text-[9px] font-bold text-[#64748B] uppercase">Status</p>
                    <div className="mt-0.5">
                      {selectedDetailModal.status_pembayaran === 'Pending' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FEF3C7] text-[#D97706] inline-flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> Pending
                        </span>
                      ) : selectedDetailModal.status_pembayaran === 'Ditolak' ? (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FEE2E2] text-[#DC2626] inline-flex items-center gap-1">
                          <XCircle className="w-2.5 h-2.5" /> Ditolak
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E8F5E9] text-[#2E7D32] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Disetujui
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5">
                  <p className="text-[9px] font-bold text-[#64748B] uppercase">Waktu Pembayaran</p>
                  <p className="text-[11px] font-semibold text-[#334155] mt-0.5">{formatDate(selectedDetailModal.tgl_bayar)}</p>
                </div>

                {selectedDetailModal.catatan && (
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-2.5">
                    <p className="text-[9px] font-bold text-[#64748B] uppercase mb-0.5">Catatan</p>
                    <p className="text-[11px] text-[#334155] italic">&ldquo;{selectedDetailModal.catatan}&rdquo;</p>
                  </div>
                )}

                {selectedDetailModal.bukti_bayar ? (
                  <div className="bg-white border border-[#E2E8F0] rounded-xl p-2.5">
                    <p className="text-[9px] font-bold text-[#64748B] uppercase mb-1.5">Bukti Transfer</p>
                    <div className="max-h-36 rounded-lg overflow-hidden border border-[#E2E8F0] flex items-center justify-center bg-gray-50">
                      <img 
                        src={selectedDetailModal.bukti_bayar} 
                        alt="Bukti Transfer" 
                        className="object-contain max-h-32 w-full cursor-pointer hover:scale-105 transition-transform duration-200"
                        onClick={() => window.open(selectedDetailModal.bukti_bayar, '_blank')}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-[#CBD5E1] rounded-xl p-3 text-center text-[11px] font-medium text-[#94A3B8]">
                    Tidak ada bukti transfer yang diunggah.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] flex justify-end">
                <button
                  onClick={() => setSelectedDetailModal(null)}
                  className="px-4 py-1.5 bg-[#1E293B] hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
