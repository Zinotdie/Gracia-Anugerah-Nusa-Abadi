import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import { Target, TrendingUp, MapPin, ShoppingCart, Camera, Check, Award, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { targetService } from '../services/targetService';
import { userService } from '../services/userService';
import { visitService } from '../services/visitService';

export default function DashboardSales() {
  const [targetData, setTargetData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [salesName, setSalesName] = useState(() => localStorage.getItem('userFullName') || 'Sales');
  const [recentVisits, setRecentVisits] = useState([]);

  const loadRecentVisits = () => {
    visitService.getAll({ bulan: 'all' })
      .then((res) => {
        const data = Array.isArray(res) ? res : (res?.data || res?.visits || []);
        const mapped = data.map(v => ({
          name: v.nama_bengkel || v.bengkelName || v.name || v.bengkel || 'Bengkel',
          date: v.tgl_kunjungan ? new Date(v.tgl_kunjungan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
          status: (v.status_order === 'Y' || v.hasOrder || (v.nilai_order && Number(v.nilai_order) > 0)) ? 'Ada Order' : 'Kunjungan',
          photoUrl: v.foto_visit || v.image || v.photoUrl || null
        }));
        setRecentVisits(mapped.slice(0, 4));
      })
      .catch((err) => {
        console.error("Gagal load recent visits:", err);
        setRecentVisits([]);
      });
  };

  const fetchTarget = (salesId = null) => {
    setIsLoading(true);
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const bulan = `${yyyy}-${mm}`;

    const params = { bulan };
    if (salesId) {
      params.sales_id = salesId;
    }

    targetService.get(params)
      .then((res) => {
        if (res && res.data) {
          setTargetData(res.data);
        } else {
          setTargetData({
            targetRevenue: 0,
            achievedRevenue: 0,
            targetVolume: 0,
            achievedVolume: 0
          });
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Gagal load target penjualan untuk dashboard sales:", err);
        setTargetData({
          targetRevenue: 0,
          achievedRevenue: 0,
          targetVolume: 0,
          achievedVolume: 0
        });
        setIsLoading(false);
      });
  };

  useEffect(() => {
    setSalesName(localStorage.getItem('userFullName') || 'Sales');
    loadRecentVisits();

    const userId = localStorage.getItem('userId');
    if (userId && userId !== 'dummy-sales-id') {
      fetchTarget(userId);
    } else {
      userService.getSales()
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.data || res?.sales || []);
          const currentName = localStorage.getItem('userFullName');
          const matched = list.find(s => 
            (s.nama || s.nama_sales || s.name || '').toLowerCase() === (currentName || '').toLowerCase()
          );
          if (matched) {
            const resolvedId = matched.id || matched.id_sales;
            localStorage.setItem('userId', resolvedId);
            fetchTarget(resolvedId);
          } else {
            fetchTarget();
          }
        })
        .catch((err) => {
          console.error("Gagal load sales list fallback di dashboard:", err);
          fetchTarget();
        });
    }
  }, []);

  const achievedRev = Number(targetData?.achievedRevenue || 0);
  const targetRev = Number(targetData?.targetRevenue || 0);
  const achievedVol = Number(targetData?.achievedVolume || targetData?.achievedDus || 0);
  const targetVol = Number(targetData?.targetVolume || targetData?.targetDus || 0);

  const pct = targetRev > 0 ? Math.min(Math.round((achievedRev / targetRev) * 100), 100) : 0;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        
        {/* Clean Light Header (Matching Admin & Other Dashboards) */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Dashboard Sales</h2>
            <p className="text-sm text-[#64748B] mt-1">Manajemen pesanan & pekerjaan lapangan mobile</p>
          </div>
        </div>

        {/* Target Penjualan Progress Card (Clean Light Styling) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full mb-3 border border-indigo-200/60">
                <Target className="w-3.5 h-3.5 text-indigo-600" /> Target Penjualan Bulan Ini
              </span>
              <h3 className="text-3xl font-black tracking-tight text-slate-900">
                Rp {achievedRev.toLocaleString('id-ID')} 
                <span className="text-base font-semibold text-slate-400 ml-2">/ Rp {targetRev.toLocaleString('id-ID')}</span>
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-2 flex items-center gap-2">
                <span>Pencapaian Volume:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">{achievedVol} Dus</span> 
                <span>dari target {targetVol} Dus</span>
              </p>
            </div>

            <div className="flex items-center gap-5 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 shrink-0">
              <div className="text-center">
                <div className="text-4xl font-black text-indigo-600 tracking-tight">{pct}%</div>
                <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">Pencapaian Target</div>
              </div>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-3 rounded-full mt-6 overflow-hidden p-0.5 border border-slate-200/60">
            <div 
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-700 shadow-xs"
              style={{ width: `${pct}%` }}
            ></div>
          </div>
        </div>

        {/* Summary Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Omset Bulan Ini" 
            value={`Rp ${achievedRev.toLocaleString('id-ID')}`}
            icon={<TrendingUp className="w-5 h-5 text-[#2563EB]" />}
            bgColor="bg-blue-50"
            textColor="text-blue-600"
          />
          <StatCard 
            title="Target Omset" 
            value={`Rp ${targetRev.toLocaleString('id-ID')}`}
            icon={<Target className="w-5 h-5 text-[#16A34A]" />}
            bgColor="bg-emerald-50"
            textColor="text-emerald-600"
          />
          <StatCard 
            title="Target Dus (Karton)" 
            value={`${targetVol} Dus`}
            icon={<Award className="w-5 h-5 text-[#D97706]" />}
            bgColor="bg-amber-50"
            textColor="text-amber-600"
          />
          <StatCard 
            title="Realisasi Dus" 
            value={`${achievedVol} Dus`}
            icon={<ShoppingCart className="w-5 h-5 text-[#9333EA]" />}
            bgColor="bg-purple-50"
            textColor="text-purple-600"
          />
        </div>

        {/* Quick Action Buttons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link 
            to="/input-pesanan" 
            className="group relative bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white p-6 rounded-3xl shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
             <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
             <div className="flex items-center justify-between mb-4">
               <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
                 <ShoppingCart className="w-6 h-6 text-white" />
               </div>
               <ArrowUpRight className="w-5 h-5 text-indigo-200 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </div>
             <div>
               <h3 className="font-extrabold text-xl mb-1 text-white">Input Sales Order (SO)</h3>
               <p className="text-xs text-indigo-100 opacity-90">Buat pesanan oli baru & penerbitan pesanan bengkel secara langsung</p>
             </div>
          </Link>
          
          <Link 
            to="/laporan-kunjungan" 
            className="group relative bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white p-6 rounded-3xl shadow-lg hover:shadow-orange-500/25 transition-all duration-300 flex flex-col justify-between overflow-hidden"
          >
             <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
             <div className="flex items-center justify-between mb-4">
               <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
                 <MapPin className="w-6 h-6 text-white" />
               </div>
               <ArrowUpRight className="w-5 h-5 text-orange-200 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
             </div>
             <div>
               <h3 className="font-extrabold text-xl mb-1 text-white">Catatan Kunjungan</h3>
               <p className="text-xs text-orange-100 opacity-90">Dokumentasikan foto visit, status order, & catatan kunjungan lapangan</p>
             </div>
          </Link>
        </div>

        {/* Live Recent Visits List Card */}
        <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-200/80 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Kunjungan Terbaru Lapangan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Daftar riwayat kunjungan ke lokasi pelanggan bengkel</p>
            </div>
            <Link to="/laporan-kunjungan" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors">
              Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          
          <div className="divide-y divide-slate-100">
            {recentVisits && recentVisits.length > 0 ? (
              recentVisits.map((visit, index) => (
                <div key={index} className="flex items-center justify-between p-5 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {visit.name ? visit.name.charAt(0).toUpperCase() : 'B'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{visit.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{visit.date}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link 
                      to="/laporan-kunjungan"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500" /> Foto
                    </Link>
                    {visit.status === 'Ada Order' ? (
                      <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-bold">
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Ada Order
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                        Kunjungan
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-slate-500 text-sm">
                Belum ada riwayat data kunjungan terbaru.
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
