import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import * as XLSX from 'xlsx';
import { Search, FileText, CheckCircle2, Clock, XCircle, Download, Eye, Check, X, Printer } from 'lucide-react';
import { orderService } from '../services/orderService';

export default function DaftarPenjualan() {
  const [salesOrders, setSalesOrders] = useState([]);

  const loadOrders = () => {
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
          tgl_jatuh_tempo: so.tgl_jatuh_tempo || null,
          items: so.dataDetail || so.items || []
        }));
        setSalesOrders(mapped);
      })
      .catch(err => {
        console.error("Gagal load orders dari API:", err);
        setSalesOrders([]);
      });
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [selectedMonth, setSelectedMonth] = useState('Semua Bulan');
  const [selectedYear, setSelectedYear] = useState('Semua Tahun');

  const filteredOrders = useMemo(() => {
    const userRole = localStorage.getItem('userRole');
    const userFullName = localStorage.getItem('userFullName') || '';
    return salesOrders.filter(so => {
      const matchSearch = String(so.id).toLowerCase().includes(searchTerm.toLowerCase()) || 
                          so.customer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'Semua Status' || so.status === statusFilter;
      const matchSales = userRole !== 'sales' || so.sales.toLowerCase() === userFullName.toLowerCase();

      let matchMonth = true;
      let matchYear = true;

      if (so.rawDate || so.created_at || so.date) {
        const d = new Date(so.rawDate || so.created_at || so.date);
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

      return matchSearch && matchStatus && matchSales && matchMonth && matchYear;
    });
  }, [salesOrders, searchTerm, statusFilter, selectedMonth, selectedYear]);

  const handlePrintInvoice = (order) => {
    // Convert nominal to Indonesian words (terbilang)
    const terbilang = (nilai) => {
      const bilangan = ["", "SATU", "DUA", "TIGA", "EMPAT", "LIMA", "ENAM", "TUJUH", "DELAPAN", "SEMBILAN", "SEPULUH", "SEBELAS"];
      let temp = "";
      if (nilai < 12) {
        temp = " " + bilangan[Math.floor(nilai)];
      } else if (nilai < 20) {
        temp = terbilang(nilai - 10) + " BELAS";
      } else if (nilai < 100) {
        temp = terbilang(nilai / 10) + " PULUH" + terbilang(nilai % 10);
      } else if (nilai < 200) {
        temp = " SERATUS" + terbilang(nilai - 100);
      } else if (nilai < 1000) {
        temp = terbilang(nilai / 100) + " RATUS" + terbilang(nilai % 100);
      } else if (nilai < 2000) {
        temp = " SERIBU" + terbilang(nilai - 1000);
      } else if (nilai < 1000000) {
        temp = terbilang(nilai / 1000) + " RIBU" + terbilang(nilai % 1000);
      } else if (nilai < 1000000000) {
        temp = terbilang(nilai / 1000000) + " JUTA" + terbilang(nilai % 1000000);
      } else if (nilai < 1000000000000) {
        temp = terbilang(nilai / 1000000000) + " MILYAR" + terbilang(nilai % 1000000000);
      }
      return temp.trim();
    };

    const nominalWords = `${terbilang(order.total)} RUPIAH`;
    const invoiceNo = order.id || '10012';
    
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

    const printContent = `
      <html>
        <head>
          <title>Faktur Penjualan - NO. ${invoiceNo}</title>
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
            .faktur-container {
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
              text-align: center; 
              letter-spacing: 4px;
              margin-bottom: 4px;
              text-decoration: underline;
            }
            .company-name { 
              font-weight: bold; 
              font-size: 11px;
            }
            .client-title {
              font-weight: bold;
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
              margin-top: 3px; 
              margin-bottom: 3px;
            }
            .product-table th, .product-table td { 
              border-top: 1px solid #000; 
              border-bottom: 1px solid #000; 
              padding: 3px 5px; 
              font-size: 10px;
            }
            .product-table th { 
              font-weight: bold; 
              text-align: left;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            
            .summary-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 2px;
            }
            .summary-table {
              width: 230px;
              border-collapse: collapse;
            }
            .summary-table td {
              padding: 1px 4px;
              font-size: 10px;
            }
            
            .footer-block {
              width: 100%;
            }
            .footer-container {
              display: grid;
              grid-template-cols: 1.8fr 2.2fr 1fr;
              gap: 12px;
              margin-top: 4px;
              align-items: start;
            }
            .border-outline {
              border: 1px solid #000;
              padding: 5px;
              font-size: 9px;
              min-height: 40px;
              box-sizing: border-box;
            }
            .footer-sig-block {
              text-align: center;
              font-size: 10px;
            }
            .logo-gana-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-top: 1px;
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
          <div class="faktur-container">
            <div class="header-block">
              <div class="title-text">FAKTUR</div>
              <table class="header-table">
                <tr>
                  <td style="width: 45%;">
                    <div class="company-name">PT GRACIA ANANTA NUSANTARA ABADI</div>
                    <div>Telp: 05115918284</div>
                    <div>Fax:</div>
                  </td>
                  <td style="width: 28%;">
                    <table style="width: 100%; font-size: 10px;">
                      <tr>
                        <td style="width: 90px; font-weight: bold;">NO.</td>
                        <td>: ${invoiceNo}</td>
                      </tr>
                      <tr>
                        <td>Ref. Pelanggan</td>
                        <td>: -</td>
                      </tr>
                      <tr>
                        <td>Tgl. Faktur</td>
                        <td>: ${formatPrintDate(order.date)}</td>
                      </tr>
                      <tr>
                        <td>Jatuh Tempo</td>
                        <td>: ${order.tgl_jatuh_tempo ? formatPrintDate(order.tgl_jatuh_tempo) : '-'}</td>
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
            </div>

            <div class="table-block">
              <table class="product-table">
                <thead>
                  <tr>
                    <th style="width: 42%;">Nama Barang</th>
                    <th style="width: 10%;"></th>
                    <th style="width: 11%;" class="text-center">Kemasan</th>
                    <th style="width: 7%;" class="text-right">Qty</th>
                    <th style="width: 15%;" class="text-right">Harga Satuan</th>
                    <th style="width: 15%;" class="text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  ${(order.items || []).map(item => {
                    const qty_beli = item.qty || item.qty_beli || 0;
                    const qty_dus = item.qty_dus || Math.ceil(qty_beli / 12);
                    const subtotal = item.subtotal || 0;
                    const harga_satuan = qty_beli > 0 ? Math.round(subtotal / qty_beli) : 0;
                    
                    return `
                      <tr>
                        <td>${item.name || item.nama}</td>
                        <td style="white-space: nowrap;">${qty_dus} Dus</td>
                        <td class="text-center">LITER</td>
                        <td class="text-right">${qty_beli}</td>
                        <td class="text-right">${harga_satuan.toLocaleString('id-ID')},00</td>
                        <td class="text-right">${subtotal.toLocaleString('id-ID')},00</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>

              <div class="summary-container">
                <table class="summary-table">
                  <tr>
                    <td>Total</td>
                    <td style="width: 10px;" class="text-center">:</td>
                    <td class="text-right">${order.total?.toLocaleString('id-ID')},00</td>
                  </tr>
                  <tr>
                    <td>Disc.</td>
                    <td class="text-center">:</td>
                    <td class="text-right">00,00</td>
                  </tr>
                  <tr style="font-weight: bold; border-top: 1px solid #000;">
                    <td>Netto</td>
                    <td class="text-center">:</td>
                    <td class="text-right">${order.total?.toLocaleString('id-ID')},00</td>
                  </tr>
                </table>
              </div>
            </div>

            <div class="footer-block">
              <div class="footer-container">
                <div class="border-outline">
                  <span style="font-weight: bold; text-decoration: underline;">TERBILANG</span><br/>
                  <span style="font-weight: bold; font-style: italic; font-size: 8px; line-height: 1.1;">*** ${nominalWords} ***</span>
                </div>
                
                <div class="border-outline">
                  <span style="font-weight: bold; text-decoration: underline;">PERHATIAN</span><br/>
                  <span>Rek. 7357353530</span><br/>
                  <span>BNI PT. GRACIA ANANTA NUSANTARA ABADI</span>
                </div>

                <div class="footer-sig-block">
                  <div>Hormat kami,</div>
                  <div class="logo-gana-wrapper">
                    <img src="/logo-gana.jpg" style="height: 28px; object-fit: contain; margin-bottom: 4px;" alt="Logo PT GANA" />
                    <div style="font-size: 9px; margin-top: 10px; font-weight: bold; text-decoration: underline;">
                      ${order.sales || 'Ruben Aldo'}
                    </div>
                  </div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px;">
                <div>
                  Penerima,<br/><br/><br/>
                  ( Tanda Tangan / Cap )
                </div>
                <div style="color: #64748B; font-size: 8px; align-self: flex-end; padding-bottom: 2px;">
                  Dicetak secara otomatis melalui ERP PT. GANA
                </div>
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

  const handlePrintFakturPajak = (order) => {
    const nsfp = `010.000-26.${String(order.id).padStart(8, '0')}`;
    const dpp = Math.round(order.total / 1.11);
    const ppn = order.total - dpp;
    
    // Format tanggal
    const formatPrintDate = (dateStr) => {
      if (!dateStr || dateStr === '-') return new Date().toLocaleDateString('id-ID');
      return dateStr;
    };

    const printContent = `
      <html>
        <head>
          <title>Faktur Pajak - ${nsfp}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              color: #000; 
              font-size: 11px; 
              line-height: 1.4; 
              margin: 0; 
              padding: 0;
            }
            .faktur-pajak-container {
              width: 100%;
              border: 2px solid #000;
              padding: 15px;
              box-sizing: border-box;
            }
            .title { 
              font-size: 18px; 
              font-weight: bold; 
              text-align: center; 
              letter-spacing: 2px;
              margin-bottom: 20px;
              text-decoration: underline;
            }
            .info-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 10px;
            }
            .info-table td { 
              vertical-align: top; 
              padding: 4px 0; 
            }
            .section-header { 
              font-weight: bold; 
              border-top: 2px solid #000; 
              border-bottom: 2px solid #000; 
              padding: 5px 0; 
              margin-top: 10px;
              font-size: 12px;
              text-transform: uppercase;
            }
            .grid-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px; 
              margin-bottom: 15px;
            }
            .grid-table th, .grid-table td { 
              border: 1px solid #000; 
              padding: 6px; 
              font-size: 11px;
            }
            .grid-table th { 
              text-align: center; 
              font-weight: bold; 
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-bold { font-weight: bold; }
            
            .footer-section {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
            }
            .footer-note {
              width: 55%;
              font-size: 9px;
              font-style: italic;
              color: #475569;
              line-height: 1.3;
            }
            .signature-block {
              text-align: center;
              width: 40%;
            }
          </style>
        </head>
        <body>
          <div class="faktur-pajak-container">
            <div class="title">FAKTUR PAJAK</div>
            
            <table class="info-table">
              <tr>
                <td style="width: 250px; font-weight: bold;">Kode & Nomor Seri Faktur Pajak:</td>
                <td style="font-weight: bold;">${nsfp}</td>
              </tr>
            </table>

            <div class="section-header">Pengusaha Kena Pajak (Penjual)</div>
            <table class="info-table" style="margin-top: 5px;">
              <tr>
                <td style="width: 120px;">Nama:</td>
                <td style="font-weight: bold;">PT. GRACIA ANUGERAH NUSA ABADI</td>
              </tr>
              <tr>
                <td>Alamat:</td>
                <td>KOMPLEK ANTERO KELAPA GADING RAYA NO. 144 RT. 001 RW. 001, BANJARBARU, KALIMANTAN SELATAN</td>
              </tr>
              <tr>
                <td>NPWP:</td>
                <td style="font-weight: bold;">43.719.949.0-732.000</td>
              </tr>
            </table>

            <div class="section-header">Penerima Barang Kena Pajak / Jasa Kena Pajak (Pembeli)</div>
            <table class="info-table" style="margin-top: 5px;">
              <tr>
                <td style="width: 120px;">Nama:</td>
                <td style="font-weight: bold;">${order.customer}</td>
              </tr>
              <tr>
                <td>Alamat:</td>
                <td></td>
              </tr>
              <tr>
                <td>NPWP:</td>
                <td style="font-weight: bold;"></td>
              </tr>
            </table>

            <div class="section-header">Daftar Barang Kena Pajak / Jasa Kena Pajak Yang Diserahkan</div>
            <table class="grid-table">
              <thead>
                <tr>
                  <th style="width: 5%;">No.</th>
                  <th style="width: 50%;">Nama Barang Kena Pajak / Jasa Kena Pajak</th>
                  <th style="width: 15%;" class="text-right">Harga Satuan (Rp)</th>
                  <th style="width: 15%;" class="text-center">Jumlah Barang</th>
                  <th style="width: 15%;" class="text-right">Harga Jual (Rp)</th>
                </tr>
              </thead>
              <tbody>
                ${(order.items || []).map((item, index) => {
                  const subtotal = Number(item.subtotal) || 0;
                  const qty = Number(item.qty) || 0;
                  const itemTotalDPP = Math.round(subtotal / 1.11);
                  const itemHargaSatuanDPP = qty > 0 ? Math.round(itemTotalDPP / qty) : 0;
                  return `
                    <tr>
                      <td class="text-center">${index + 1}</td>
                      <td>${item.brand || ''} - ${item.name || item.nama}</td>
                      <td class="text-right">${itemHargaSatuanDPP.toLocaleString('id-ID')},00</td>
                      <td class="text-center">${qty} Karton</td>
                      <td class="text-right">${itemTotalDPP.toLocaleString('id-ID')},00</td>
                    </tr>
                  `;
                }).join('')}
                
                <tr class="font-bold">
                  <td colspan="4" class="text-right">Harga Jual (DPP / Dasar Pengenaan Pajak)</td>
                  <td class="text-right">${dpp.toLocaleString('id-ID')},00</td>
                </tr>
                <tr class="font-bold">
                  <td colspan="4" class="text-right">PPN Dipungut (11%)</td>
                  <td class="text-right">${ppn.toLocaleString('id-ID')},00</td>
                </tr>
                <tr class="font-bold" style="background-color: #F8FAFC;">
                  <td colspan="4" class="text-right">Total Nilai Transaksi (HET Pajak)</td>
                  <td class="text-right">${order.total.toLocaleString('id-ID')},00</td>
                </tr>
              </tbody>
            </table>

            <div class="footer-section">
              <div class="footer-note">
                * Faktur Pajak ini merupakan bukti pungutan PPN resmi sesuai dengan undang-undang perpajakan Republik Indonesia yang berlaku.<br/>
                * Cetakan komputer sah tanpa tanda tangan fisik apabila dilaporkan melalui sistem e-Faktur DJP.
              </div>
              
              <div class="signature-block">
                <div>Banjarmasin, ${formatPrintDate(order.date)}</div>
                <div style="font-weight: bold; margin-top: 5px;">PT. GRACIA ANUGERAH NUSA ABADI</div>
                <br/><br/><br/><br/>
                <div style="font-weight: bold; text-decoration: underline;">( &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; )</div>
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

  const handlePrintSuratJalan = (order) => {
    const invoiceNo = order.id || '10012';
    
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
              font-size: 12px;
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
              font-size: 15px;
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
                    <div class="title-text">SURAT JALAN</div>
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
                    <th style="width: 10%;" class="text-right">Qty</th>
                    <th style="width: 15%;">Kemasan</th>
                    <th style="width: 15%;"></th>
                    <th style="width: 60%;">Nama Barang</th>
                  </tr>
                </thead>
                <tbody>
                  ${(order.items || []).map(item => {
                    const qty_beli = item.qty || item.qty_beli || 0;
                    const qty_dus = item.qty_dus || Math.ceil(qty_beli / 12);
                    
                    return `
                      <tr>
                        <td class="text-right" style="padding-right: 15px;">${qty_beli}</td>
                        <td>LITER</td>
                        <td>${qty_dus} Dus</td>
                        <td>${item.name || item.nama}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <div class="footer-sig-container">
              <div>
                Penerima,<br/>
                Tanda Tangan / Cap<br/><br/><br/>
                (.......................................)
              </div>
              
              <div style="text-align: center; width: 250px;">
                Hormat kami,<br/>
                <div class="logo-gana-wrapper">
                  <img src="/logo-gana.jpg" style="height: 28px; object-fit: contain; margin-top: 6px; margin-bottom: 4px;" alt="Logo PT GANA" />
                  <br/>
                  <div>(.......................................)</div>
                </div>
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

  const [approveModal, setApproveModal] = useState({ isOpen: false, orderId: null });
  const [cancelModal, setCancelModal] = useState({ isOpen: false, orderId: null });
  const [detailModal, setDetailModal] = useState({ isOpen: false, order: null });

  const confirmApproveOrder = (id) => {
    setApproveModal({ isOpen: true, orderId: id });
  };

  const confirmCancelOrder = (id) => {
    setCancelModal({ isOpen: true, orderId: id });
  };

  const handleApprove = () => {
    if (approveModal.orderId) {
      orderService.update(approveModal.orderId, { status: 'Approved' })
        .then(() => {
          loadOrders();
          setApproveModal({ isOpen: false, orderId: null });
        })
        .catch((err) => {
          console.error("Gagal menyetujui pesanan:", err);
          alert(err.response?.data?.message || "Gagal menyetujui pesanan di database.");
          setApproveModal({ isOpen: false, orderId: null });
        });
    }
  };

  const handleCancel = (targetId) => {
    const idToCancel = targetId || cancelModal.orderId;
    if (idToCancel) {
      orderService.update(idToCancel, { status: 'Batal' })
        .then(() => {
          loadOrders();
          setCancelModal({ isOpen: false, orderId: null });
          setApproveModal({ isOpen: false, orderId: null });
        })
        .catch((err) => {
          console.error("Gagal membatalkan pesanan:", err);
          alert(err.response?.data?.message || "Gagal membatalkan pesanan di database.");
          setCancelModal({ isOpen: false, orderId: null });
        });
    }
  };

  const showDetail = (order) => {
    setDetailModal({ isOpen: true, order });
  };

  const handleExportExcel = () => {
    if (filteredOrders.length === 0) return alert("Tidak ada data untuk dieksport");
    
    // Header title rows
    const dataRows = [
      ["LAPORAN DATA PENJUALAN - PT GRACIA ANANTA NUSANTARA ABADI"],
      [`Periode Ekspor: ${new Date().toLocaleDateString('id-ID')}`],
      [], // empty row for spacing
      ["NO SO", "TANGGAL", "PELANGGAN", "SALES", "TOTAL (Rp)", "STATUS"] // table headers
    ];

    let totalAll = 0;
    filteredOrders.forEach(row => {
      dataRows.push([
        `INV-${String(row.id).padStart(4, '0')}`,
        row.date,
        row.customer,
        row.sales,
        row.total,
        row.status === 'Approved' ? 'Disetujui' : row.status === 'Draft' ? 'Draft' : row.status
      ]);
      totalAll += row.total;
    });

    // Summary row
    dataRows.push([]);
    dataRows.push(["", "", "", "TOTAL PENJUALAN", totalAll, ""]);

    const worksheet = XLSX.utils.aoa_to_sheet(dataRows);
    
    // Auto-adjust column widths
    const max_cols = dataRows[3].length;
    const colWidths = [];
    for (let c = 0; c < max_cols; c++) {
      let max_len = 10;
      dataRows.forEach(row => {
        if (row[c]) {
          const len = String(row[c]).length;
          if (len > max_len) max_len = len;
        }
      });
      colWidths.push({ wch: max_len + 3 });
    }
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");

    XLSX.writeFile(workbook, `Laporan_Penjualan_${new Date().getTime()}.xlsx`);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Draft': return <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#F1F5F9] text-[#64748B] flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> Draft</span>;
      case 'Approved': return <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Disetujui</span>;
      case 'Shipped': return <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#E0E7FF] text-[#4F46E5] flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Dikirim</span>;
      case 'Delivered':
      case 'Invoiced': return <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#16A34A] flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Terkirim</span>;
      case 'Cancelled': return <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#DC2626] flex items-center gap-1 w-max"><XCircle className="w-3 h-3" /> Dibatalkan</span>;
      default: return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B]">Daftar Penjualan</h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1">Kelola seluruh transaksi Sales Order (SO)</p>
          </div>
          <button 
            onClick={handleExportExcel}
            className="bg-[#16A34A] border border-[#16A34A] text-white hover:bg-[#15803D] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Download className="w-4 h-4" /> Ekspor Excel
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-[#E2E8F0]">
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#94A3B8]" />
            </div>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari No SO atau Nama Bengkel..." 
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
              <option value="Draft">Draft</option>
              <option value="Approved">Disetujui</option>
              <option value="Shipped">Dikirim</option>
              <option value="Delivered">Terkirim</option>
              <option value="Cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0]">
                  <th className="py-4 px-6">NO SO</th>
                  <th className="py-4 px-6">TANGGAL</th>
                  <th className="py-4 px-6">PELANGGAN</th>
                  <th className="py-4 px-6">SALES</th>
                  <th className="py-4 px-6">TOTAL</th>
                  <th className="py-4 px-6">STATUS</th>
                  <th className="py-4 px-6 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredOrders.length > 0 ? filteredOrders.map((so, idx) => (
                  <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#94A3B8]" />
                        <span className="font-bold text-[#4F46E5]">{so.id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#475569]">{so.date}</td>
                    <td className="py-4 px-6 font-bold text-[#1E293B]">{so.customer}</td>
                    <td className="py-4 px-6 text-[#64748B]">{so.sales}</td>
                    <td className="py-4 px-6 font-bold text-[#1E293B]">Rp {so.total.toLocaleString('id-ID')}</td>
                    <td className="py-4 px-6">
                      {getStatusBadge(so.status)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center gap-2">
                        {so.status === 'Draft' && (localStorage.getItem('userRole') === 'admin' || localStorage.getItem('userRole') === 'owner') && (
                          <>
                            <button 
                              onClick={() => confirmApproveOrder(so.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16A34A] text-white hover:bg-[#15803D] transition-colors text-xs font-semibold"
                            >
                              <Check className="w-3.5 h-3.5" /> Setujui
                            </button>
                            <button 
                              onClick={() => confirmCancelOrder(so.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EF4444] text-white hover:bg-[#DC2626] transition-colors text-xs font-semibold"
                              title="Batalkan Pesanan"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Batalkan
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => showDetail(so)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] transition-colors text-xs font-semibold"
                        >
                          <Eye className="w-4 h-4" /> Detail
                        </button>
                        {so.status !== 'Draft' && so.status !== 'Cancelled' && so.status !== 'Dibatalkan' && (
                          <>
                            <button 
                              onClick={() => handlePrintInvoice(so)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF2FF] text-[#4F46E5] hover:bg-[#E0E7FF] transition-colors text-xs font-semibold"
                              title="Cetak Invoice Tagihan"
                            >
                              <Printer className="w-4 h-4" /> Invoice
                            </button>
                            <button 
                              onClick={() => handlePrintFakturPajak(so)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF7ED] text-[#EA580C] hover:bg-[#FFEDD5] transition-colors text-xs font-semibold"
                              title="Cetak Faktur Pajak PPN"
                            >
                              <Printer className="w-4 h-4" /> Faktur Pajak
                            </button>
                            {localStorage.getItem('userRole') !== 'sales' && (
                              <button 
                                onClick={() => handlePrintSuratJalan(so)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5] transition-colors text-xs font-semibold"
                                title="Cetak Surat Jalan Pengiriman"
                              >
                                <Printer className="w-4 h-4" /> Surat Jalan
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-[#64748B]">Tidak ada data penjualan yang sesuai.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Approve Modal */}
      {approveModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#EEF2FF] rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#4F46E5]" />
            </div>
            <h3 className="text-lg font-bold text-[#1E293B] mb-2">Konfirmasi Pesanan</h3>
            <p className="text-sm text-[#64748B] mb-6">
              Pilih tindakan konfirmasi untuk Sales Order #{approveModal.orderId}:
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={handleApprove} className="w-full py-2.5 bg-[#16A34A] text-white hover:bg-[#15803D] font-semibold rounded-xl transition-colors shadow-sm text-sm flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Ya, Setujui & Potong Stok
              </button>
              <button onClick={() => { handleCancel(approveModal.orderId); }} className="w-full py-2.5 bg-[#EF4444] text-white hover:bg-[#DC2626] font-semibold rounded-xl transition-colors shadow-sm text-sm flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" /> Batalkan / Tolak Pesanan
              </button>
              <button onClick={() => setApproveModal({ isOpen: false, orderId: null })} className="w-full py-2 bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] font-semibold rounded-xl transition-colors text-xs mt-1">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#FEE2E2] rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-[#EF4444]" />
            </div>
            <h3 className="text-lg font-bold text-[#1E293B] mb-2">Batalkan Pesanan?</h3>
            <p className="text-sm text-[#64748B] mb-6">
              Apakah Anda yakin ingin membatalkan Sales Order #{cancelModal.orderId}? Status pesanan akan diubah menjadi Dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelModal({ isOpen: false, orderId: null })} className="flex-1 py-2.5 bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] font-semibold rounded-xl transition-colors text-sm font-semibold">
                Tutup
              </button>
              <button onClick={() => handleCancel(cancelModal.orderId)} className="flex-1 py-2.5 bg-[#EF4444] text-white hover:bg-[#DC2626] font-semibold rounded-xl transition-colors shadow-sm text-sm font-semibold">
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.isOpen && detailModal.order && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <h3 className="font-bold text-[#1E293B]">Detail Pesanan</h3>
              <button onClick={() => setDetailModal({ isOpen: false, order: null })} className="text-[#64748B] hover:text-[#1E293B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-[#64748B] font-bold mb-1">NO. SALES ORDER</p>
                  <p className="text-sm font-bold text-[#4F46E5]">{detailModal.order.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#64748B] font-bold mb-1">TANGGAL</p>
                  <p className="text-sm font-bold text-[#1E293B]">{detailModal.order.date}</p>
                </div>
              </div>
              <div className="border-t border-dashed border-[#E2E8F0]"></div>
              <div>
                <p className="text-xs text-[#64748B] font-bold mb-1">PELANGGAN</p>
                <p className="text-sm font-bold text-[#1E293B]">{detailModal.order.customer}</p>
                <p className="text-xs text-[#475569] mt-0.5">{detailModal.order.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#64748B] font-bold mb-1">SALES</p>
                  <p className="text-sm font-medium text-[#1E293B]">{detailModal.order.sales}</p>
                </div>
                <div>
                  <p className="text-xs text-[#64748B] font-bold mb-1">METODE PEMBAYARAN</p>
                  <p className="text-sm font-medium text-[#1E293B] capitalize">{detailModal.order.paymentMethod === 'tempo' || detailModal.order.paymentMethod === 'Tempo' ? 'Tempo' : 'Transfer'}</p>
                </div>
              </div>
              {(detailModal.order.bukti_bayar || detailModal.order.bukti_transfer) && (
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl flex flex-col gap-2">
                  <span className="text-xs text-[#1E293B] font-bold">Bukti Transfer Pembayaran:</span>
                  <img 
                    src={detailModal.order.bukti_bayar || detailModal.order.bukti_transfer} 
                    alt="Bukti Transfer" 
                    onClick={() => window.open(detailModal.order.bukti_bayar || detailModal.order.bukti_transfer, '_blank')}
                    className="max-h-48 w-full object-contain rounded-lg border border-[#CBD5E1] bg-white cursor-pointer hover:opacity-90 transition-opacity" 
                  />
                  <span 
                    onClick={() => window.open(detailModal.order.bukti_bayar || detailModal.order.bukti_transfer, '_blank')}
                    className="text-[11px] text-[#4F46E5] font-bold cursor-pointer hover:underline text-center"
                  >
                    Klik untuk membuka gambar penuh ↗
                  </span>
                </div>
              )}
              <div className="border-t border-dashed border-[#E2E8F0]"></div>
              <div className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                <span className="text-sm font-bold text-[#64748B]">Total Belanja ({detailModal.order.qty || 0} Item)</span>
                <span className="text-lg font-bold text-[#16A34A]">Rp {detailModal.order.total?.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <div className="p-5 border-t border-[#E2E8F0] flex justify-end gap-2 bg-[#F8FAFC]">
              {detailModal.order.status !== 'Draft' && detailModal.order.status !== 'Cancelled' && detailModal.order.status !== 'Dibatalkan' && (
                <>
                  <button 
                    onClick={() => handlePrintInvoice(detailModal.order)}
                    className="px-4 py-2 bg-[#4F46E5] text-white hover:bg-[#4338CA] font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1.5 text-xs md:text-sm"
                  >
                    <Printer className="w-4 h-4" /> Cetak Invoice
                  </button>
                  <button 
                    onClick={() => handlePrintFakturPajak(detailModal.order)}
                    className="px-4 py-2 bg-[#EA580C] text-white hover:bg-[#C2410C] font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1.5 text-xs md:text-sm"
                  >
                    <Printer className="w-4 h-4" /> Cetak Faktur Pajak
                  </button>
                  {localStorage.getItem('userRole') !== 'sales' && (
                    <button 
                      onClick={() => handlePrintSuratJalan(detailModal.order)}
                      className="px-4 py-2 bg-[#059669] text-white hover:bg-[#047857] font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1.5 text-xs md:text-sm"
                    >
                      <Printer className="w-4 h-4" /> Cetak Surat Jalan
                    </button>
                  )}
                </>
              )}
              <button onClick={() => setDetailModal({ isOpen: false, order: null })} className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] font-semibold rounded-xl transition-colors text-xs md:text-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
