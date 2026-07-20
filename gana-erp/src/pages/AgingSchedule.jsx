import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { DollarSign, Calendar as CalendarIcon, AlertTriangle, Loader2, X, Eye, Check, CheckCircle2, ChevronRight, FileText } from 'lucide-react';
import api from '../utils/api';

export default function AgingSchedule() {
  const [isLoading, setIsLoading] = useState(true);
  const [agingData, setAgingData] = useState({
    cards: {
      totalPiutang: 0,
      current30: 0,
      d31_45: 0,
      d45_plus: 0
    },
    table: []
  });

  // Workshop Detail Inspector Modal States
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [workshopInvoices, setWorkshopInvoices] = useState([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [selectedBukti, setSelectedBukti] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchAging = () => {
    setIsLoading(true);
    api.get('/api/owner/aging-schedule')
      .then(res => {
        if (res.data && res.data.success) {
          const cardsData = res.data.cards || res.data.data?.cards || { totalPiutang: 0, current30: 0, d31_45: 0, d45_plus: 0 };
          const tableList = res.data.table || res.data.data?.table || res.data.data?.agingList || [];
          setAgingData({
            cards: cardsData,
            table: Array.isArray(tableList) ? tableList : []
          });
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Gagal memuat aging schedule dari API:", err);
        setAgingData({
          cards: { totalPiutang: 0, current30: 0, d31_45: 0, d45_plus: 0 },
          table: []
        });
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchAging();
  }, []);

  const handleOpenWorkshop = (name) => {
    setSelectedWorkshop(name);
    setSelectedInvoice(null);
    setPayments([]);
    setIsLoadingInvoices(true);

    api.get('/api/owner/monitoring-piutang')
      .then(res => {
        if (res.data && res.data.success) {
          const list = res.data.list || [];
          const filtered = list.filter(item => item.customer === name);
          setWorkshopInvoices(filtered);
        }
        setIsLoadingInvoices(false);
      })
      .catch(err => {
        console.error("Gagal load invoices untuk bengkel:", err);
        setWorkshopInvoices([]);
        setIsLoadingInvoices(false);
      });
  };

  const handleSelectInvoice = (inv) => {
    setSelectedInvoice(inv);
    setIsLoadingPayments(true);
    api.get(`/api/penjualan/${inv.dbId}/pembayaran`)
      .then(res => {
        if (res.data && res.data.success) {
          setPayments(res.data.data || []);
        }
        setIsLoadingPayments(false);
      })
      .catch(err => {
        console.error("Gagal load pembayaran:", err);
        setPayments([]);
        setIsLoadingPayments(false);
      });
  };

  const handleVerifyPayment = (pId, newStatus) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    api.put(`/api/penjualan/pembayaran/${pId}`, { status_pembayaran: newStatus })
      .then(res => {
        if (res.data && res.data.success) {
          // Refresh payments list
          if (selectedInvoice) {
            api.get(`/api/penjualan/${selectedInvoice.dbId}/pembayaran`)
              .then(pRes => {
                if (pRes.data && pRes.data.success) {
                  setPayments(pRes.data.data || []);
                }
              });
          }
          // Refresh customer invoices & total aging stats
          api.get('/api/owner/monitoring-piutang')
            .then(mRes => {
              if (mRes.data && mRes.data.success) {
                const list = mRes.data.list || [];
                const filtered = list.filter(item => item.customer === selectedWorkshop);
                setWorkshopInvoices(filtered);
              }
            });
          fetchAging();
        }
        setIsUpdatingStatus(false);
      })
      .catch(err => {
        console.error("Gagal verifikasi pembayaran:", err);
        setIsUpdatingStatus(false);
      });
  };

  // Compute column totals safely
  const tableRows = Array.isArray(agingData?.table) ? agingData.table : [];
  const totalRow = tableRows.reduce((acc, row) => {
    acc.current += row.current || 0;
    acc.d1_30 += row.d1_30 || 0;
    acc.d31_45 += row.d31_45 || 0;
    acc.d45_plus += row.d45_plus || 0;
    acc.total += row.total || row.totalOutstanding || 0;
    return acc;
  }, { current: 0, d1_30: 0, d31_45: 0, d45_plus: 0, total: 0 });

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-[#1E293B]">Jadwal Umur Piutang (Aging Schedule)</h2>
          <p className="text-sm text-[#64748B] mt-1">Tabel piutang dengan indikator 30, 45, hingga &gt;45 hari (Masa Kritis)</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
            <p className="text-xs font-bold text-[#64748B]">Memuat data aging...</p>
          </div>
        ) : (
          <>
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] p-5 flex flex-col gap-2">
                <DollarSign className="w-5 h-5 text-[#3B82F6]" />
                <p className="text-xs font-semibold text-[#64748B]">Total Piutang</p>
                <h3 className="text-[22px] font-bold text-[#1E293B]">
                  Rp {(agingData.cards.totalPiutang / 1000000).toFixed(1)}jt
                </h3>
              </div>
              <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] p-5 flex flex-col gap-2">
                <div className="w-3 h-3 rounded-full bg-[#22C55E]"></div>
                <p className="text-xs font-semibold text-[#64748B]">Belum Jatuh Tempo + 30 Hari</p>
                <h3 className="text-[22px] font-bold text-[#22C55E]">
                  Rp {(agingData.cards.current30 / 1000000).toFixed(1)}jt
                </h3>
              </div>
              <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] p-5 flex flex-col gap-2">
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
                <p className="text-xs font-semibold text-[#64748B]">31-45 Hari (Perhatian)</p>
                <h3 className="text-[22px] font-bold text-[#F59E0B]">
                  Rp {((agingData.cards.d31_45 || 0) / 1000000).toFixed(1)}jt
                </h3>
              </div>
              <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] p-5 flex flex-col gap-2">
                <div className="w-3 h-3 rounded-full bg-[#EF4444]"></div>
                <p className="text-xs font-semibold text-[#64748B]">&gt;45 Hari (Kritis)</p>
                <h3 className="text-[22px] font-bold text-[#EF4444]">
                  Rp {((agingData.cards.d45_plus || 0) / 1000000).toFixed(1)}jt
                </h3>
              </div>
            </div>

            {/* Aging Table */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden mt-2">
              <div className="p-5 border-b border-[#E2E8F0] flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1E293B]">Tabel Umur Piutang</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Per tanggal {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">NAMA BENGKEL</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">BELUM JATUH TEMPO</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">1-30 HARI</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">31-45 HARI</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">&gt;45 HARI (KRITIS)</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">TOTAL PIUTANG</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {agingData.table.length > 0 ? (
                      agingData.table.map((row, idx) => {
                        const hasOverdue = ((row.d1_30 || 0) + (row.d31_45 || 0) + (row.d45_plus || 0)) > 0;
                        const isCritical = (row.d45_plus || 0) > 0;
                        return (
                          <tr 
                            key={idx} 
                            className={`border-b border-[#E2E8F0] transition-colors ${
                              isCritical ? 'bg-red-50 hover:bg-red-100/70' : hasOverdue ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-[#F8FAFC]'
                            }`}
                          >
                            <td className="py-4 px-6 font-semibold text-[#1E293B]">
                              <button
                                onClick={() => handleOpenWorkshop(row.name)}
                                className="flex items-center gap-2 text-[#4F46E5] hover:text-[#4338CA] font-bold hover:underline text-left focus:outline-none"
                              >
                                {row.name} {isCritical && <AlertTriangle className="w-4 h-4 text-[#EF4444]" />}
                              </button>
                            </td>
                            <td className="py-4 px-6 text-[#475569]">
                              {row.current > 0 ? `Rp ${(row.current / 1000000).toFixed(1)}jt` : '-'}
                            </td>
                            <td className="py-4 px-6 font-bold text-[#22C55E]">
                              {row.d1_30 > 0 ? `Rp ${(row.d1_30 / 1000000).toFixed(1)}jt` : '-'}
                            </td>
                            <td className="py-4 px-6 font-bold text-[#F59E0B]">
                              {row.d31_45 > 0 ? `Rp ${(row.d31_45 / 1000000).toFixed(1)}jt` : '-'}
                            </td>
                            <td className="py-4 px-6 font-bold text-[#EF4444]">
                              {row.d45_plus > 0 ? `Rp ${(row.d45_plus / 1000000).toFixed(1)}jt` : '-'}
                            </td>
                            <td className="py-4 px-6 font-bold text-[#1E293B]">
                              Rp {(row.total / 1000000).toFixed(1)}jt
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-[#64748B]">Tidak ada data aging schedule.</td>
                      </tr>
                    )}
                    {/* Total Row */}
                    {agingData.table.length > 0 && (
                      <tr className="bg-[#F8FAFC]">
                        <td className="py-4 px-6 font-bold text-[#1E293B]">TOTAL</td>
                        <td className="py-4 px-6 font-bold text-[#1E293B]">
                          {totalRow.current > 0 ? `Rp ${(totalRow.current / 1000000).toFixed(1)}jt` : '-'}
                        </td>
                        <td className="py-4 px-6 font-bold text-[#22C55E]">
                          {totalRow.d1_30 > 0 ? `Rp ${(totalRow.d1_30 / 1000000).toFixed(1)}jt` : '-'}
                        </td>
                        <td className="py-4 px-6 font-bold text-[#F59E0B]">
                          {totalRow.d31_45 > 0 ? `Rp ${(totalRow.d31_45 / 1000000).toFixed(1)}jt` : '-'}
                        </td>
                        <td className="py-4 px-6 font-bold text-[#EF4444]">
                          {totalRow.d45_plus > 0 ? `Rp ${(totalRow.d45_plus / 1000000).toFixed(1)}jt` : '-'}
                        </td>
                        <td className="py-4 px-6 font-bold text-[#1E293B]">
                          Rp {(totalRow.total / 1000000).toFixed(1)}jt
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="p-6 border-t border-[#E2E8F0] bg-white">
                <h4 className="font-bold text-sm text-[#1E293B] mb-4">Keterangan Warna Aging</h4>
                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#22C55E]"></div>
                    <span className="text-xs text-[#475569]">1-30 hari (Normal)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#F59E0B]"></div>
                    <span className="text-xs text-[#475569]">31-45 hari (Perhatian)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#EF4444]"></div>
                    <span className="text-xs text-[#475569]">&gt;45 hari (Kritis)</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Workshop Detail Inspector Modal */}
        {selectedWorkshop && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-[#E2E8F0] flex flex-col animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-lg font-black text-[#1E293B]">Faktur & Pembayaran - {selectedWorkshop}</h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Audit rincian tagihan piutang aktif dan cicilan pembayaran</p>
                </div>
                <button
                  onClick={() => setSelectedWorkshop(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-200 text-[#64748B] hover:text-[#1E293B] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]">
                {/* Left Panel: Invoice List */}
                <div className="flex flex-col gap-3">
                  <h4 className="font-bold text-xs text-[#475569] uppercase tracking-wider mb-1">Daftar Tagihan Aktif</h4>
                  {isLoadingInvoices ? (
                    <div className="flex items-center justify-center py-10 gap-2">
                      <Loader2 className="w-5 h-5 text-[#4F46E5] animate-spin" />
                      <span className="text-xs font-semibold text-[#64748B]">Memuat invoice...</span>
                    </div>
                  ) : workshopInvoices.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] font-bold py-10 text-center">Tidak ada tagihan piutang aktif.</p>
                  ) : (
                    <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                      {workshopInvoices.map((inv) => {
                        const isSel = selectedInvoice?.dbId === inv.dbId;
                        return (
                          <div
                            key={inv.dbId}
                            onClick={() => handleSelectInvoice(inv)}
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              isSel ? 'border-[#4F46E5] bg-[#EEF2FF]' : 'border-[#E2E8F0] bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-sm text-[#1E293B]">{inv.id}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                inv.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {inv.status === 'overdue' ? `Terlambat ${inv.days} hari` :
                                 inv.status === 'warning' ? `Jatuh tempo ${inv.days} hari` : 'Aman'}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-[#64748B]">
                              <span>Sisa Tagihan:</span>
                              <span className="font-bold text-[#1E293B]">Rp {inv.amount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-[11px] text-[#94A3B8] mt-1">
                              <span>Tanggal Jatuh Tempo:</span>
                              <span>{inv.dueDate}</span>
                            </div>
                            {inv.hasPendingPayment && (
                              <div className="mt-2 text-[10px] font-extrabold text-[#D97706] bg-[#FFFBEB] px-2 py-1 rounded inline-block">
                                ⏳ Ada cicilan baru perlu konfirmasi
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Panel: Payments Logs & Verifications */}
                <div className="flex flex-col gap-3">
                  <h4 className="font-bold text-xs text-[#475569] uppercase tracking-wider mb-1">Riwayat Cicilan & Audit</h4>
                  
                  {!selectedInvoice ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[#94A3B8] border border-dashed border-[#E2E8F0] rounded-xl bg-slate-50/50">
                      <FileText className="w-8 h-8 mb-2" />
                      <p className="text-xs font-semibold">Pilih invoice di sebelah kiri untuk melihat riwayat pembayaran.</p>
                    </div>
                  ) : isLoadingPayments ? (
                    <div className="flex items-center justify-center py-20 gap-2">
                      <Loader2 className="w-5 h-5 text-[#4F46E5] animate-spin" />
                      <span className="text-xs font-semibold text-[#64748B]">Memuat data cicilan...</span>
                    </div>
                  ) : payments.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] font-bold py-20 text-center border border-dashed border-[#E2E8F0] rounded-xl">Belum ada pembayaran cicilan dicatat.</p>
                  ) : (
                    <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                      {payments.map((p) => (
                        <div key={p.id_pembayaran} className="p-3.5 bg-slate-50 border border-[#E2E8F0] rounded-xl flex flex-col gap-2.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-[#1E293B]">
                              {p.tgl_pembayaran ? new Date(p.tgl_pembayaran).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status_pembayaran === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' :
                              p.status_pembayaran === 'Ditolak' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {p.status_pembayaran}
                            </span>
                          </div>
                          
                          <div className="flex justify-between text-xs">
                            <span className="text-[#64748B]">Nominal Bayar:</span>
                            <span className="font-extrabold text-[#1E293B]">Rp {p.jumlah_bayar.toLocaleString('id-ID')}</span>
                          </div>

                          <div className="flex justify-between text-xs">
                            <span className="text-[#64748B]">Metode:</span>
                            <span className="font-semibold text-[#475569]">{p.metode_bayar}</span>
                          </div>

                          {p.bukti_bayar && (
                            <button
                              onClick={() => setSelectedBukti(p.bukti_bayar)}
                              className="text-left text-[#4F46E5] hover:text-[#4338CA] text-xs font-bold flex items-center gap-1 mt-1 focus:outline-none"
                            >
                              <Eye className="w-3.5 h-3.5" /> Lihat Bukti Transfer
                            </button>
                          )}

                          {/* Owner Action Buttons for Pending Installments */}
                          {p.status_pembayaran === 'Pending' && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleVerifyPayment(p.id_pembayaran, 'Disetujui')}
                                disabled={isUpdatingStatus}
                                className="flex-1 bg-emerald-600 text-white font-bold text-xs py-1.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" /> Setujui
                              </button>
                              <button
                                onClick={() => handleVerifyPayment(p.id_pembayaran, 'Ditolak')}
                                disabled={isUpdatingStatus}
                                className="flex-1 bg-red-600 text-white font-bold text-xs py-1.5 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" /> Tolak
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lightbox Bukti Transfer Viewer */}
        {selectedBukti && (
          <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col justify-center items-center p-4">
            <button
              onClick={() => setSelectedBukti(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-all focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedBukti}
              alt="Bukti Transfer"
              className="max-h-[85vh] max-w-full rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-200"
            />
            <p className="text-white/60 text-xs mt-4 font-semibold">Bukti Pembayaran / Transfer Bengkel</p>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
