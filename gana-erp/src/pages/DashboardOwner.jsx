import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import { DollarSign, AlertTriangle, TrendingUp, Calendar, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardOwner() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));

  const handlePrevMonth = () => {
    let m = parseInt(selectedMonth, 10) - 1;
    let y = parseInt(selectedYear, 10);
    if (m < 1) {
      m = 12;
      y = y - 1;
    }
    setSelectedMonth(String(m).padStart(2, '0'));
    setSelectedYear(String(y));
  };

  const handleNextMonth = () => {
    let m = parseInt(selectedMonth, 10) + 1;
    let y = parseInt(selectedYear, 10);
    if (m > 12) {
      m = 1;
      y = y + 1;
    }
    setSelectedMonth(String(m).padStart(2, '0'));
    setSelectedYear(String(y));
  };

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalPiutang: 0,
      piutangJatuhTempo: 0,
      countBengkelJatuhTempo: 0,
      salesMTD: 0,
      purchaseMTD: 0
    },
    chartData: [],
    topReceivables: []
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

  const fetchDashboard = (monthKey) => {
    setIsLoading(true);
    api.get('/api/owner/dashboard', { params: { bulan: monthKey } })
      .then(res => {
        if (res.data && res.data.success) {
          setDashboardData({
            stats: res.data.stats,
            chartData: res.data.chartData,
            topReceivables: res.data.topReceivables
          });
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Gagal memuat dashboard dari API:", err);
        setDashboardData({
          stats: { totalPiutang: 0, piutangJatuhTempo: 0, countBengkelJatuhTempo: 0, salesMTD: 0, purchaseMTD: 0 },
          chartData: [],
          topReceivables: []
        });
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard(`${selectedYear}-${selectedMonth}`);
  }, [selectedMonth, selectedYear]);

  // Max value to scale bars in the chart
  const maxChartVal = Math.max(
    ...dashboardData.chartData.map(c => Math.max(c.sales, c.purchase)),
    1000000
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Title & Filter Section */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1E293B]">Dashboard Owner - Pak Tigana</h2>
            <p className="text-xs text-[#64748B] mt-1">Monitoring profitabilitas dan piutang bermasalah</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-[#E2E8F0] bg-white rounded-lg px-3 py-1.5 text-xs font-semibold text-[#1E293B] shadow-sm outline-none focus:ring-1 focus:ring-[#4F46E5]"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-[#E2E8F0] bg-white rounded-lg px-3 py-1.5 text-xs font-semibold text-[#1E293B] shadow-sm outline-none focus:ring-1 focus:ring-[#4F46E5]"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
            <p className="text-xs font-bold text-[#64748B]">Memuat dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Total Piutang" 
                value={`Rp ${(dashboardData.stats?.totalPiutang ?? 0).toLocaleString('id-ID')}`} 
                icon={<DollarSign className="w-5 h-5" />} 
                bgClass="bg-[#3B82F6]"
                trend=""
              />
              <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] p-5 flex flex-col justify-between border border-[#E2E8F0] h-full gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <p className="text-xs font-semibold text-[#64748B] mb-2">Piutang Jatuh Tempo</p>
                    <h3 className="text-[22px] font-bold text-[#1E293B] leading-none">
                      Rp {(dashboardData.stats?.piutangJatuhTempo ?? dashboardData.stats?.overduePiutang ?? 0).toLocaleString('id-ID')}
                    </h3>
                  </div>
                  <div className="w-[42px] h-[42px] rounded-lg flex items-center justify-center shrink-0 bg-[#EF4444] text-white">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-auto">
                  <span className="text-[11px] font-semibold text-[#EF4444]">
                    {dashboardData.stats?.countBengkelJatuhTempo ?? dashboardData.stats?.countBengkelOverdue ?? 0} bengkel
                  </span>
                </div>
              </div>
              <StatCard 
                title="Penjualan MTD" 
                value={`Rp ${(dashboardData.stats?.salesMTD ?? 0).toLocaleString('id-ID')}`} 
                icon={<TrendingUp className="w-5 h-5" />} 
                bgClass="bg-[#22C55E]"
                trend=""
              />
              <StatCard 
                title="Pembelian MTD" 
                value={`Rp ${(dashboardData.stats?.purchaseMTD ?? dashboardData.stats?.pembelianMTD ?? 0).toLocaleString('id-ID')}`} 
                icon={<Calendar className="w-5 h-5" />} 
                bgClass="bg-[#A855F7]"
                trend=""
              />
            </div>

            {/* Middle Section: Chart and Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
              
              {/* Chart Section */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] p-5 flex flex-col">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                  <h3 className="font-bold text-[#1E293B]">Penjualan vs Pembelian (4 Bulan Terakhir)</h3>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={handlePrevMonth}
                      className="p-1 border border-[#E2E8F0] rounded hover:bg-slate-50 transition-colors text-[#64748B] hover:text-[#1E293B] flex items-center justify-center"
                      title="Geser ke kiri (Bulan sebelumnya)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-bold text-[#64748B] px-1">Geser Bulan</span>
                    <button 
                      onClick={handleNextMonth}
                      className="p-1 border border-[#E2E8F0] rounded hover:bg-slate-50 transition-colors text-[#64748B] hover:text-[#1E293B] flex items-center justify-center"
                      title="Geser ke kanan (Bulan berikutnya)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 min-h-[300px]">
                  {dashboardData.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300} minWidth={0}>
                      <BarChart
                        data={dashboardData.chartData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis 
                          dataKey="label" 
                          tickLine={false} 
                          axisLine={false} 
                          tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} 
                        />
                        <YAxis 
                          domain={[0, maxChartVal]}
                          tickLine={false} 
                          axisLine={false} 
                          tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} 
                          tickFormatter={(val) => {
                            if (val >= 1000000) return `Rp ${(val / 1000000).toFixed(1)}jt`;
                            if (val >= 1000) return `Rp ${(val / 1000).toFixed(0)}rb`;
                            return `Rp ${val}`;
                          }}
                        />
                        <Tooltip 
                          formatter={(value, name) => [`Rp ${value.toLocaleString('id-ID')}`, name === 'sales' ? 'Penjualan' : 'Pembelian']}
                          labelStyle={{ fontWeight: 'bold', color: '#1E293B' }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend 
                          verticalAlign="top" 
                          align="right" 
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ paddingBottom: 20, fontSize: 12, fontWeight: 600 }}
                          formatter={(value) => value === 'sales' ? 'Penjualan' : 'Pembelian'}
                        />
                        <Bar dataKey="sales" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="purchase" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-center text-xs font-semibold text-[#64748B]">
                      Tidak ada data grafik penjualan/pembelian untuk bulan ini.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Cards */}
              <div className="flex flex-col gap-4">
                <Link to="/aging-schedule" className="bg-[#EF4444] text-white p-6 rounded-xl shadow-sm hover:bg-[#DC2626] transition-colors flex-1 flex flex-col justify-center">
                   <AlertTriangle className="w-6 h-6 mb-3 opacity-90" />
                   <h3 className="font-bold text-lg mb-1">Jadwal Umur Piutang (Aging Schedule)</h3>
                   <p className="text-sm opacity-90">Pantau piutang & umur tagihan bengkel</p>
                </Link>
                <Link to="/laporan-penjualan" className="bg-[#3B82F6] text-white p-6 rounded-xl shadow-sm hover:bg-[#2563EB] transition-colors flex-1 flex flex-col justify-center">
                   <TrendingUp className="w-6 h-6 mb-3 opacity-90" />
                   <h3 className="font-bold text-lg mb-1">Laporan Penjualan</h3>
                   <p className="text-sm opacity-90">Analisis performa & omset bulanan</p>
                </Link>
              </div>
            </div>

            {/* Highest Receivables Table */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden mt-2">
              <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-[#1E293B]">Bengkel dengan Piutang Tertinggi</h3>
                  <p className="text-xs text-[#64748B] mt-1">Prioritas Penagihan</p>
                </div>
                <Link to="/aging-schedule" className="text-sm text-[#4F46E5] font-semibold hover:underline">
                  Lihat Semua
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">BENGKEL</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">SISA TAGIHAN</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">JATUH TEMPO</th>
                      <th className="py-4 px-6 border-b border-[#E2E8F0]">STATUS AGING</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {dashboardData.topReceivables.length > 0 ? (
                      dashboardData.topReceivables.map((r, idx) => (
                        <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-4 px-6 font-bold text-[#1E293B]">{r.customer}</td>
                          <td className="py-4 px-6 font-bold text-[#1E293B]">
                            Rp {(r.outstanding ?? r.amount ?? 0).toLocaleString('id-ID')}
                          </td>
                          <td className="py-4 px-6 text-[#64748B]">{r.overdueText}</td>
                          <td className="py-4 px-6">
                            <div className={`h-2 w-full max-w-[100px] rounded-full ${r.color}`}></div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-xs font-semibold text-[#64748B]">
                          Tidak ada data piutang berjalan.
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
