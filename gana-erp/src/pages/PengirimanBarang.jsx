import DashboardLayout from '../layouts/DashboardLayout';
import { Truck, PackageOpen, CheckCircle2, MapPin, Search, X, Printer, Plus } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import ConfirmDialog from '../components/ConfirmDialog';

export default function PengirimanBarang() {
  const [deliveries, setDeliveries] = useState({ diproses: [], dikirim: [], terkirim: [] });
  const location = useLocation();

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');

  // Product master and printing states
  const [products, setProducts] = useState([]);
  const [activePrintOrder, setActivePrintOrder] = useState(null);
  const [role, setRole] = useState('');

  const loadDeliveries = () => {
    orderService.getAll()
      .then(res => {
        const data = Array.isArray(res) ? res : (res?.data || res?.orders || []);
        const mapped = data.map(so => ({
          id: so.id,
          date: so.date || so.tgl_invoice || so.tgl_penjualan || (so.created_at ? new Date(so.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'),
          customer: so.pelanggan?.nama || so.pelanggan?.name || so.customer || '-',
          address: so.pelanggan?.alamat || so.address || '-',
          sales: so.user?.nama || so.user?.name || so.sales || 'Sales System',
          total: Number(so.total_netto) || Number(so.total) || 0,
          status: so.status || 'Draft',
          qty: Number(so.qty) || (so.dataDetail ? so.dataDetail.reduce((acc, curr) => acc + (Number(curr.qty) || 0), 0) : 0),
          paymentMethod: so.metode_bayar || so.paymentMethod || 'Transfer',
          items: so.dataDetail || so.items || [],
          driver: so.driver || '',
          time: so.time || '',
          updated_at: so.updated_at || so.created_at || ''
        })).filter(o => Number(o.qty) > 0);
        setDeliveries({
          diproses: mapped.filter(o => o.status === 'Approved'),
          dikirim: mapped.filter(o => o.status === 'Shipped'),
          terkirim: mapped.filter(o => {
            if (o.status !== 'Delivered' && o.status !== 'Invoiced') return false;
            if (!o.updated_at) return true;
            const deliveryTime = new Date(o.updated_at).getTime();
            const now = Date.now();
            return (now - deliveryTime) < 24 * 60 * 60 * 1000;
          })
        });
      })
      .catch(err => {
        console.error("Gagal load deliveries dari API:", err);
        setDeliveries({
          diproses: [],
          dikirim: [],
          terkirim: []
        });
      });
  };

  useEffect(() => {
    setRole(localStorage.getItem('userRole') || '');
    loadDeliveries();
    
    productService.getAll()
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || res?.products || res?.produk || []);
        setProducts(list);
      })
      .catch(err => console.error("Gagal load produk untuk surat jalan:", err));
    
    // Auto-open modal if specified in query params
    const queryParams = new URLSearchParams(location.search);
    const openModalOrderId = queryParams.get('openModal');
    if (openModalOrderId) {
      setTimeout(() => {
        handleOpenModal(openModalOrderId);
      }, 100);
    }
  }, [location.search]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPageDikirim, setCurrentPageDikirim] = useState(1);
  const itemsPerPageDikirim = 6;
  const [currentPageDiproses, setCurrentPageDiproses] = useState(1);
  const itemsPerPageDiproses = 6;

  const filterBySearch = (arr) => arr.filter(item => 
    String(item.id).toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDiproses = useMemo(() => {
    return filterBySearch(deliveries.diproses);
  }, [deliveries.diproses, searchTerm]);

  const filteredDikirim = useMemo(() => {
    return filterBySearch(deliveries.dikirim);
  }, [deliveries.dikirim, searchTerm]);

  useEffect(() => {
    setCurrentPageDikirim(1);
    setCurrentPageDiproses(1);
  }, [searchTerm]);

  const paginatedDiproses = useMemo(() => {
    const startIndex = (currentPageDiproses - 1) * itemsPerPageDiproses;
    return filteredDiproses.slice(startIndex, startIndex + itemsPerPageDiproses);
  }, [filteredDiproses, currentPageDiproses]);

  const totalPagesDiproses = Math.ceil(filteredDiproses.length / itemsPerPageDiproses);

  const paginatedDikirim = useMemo(() => {
    const startIndex = (currentPageDikirim - 1) * itemsPerPageDikirim;
    return filteredDikirim.slice(startIndex, startIndex + itemsPerPageDikirim);
  }, [filteredDikirim, currentPageDikirim]);

  const totalPagesDikirim = Math.ceil(filteredDikirim.length / itemsPerPageDikirim);

  const showAlert = (type, title, message) => {
    setAlert({ isOpen: true, type, title, message });
  };

  const closeAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  const handleOpenModal = (orderId = '') => {
    setSelectedOrderId(orderId);
    setDriverName('');
    setPlateNumber('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrderId('');
    setDriverName('');
    setPlateNumber('');
  };

  const handleCreateSuratJalan = (e) => {
    e.preventDefault();

    if (!selectedOrderId) {
      showAlert('error', 'Gagal', 'Silakan pilih pesanan terlebih dahulu.');
      return;
    }

    if (!driverName.trim()) {
      showAlert('error', 'Gagal', 'Silakan masukkan nama driver.');
      return;
    }

    if (!plateNumber.trim()) {
      showAlert('error', 'Gagal', 'Silakan masukkan plat nomor kendaraan.');
      return;
    }

    const fullDriverInfo = `${driverName.trim()} (${plateNumber.trim().toUpperCase()})`;
    
    // Determine if mock ID or real DB ID
    const isMockId = isNaN(Number(selectedOrderId));
    const apiUpdate = isMockId
      ? Promise.reject("Mock ID")
      : orderService.update(selectedOrderId, { status: 'Shipped', driver: fullDriverInfo });

    apiUpdate
      .then(() => {
        loadDeliveries();
        showAlert(
          'success',
          'Surat Jalan Dibuat!',
          `Surat Jalan untuk Pesanan ${selectedOrderId} berhasil dibuat. Armada pengiriman dialokasikan ke ${fullDriverInfo}.`
        );
        handleCloseModal();
      })
      .catch((err) => {
        console.error("Gagal membuat surat jalan di server:", err);
        showAlert('error', 'Gagal', 'Gagal memproses Surat Jalan di server backend.');
      });
  };

  const promptSelesaikan = (id) => {
    setConfirmDialog({
      isOpen: true,
      type: 'warning',
      title: 'Konfirmasi Penyelesaian Pengiriman',
      message: `Apakah Anda yakin ingin menyelesaikan pengiriman barang untuk pesanan ${id}?`,
      confirmText: 'Ya, Selesaikan',
      cancelText: 'Batalkan',
      showCancel: true,
      onConfirm: () => {
        handleSelesaikanPengiriman(id);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSelesaikanPengiriman = (id) => {
    const item = deliveries.dikirim.find(d => String(d.id) === String(id));
    if (!item) return;
    
    const d = new Date();
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WITA';

    const isMockId = isNaN(Number(id));
    const apiUpdate = isMockId
      ? Promise.reject("Mock ID")
      : orderService.update(id, { status: 'Delivered', time: timeStr });

    apiUpdate
      .then(() => {
        loadDeliveries();
        showAlert(
          'success',
          'Pengiriman Selesai!',
          `Pesanan ${id} telah berhasil diterima oleh pelanggan pada pukul ${timeStr}.`
        );
      })
      .catch((err) => {
        console.error("Gagal menyelesaikan pengiriman di server:", err);
        showAlert('error', 'Gagal', 'Gagal menyelesaikan pengiriman di server backend.');
      });
  };

  // Get details of selected order for preview in modal
  const selectedOrderPreview = useMemo(() => {
    if (!selectedOrderId) return null;
    return deliveries.diproses.find(o => o.id === selectedOrderId);
  }, [selectedOrderId, deliveries.diproses]);

  const handlePrint = (order) => {
    const invoiceNo = order.id || '10233';
    
    // Format tanggal
    const formatPrintDate = (dateStr) => {
      if (!dateStr || dateStr === '-') {
        const d = new Date();
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      }
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      } catch (e) {
        return dateStr;
      }
    };

    const itemsContent = (order.items || []).map((item, idx) => {
      const prod = products.find(p => String(p.id || p.id_produk) === String(item.produk_id || item.id));
      const brand = prod?.brand || '';
      const name = prod ? (prod.name || prod.nama) : (item.name || item.nama || `Produk ID: ${item.produk_id}`);
      const sae = prod?.sae || '';
      const kemasan = prod?.kemasan || '';
      const qty_beli = item.qty || item.qty_beli || 0;
      const qty_dus = item.qty_dus || Math.ceil(qty_beli / 12);
      
      const desc = brand ? `${brand} - ${name} (${sae}, ${kemasan})` : name;
      
      return `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td>${desc}</td>
          <td class="text-center">LITER</td>
          <td class="text-center">${qty_dus} Dus</td>
        </tr>
      `;
    }).join('');

    const printContent = `
      <html>
        <head>
          <title>Surat Jalan - NO. ${invoiceNo}</title>
          <style>
            @page { size: A5 landscape; margin: 5mm; }
            html, body { 
              height: 100%;
              margin: 0; 
              padding: 0;
              font-family: 'Courier New', Courier, monospace; 
              color: #000; 
              font-size: 10px; 
              line-height: 1.3; 
              overflow: hidden;
              box-sizing: border-box;
            }
            .container {
              width: 100%;
              max-width: 800px;
              height: 96vh;
              max-height: 132mm;
              margin: 0 auto;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header-block {
              width: 100%;
            }
            .header-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 3px;
            }
            .header-table td { 
              vertical-align: top; 
              padding: 1px;
            }
            .title-text { 
              font-size: 18px; 
              font-weight: bold; 
              letter-spacing: 2px;
              margin-bottom: 2px;
            }
            .company-name { 
              font-weight: bold; 
              font-size: 11px;
              text-decoration: underline;
              margin-bottom: 3px;
            }
            .client-title {
              font-weight: bold;
              font-size: 10px;
            }
            .delivery-info {
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 4px 0;
              margin-top: 4px;
              margin-bottom: 6px;
              font-size: 10px;
            }
            .table-block {
              flex-grow: 1;
              width: 100%;
              overflow: hidden;
            }
            .product-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 5px; 
              margin-bottom: 10px;
            }
            .product-table th, .product-table td { 
              border-top: 1px solid #000; 
              border-bottom: 1px solid #000; 
              padding: 4px 6px; 
              font-size: 10px;
              text-align: left;
            }
            .product-table th { 
              font-weight: bold; 
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .footer-sig-container {
              display: flex;
              justify-content: space-between;
              margin-top: 12px;
              font-size: 10px;
              width: 100%;
            }
            .logo-gana-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-top: 2px;
            }
            .logo-gana {
              font-size: 14px;
              font-weight: 900;
              color: #0E3B8C;
              letter-spacing: 1px;
              display: flex;
              align-items: center;
              gap: 2px;
            }
            .logo-gana span {
              color: #92C63F;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header-block">
              <table class="header-table">
                <tr>
                  <td style="width: 45%;">
                    <div style="display: flex; items-center; gap: 8px; align-items: center; margin-bottom: 4px;">
                      <img src="/logo-gana.jpg" style="height: 26px; object-fit: contain;" alt="Logo GANA" />
                      <div class="title-text" style="margin-top: 0;">SURAT JALAN</div>
                    </div>
                    <div class="company-name">PT GRACIA ANANTA NUSANTARA ABADI</div>
                  </td>
                  <td style="width: 28%; padding-top: 5px;">
                    <table style="width: 100%; font-size: 10px;">
                      <tr>
                        <td style="width: 90px; font-weight: bold;">NO.</td>
                        <td>: ${invoiceNo}</td>
                      </tr>
                      <tr>
                        <td>Tanggal</td>
                        <td>: ${formatPrintDate(order.date)}</td>
                      </tr>
                    </table>
                  </td>
                  <td style="width: 27%; padding-left: 10px;">
                    <div class="client-title">KEPADA YTH.</div>
                    <div style="font-weight: bold;">${order.customer}</div>
                    <div style="font-size: 9px; line-height: 1.2;">${order.address || '-'}</div>
                  </td>
                </tr>
              </table>

              <div class="delivery-info">
                Kami kirimkan barang-barang tersebut dibawah ini dengan kendaraan ______________________ No. __________________
              </div>
            </div>

            <div class="table-block">
              <table class="product-table">
                <thead>
                  <tr>
                    <th style="width: 10%;" class="text-center">No</th>
                    <th style="width: 50%;">Nama Barang</th>
                    <th style="width: 20%;" class="text-center">Kemasan</th>
                    <th style="width: 20%;" class="text-center">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsContent || '<tr><td colspan="4" class="text-center">Tidak ada detail produk.</td></tr>'}
                </tbody>
              </table>
            </div>

            <div class="footer-sig-container">
              <div>
                Tanda Terima / Penerima,<br/><br/><br/>
                (.......................................)
              </div>
              
              <div style="text-align: center; width: 180px;">
                Sopir / Pengirim,<br/><br/><br/>
                (.......................................)
              </div>

              <div style="text-align: center; width: 180px;">
                Kepala Gudang,<br/><br/><br/>
                (.......................................)
              </div>
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
      <div className="flex flex-col gap-6 font-sans relative">
        
        {/* Custom Alert Modal */}
        {alert.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
              <div className={`p-6 text-center ${alert.type === 'success' ? 'bg-[#F0FDF4]' : 'bg-[#FEE2E2]'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${alert.type === 'success' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FECACA] text-[#DC2626]'}`}>
                  {alert.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-bold text-[#1E293B] mb-2">{alert.title}</h3>
                <p className="text-sm text-[#475569]">{alert.message}</p>
              </div>
              <div className="p-4 bg-white border-t border-[#E2E8F0]">
                <button 
                  onClick={closeAlert}
                  className={`w-full py-2.5 rounded-xl font-bold text-white transition-colors shadow-sm ${alert.type === 'success' ? 'bg-[#16A34A] hover:bg-[#15803D]' : 'bg-[#DC2626] hover:bg-[#B91C1C]'}`}
                >
                  OK, Mengerti
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Pengiriman Barang</h2>
            <p className="text-sm text-[#64748B] mt-1">Pantau Surat Jalan (DO) dan status pengiriman armada</p>
          </div>
          {role !== 'staff_gudang' && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold text-sm transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Buat Surat Jalan
            </button>
          )}
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
              placeholder="Cari No DO, nama pelanggan..." 
              className="w-full pl-10 pr-4 py-2 border-none rounded-lg text-sm focus:outline-none focus:ring-0 text-[#334155] placeholder:text-[#94A3B8] bg-transparent"
            />
          </div>
        </div>

        {/* Section: Sedang Diproses */}
        <div className="flex flex-col gap-4 bg-[#F8FAFC] border border-[#E2E8F0] p-5 rounded-2xl shadow-sm mb-6">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div className="flex items-center gap-2">
              <PackageOpen className="w-5 h-5 text-[#64748B]" />
              <h3 className="font-bold text-[#1E293B] text-base">Sedang Diproses</h3>
              <span className="bg-[#E2E8F0] text-[#475569] text-xs font-bold px-2 py-1 rounded-full">{deliveries.diproses.length}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {paginatedDiproses.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#94A3B8]"></div>
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-1 rounded">{item.id}</span>
                    <span className="text-[11px] font-bold text-[#64748B]">{item.qty} Dus</span>
                  </div>
                  <h4 className="font-bold text-[#1E293B] mb-2">{item.customer}</h4>
                  <div className="flex items-start gap-1.5 text-[#64748B]">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <p className="text-xs leading-relaxed">{item.address}</p>
                  </div>
                </div>
                {role !== 'staff_gudang' && (
                  <button 
                    onClick={() => handleOpenModal(item.id)}
                    className="mt-4 w-full py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Proses Pengiriman
                  </button>
                )}
              </div>
            ))}
            {filteredDiproses.length === 0 && (
              <div className="col-span-3 text-center py-8">
                <p className="text-xs text-[#94A3B8]">Tidak ada pengiriman dalam proses.</p>
              </div>
            )}
          </div>

          {totalPagesDiproses > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#E2E8F0]">
              <span className="text-xs text-[#475569] font-semibold">
                Menampilkan {paginatedDiproses.length} dari {filteredDiproses.length} barang sedang diproses
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPageDiproses(prev => Math.max(prev - 1, 1))}
                  disabled={currentPageDiproses === 1}
                  className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#475569] text-xs font-bold rounded-lg hover:bg-[#F1F5F9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Sebelumnya
                </button>
                <span className="px-3 py-1.5 text-xs font-bold text-[#475569]">
                  {currentPageDiproses} / {totalPagesDiproses}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPageDiproses(prev => Math.min(prev + 1, totalPagesDiproses))}
                  disabled={currentPageDiproses === totalPagesDiproses}
                  className="px-3 py-1.5 bg-white border border-[#E2E8F0] text-[#475569] text-xs font-bold rounded-lg hover:bg-[#F1F5F9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section: Status Pengiriman (Bottom Board) */}
        <div className="flex flex-col gap-6 pb-8">
          
          {/* Section: Sedang Dikirim */}
          <div className="flex flex-col gap-4 bg-[#EEF2FF] border border-[#C7D2FE] p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-[#C7D2FE] pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="font-bold text-[#1E40AF] text-base">Sedang Dikirim</h3>
                <span className="bg-[#C7D2FE] text-[#1E40AF] text-xs font-bold px-2 py-1 rounded-full">{deliveries.dikirim.length}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {paginatedDikirim.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-xl shadow-md border border-[#C7D2FE] relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#4F46E5]"></div>
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold text-[#4F46E5] bg-[#EEF2FF] px-2 py-1 rounded">{item.id}</span>
                      <span className="text-[11px] font-bold text-[#64748B]">{item.qty} Dus</span>
                    </div>
                    <h4 className="font-bold text-[#1E293B] mb-2">{item.customer}</h4>
                    <div className="flex items-start gap-1.5 text-[#64748B] mb-3">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <p className="text-xs leading-relaxed">{item.address}</p>
                    </div>
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 bg-[#E2E8F0] rounded-full flex items-center justify-center shrink-0">🚚</div>
                      <p className="text-xs font-semibold text-[#334155] truncate">{item.driver}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {role !== 'kepala_gudang' && (
                      <button 
                        onClick={() => promptSelesaikan(item.id)}
                        className="flex-1 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Selesaikan
                      </button>
                    )}
                    <button 
                      onClick={() => handlePrint(item)}
                      className="px-3 py-2 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] hover:text-[#1E293B] rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs font-bold"
                      title="Cetak Surat Jalan"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak SJ
                    </button>
                  </div>
                </div>
              ))}
              {filteredDikirim.length === 0 && (
                <div className="col-span-3 text-center py-8">
                  <p className="text-xs text-[#94A3B8]">Tidak ada armada pengiriman aktif.</p>
                </div>
              )}
            </div>

            {totalPagesDikirim > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#C7D2FE]">
                <span className="text-xs text-[#1E40AF] font-semibold">
                  Menampilkan {paginatedDikirim.length} dari {filteredDikirim.length} barang sedang dikirim
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPageDikirim(prev => Math.max(prev - 1, 1))}
                    disabled={currentPageDikirim === 1}
                    className="px-3 py-1.5 bg-white border border-[#C7D2FE] text-[#1E40AF] text-xs font-bold rounded-lg hover:bg-[#EEF2FF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sebelumnya
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-[#1E40AF]">
                    {currentPageDikirim} / {totalPagesDikirim}
                  </span>
                  <button
                    onClick={() => setCurrentPageDikirim(prev => Math.min(prev + 1, totalPagesDikirim))}
                    disabled={currentPageDikirim === totalPagesDikirim}
                    className="px-3 py-1.5 bg-white border border-[#C7D2FE] text-[#1E40AF] text-xs font-bold rounded-lg hover:bg-[#EEF2FF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section: Terkirim */}
          <div className="flex flex-col gap-4 bg-[#F0FDF4] border border-[#BBF7D0] p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between border-b border-[#BBF7D0] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                <h3 className="font-bold text-[#166534] text-base">Terkirim Hari Ini</h3>
                <span className="bg-[#BBF7D0] text-[#166534] text-xs font-bold px-2 py-1 rounded-full">{deliveries.terkirim.length}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {filterBySearch(deliveries.terkirim).map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-xl shadow-sm border border-[#E2E8F0] relative overflow-hidden opacity-75 hover:opacity-100 transition-opacity flex flex-col justify-between">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#16A34A]"></div>
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-bold text-[#16A34A] bg-[#DCFCE7] px-2 py-1 rounded">{item.id}</span>
                      <span className="text-[11px] font-bold text-[#64748B]">{item.time}</span>
                    </div>
                    <h4 className="font-bold text-[#1E293B] mb-2 line-through decoration-[#94A3B8]">{item.customer}</h4>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#E2E8F0]">
                    <span className="text-xs text-[#64748B] font-semibold">{item.qty} Dus</span>
                    <button 
                      onClick={() => handlePrint(item)}
                      className="px-2.5 py-1.5 border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] hover:text-[#1E293B] rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold font-sans"
                    >
                      <Printer className="w-3 h-3" /> Cetak SJ
                    </button>
                  </div>
                </div>
              ))}
              {filterBySearch(deliveries.terkirim).length === 0 && (
                <div className="col-span-3 text-center py-8">
                  <p className="text-xs text-[#94A3B8]">Belum ada pengiriman diselesaikan hari ini.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Buat Surat Jalan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#4F46E5]" />
                <h2 className="text-lg font-bold text-[#1E293B]">
                  Buat Surat Jalan (Delivery Order)
                </h2>
              </div>
              <button onClick={handleCloseModal} className="text-[#94A3B8] hover:text-[#334155] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSuratJalan} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl">
                <span className="text-xs text-[#64748B] font-bold uppercase tracking-wider">Pesanan Yang Dipilih</span>
                <span className="text-base font-black text-[#1E293B]">
                  #INV-{String(selectedOrderId).padStart(4, '0')} - {selectedOrderPreview?.customer} ({selectedOrderPreview?.qty} Dus)
                </span>
              </div>

              {/* Order Preview inside Modal */}
              {selectedOrderPreview && (
                <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#64748B]">Pelanggan:</span>
                    <span className="font-bold text-[#1E293B]">{selectedOrderPreview.customer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#64748B]">Alamat Pengiriman:</span>
                    <span className="font-bold text-[#1E293B] max-w-[250px] text-right truncate">{selectedOrderPreview.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-[#64748B]">Total Kuantitas:</span>
                    <span className="font-bold text-[#4F46E5]">{selectedOrderPreview.qty} Dus</span>
                  </div>
                </div>
              )}



              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Nama Driver</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Pak Supri"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]" 
                    value={driverName} 
                    onChange={e => setDriverName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#334155]">Plat Nomor</label>
                  <input 
                    type="text" 
                    placeholder="e.g. DA 1234 XX"
                    className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:ring-1 focus:ring-[#4F46E5]" 
                    value={plateNumber} 
                    onChange={e => setPlateNumber(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#E2E8F0]">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="px-5 py-2.5 text-sm font-semibold text-[#475569] hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-[#4F46E5] hover:bg-[#4338CA] rounded-lg transition-colors flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  Simpan & Kirim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        type={confirmDialog.type || 'warning'}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText || 'Selesaikan'}
        cancelText={confirmDialog.cancelText || 'Batal'}
        showCancel={true}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

    </DashboardLayout>
  );
}
