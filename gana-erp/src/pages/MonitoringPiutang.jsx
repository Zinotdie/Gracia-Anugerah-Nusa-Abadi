import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Search, AlertTriangle, CheckCircle2, Clock, DollarSign, FileSpreadsheet, Loader2, AlertCircle, X, Upload, Image, Plus, Check, FileText, CheckSquare } from 'lucide-react';
import api from '../utils/api';

export default function MonitoringPiutang() {
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [confirmingItem, setConfirmingItem] = useState(null);
  const [activeHighlightId, setActiveHighlightId] = useState(null);
  
  // States for installment/pembayaran flow
  const [payments, setPayments] = useState([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);
  const [jumlahBayar, setJumlahBayar] = useState('');
  const [metodeBayar, setMetodeBayar] = useState('Transfer');
  const [buktiBayar, setBuktiBayar] = useState('');
  const [catatan, setCatatan] = useState('');
  const [selectedBukti, setSelectedBukti] = useState(null); // for lightbox viewer

  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const showAlert = (type, title, message) => {
    setAlertModal({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlertModal({ isOpen: false, type: 'success', title: '', message: '' });
  };

  const [piutangData, setPiutangData] = useState({
    stats: {
      totalPiutang: 0,
      overduePiutang: 0,
      countOverdue: 0,
      warningPiutang: 0
    },
    list: []
  });
  
  const fetchPiutang = () => {
    setIsLoading(true);
    api.get('/api/owner/monitoring-piutang')
      .then(res => {
        if (res.data && res.data.success) {
          setPiutangData({
            stats: res.data.stats,
            list: res.data.list
          });
          setConfirmingItem(prev => {
            if (!prev) return null;
            const updated = res.data.list.find(item => item.dbId === prev.dbId);
            return updated ? updated : { ...prev, amount: 0 };
          });
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Gagal memuat monitoring piutang dari API:", err);
        setPiutangData({
          stats: {
            totalPiutang: 0,
            overduePiutang: 0,
            countOverdue: 0,
            warningPiutang: 0
          },
          list: []
        });
        setIsLoading(false);
      });
  };

  const fetchPayments = (id_penjualan) => {
    setIsLoadingPayments(true);
    api.get(`/api/penjualan/${id_penjualan}/pembayaran`)
      .then(res => {
        if (res.data && res.data.success) {
          setPayments(res.data.data);
        }
        setIsLoadingPayments(false);
      })
      .catch(err => {
        console.error("Gagal memuat riwayat pembayaran:", err);
        setIsLoadingPayments(false);
      });
  };

  const handleJumlahBayarChange = (e) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (!rawVal) {
      setJumlahBayar('');
      return;
    }
    let numVal = Number(rawVal);
    const maxVal = confirmingItem ? confirmingItem.amount : Infinity;
    if (numVal > maxVal) {
      numVal = maxVal;
    }
    setJumlahBayar(numVal.toLocaleString('id-ID'));
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    if (!confirmingItem) return;
    const numericJumlah = Number(String(jumlahBayar).replace(/\./g, ''));
    if (!jumlahBayar || numericJumlah <= 0) {
      alert("Jumlah pembayaran harus lebih besar dari 0");
      return;
    }

    const payload = {
      jumlah_bayar: numericJumlah,
      metode_bayar: metodeBayar,
      bukti_bayar: buktiBayar,
      catatan: catatan
    };

    api.post(`/api/penjualan/${confirmingItem.dbId}/pembayaran`, payload)
      .then(res => {
        if (res.data && res.data.success) {
          showAlert('success', 'Berhasil!', 'Pembayaran cicilan berhasil diajukan dan sedang menunggu verifikasi.');
          setJumlahBayar('');
          setBuktiBayar('');
          setCatatan('');
          fetchPayments(confirmingItem.dbId);
          fetchPiutang();
        }
      })
      .catch(err => {
        console.error("Gagal menambahkan cicilan:", err);
        showAlert('error', 'Gagal!', 'Gagal menambahkan pembayaran cicilan.');
      });
  };

  const handleUpdatePaymentStatus = (id_pembayaran, newStatus) => {
    api.put(`/api/penjualan/pembayaran/${id_pembayaran}`, { status_pembayaran: newStatus })
      .then(res => {
        if (res.data && res.data.success) {
          showAlert('success', 'Update Status!', `Status pembayaran berhasil diubah menjadi: ${newStatus}`);
          if (confirmingItem) {
            fetchPayments(confirmingItem.dbId);
          }
          fetchPiutang();
          window.dispatchEvent(new Event('pending-counts-updated'));
        }
      })
      .catch(err => {
        console.error("Gagal mengubah status pembayaran:", err);
        showAlert('error', 'Gagal!', 'Gagal memperbarui status pembayaran.');
      });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBuktiBayar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    setRole(localStorage.getItem('userRole') || 'admin');
    fetchPiutang();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get('highlight');
    if (highlightId && !isLoading) {
      setTimeout(() => {
        const element = document.getElementById(`row-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Trigger the highlight animation 850ms after scroll starts (once row is centered in view)
          setTimeout(() => {
            setActiveHighlightId(highlightId);
            // Auto-remove highlight class after the 3-second animation completes
            setTimeout(() => {
              setActiveHighlightId(null);
            }, 3200);
          }, 850);
        }
      }, 500);
    }
  }, [isLoading]);

  const filteredPiutang = useMemo(() => {
    const list = Array.isArray(piutangData?.list) ? piutangData.list : [];
    const filtered = list.filter(item => {
      const customerName = item?.customer || '';
      const itemId = item?.id || '';
      const matchSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          itemId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isLunas = item?.isLunas || item?.remainingAmount === 0 || item?.statusBayar === 'Lunas';
      const itemStatus = item?.status || (isLunas ? 'lunas' : (item?.statusTempo === 'Jatuh Tempo' ? 'overdue' : 'lancar'));

      let matchStatus = true;
      if (filterStatus === 'Semua Status' || filterStatus === 'Aktif') {
        matchStatus = !isLunas;
      } else if (filterStatus === 'Overdue') {
        matchStatus = (itemStatus === 'overdue' || item?.statusTempo === 'Jatuh Tempo') && !isLunas;
      } else if (filterStatus === 'Warning') {
        matchStatus = itemStatus === 'warning' && !isLunas;
      } else if (filterStatus === 'Lunas') {
        matchStatus = isLunas;
      }

      return matchSearch && matchStatus;
    });

    return filtered.sort((a, b) => {
      // 1. Tagihan yang memiliki pengajuan cicilan (perlu konfirmasi) berada di posisi paling atas
      if (a.hasPendingPayment && !b.hasPendingPayment) return -1;
      if (!a.hasPendingPayment && b.hasPendingPayment) return 1;

      // 2. Setelah aksi disetujui/ditolak, data kembali ke urutan semula (ID Invoice / tgl invoice)
      return (b.dbId || 0) - (a.dbId || 0);
    });
  }, [piutangData, searchTerm, filterStatus]);

  const downloadExcel = () => {
    let csvContent = "\uFEFF"; // BOM for Excel on Windows to read UTF-8 properly
    csvContent += "Bengkel / Pelanggan;No Invoice;Nominal;Jatuh Tempo;Status\r\n";
    filteredPiutang.forEach(item => {
      let statusText = '';
      if (item.status === 'overdue') {
        statusText = `Telat ${item.days} Hari`;
      } else if (item.status === 'warning') {
        statusText = `Sisa ${item.days} Hari (Peringatan)`;
      } else {
        statusText = `Sisa ${item.days} Hari`;
      }
      const cleanCustomer = item.customer.replace(/;/g, ',');
      csvContent += `${cleanCustomer};${item.id};${item.amount};${item.dueDate};${statusText}\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Piutang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReminder = (type, customer) => {
    if (type === 'phone') {
      alert(`Membuka aplikasi Telepon/WhatsApp untuk menghubungi ${customer}...`);
    } else {
      alert(`Mengirim Email Reminder tagihan ke ${customer}...`);
    }
  };

  const handleConfirmPayment = (item) => {
    setConfirmingItem(item);
    fetchPayments(item.dbId);
  };

  return (
    <DashboardLayout>
      <style>{`
        @keyframes highlight-pulse {
          0% { 
            background-color: rgba(254, 243, 199, 0.95); 
            box-shadow: inset 0 0 0 2px #F59E0B;
          }
          100% { 
            background-color: transparent; 
            box-shadow: inset 0 0 0 0px transparent;
          }
        }
        .row-highlighted {
          animation: highlight-pulse 3s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>
      <div className="flex flex-col gap-6 font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Monitoring Piutang</h2>
            <p className="text-sm text-[#64748B] mt-1">Pantau status pembayaran dan tagihan jatuh tempo</p>
          </div>
          <button 
            onClick={downloadExcel}
            className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download Rekap (Excel)
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
            <p className="text-xs font-bold text-[#64748B]">Memuat data piutang...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-[#2563EB]" />
                  </div>
                </div>
                <p className="text-sm font-bold text-[#64748B] mb-1">Total Piutang Berjalan</p>
                <h3 className="text-3xl font-black text-[#1E293B]">
                  Rp {Math.round(piutangData?.stats?.totalPiutang || 0).toLocaleString('id-ID')}
                </h3>
              </div>
              
              <div className="bg-[#FEF2F2] rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#FECACA]">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-[#DC2626] rounded-xl flex items-center justify-center shadow-inner">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm font-bold text-[#991B1B] mb-1">Jatuh Tempo (Overdue)</p>
                <h3 className="text-3xl font-black text-[#7F1D1D]">
                  Rp {Math.round(piutangData?.stats?.overduePiutang || 0).toLocaleString('id-ID')}
                </h3>
                <p className="text-xs font-semibold text-[#DC2626] mt-2">
                  Terdapat {piutangData?.stats?.countOverdue || 0} tagihan menunggak
                </p>
              </div>

              <div className="bg-[#FFFBEB] rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#FDE68A]">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-[#F59E0B] rounded-xl flex items-center justify-center shadow-inner">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm font-bold text-[#92400E] mb-1">Peringatan (&lt; 7 Hari)</p>
                <h3 className="text-3xl font-black text-[#78350F]">
                  Rp {Math.round(piutangData?.stats?.warningPiutang || 0).toLocaleString('id-ID')}
                </h3>
                <p className="text-xs font-semibold text-[#D97706] mt-2">Segera ingatkan pelanggan</p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-4 bg-white p-2 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-[#94A3B8]" />
                </div>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari nama bengkel atau no invoice..." 
                  className="w-full pl-10 pr-4 py-2.5 border-none rounded-lg text-sm focus:outline-none focus:ring-0 text-[#334155] placeholder:text-[#94A3B8] bg-transparent"
                />
              </div>
              <div className="w-px h-8 bg-[#E2E8F0] mx-2"></div>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-[#E2E8F0] rounded-lg px-4 py-2 text-sm text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white min-w-[170px] mr-2 font-semibold"
              >
                <option value="Semua Status">Semua Piutang</option>
                <option value="Aktif">Belum Lunas (Aktif)</option>
                <option value="Lunas">Lunas (Selesai)</option>
                <option value="Overdue">Jatuh Tempo (Telat)</option>
                <option value="Warning">Peringatan (&lt; 7 Hari)</option>
              </select>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                      <th className="py-4 px-6">BENGKEL / PELANGGAN</th>
                      <th className="py-4 px-6">NO INVOICE</th>
                      <th className="py-4 px-6">NOMINAL PIUTANG</th>
                      <th className="py-4 px-6">JATUH TEMPO</th>
                      <th className="py-4 px-6">STATUS</th>
                      <th className="py-4 px-6 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredPiutang.length > 0 ? filteredPiutang.map((item, idx) => {
                      const isHighlighted = activeHighlightId === item.id;

                      return (
                        <tr 
                          key={idx} 
                          id={`row-${item.id}`}
                          className={`border-b border-[#E2E8F0] hover:bg-gray-50/50 transition-all duration-300 ${
                            item.hasPendingPayment ? 'bg-amber-50/50 border-l-4 border-l-[#F59E0B]' : isHighlighted ? 'row-highlighted bg-amber-50/60' : ''
                          }`}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {item.hasPendingPayment && (
                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300 shadow-xs animate-pulse">
                                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
                                  ⚡ PERLU KONFIRMASI
                                </span>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5">
                                  {item.hasPendingPayment && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0 border border-white shadow-xs" title="Ada pembayaran cicilan yang perlu dikonfirmasi Admin" />
                                  )}
                                  <p className="font-bold text-[#1E293B]">{item.customer}</p>
                                </div>
                                <p className="text-xs text-[#64748B]">{item.city}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-[#4F46E5] font-semibold text-xs">
                            {item.id}
                          </td>
                          <td className="py-4 px-6 font-bold text-[#1E293B]">
                            {item.isLunas ? (
                              <span className="text-[#16A34A] font-black">Lunas (Rp 0)</span>
                            ) : (
                              `Rp ${Math.round(item.remainingAmount ?? item.amount ?? 0).toLocaleString('id-ID')}`
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <p className="font-semibold text-[#334155]">{item.dueDate}</p>
                          </td>
                          <td className="py-4 px-6">
                            {item.isLunas ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A]">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="text-[10px] font-bold">Lunas</span>
                              </div>
                            ) : item.status === 'overdue' ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626]">
                                <AlertTriangle className="w-3 h-3" />
                                <span className="text-[10px] font-bold">Telat {item.days} Hari</span>
                              </div>
                            ) : item.status === 'warning' ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706]">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] font-bold">Sisa {item.days} Hari</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E0E7FF] border border-[#C7D2FE] text-[#4F46E5]">
                                <CheckCircle2 className="w-3 h-3" />
                                <span className="text-[10px] font-bold">Sisa {item.days} Hari</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {item.isLunas || role === 'owner' ? (
                              <button
                                onClick={() => handleConfirmPayment(item)}
                                className="bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] border border-[#C7D2FE] px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 mx-auto"
                                title="Lihat Rincian & Riwayat Pembayaran"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Lihat Detail</span>
                              </button>
                            ) : role === 'admin' ? (
                              <button
                                onClick={() => handleConfirmPayment(item)}
                                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 mx-auto font-sans"
                                title="Konfirmasi Pembayaran"
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>Konfirmasi</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleConfirmPayment(item)}
                                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5 mx-auto font-sans"
                                title="Bayar / Catat Cicilan"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Bayar / Cicil</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-[#64748B]">Tidak ada data piutang yang sesuai.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Modal Konfirmasi Pembayaran & Cicilan */}
      {confirmingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <div>
                <h3 className="text-lg font-bold text-[#1E293B]">Pembayaran & Riwayat Cicilan</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Kelola pembayaran cicilan untuk tagihan pelanggan</p>
              </div>
              <button 
                onClick={() => setConfirmingItem(null)} 
                className="p-1.5 hover:bg-[#E2E8F0] rounded-lg transition-colors text-[#64748B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0] max-h-[75vh] overflow-y-auto">
              
              {/* KOLOM KIRI: Informasi & Form Bayar Baru */}
              <div className="p-6 flex flex-col gap-6">
                {/* Info Card Invoice */}
                <div className="bg-[#4F46E5]/5 border border-[#4F46E5]/10 rounded-2xl p-5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#4F46E5]">Informasi Piutang</span>
                  <h4 className="text-xl font-bold text-[#1E293B] mt-1">{confirmingItem.customer}</h4>
                  <p className="text-xs text-[#64748B] mt-1">{confirmingItem.city}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 border-t border-[#E2E8F0] pt-4">
                    <div>
                      <p className="text-[10px] text-[#64748B] uppercase font-bold">No Invoice</p>
                      <p className="text-sm font-bold text-[#4F46E5]">{confirmingItem.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748B] uppercase font-bold">Jatuh Tempo</p>
                      <p className="text-sm font-semibold text-[#334155]">{confirmingItem.dueDate}</p>
                    </div>
                  </div>

                {/* Display Mode Based on Role & Payment Status */}
                {(() => {
                  const approvedSum = payments.filter(p => p.status_pembayaran === 'Disetujui' || p.status_pembayaran === 'Approved').reduce((acc, curr) => acc + parseFloat(curr.jumlah_bayar || 0), 0);
                  const currentRemaining = confirmingItem.remainingAmount !== undefined && confirmingItem.remainingAmount !== null 
                    ? confirmingItem.remainingAmount 
                    : Math.max(0, (confirmingItem.amount || 0) - approvedSum);

                  const isLunas = confirmingItem.isLunas || currentRemaining === 0 || confirmingItem.statusBayar === 'Lunas';
                  
                  return (
                    <>
                      <div className="mt-4 bg-white/70 border border-[#E2E8F0] rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] text-[#64748B] uppercase font-bold">Sisa Piutang Aktif</p>
                          <p className="text-lg font-black text-[#DC2626]">Rp {Math.round(currentRemaining).toLocaleString('id-ID')}</p>
                        </div>
                        {confirmingItem.paidAmount > 0 && (
                          <div className="text-right">
                            <p className="text-[10px] text-[#64748B] uppercase font-bold">Total Terbayar</p>
                            <p className="text-sm font-bold text-[#16A34A]">Rp {Math.round(confirmingItem.paidAmount || approvedSum).toLocaleString('id-ID')}</p>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
                </div>

                {/* Display Form / Info Based on Role */}
                {(() => {
                  const approvedSum = payments.filter(p => p.status_pembayaran === 'Disetujui' || p.status_pembayaran === 'Approved').reduce((acc, curr) => acc + parseFloat(curr.jumlah_bayar || 0), 0);
                  const currentRemaining = confirmingItem.remainingAmount !== undefined && confirmingItem.remainingAmount !== null 
                    ? confirmingItem.remainingAmount 
                    : Math.max(0, (confirmingItem.amount || 0) - approvedSum);

                  const isLunas = confirmingItem.isLunas || currentRemaining === 0 || confirmingItem.statusBayar === 'Lunas';
                  if (isLunas) {
                    return (
                      <div className="bg-[#DCFCE7] border border-[#BBF7D0] rounded-2xl p-5 text-center flex flex-col items-center justify-center flex-1">
                        <CheckCircle2 className="w-12 h-12 text-[#16A34A] mb-2" />
                        <h4 className="text-md font-bold text-[#1E293B]">Tagihan Sudah Lunas</h4>
                        <p className="text-xs text-[#475569] mt-1">Seluruh sisa piutang untuk invoice ini telah dibayarkan penuh.</p>
                      </div>
                    );
                  }
                  if (role === 'admin') {
                    return (
                      <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl p-5 text-center flex flex-col items-center justify-center flex-1">
                        <Check className="w-10 h-10 text-[#4F46E5] mb-2" />
                        <h4 className="text-md font-bold text-[#1E293B]">Mode Konfirmator (Admin)</h4>
                        <p className="text-xs text-[#475569] mt-1">Tinjau bukti transfer dan konfirmasi (Setujui / Tolak) pembayaran di panel kanan.</p>
                      </div>
                    );
                  }
                  if (role === 'owner') {
                    return (
                      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-5 text-center flex flex-col items-center justify-center flex-1">
                        <FileText className="w-10 h-10 text-[#2563EB] mb-2" />
                        <h4 className="text-md font-bold text-[#1E293B]">Mode Pengamat (Owner)</h4>
                        <p className="text-xs text-[#475569] mt-1">Menampilkan rincian tagihan piutang dan seluruh riwayat cicilan (Read Only).</p>
                      </div>
                    );
                  }
                  return (
                    <form onSubmit={handleAddPayment} className="flex flex-col gap-4">
                      <h4 className="text-sm font-bold text-[#1E293B]">Input Cicilan / Pembayaran Baru</h4>
                      
                      <div>
                        <label className="block text-xs font-semibold text-[#475569] mb-1">Nominal Pembayaran (Rupiah) *</label>
                        <input 
                          type="text" 
                          value={jumlahBayar}
                          onChange={handleJumlahBayarChange}
                          placeholder="Contoh: 1.000.000"
                          required
                          className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#4F46E5] text-[#334155]"
                        />
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-[10px] text-[#64748B]">Maksimal pembayaran: Rp {Math.round(currentRemaining).toLocaleString('id-ID')},00</p>
                          {jumlahBayar && (
                            <p className="text-[11px] font-black text-[#16A34A]">Format: Rp {jumlahBayar}.00</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#475569] mb-1">Metode Pembayaran</label>
                          <select 
                            value={metodeBayar}
                            onChange={(e) => setMetodeBayar(e.target.value)}
                            className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#4F46E5] text-[#334155] bg-white"
                          >
                            <option value="Transfer">Transfer Bank</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#475569] mb-1">Unggah Bukti Transfer / Resi</label>
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden" 
                              id="upload-bukti"
                            />
                            <label 
                              htmlFor="upload-bukti"
                              className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm focus:outline-none hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-2 text-[#475569] font-medium"
                            >
                              <Upload className="w-4 h-4" />
                              <span>{buktiBayar ? 'Resi Dipilih' : 'Pilih File'}</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {buktiBayar && (
                        <div className="relative border border-[#E2E8F0] rounded-xl p-2 bg-gray-50 flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                            <img src={buktiBayar} alt="Bukti Transfer" className="object-cover w-full h-full" />
                          </div>
                          <span className="text-xs text-[#475569] font-medium truncate flex-1">Resi berhasil dimuat (Base64)</span>
                          <button 
                            type="button" 
                            onClick={() => setBuktiBayar('')}
                            className="text-xs font-bold text-[#EF4444] hover:underline px-2"
                          >
                            Hapus
                          </button>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-[#475569] mb-1">Catatan / Keterangan</label>
                        <textarea 
                          value={catatan}
                          onChange={(e) => setCatatan(e.target.value)}
                          placeholder="Keterangan pembayaran (misal: Transfer Bank Mandiri, Titip supir, dll.)"
                          rows="2"
                          className="w-full border border-[#E2E8F0] rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#4F46E5] text-[#334155]"
                        ></textarea>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold rounded-xl transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ajukan Pembayaran</span>
                      </button>
                    </form>
                  );
                })()}
              </div>

              {/* KOLOM KANAN: Riwayat Cicilan / Pembayaran Terdaftar */}
              <div className="p-6 flex flex-col gap-4">
                <h4 className="text-sm font-bold text-[#1E293B]">Riwayat Pembayaran & Approval</h4>
                
                {isLoadingPayments ? (
                  <div className="flex flex-col items-center justify-center py-12 text-[#64748B]">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-xs">Memuat riwayat cicilan...</span>
                  </div>
                ) : payments.length > 0 ? (
                  <div className="flex flex-col gap-3 overflow-y-auto pr-1 max-h-[50vh]">
                    {payments.map((pay, pIdx) => (
                      <div 
                        key={pIdx}
                        className="border border-[#E2E8F0] rounded-2xl p-4 bg-white hover:shadow-sm transition-shadow flex flex-col gap-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs text-[#64748B]">Tanggal Bayar:</span>
                            <p className="text-xs font-bold text-[#334155]">
                              {new Date(pay.tgl_bayar).toLocaleDateString('id-ID', {
                                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                          
                          {/* Badge Status */}
                          {pay.status_pembayaran === 'Pending' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 border border-amber-200 text-amber-800">
                              Pending Review
                            </span>
                          )}
                          {pay.status_pembayaran === 'Disetujui' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 border border-emerald-200 text-emerald-800">
                              Disetujui
                            </span>
                          )}
                          {pay.status_pembayaran === 'Ditolak' && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 border border-rose-200 text-rose-800">
                              Ditolak
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between items-center bg-[#F8FAFC] px-3 py-2 rounded-xl border border-[#E2E8F0]">
                          <div>
                            <span className="text-[10px] text-[#64748B] uppercase font-bold">Nominal</span>
                            <p className="text-sm font-bold text-[#1E293B]">Rp {parseFloat(pay.jumlah_bayar).toLocaleString('id-ID')}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[#64748B] uppercase font-bold">Metode</span>
                            <p className="text-xs font-semibold text-[#475569]">{pay.metode_bayar}</p>
                          </div>
                        </div>

                        {pay.catatan && (
                          <p className="text-xs text-[#64748B] bg-gray-50 p-2 rounded-lg italic">
                            &ldquo;{pay.catatan}&rdquo;
                          </p>
                        )}

                        {pay.bukti_bayar && (
                          <button
                            type="button"
                            onClick={() => setSelectedBukti(pay.bukti_bayar)}
                            className="text-xs text-[#4F46E5] hover:underline font-semibold flex items-center gap-1"
                          >
                            <Image className="w-3.5 h-3.5" />
                            <span>Lihat Bukti Transfer / Transaksi</span>
                          </button>
                        )}

                        {/* Aksi Verifikasi / Approval (Hanya untuk Admin Konfirmator) */}
                        {pay.status_pembayaran === 'Pending' && role === 'admin' && (
                          <div className="flex gap-2 pt-2 border-t border-[#E2E8F0]">
                            <button
                              type="button"
                              onClick={() => handleUpdatePaymentStatus(pay.id_pembayaran, 'Ditolak')}
                              className="flex-1 py-1.5 border border-[#EF4444] text-[#EF4444] hover:bg-rose-50 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdatePaymentStatus(pay.id_pembayaran, 'Disetujui')}
                              className="flex-1 py-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[#E2E8F0] rounded-2xl text-[#64748B]">
                    <FileText className="w-10 h-10 text-[#CBD5E1] mb-2" />
                    <span className="text-xs font-semibold">Belum ada riwayat pembayaran.</span>
                    <p className="text-[10px] text-[#94A3B8] mt-0.5">Input pembayaran baru di sebelah kiri.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Lightbox Viewer Bukti Transfer */}
      {selectedBukti && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4">
          <div className="relative max-w-2xl w-full flex flex-col items-center">
            <button
              onClick={() => setSelectedBukti(null)}
              className="absolute -top-10 right-0 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <X className="w-4 h-4" />
              <span>Tutup</span>
            </button>
            <div className="bg-white rounded-2xl overflow-hidden p-2 max-h-[80vh] flex items-center justify-center shadow-2xl">
              <img src={selectedBukti} alt="Bukti Transfer Lanjutan" className="max-h-[75vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
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
    </DashboardLayout>
  );
}
