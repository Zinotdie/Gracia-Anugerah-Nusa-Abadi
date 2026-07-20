import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import StatCard from '../components/StatCard';
import { Truck, CheckCircle2, Package, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { purchaseService } from '../services/purchaseService';

export default function DashboardStaffGudang() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [shippedCount, setShippedCount] = useState(0);
  const [incomingStockCount, setIncomingStockCount] = useState(0);
  const [suratJalanCount, setSuratJalanCount] = useState(0);

  useEffect(() => {
    orderService.getAll()
      .then(res => {
        const data = Array.isArray(res) ? res : (res?.data || res?.orders || []);
        const mapped = data.map(so => ({
          id: so.id,
          customer: so.pelanggan?.nama || so.pelanggan?.name || so.customer || '-',
          sales: so.user?.nama || so.user?.name || so.sales || 'Sales System',
          status: so.status || 'Draft',
          qty: Number(so.qty) || (so.dataDetail ? so.dataDetail.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0) : 0),
          date: so.tgl_penjualan || (so.created_at ? new Date(so.created_at).toLocaleDateString('id-ID') : '-'),
        }));
        setPendingOrders(mapped.filter(o => o.status === 'Approved'));
        setShippedCount(mapped.filter(o => o.status === 'Shipped' || o.status === 'Delivered').length);
        setSuratJalanCount(mapped.filter(o => o.status === 'Shipped' || o.status === 'Delivered' || o.status === 'Invoiced').length);
      })
      .catch(err => {
        console.error("Gagal load orders dari API di staff gudang:", err);
        setPendingOrders([]);
        setShippedCount(0);
        setSuratJalanCount(0);
      });

    purchaseService.getAll()
      .then(res => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        setIncomingStockCount(data.length);
      })
      .catch(err => {
        console.error("Gagal load incoming stock di staff gudang:", err);
        setIncomingStockCount(0);
      });
  }, []);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        
        {/* Title Section */}
        <div>
          <h2 className="text-xl font-bold text-[#1E293B]">Dashboard Staff Gudang</h2>
          <p className="text-xs text-[#64748B] mt-1">Pencatatan fisik dan pengiriman barang</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Pending Pengiriman" 
            value={String(pendingOrders.length)} 
            icon={<Truck className="w-5 h-5" />} 
            bgColor="bg-orange-50"
            textColor="text-orange-600"
          />
          <StatCard 
            title="Dikirim (Terkirim)" 
            value={String(shippedCount)} 
            icon={<CheckCircle2 className="w-5 h-5" />} 
            bgColor="bg-emerald-50"
            textColor="text-emerald-600"
          />
          <StatCard 
            title="Penerimaan Stok Masuk" 
            value={String(incomingStockCount)} 
            icon={<Package className="w-5 h-5" />} 
            bgColor="bg-blue-50"
            textColor="text-blue-600"
          />
          <StatCard 
            title="Total Surat Jalan" 
            value={String(suratJalanCount)} 
            icon={<ClipboardList className="w-5 h-5" />} 
            bgColor="bg-purple-50"
            textColor="text-purple-600"
          />
        </div>

        {/* Large Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <Link to="/pengiriman-barang" className="bg-[#F97316] text-white p-6 rounded-2xl shadow-sm hover:bg-[#EA580C] transition-colors block flex flex-col justify-center min-h-[120px]">
             <Truck className="w-6 h-6 mb-3 opacity-90" />
             <h3 className="font-bold text-lg mb-1">Proses Pengiriman</h3>
             <p className="text-sm opacity-90">Input Surat Jalan & Packing List</p>
          </Link>
          <Link to="/input-stok-masuk" className="bg-[#4F46E5] text-white p-6 rounded-2xl shadow-sm hover:bg-[#4338CA] transition-colors block flex flex-col justify-center min-h-[120px]">
             <Package className="w-6 h-6 mb-3 opacity-90" />
             <h3 className="font-bold text-lg mb-1">Input Stok Masuk</h3>
             <p className="text-sm opacity-90">Catat barang dari supplier</p>
          </Link>
        </div>

        {/* Pending Deliveries Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden mt-2">
          <div className="p-5 border-b border-[#E2E8F0]">
            <h3 className="font-bold text-[#1E293B]">Pemenuhan Pesanan - Pengiriman Tertunda</h3>
            <p className="text-xs text-[#64748B] mt-1">Daftar pesanan yang menunggu untuk dikirim</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#334155]">
              <thead className="bg-[#F8FAFC] text-xs font-bold text-[#64748B] uppercase border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-4">No. SO</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Pelanggan</th>
                  <th className="p-4">Sales</th>
                  <th className="p-4 text-center">Jumlah (Dus)</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {pendingOrders.length > 0 ? (
                  pendingOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#F8FAFC]">
                      <td className="p-4 font-bold text-[#1E293B]">SO-{String(order.id).padStart(4, '0')}</td>
                      <td className="p-4 text-xs">{order.date}</td>
                      <td className="p-4 font-semibold">{order.customer}</td>
                      <td className="p-4 text-xs text-[#64748B]">{order.sales}</td>
                      <td className="p-4 text-center font-bold">{order.qty} Dus</td>
                      <td className="p-4 text-center">
                        <Link 
                          to="/pengiriman-barang" 
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4F46E5] text-white rounded-lg text-xs font-semibold hover:bg-[#4338CA] transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5" /> Cetak SJ
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-[#64748B] text-xs">
                      Tidak ada pesanan pending yang siap dikirim saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
