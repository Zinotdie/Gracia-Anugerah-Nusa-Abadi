import { useState, useEffect, useRef } from 'react';
import { Bell, Clock, AlertTriangle, Package, ShoppingCart, Users, CheckCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function NotificationCenter({ role }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissedNotifIds');
      return saved ? JSON.parse(saved) : [];
    } catch(e) {
      return [];
    }
  });

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const loadNotifications = () => {
    const userRole = (role || localStorage.getItem('userRole') || 'admin').toLowerCase();
    const items = [];

    Promise.all([
      api.get('/api/penjualan/all-pembayaran').catch(() => ({ data: { data: [] } })),
      api.get('/api/penjualan').catch(() => ({ data: { data: [] } })),
      api.get('/api/pelanggan').catch(() => ({ data: { data: [] } })),
      api.get('/api/pembelian').catch(() => ({ data: { data: [] } })),
      api.get('/api/produk').catch(() => ({ data: { data: [] } })),
      api.get('/api/owner/monitoring-piutang').catch(() => ({ data: { invoices: [] } }))
    ]).then(([pembayaranRes, penjualanRes, customerRes, pembelianRes, produkRes, ownerPiutangRes]) => {
      const allPembayaran = pembayaranRes.data?.data || [];
      const allPenjualan = Array.isArray(penjualanRes.data) ? penjualanRes.data : (penjualanRes.data?.data || []);
      const allCustomers = Array.isArray(customerRes.data) ? customerRes.data : (customerRes.data?.data || customerRes.data?.customers || []);
      const allPembelian = Array.isArray(pembelianRes.data) ? pembelianRes.data : (pembelianRes.data?.data || []);
      const allProduk = Array.isArray(produkRes.data) ? produkRes.data : (produkRes.data?.data || []);
      const piutangInvoices = ownerPiutangRes.data?.invoices || ownerPiutangRes.data?.list || ownerPiutangRes.data?.data || [];

      // -----------------------------------------------------------------
      // INSTALLMENT PAYMENT NOTIFICATIONS (All Roles)
      // -----------------------------------------------------------------
      if (Array.isArray(allPembayaran) && allPembayaran.length > 0) {
        allPembayaran.forEach((p, pIdx) => {
          const custName = p.nama_bengkel || p.bengkel || p.customer || 'Bengkel';
          const nominal = Number(p.jumlah_bayar || 0);
          const formattedNominal = nominal > 0 ? `Rp ${nominal.toLocaleString('id-ID')}` : '';

          if (p.status_pembayaran === 'Pending') {
            items.push({
              id: `pay-pending-${p.id_pembayaran || pIdx}`,
              title: `💳 Cicilan Piutang Baru: ${custName}`,
              message: `Pengajuan cicilan ${formattedNominal} (${custName}) menunggu verifikasi Admin.`,
              icon: <Clock className="w-4 h-4 text-amber-500" />,
              bgColor: 'bg-amber-50',
              path: '/monitoring-piutang',
              time: 'Pending'
            });
          } else if (p.status_pembayaran === 'Disetujui' || p.status_pembayaran === 'Approved') {
            items.push({
              id: `pay-approved-${p.id_pembayaran || pIdx}`,
              title: `✅ Cicilan Disetujui: ${custName}`,
              message: `Pembayaran cicilan ${formattedNominal} untuk ${custName} telah disetujui.`,
              icon: <CheckCheck className="w-4 h-4 text-emerald-500" />,
              bgColor: 'bg-emerald-50',
              path: '/monitoring-piutang',
              time: 'Disetujui'
            });
          }
        });
      }

      // -----------------------------------------------------------------
      // PIUTANG WARNINGS (Bell Notifications for Sales, Owner, Admin)
      // -----------------------------------------------------------------
      if (Array.isArray(piutangInvoices) && piutangInvoices.length > 0) {
        piutangInvoices.forEach((item, idx) => {
          const custName = item.customer || item.nama_bengkel || 'Bengkel';
          const totalNetto = Number(item.total_netto || item.amount || 0);
          const totalDibayar = Number(item.total_dibayar || item.paidAmount || 0);
          const remaining = Math.max(0, totalNetto - totalDibayar);

          if (remaining > 0) {
            const isOverdue = item.overdueDays > 0 || item.status === 'overdue';
            const badgeText = isOverdue ? `Telat ${item.overdueDays || item.days || 1} Hari` : 'Jatuh Tempo';
            items.push({
              id: `piutang-bell-${item.id_penjualan || item.id || idx}`,
              title: `⚠️ Tagihan Tempo: ${custName}`,
              message: `Faktur INV-${String(item.id_penjualan || item.id || idx).padStart(4, '0')} (${custName}) sisa tagihan Rp ${remaining.toLocaleString('id-ID')} (${badgeText}).`,
              icon: <AlertTriangle className="w-4 h-4 text-[#D97706]" />,
              bgColor: isOverdue ? 'bg-rose-50' : 'bg-amber-50',
              path: '/monitoring-piutang',
              time: badgeText
            });
          }
        });
      }

      // -----------------------------------------------------------------
      // 1. ADMIN NOTIFICATIONS
      // -----------------------------------------------------------------
      if (userRole === 'admin') {
        const pendingPayments = allPembayaran.filter(p => p.status_pembayaran === 'Pending');
        if (pendingPayments.length > 0) {
          items.push({
            id: 'admin-pay-1',
            title: '⚡ PERLU KONFIRMASI: Pembayaran Masuk',
            message: `Terdapat ${pendingPayments.length} pengajuan pembayaran tempo/transfer yang menunggu persetujuan Admin.`,
            icon: <Clock className="w-4 h-4 text-amber-500" />,
            bgColor: 'bg-amber-50',
            path: '/riwayat-pembayaran',
            time: 'Perlu Konfirmasi'
          });
        }

        const inactiveCustomers = allCustomers.filter(c => c.is_active === 0 || c.status === 'Inactive');
        if (inactiveCustomers.length > 0) {
          items.push({
            id: 'admin-cust-1',
            title: 'Verifikasi Bengkel Baru',
            message: `Terdapat ${inactiveCustomers.length} pengajuan bengkel baru dari Sales yang belum diverifikasi.`,
            icon: <Users className="w-4 h-4 text-indigo-500" />,
            bgColor: 'bg-indigo-50',
            path: '/data-pelanggan',
            time: 'Perlu Tindakan'
          });
        }

        const approvedOrders = allPenjualan.filter(o => o.status === 'Approved');
        if (approvedOrders.length > 0) {
          items.push({
            id: 'admin-ord-1',
            title: 'Pesanan Baru Disetujui',
            message: `${approvedOrders.length} pesanan penjualan baru telah disetujui dan siap diterbitkan Surat Jalan.`,
            icon: <ShoppingCart className="w-4 h-4 text-emerald-500" />,
            bgColor: 'bg-emerald-50',
            path: '/daftar-penjualan',
            time: 'Informasi'
          });
        }

        const lowStockCount = allProduk.filter(p => (parseInt(p.stokKarton || p.stok_total_karton) || 0) <= 30).length;
        if (lowStockCount > 0) {
          items.push({
            id: 'admin-lowstok-1',
            title: 'Peringatan Stok Menipis (<= 30 Dus)',
            message: `Terdapat ${lowStockCount} varian oli dengan sisa stok <= 30 dus di gudang fisik.`,
            icon: <Package className="w-4 h-4 text-rose-500" />,
            bgColor: 'bg-rose-50',
            path: '/data-produk',
            time: 'Restok'
          });
        }
      }

      setNotifications(items);
    });
  };

  useEffect(() => {
    loadNotifications();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const activeNotifications = notifications.filter(n => !dismissedIds.includes(n.id));

  const handleNotificationClick = (item) => {
    setDismissedIds(prev => {
      const updated = [...prev, item.id];
      try {
        localStorage.setItem('dismissedNotifIds', JSON.stringify(updated));
      } catch(e) {}
      return updated;
    });

    setIsOpen(false);
    if (item.path) {
      navigate(item.path);
    }
  };

  const handleMarkAllRead = () => {
    const allIds = notifications.map(n => n.id);
    setDismissedIds(prev => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem('dismissedNotifIds', JSON.stringify(updated));
      } catch(e) {}
      return updated;
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
        title="Pusat Notifikasi System"
      >
        <Bell className="w-5 h-5" />
        {activeNotifications.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {activeNotifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Notifikasi System</h3>
              <p className="text-[11px] text-slate-500 font-medium">Peringatan tempo piutang & operasional</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200/60">
                {activeNotifications.length} Baru
              </span>
              {activeNotifications.length > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  title="Tandai Semua Dibaca"
                  className="p-1 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors text-xs flex items-center gap-1 font-bold"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {activeNotifications.length > 0 ? (
              activeNotifications.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 items-start group relative"
                >
                  <div className={`p-2.5 rounded-2xl shrink-0 ${item.bgColor}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0 ml-2">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{item.message}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationClick(item);
                    }}
                    title="Hapus Notifikasi"
                    className="absolute right-3 top-4 text-slate-300 hover:text-rose-500 transition-colors p-1 opacity-60 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                Semua notifikasi telah dibaca / tidak ada notifikasi baru.
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center px-4">
            {activeNotifications.length > 0 ? (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                Tandai Semua Dibaca
              </button>
            ) : <div />}
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              Tutup Notifikasi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
