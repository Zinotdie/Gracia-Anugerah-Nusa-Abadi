import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { BarChart2, Trophy, DollarSign, Calendar, Loader2, Package } from 'lucide-react';
import api from '../utils/api';

export default function LaporanPenjualan() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));

  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalDus: 0,
    avgOrder: 0,
    topCustomers: [],
    brandBreakdown: [],
    transactions: []
  });

  const months = [
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

  const fetchReport = (monthKey) => {
    setIsLoading(true);
    api.get(`/api/owner/laporan-penjualan`, { params: { bulan: monthKey } })
      .then(res => {
        if (res.data && res.data.success) {
          const payload = res.data.data || res.data;
          setReportData({
            totalRevenue: Number(payload.totalRevenue || 0),
            totalDus: Number(payload.totalDus || 0),
            avgOrder: Number(payload.avgOrder || 0),
            topCustomers: Array.isArray(payload.topCustomers) ? payload.topCustomers : [],
            brandBreakdown: Array.isArray(payload.brandBreakdown) ? payload.brandBreakdown : [],
            transactions: Array.isArray(payload.transactions) ? payload.transactions : (Array.isArray(payload.orders) ? payload.orders : [])
          });
        } else {
          setReportData({
            totalRevenue: 0,
            totalDus: 0,
            avgOrder: 0,
            topCustomers: [],
            brandBreakdown: [],
            transactions: []
          });
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Gagal memuat laporan dari API:", err);
        setReportData({
          totalRevenue: 0,
          totalDus: 0,
          avgOrder: 0,
          topCustomers: [],
          brandBreakdown: [],
          transactions: []
        });
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchReport(`${selectedYear}-${selectedMonth}`);
  }, [selectedMonth, selectedYear]);

  // Is future check
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const isFuture = `${selectedYear}-${selectedMonth}` > currentMonthStr;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        
        {/* Header & Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Laporan Penjualan</h2>
            <p className="text-sm text-[#64748B] mt-1">Laporan performa penjualan dan top pelanggan</p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-[#E2E8F0] bg-white rounded-lg px-4 py-2 text-sm font-semibold text-[#1E293B] shadow-sm outline-none focus:ring-2 focus:ring-[#4F46E5]"
            >
              {months.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-[#E2E8F0] bg-white rounded-lg px-4 py-2 text-sm font-semibold text-[#1E293B] shadow-sm outline-none focus:ring-2 focus:ring-[#4F46E5]"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-10 h-10 text-[#4F46E5] animate-spin" />
            <p className="text-sm font-bold text-[#64748B]">Memuat laporan...</p>
          </div>
        ) : isFuture || (reportData.totalRevenue === 0 && reportData.totalDus === 0) ? (
          /* Empty State / Future Date */
          <div className="flex flex-col items-center justify-center py-24 bg-white border border-[#E2E8F0] rounded-2xl gap-4 shadow-sm">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-[#EF4444]">
              <Calendar className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-[#1E293B]">Data Tidak Ada</h3>
              <p className="text-sm text-[#64748B] mt-1 px-4">
                Periode laporan belum terjadi atau tidak memiliki data penjualan.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
                <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-[#2563EB]" />
                </div>
                <p className="text-sm font-bold text-[#64748B] mb-1 uppercase tracking-wide">Total Omset</p>
                <h3 className="text-3xl font-black text-[#1E293B] mb-2">
                  Rp {reportData.totalRevenue.toLocaleString('id-ID')}
                </h3>
                <p className="text-xs font-semibold text-[#64748B]">
                  Berdasarkan seluruh transaksi bulan ini
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
                <div className="w-12 h-12 bg-[#FEF2F2] rounded-xl flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-[#DC2626]" />
                </div>
                <p className="text-sm font-bold text-[#64748B] mb-1 uppercase tracking-wide">Total Dus Terjual</p>
                <h3 className="text-3xl font-black text-[#1E293B] mb-2">
                  {reportData.totalDus} Karton
                </h3>
                <p className="text-xs font-semibold text-[#64748B]">
                  Volume penjualan produk
                </p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
                <div className="w-12 h-12 bg-[#F0FDF4] rounded-xl flex items-center justify-center mb-4">
                  <BarChart2 className="w-6 h-6 text-[#16A34A]" />
                </div>
                <p className="text-sm font-bold text-[#64748B] mb-1 uppercase tracking-wide">Rata-rata Order</p>
                <h3 className="text-3xl font-black text-[#1E293B] mb-2">
                  Rp {Math.round(reportData.avgOrder).toLocaleString('id-ID')}
                </h3>
                <p className="text-xs font-semibold text-[#64748B]">Per transaksi / invoice</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Brand Performance Split */}
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-[#E2E8F0]">
                  <h3 className="font-bold text-[#1E293B] text-lg">Komposisi Penjualan by Brand</h3>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-center gap-6">
                  {reportData.brandBreakdown.length > 0 ? (
                    reportData.brandBreakdown.map((brandInfo, index) => {
                      const colors = [
                        { dot: 'bg-[#16A34A]', bar: 'bg-[#16A34A]' },
                        { dot: 'bg-[#DC2626]', bar: 'bg-[#DC2626]' },
                        { dot: 'bg-[#2563EB]', bar: 'bg-[#2563EB]' },
                        { dot: 'bg-[#F59E0B]', bar: 'bg-[#F59E0B]' }
                      ];
                      const color = colors[index % colors.length];

                      return (
                        <div key={brandInfo.brand}>
                          <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${color.dot}`}></div>
                              <span className="font-bold text-[#1E293B]">{brandInfo.brand || 'Unbranded'}</span>
                            </div>
                             <div className="text-right">
                              <span className="font-black text-xl text-[#1E293B]">{brandInfo?.percentage || 0}%</span>
                              <p className="text-xs text-[#64748B] font-semibold">
                                Rp {Number(brandInfo?.total || brandInfo?.revenue || 0).toLocaleString('id-ID')} {brandInfo?.dus !== undefined ? `(${brandInfo.dus} Karton)` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-[#E2E8F0] h-4 rounded-full overflow-hidden">
                            <div 
                              className={`${color.bar} h-full rounded-full transition-all duration-500`} 
                              style={{ width: `${brandInfo?.percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-sm font-semibold text-[#64748B] py-8">
                      Tidak ada data brand penjualan untuk periode ini.
                    </p>
                  )}
                </div>
              </div>

              {/* Top 5 Customers */}
              <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden">
                <div className="p-6 border-b border-[#E2E8F0] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#F59E0B]" />
                  <h3 className="font-bold text-[#1E293B] text-lg">Top 5 Pelanggan</h3>
                </div>
                <div className="p-2">
                  {reportData.topCustomers.length > 0 ? (
                    reportData.topCustomers.map((cust, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 hover:bg-[#F8FAFC] rounded-xl transition-colors">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          idx === 0 ? 'bg-[#FEF3C7] text-[#D97706]' : 
                          idx === 1 ? 'bg-[#F1F5F9] text-[#64748B]' : 
                          idx === 2 ? 'bg-[#FFEDD5] text-[#9A3412]' : 
                          'bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0]'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#1E293B] truncate">{cust.name}</h4>
                          <p className="text-xs text-[#64748B] truncate">{cust.city || 'Banjarmasin'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-[#1E293B] text-sm">
                            Rp {Number(cust?.total || cust?.totalSpent || 0).toLocaleString('id-ID')}
                          </p>
                          <p className="text-xs text-[#64748B] font-semibold">{cust?.percentage || 0}% dari total</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-sm font-semibold text-[#64748B] py-16">
                      Tidak ada data pelanggan untuk periode ini.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Monthly Transaction Detail Listing Table */}
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden mt-6">
              <div className="p-6 border-b border-[#E2E8F0]">
                <h3 className="font-bold text-[#1E293B] text-lg">Rincian Transaksi Penjualan Bulanan</h3>
                <p className="text-xs text-[#64748B] mt-1">Daftar lengkap invoice penjualan yang tercatat pada periode ini</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">INVOICE</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">NAMA BENGKEL</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">SALES</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">METODE BAYAR</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">STATUS BAYAR</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">STATUS KIRIM</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">TANGGAL</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">TOTAL NETTO</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {reportData.transactions && reportData.transactions.length > 0 ? (
                      reportData.transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-4 px-6 font-bold text-[#1E293B]">{tx.id}</td>
                          <td className="py-4 px-6 font-semibold text-[#475569]">{tx.customerName || tx.customer || 'Bengkel'}</td>
                          <td className="py-4 px-6 text-[#64748B]">{tx.salesName || tx.sales || 'Sales Team'}</td>
                          <td className="py-4 px-6 text-[#475569]">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              (tx.paymentMethod || 'Tempo') === 'Tempo' ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'bg-[#ECFDF5] text-[#10B981]'
                            }`}>
                              {tx.paymentMethod || 'Tempo'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              (tx.paymentStatus || tx.status || 'Belum Lunas') === 'Lunas' ? 'bg-[#ECFDF5] text-[#10B981]' : 'bg-[#FFFBEB] text-[#D97706]'
                            }`}>
                              {tx.paymentStatus || tx.status || 'Belum Lunas'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              (tx.shippingStatus || 'Delivered') === 'Delivered' ? 'bg-[#ECFDF5] text-[#10B981]' :
                              tx.shippingStatus === 'Shipped' ? 'bg-[#EFF6FF] text-[#2563EB]' : 'bg-[#FFFBEB] text-[#D97706]'
                            }`}>
                              {tx.shippingStatus || 'Delivered'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-[#64748B]">{tx.date}</td>
                          <td className="py-4 px-6 font-bold text-[#1E293B]">
                            Rp {Number(tx.amount || tx.total || 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-xs text-[#94A3B8]">
                          Tidak ada rincian transaksi untuk periode ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        )}

      </div>
    </DashboardLayout>
  );
}
