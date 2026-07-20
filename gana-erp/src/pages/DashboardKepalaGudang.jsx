import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import { AlertCircle, Package, TrendingUp, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { purchaseService } from '../services/purchaseService';

export default function DashboardKepalaGudang() {
  const [products, setProducts] = useState([]);
  const [incomingStock, setIncomingStock] = useState([]);

  useEffect(() => {
    productService.getAll()
      .then(res => {
        const data = Array.isArray(res) ? res : (res?.data || res?.products || []);
        setProducts(data);
      })
      .catch(err => {
        console.error("Gagal memuat produk dari API:", err);
        setProducts([]);
      });

    purchaseService.getAll()
      .then(res => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        setIncomingStock(data);
      })
      .catch(err => {
        console.error("Gagal memuat incoming stock dari API:", err);
        setIncomingStock([]);
      });
  }, []);

  const pendingApprovals = incomingStock.filter(s => s.status === 'pending');
  const approvedThisMonth = incomingStock.filter(s => s.status === 'approved');
  const totalApprovedQty = approvedThisMonth.reduce((acc, curr) => acc + curr.totalQty, 0);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Title Section */}
        <div>
          <h2 className="text-xl font-bold text-[#1E293B]">Dashboard Kepala Gudang</h2>
          <p className="text-xs text-[#64748B] mt-1">Validasi stok masuk dan Quality Control</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Menunggu Approval" 
            value={pendingApprovals.length.toString()} 
            icon={<AlertCircle className="w-5 h-5" />} 
            bgClass="bg-[#EAB308]"
          />
          <StatCard 
            title="Total Jenis Produk" 
            value={products.length.toString()} 
            icon={<Package className="w-5 h-5" />} 
            bgClass="bg-[#3B82F6]"
          />
          <StatCard 
            title="Stok Masuk Disetujui" 
            value={`${totalApprovedQty} Karton`} 
            icon={<TrendingUp className="w-5 h-5" />} 
            bgClass="bg-[#22C55E]"
          />
          <StatCard 
            title="Status QC Sesuai" 
            value="100%" 
            icon={<ClipboardCheck className="w-5 h-5" />} 
            bgClass="bg-[#A855F7]"
          />
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden mt-2">
          <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center">
            <div>
              <h3 className="font-bold text-[#1E293B]">Stok Masuk - Menunggu Approval</h3>
              <p className="text-xs text-[#64748B] mt-1">Validasi kualitas dan kuantitas barang dari supplier</p>
            </div>
            <Link to="/approval-stok" className="bg-[#4F46E5] text-white text-xs font-semibold py-2 px-4 rounded-lg hover:bg-[#4338CA] transition-colors">
              Buka Halaman Approval
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-4 px-6 border-b border-[#E2E8F0]">NO RCV</th>
                  <th className="py-4 px-6 border-b border-[#E2E8F0]">NO SURAT JALAN</th>
                  <th className="py-4 px-6 border-b border-[#E2E8F0]">SUPPLIER</th>
                  <th className="py-4 px-6 border-b border-[#E2E8F0]">TANGGAL</th>
                  <th className="py-4 px-6 border-b border-[#E2E8F0]">TOTAL ITEM</th>
                  <th className="py-4 px-6 border-b border-[#E2E8F0]">TOTAL QTY</th>
                  <th className="py-4 px-6 border-b border-[#E2E8F0] text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {pendingApprovals.length > 0 ? (
                  pendingApprovals.map((item) => (
                    <tr key={item.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-4 px-6 font-bold text-[#1E293B]">{item.id}</td>
                      <td className="py-4 px-6 text-[#64748B] font-medium">{item.sj}</td>
                      <td className="py-4 px-6 text-[#475569]">{item.supplier}</td>
                      <td className="py-4 px-6 text-[#64748B]">{item.date}</td>
                      <td className="py-4 px-6 text-[#1E293B]">{item.items} Produk</td>
                      <td className="py-4 px-6 font-bold text-[#1E293B]">{item.totalQty} Karton</td>
                      <td className="py-4 px-6 text-center">
                        <Link 
                          to="/approval-stok"
                          className="text-xs font-bold text-[#4F46E5] hover:text-[#4338CA] bg-[#EEF2FF] px-3 py-1.5 rounded-lg border border-[#C7D2FE] transition-colors"
                        >
                          Tinjau & Setujui
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-[#64748B] font-medium">
                      Tidak ada penerimaan stok yang menunggu approval.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Real-time Stock Section */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden mt-2">
          <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center">
            <h3 className="font-bold text-[#1E293B]">Stok Real-time (Karton & Liter)</h3>
            <Link to="/riwayat-stok" className="text-sm text-[#4F46E5] font-semibold hover:underline">
              Riwayat Lengkap
            </Link>
          </div>
          <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            {products.map((p) => {
              const statusClass = p.stokKarton < 70 
                ? 'bg-[#FEE2E2] text-[#EF4444]' 
                : p.stokKarton < 100 
                  ? 'bg-[#FEF3C7] text-[#D97706]' 
                  : 'bg-[#DCFCE7] text-[#16A34A]';
              const statusLabel = p.stokKarton < 70 
                ? 'Kritis' 
                : p.stokKarton < 100 
                  ? 'Sedikit' 
                  : 'Baik';

              return (
                <div key={p.id} className="flex items-center justify-between p-4 border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors rounded-xl">
                  <div>
                    <h4 className="font-bold text-sm text-[#1E293B]">{p.name}</h4>
                    <p className="text-xs text-[#64748B] mt-0.5">{p.brand} &bull; {p.sae} &bull; {p.kemasan}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="font-black text-sm text-[#1E293B]">{p.stokKarton} Karton <span className="text-xs text-[#64748B] font-normal">({p.stokLiter} L)</span></p>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
