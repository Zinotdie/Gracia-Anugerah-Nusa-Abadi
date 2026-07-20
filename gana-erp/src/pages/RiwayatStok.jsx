import DashboardLayout from '../layouts/DashboardLayout';
import { Search, ArrowDownRight, ArrowUpRight, Download, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { stockService } from '../services/stockService';

export default function RiwayatStok() {
  const [stockHistory, setStockHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Semua Tipe');
  
  // Sorting states
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');

  const loadStockHistory = () => {
    stockService.getAll()
      .then(res => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        setStockHistory(data);
      })
      .catch(err => {
        console.error("Gagal memuat riwayat stok dari API:", err);
        setStockHistory([]);
      });
  };

  useEffect(() => {
    loadStockHistory();
  }, []);

  const isNewItem = (dateString, rawDate) => {
    let time;
    if (rawDate) {
      time = new Date(rawDate).getTime();
    } else {
      try {
        const monthsId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let normalized = dateString.replace('WITA', '').trim();
        monthsId.forEach((m, idx) => {
          normalized = normalized.replace(m, monthsEn[idx]);
        });
        normalized = normalized.replace(/\./g, ':');
        time = Date.parse(normalized);
      } catch (e) {
        return false;
      }
    }
    if (!time || isNaN(time)) return false;
    const oneDayMs = 24 * 60 * 60 * 1000;
    const diff = Date.now() - time;
    return diff < oneDayMs && diff >= 0;
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-[#94A3B8]" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-3.5 h-3.5 text-[#4F46E5]" />
      : <ChevronDown className="w-3.5 h-3.5 text-[#4F46E5]" />;
  };

  const [selectedMonth, setSelectedMonth] = useState('Semua Bulan');
  const [selectedYear, setSelectedYear] = useState('Semua Tahun');

  const filteredHistory = useMemo(() => {
    return stockHistory.filter(item => {
      // Type Filter
      if (typeFilter === 'Barang Masuk (IN)' && item.type !== 'in') return false;
      if (typeFilter === 'Barang Keluar (OUT)' && item.type !== 'out') return false;

      // Search Filter
      const searchLower = searchTerm.toLowerCase();
      const matchProduct = item.product.toLowerCase().includes(searchLower);
      const matchRef = item.ref.toLowerCase().includes(searchLower);

      // Period Month & Year filter
      let matchMonth = true;
      let matchYear = true;

      const dateVal = item.rawDate || item.created_at || item.date;
      if (dateVal) {
        const d = new Date(dateVal);
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

      return (matchProduct || matchRef) && matchMonth && matchYear;
    });
  }, [stockHistory, searchTerm, typeFilter, selectedMonth, selectedYear]);

  const sortedHistory = useMemo(() => {
    const sorted = [...filteredHistory];
    sorted.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'date') {
        const parseDate = (str) => {
          if (!str) return 0;
          // Normalize Indonesian month names to English
          const monthsId = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
          const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          let normalized = str.replace('WITA', '').trim();
          monthsId.forEach((m, idx) => {
            normalized = normalized.replace(m, monthsEn[idx]);
          });
          normalized = normalized.replace(/\./g, ':');
          return Date.parse(normalized) || 0;
        };
        aVal = parseDate(aVal);
        bVal = parseDate(bVal);
      } else if (sortField === 'qty' || sortField === 'balance') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredHistory, sortField, sortDirection]);

  const handleExportExcel = () => {
    if (sortedHistory.length === 0) return alert("Tidak ada data untuk dieksport");

    const worksheetData = sortedHistory.map(row => ({
      "TANGGAL & WAKTU": row.date,
      "PRODUK": row.product,
      "REFERENSI": row.ref,
      "TIPE": row.type === 'in' ? 'MASUK' : 'KELUAR',
      "QTY (KARTON)": row.type === 'in' ? row.qty : -row.qty,
      "STOK": row.balance
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Stok");

    XLSX.writeFile(workbook, `Riwayat_Stok_${new Date().getTime()}.xlsx`);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-2xl font-bold text-[#1E293B]">Riwayat Stok (Kartu Stok)</h2>
            <p className="text-sm text-[#64748B] mt-1">Pantau mutasi barang masuk dan keluar secara realtime</p>
          </div>
          <button 
            onClick={handleExportExcel}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 border-none"
          >
            <Download className="w-4 h-4" /> Ekspor Excel
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0]">
          <div className="relative flex-1 min-w-[250px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#94A3B8]" />
            </div>
            <input 
              type="text" 
              placeholder="Cari Produk atau No Referensi..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-none rounded-lg text-sm focus:outline-none focus:ring-0 text-[#334155] placeholder:text-[#94A3B8] bg-transparent"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Month Filter */}
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-bold text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white h-9"
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

            {/* Year Filter */}
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-bold text-[#334155] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] bg-white h-9"
            >
              <option value="Semua Tahun">Semua Tahun</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>

            {/* Type Filtering Tab Segmented Control */}
            <div className="flex bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0] h-9">
              <button 
                onClick={() => setTypeFilter('Semua Tipe')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${typeFilter === 'Semua Tipe' ? 'bg-white text-[#4F46E5] shadow-sm' : 'text-[#64748B] hover:text-[#334155]'}`}
              >
                Semua
              </button>
              <button 
                onClick={() => setTypeFilter('Barang Masuk (IN)')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${typeFilter === 'Barang Masuk (IN)' ? 'bg-white text-[#16A34A] shadow-sm' : 'text-[#64748B] hover:text-[#334155]'}`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" /> Masuk
              </button>
              <button 
                onClick={() => setTypeFilter('Barang Keluar (OUT)')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${typeFilter === 'Barang Keluar (OUT)' ? 'bg-white text-[#DC2626] shadow-sm' : 'text-[#64748B] hover:text-[#334155]'}`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Keluar
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-[#F8FAFC] text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E2E8F0] select-none">
                  <th onClick={() => handleSort('date')} className="py-4 px-6 cursor-pointer hover:bg-gray-100/70 transition-colors">
                    <div className="flex items-center gap-1.5">TANGGAL & WAKTU {renderSortIcon('date')}</div>
                  </th>
                  <th onClick={() => handleSort('product')} className="py-4 px-6 cursor-pointer hover:bg-gray-100/70 transition-colors">
                    <div className="flex items-center gap-1.5">PRODUK {renderSortIcon('product')}</div>
                  </th>
                  <th onClick={() => handleSort('ref')} className="py-4 px-6 cursor-pointer hover:bg-gray-100/70 transition-colors">
                    <div className="flex items-center gap-1.5">REFERENSI {renderSortIcon('ref')}</div>
                  </th>
                  <th onClick={() => handleSort('type')} className="py-4 px-6 cursor-pointer hover:bg-gray-100/70 transition-colors text-center">
                    <div className="flex items-center justify-center gap-1.5">TIPE {renderSortIcon('type')}</div>
                  </th>
                  <th onClick={() => handleSort('qty')} className="py-4 px-6 cursor-pointer hover:bg-gray-100/70 transition-colors text-right">
                    <div className="flex items-center justify-end gap-1.5">QTY (KARTON) {renderSortIcon('qty')}</div>
                  </th>
                  <th onClick={() => handleSort('balance')} className="py-4 px-6 cursor-pointer hover:bg-gray-100/70 transition-colors text-right">
                    <div className="flex items-center justify-end gap-1.5">STOK {renderSortIcon('balance')}</div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {sortedHistory.map((item, idx) => (
                  <tr key={idx} className="border-b border-[#E2E8F0] hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-[#475569] font-medium">{item.date}</td>
                    <td className="py-4 px-6 font-bold text-[#1E293B]">
                      <div className="flex items-center gap-2">
                        <span>{item.product}</span>
                        {isNewItem(item.date, item.rawDate) && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-[#EF4444] text-white animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#64748B] text-xs">{item.ref}</td>
                    <td className="py-4 px-6 text-center">
                      {item.type === 'in' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#DCFCE7] text-[#16A34A] text-[10px] font-bold">
                          <ArrowDownRight className="w-3 h-3" /> MASUK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#FEE2E2] text-[#DC2626] text-[10px] font-bold">
                          <ArrowUpRight className="w-3 h-3" /> KELUAR
                        </span>
                      )}
                    </td>
                    <td className={`py-4 px-6 text-right font-black ${item.type === 'in' ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                      {item.type === 'in' ? '+' : '-'}{item.qty}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-[#1E293B]">
                      {item.balance}
                    </td>
                  </tr>
                ))}
                {sortedHistory.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-xs text-[#94A3B8]">
                      Tidak ada riwayat mutasi stok ditemukan.
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
