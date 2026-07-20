import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import * as XLSX from 'xlsx';
import { Search, FileText, CheckCircle2, Clock, XCircle, Download, Eye, X, Printer, User } from 'lucide-react';
import { purchaseService } from '../services/purchaseService';

export default function DaftarPembelian() {
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState(null);

  const loadPurchases = () => {
    setIsLoading(true);
    purchaseService.getAll()
      .then(res => {
        // Response format is formatted inside backend Model: { id, date, sj, supplier, items, totalQty, status, staff, kepala, draftList }
        const data = Array.isArray(res) ? res : (res?.data || []);
        setPurchases(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Gagal load data pembelian:", err);
        setPurchases([]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [selectedMonth, setSelectedMonth] = useState('Semua Bulan');
  const [selectedYear, setSelectedYear] = useState('Semua Tahun');

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const matchSearch = String(p.id).toLowerCase().includes(searchTerm.toLowerCase()) || 
                          String(p.sj).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchStatus = true;
      if (statusFilter !== 'Semua Status') {
        if (statusFilter === 'Pending') matchStatus = p.status === 'pending';
        else if (statusFilter === 'Approved') matchStatus = p.status === 'approved';
        else if (statusFilter === 'Rejected') matchStatus = p.status === 'rejected';
      }

      let matchMonth = true;
      let matchYear = true;

      if (p.rawDate || p.created_at || p.date) {
        const d = new Date(p.rawDate || p.created_at || p.date);
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

      return matchSearch && matchStatus && matchMonth && matchYear;
    });
  }, [purchases, searchTerm, statusFilter, selectedMonth, selectedYear]);

  const [detailModal, setDetailModal] = useState({ isOpen: false, purchase: null });

  const showDetail = (purchase) => {
    setDetailModal({ isOpen: true, purchase });
  };

  const handleExportExcel = () => {
    if (filteredPurchases.length === 0) return alert("Tidak ada data untuk dieksport");
    
    const worksheetData = filteredPurchases.map(row => ({
      "NO PENERIMAAN": row.id,
      "NO SURAT JALAN": row.sj,
      "TANGGAL": row.date,
      "SUPPLIER": row.supplier,
      "STAFF GUDANG": row.staff,
      "KEPALA GUDANG": row.kepala,
      "TOTAL QTY (KARTON)": row.totalQty,
      "STATUS": row.status_qc || row.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Pembelian");

    XLSX.writeFile(workbook, `Data_Pembelian_${new Date().getTime()}.xlsx`);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Menunggu</span>;
      case 'approved': return <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#16A34A] flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Disetujui</span>;
      case 'rejected': return <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626] flex items-center gap-1 w-max"><XCircle className="w-3 h-3" /> Ditolak</span>;
      default: return <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-500 flex items-center gap-1 w-max">{status}</span>;
    }
  };

  const handlePrint = (p) => {
    const printContent = `
      <html>
        <head>
          <title>Invoice Pembelian - ${p.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1E293B; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #4F46E5; }
            .metadata { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .meta-block h4 { margin: 0 0 5px 0; font-size: 11px; color: #64748B; text-transform: uppercase; }
            .meta-block p { margin: 0; font-size: 14px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #F1F5F9; color: #475569; padding: 12px; font-size: 12px; font-weight: bold; text-align: left; border-bottom: 1px solid #E2E8F0; }
            td { padding: 12px; font-size: 13px; border-bottom: 1px solid #F1F5F9; }
            .total-section { margin-top: 30px; display: flex; justify-content: space-between; background: #F8FAFC; padding: 15px; border-radius: 8px; border: 1px solid #E2E8F0; }
            .footer-sig { margin-top: 50px; display: grid; grid-template-cols: 1fr 1fr; text-align: center; gap: 100px; }
            .sig-box { border-top: 1px solid #CBD5E1; padding-top: 10px; margin-top: 70px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">INVOICE PEMBELIAN BARANG</div>
              <div style="font-size: 12px; color: #64748B; margin-top: 5px;">PT. GRACIA ANUGERAH NUSA ABADI</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 16px; font-weight: bold;">${p.id}</div>
              <div style="font-size: 12px; color: #64748B;">Tanggal: ${p.date}</div>
            </div>
          </div>
          <div class="metadata">
            <div class="meta-block">
              <h4>No. Surat Jalan Supplier</h4>
              <p>${p.sj}</p>
            </div>
            <div class="meta-block">
              <h4>Supplier</h4>
              <p>${p.supplier}</p>
            </div>
            <div class="meta-block" style="margin-top: 10px;">
              <h4>Pencatat (Staff Gudang)</h4>
              <p>${p.staff}</p>
            </div>
            <div class="meta-block" style="margin-top: 10px;">
              <h4>Penyetujui (Kepala Gudang)</h4>
              <p>${p.kepala || '-'}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>BRAND</th>
                <th>NAMA PRODUK</th>
                <th style="text-align: right;">QTY MASUK</th>
                <th>SATUAN</th>
              </tr>
            </thead>
            <tbody>
              ${(p.draftList || []).map(item => `
                <tr>
                  <td><strong>${item.brand}</strong></td>
                  <td>${item.name}</td>
                  <td style="text-align: right; font-weight: bold;">${item.qty}</td>
                  <td>${item.uom}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-section">
            <span style="font-weight: bold;">TOTAL VOLUME MASUK</span>
            <span style="font-weight: 900; font-size: 16px;">${p.totalQty} Karton</span>
          </div>
          <div class="footer-sig">
            <div>
              <div>Penerima,</div>
              <div class="sig-box">${p.staff}</div>
            </div>
            <div>
              <div>Mengetahui,</div>
              <div class="sig-box">${p.kepala || 'Kepala Gudang'}</div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Daftar Pembelian (Barang Masuk)</h2>
            <p className="text-sm text-[#64748B] mt-1">Laporan historis surat jalan dan invoice masuk dari supplier</p>
          </div>
          <button 
            onClick={handleExportExcel}
            className="bg-[#16A34A] border border-[#16A34A] text-white hover:bg-[#15803D] px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Ekspor Excel
          </button>
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
              placeholder="Cari No Penerimaan, No. SJ, atau Supplier..." 
              className="w-full pl-10 pr-4 py-2.5 border-none rounded-lg text-sm focus:outline-none focus:ring-0 text-[#334155] placeholder:text-[#94A3B8] bg-transparent"
            />
          </div>
          <div className="w-px h-8 bg-[#E2E8F0] hidden sm:block"></div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-bold text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white"
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
              className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-bold text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white"
            >
              <option value="Semua Tahun">Semua Tahun</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-bold text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white"
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Pending">Menunggu</option>
              <option value="Approved">Disetujui</option>
              <option value="Rejected">Ditolak</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="py-4 px-6">NO INVOICE MASUK</th>
                  <th className="py-4 px-6">NO SURAT JALAN</th>
                  <th className="py-4 px-6">SUPPLIER</th>
                  <th className="py-4 px-6">TANGGAL MASUK</th>
                  <th className="py-4 px-6 text-right">TOTAL QTY</th>
                  <th className="py-4 px-6">STATUS</th>
                  <th className="py-4 px-6 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-[#64748B]">Memuat data pembelian...</td>
                  </tr>
                ) : filteredPurchases.length > 0 ? filteredPurchases.map((p, idx) => (
                  <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#94A3B8]" />
                        <span className="font-bold text-[#4F46E5]">{p.id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#475569] font-medium">{p.sj}</td>
                    <td className="py-4 px-6 font-bold text-[#1E293B]">{p.supplier}</td>
                    <td className="py-4 px-6 text-[#64748B]">{p.date}</td>
                    <td className="py-4 px-6 text-right font-black text-[#1E293B]">{p.totalQty} Karton</td>
                    <td className="py-4 px-6">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        {(p.status === 'Menunggu' || p.status === 'Pending' || p.status === 'Draft') && (
                          <>
                            <button 
                              onClick={() => {
                                purchaseService.approveQC(p.id)
                                  .then(() => { loadPurchases(); alert("Penerimaan barang disetujui & stok berhasil ditambahkan!"); })
                                  .catch((err) => alert(err.response?.data?.message || "Gagal menyetujui QC."));
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors text-xs font-semibold"
                              title="Setujui QC (Sesuai) & Tambah Stok"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve QC
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`Yakin ingin MENOLAK QC untuk penerimaan ${p.id}? Status akan diubah menjadi Cacat/Retur dan stok TIDAK akan bertambah.`)) {
                                  purchaseService.rejectQC(p.id)
                                    .then(() => { loadPurchases(); alert("Penerimaan barang ditolak / ditandai Cacat/Retur."); })
                                    .catch((err) => alert(err.response?.data?.message || "Gagal menolak QC."));
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EF4444] text-white hover:bg-[#DC2626] transition-colors text-xs font-semibold"
                              title="Tolak QC (Cacat/Retur)"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Tolak QC
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => showDetail(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] transition-colors text-xs font-semibold"
                        >
                          <Eye className="w-4 h-4" /> Rincian
                        </button>
                        <button 
                          onClick={() => handlePrint(p)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#E0E7FF] transition-colors text-xs font-semibold"
                        >
                          <Printer className="w-4 h-4" /> Cetak
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-[#64748B]">Tidak ada data pembelian yang sesuai.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Detail Modal */}
      {detailModal.isOpen && detailModal.purchase && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <h3 className="font-bold text-[#1E293B]">Rincian Invoice Pembelian</h3>
              <button onClick={() => setDetailModal({ isOpen: false, purchase: null })} className="text-[#64748B] hover:text-[#1E293B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-[#64748B] font-bold mb-1 font-sans">NO. PENERIMAAN</p>
                  <p className="text-sm font-bold text-[#4F46E5]">{detailModal.purchase.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#64748B] font-bold mb-1 font-sans">TANGGAL MASUK</p>
                  <p className="text-sm font-bold text-[#1E293B]">{detailModal.purchase.date}</p>
                </div>
              </div>
              <div className="border-t border-dashed border-[#E2E8F0]"></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#64748B] font-bold mb-1">NO. SURAT JALAN SUPPLIER</p>
                  <p className="text-sm font-bold text-[#1E293B]">{detailModal.purchase.sj}</p>
                  {detailModal.purchase.foto_sj_supplier && (
                    <button
                      onClick={() => setSelectedLightboxPhoto(detailModal.purchase.foto_sj_supplier)}
                      className="mt-2 text-xs font-bold text-[#4F46E5] hover:underline flex items-center gap-1 focus:outline-none"
                    >
                      <Eye className="w-3.5 h-3.5" /> Lihat Foto Surat Jalan
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-xs text-[#64748B] font-bold mb-1">SUPPLIER</p>
                  <p className="text-sm font-bold text-[#1E293B]">{detailModal.purchase.supplier}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#64748B] font-bold mb-1 flex items-center gap-1"><User className="w-3 h-3"/> STAFF GUDANG (PENCATAT)</p>
                  <p className="text-sm font-medium text-[#1E293B]">{detailModal.purchase.staff}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] font-bold mb-1 flex items-center gap-1"><User className="w-3 h-3"/> KEPALA GUDANG (PENYETUJUI)</p>
                  <p className="text-sm font-medium text-[#1E293B]">{detailModal.purchase.kepala || '-'}</p>
                </div>
              </div>
              
              <div className="border-t border-dashed border-[#E2E8F0]"></div>
              
              <div>
                <p className="text-xs text-[#64748B] font-bold mb-2">DAFTAR ITEM BARANG</p>
                <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl bg-white">
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
                      {detailModal.purchase.draftList && detailModal.purchase.draftList.length > 0 ? (
                        detailModal.purchase.draftList.map((item, pIdx) => (
                          <tr key={pIdx} className="border-b border-[#F1F5F9] last:border-b-0 hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                item.brand === 'Kixx' ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#DCFCE7] text-[#16A34A]'
                              }`}>
                                {item.brand}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-[#1E293B]">{item.name}</td>
                            <td className="py-2.5 px-4 text-right font-bold text-[#1E293B]">{item.qty}</td>
                            <td className="py-2.5 px-4 text-[#64748B]">{item.uom}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-4 text-center text-[#64748B] font-medium">
                            Tidak ada rincian produk.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {detailModal.purchase.foto_sj_supplier ? (
                <div>
                  <p className="text-xs text-[#64748B] font-bold mb-2">FOTO SURAT JALAN / INVOICE SUPPLIER</p>
                  <div className="max-h-56 rounded-xl overflow-hidden border border-[#E2E8F0] flex items-center justify-center bg-gray-50 p-2">
                    <img 
                      src={detailModal.purchase.foto_sj_supplier} 
                      alt="Foto Surat Jalan Supplier" 
                      className="object-contain max-h-48 w-full rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() => window.open(detailModal.purchase.foto_sj_supplier, '_blank')}
                    />
                  </div>
                  <p className="text-[10px] text-[#94A3B8] text-center mt-1">Klik gambar untuk melihat dalam ukuran penuh</p>
                </div>
              ) : null}

              <div className="border-t border-dashed border-[#E2E8F0]"></div>
              <div className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <span className="text-sm font-bold text-[#64748B]">Total Volume Masuk</span>
                <span className="text-md font-black text-[#1E293B]">{detailModal.purchase.totalQty} Karton</span>
              </div>
            </div>
            <div className="p-5 border-t border-[#E2E8F0] flex justify-end gap-2 bg-[#F8FAFC]">
              <button 
                onClick={() => handlePrint(detailModal.purchase)}
                className="px-5 py-2.5 bg-[#4F46E5] text-white hover:bg-[#4338CA] font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Cetak Invoice
              </button>
              <button onClick={() => setDetailModal({ isOpen: false, purchase: null })} className="px-5 py-2.5 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] font-semibold rounded-xl transition-colors">
                Tutup
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
            alt="Foto Surat Jalan Supplier"
            className="max-h-[85vh] max-w-full rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-200"
          />
          <p className="text-white/70 text-xs mt-4 font-semibold">Foto Surat Jalan / Invoice Supplier</p>
        </div>
      )}

    </DashboardLayout>
  );
}
