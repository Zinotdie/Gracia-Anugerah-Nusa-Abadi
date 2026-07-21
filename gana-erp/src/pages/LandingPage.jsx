import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ShieldCheck, 
  Truck, 
  PackageCheck, 
  MapPin, 
  Phone, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Star, 
  Users, 
  Layers,
  Award,
  BarChart3,
  MessageSquare,
  Search,
  CheckCircle2,
  Calculator,
  Receipt,
  Clock,
  ChevronRight,
  FileCheck,
  Building,
  HelpCircle,
  ExternalLink,
  Shield,
  BadgeCheck,
  TrendingUp,
  FileText
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // B2B Order & Savings Calculator State
  const [clientType, setClientType] = useState('bengkel_mobil');
  const [volumeDus, setVolumeDus] = useState(25);
  const [selectedProduct, setSelectedProduct] = useState('Kixx G1 SP 5W-30 (12x1L)');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Products Data matching Stitch & GANA Portfolio
  const products = [
    {
      id: 1,
      brand: 'Kixx',
      name: 'Kixx G1 SP 5W-30 Full Synthetic',
      category: 'PCMO',
      viscosity: '5W-30 API SP / ILSAC GF-6',
      pack: '12 x 1L / Dus',
      desc: 'Pelumas bensin sintetis premium dengan Triple Double Technology GS Caltex untuk mesin mobil modern.',
      badge: 'Top Seller PCMO',
      badgeBg: 'bg-[#E0E7FF] text-[#4338CA] border-[#C7D2FE]'
    },
    {
      id: 2,
      brand: 'Petronas',
      name: 'PETRONAS Syntium 7000 0W-20',
      category: 'PCMO',
      viscosity: '0W-20 API SP',
      pack: '12 x 1L / Dus',
      desc: 'Formulasi CoolTech+™ F1 Mercedes-AMG untuk efisiensi BBM dan kontrol suhu panas mesin ekstrem.',
      badge: 'F1 CoolTech+ Tech',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      id: 3,
      brand: 'Petronas',
      name: 'PETRONAS Sprinta F900 10W-40',
      category: 'MCMO',
      viscosity: '10W-40 JASO MA2 / API SN',
      pack: '24 x 1L / Dus',
      desc: 'Teknologi UltraFlex™ memberikan respons akseklerasi cepat & perlindungan selip kopling motor sport.',
      badge: 'Ultimate Motor Oil',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      id: 4,
      brand: 'Kixx',
      name: 'Kixx Ultra 4T Synthetic 10W-40',
      category: 'MCMO',
      viscosity: '10W-40 JASO MA2',
      pack: '24 x 0.8L / Dus',
      desc: 'Stabilitas geser tinggi untuk perpindahan gigi halus dan kebersihan ruang bakar motor matic & bebek.',
      badge: 'Smooth Ride',
      badgeBg: 'bg-[#E0E7FF] text-[#4338CA] border-[#C7D2FE]'
    },
    {
      id: 5,
      brand: 'Kixx',
      name: 'Kixx HD1 15W-40 CI-4/SL',
      category: 'HDDEO',
      viscosity: '15W-40 API CI-4/SL',
      pack: 'Drum 200L / Pail 20L',
      desc: 'Pelumas Heavy Duty Diesel khusus truk kargo, armada bus & mesin konstruksi industri berat.',
      badge: 'Heavy Duty Fleet',
      badgeBg: 'bg-[#E0E7FF] text-[#4338CA] border-[#C7D2FE]'
    },
    {
      id: 6,
      brand: 'Petronas',
      name: 'PETRONAS Urania 3000 15W-40',
      category: 'HDDEO',
      viscosity: '15W-40 API CI-4',
      pack: 'Drum 200L / Pail 20L',
      desc: 'Perlindungan luar biasa terhadap jelaga (soot) & deposit piston mesin diesel heavy duty turbocharged.',
      badge: 'Heavy Duty Diesel',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      id: 7,
      brand: 'Kixx',
      name: 'Kixx Hydro AF 46 / 68 Hydraulic Oil',
      category: 'Industrial',
      viscosity: 'ISO VG 46 / 68 Anti-Wear',
      pack: 'Drum 200L',
      desc: 'Oli hidrolik industri dengan aditif anti-aus seng efisiensi tinggi untuk pompa hidrolik tekanan tinggi.',
      badge: 'Industrial Fluid',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200'
    },
    {
      id: 8,
      brand: 'Petronas',
      name: 'PETRONAS Tutela Gear Oil 80W-90',
      category: 'Industrial',
      viscosity: '80W-90 API GL-5',
      pack: 'Drum 200L / 20L',
      desc: 'Pelumas roda gigi ekstrem (hypoid gear) untuk transmisi manual & gardan kendaraan beban berat.',
      badge: 'Extreme Pressure',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
  ];

  const filteredProducts = activeCategory === 'Semua' 
    ? products 
    : products.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());

  // Calculator Logic
  const pricePerDus = 450000;
  const grossTotal = volumeDus * pricePerDus;
  let discountPercent = 0;
  let topDays = 14;
  if (volumeDus >= 50) {
    discountPercent = 12;
    topDays = 45;
  } else if (volumeDus >= 20) {
    discountPercent = 8;
    topDays = 30;
  } else if (volumeDus >= 10) {
    discountPercent = 5;
    topDays = 14;
  }
  const discountAmount = (grossTotal * discountPercent) / 100;
  const netTotal = grossTotal - discountAmount;

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/login?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F5FB] text-[#1E1B4B] font-sans selection:bg-[#4F46E5] selection:text-white antialiased">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER / NAVIGATION BAR (Stitch Design Tokens) */}
      {/* ------------------------------------------------------------- */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm py-3' 
          : 'bg-white py-4 border-b border-[#E2E8F0]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] p-1 flex items-center justify-center shadow-md shadow-[#2B2D83]/15 overflow-hidden">
              <img src="/logo-gana.jpg" alt="Logo PT GANA" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-[#2B2D83] flex items-center gap-2">
                PT GANA <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#E0E7FF] text-[#4338CA] font-bold border border-[#C7D2FE]">DISTRIBUTOR RESMI</span>
              </span>
              <p className="text-[11px] text-[#64748B] font-medium tracking-wide">Gracia Anugerah Nusa Abadi</p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="hidden lg:flex items-center gap-7 text-sm font-semibold text-[#464651]">
            <a href="#katalog" className="hover:text-[#4F46E5] transition-colors">Katalog Produk</a>
            <a href="#keunggulan" className="hover:text-[#4F46E5] transition-colors">Layanan B2B</a>
            <a href="#kalkulator" className="hover:text-[#4F46E5] transition-colors">Simulasi Order</a>
            <a href="#alur-kerja" className="hover:text-[#4F46E5] transition-colors">Alur Pengiriman</a>
            <a href="#perbandingan" className="hover:text-[#4F46E5] transition-colors">Tentang GANA</a>
          </div>

          {/* Quick Search & CTAs */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleQuickSearch} className="hidden sm:flex items-center relative">
              <input 
                type="text"
                placeholder="Cari No DO / SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 lg:w-52 pl-8 pr-3 py-1.5 text-xs bg-[#F4F5FB] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-[#1E1B4B]"
              />
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 pointer-events-none" />
            </form>

            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#EEF2FF] text-[#4338CA] hover:bg-[#E0E7FF] border border-[#C7D2FE] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Portal Mitra</span>
            </button>

            <a
              href="https://wa.me/6281234567890?text=Halo%20PT%20GANA,%20saya%20ingin%20konsultasi%20pasokan%20pelumas%20B2B."
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[#2B2D83] hover:bg-[#1E1B4B] text-white shadow-md shadow-[#2B2D83]/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Hubungi Sales</span>
            </a>
          </div>

        </div>
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* 2. HERO SECTION (Split B2B Layout) */}
      {/* ------------------------------------------------------------- */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative overflow-hidden">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Core Value Proposition */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 bg-[#E0E7FF] text-[#4338CA] px-3 py-1.5 rounded-full border border-[#C7D2FE] mb-6">
              <BadgeCheck className="w-4 h-4 text-[#4F46E5]" />
              <span className="text-xs font-bold tracking-wide">Distributor Resmi Kixx & Petronas Kalsel</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1E1B4B] leading-[1.18] tracking-tight mb-6">
              Pasokan Pelumas Resmi Kixx & Petronas <span className="text-[#4F46E5]">Tanpa Hambatan Operasional.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed font-normal mb-8 max-w-2xl">
              Solusi rantai pasok pelumas B2B terintegrasi untuk bengkel, toko sparepart, armada komersial, dan sektor industri di Kalimantan Selatan. Jaminan 100% original, sistem tempo transparan, dan pengiriman armada terukur.
            </p>

            {/* Quick Action Group */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-lg font-bold text-sm bg-[#2B2D83] hover:bg-[#1E1B4B] text-white shadow-lg shadow-[#2B2D83]/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Mulai Kemitraan B2B</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#katalog"
                className="px-6 py-3 rounded-lg font-bold text-sm bg-white border border-[#E2E8F0] text-[#1E1B4B] hover:bg-[#F4F5FB] shadow-sm transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-[#4F46E5]" />
                <span>Lihat Katalog Produk</span>
              </a>
            </div>

            {/* SLA Badges Grid */}
            <div className="mt-10 pt-6 border-t border-[#E2E8F0] grid grid-cols-3 gap-4 w-full">
              <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-xl font-bold text-[#2B2D83] block">1.000+</span>
                <span className="text-[11px] text-[#64748B] font-medium">Mitra Bengkel Active</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-xl font-bold text-[#15803D] block">99.8%</span>
                <span className="text-[11px] text-[#64748B] font-medium">SLA Ready Stock</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#E2E8F0] shadow-xs">
                <span className="text-xl font-bold text-[#4338CA] block">24 Jam</span>
                <span className="text-[11px] text-[#64748B] font-medium">Pengiriman Kalsel</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual B2B Showcase Banner with Official GANA Logo */}
          <div className="lg:col-span-5 relative">
            <div className="bg-gradient-to-b from-[#2B2D83] to-[#1E1B4B] rounded-3xl p-6 shadow-2xl border border-[#3730A3] relative overflow-hidden text-white">
              
              {/* Brand Header Overlay with Official GANA Logo */}
              <div className="flex items-center justify-between pb-4 border-b border-white/15 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md overflow-hidden shrink-0">
                    <img src="/logo-gana.jpg" alt="Logo PT GANA" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">PT GANA SUPPLY CHAIN</h4>
                    <span className="text-[10px] text-[#A5B4FC] font-medium">Official Petronas & Kixx Hub Kalsel</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] border border-emerald-300">
                  LIVE STOCK 24/7
                </span>
              </div>

              {/* High-Key Warehouse Distribution Visual Image Card */}
              <div className="relative h-48 rounded-2xl overflow-hidden mb-5 border border-white/10 shadow-inner group">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsSYKQVDDR026nACH1f3hwfheZumezZv1LWgMx-EPcpiwlDRK_zLqOz-VcEtzGydCNVT5eTfyxa4b1WzjEKCAdeDFmQJ9AF7DuiaAZiyNNFzPWxSAS6YkYAsoyyHrGPpvKcD-iHJzjkoc4oBrHC2QI8-RilcdwcZgcZDQXueGZDF9FVKXFIZSNDE80hFA87aaVSo3fmN71zFDL__BFVh1ctbPWJm1zFoS63YeVKTvzHO_-TIuClXrrVsHFCPKKhrW2OsHnxge0lQ" 
                  alt="Warehouse Storage GANA" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/90 via-[#1E1B4B]/30 to-transparent" />
                
                {/* Floating Live Stock Chips */}
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-[10px] font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
                    🟢 PETRONAS: 1.250 Karton
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-indigo-300 border border-indigo-500/30">
                    🔵 KIXX: 1.800 Karton
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. BRAND & PRINCIPAL WALL (Stitch Verified Principal Wall) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-10 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748B] mb-6">
            Mitra Principal & Sertifikasi Keaslian Terverifikasi
          </p>

          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14 opacity-90 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2.5 border border-[#E2E8F0] px-4 py-2 rounded-xl bg-white shadow-xs">
              <div className="w-7 h-7 rounded-lg bg-white p-0.5 border border-[#E2E8F0] overflow-hidden flex items-center justify-center shrink-0">
                <img src="/logo-gana.jpg" alt="Logo PT GANA" className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-bold text-[#2B2D83]">PT GANA (Distributor Utama)</span>
            </div>
            <div className="flex items-center gap-2 border border-[#E2E8F0] px-4 py-2 rounded-xl bg-[#F4F5FB]">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-[#1E1B4B]">PETRONAS Lubricants</span>
            </div>
            <div className="flex items-center gap-2 border border-[#E2E8F0] px-4 py-2 rounded-xl bg-[#F4F5FB]">
              <Building2 className="w-5 h-5 text-[#2B2D83]" />
              <span className="text-xs font-bold text-[#1E1B4B]">GS Caltex Kixx Korea</span>
            </div>
            <div className="flex items-center gap-2 border border-[#E2E8F0] px-4 py-2 rounded-xl bg-[#F4F5FB]">
              <Award className="w-5 h-5 text-[#4F46E5]" />
              <span className="text-xs font-bold text-[#1E1B4B]">Artha Buana Emas Group</span>
            </div>
            <div className="flex items-center gap-2 border border-[#E2E8F0] px-4 py-2 rounded-xl bg-[#F4F5FB]">
              <ShieldCheck className="w-5 h-5 text-[#15803D]" />
              <span className="text-xs font-bold text-[#1E1B4B]">SNI & ISO 9001:2015</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. VALUE PROPOSITION (4 Columns Bento Grid Stitch Tokens) */}
      {/* ------------------------------------------------------------- */}
      <section id="keunggulan" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#4F46E5] mb-2">Keunggulan Operasional</h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#2B2D83] tracking-tight">
            Empat Pilar Layanan B2B PT GANA
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#4F46E5] transition-all group">
            <div className="w-12 h-12 rounded-xl bg-[#EEF2FF] text-[#4338CA] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#1E1B4B] mb-2">Pengiriman Cepat (DO)</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Armada logistik teratur menjamin pengiriman barang beserta Surat Jalan & DO tepat waktu ke seluruh rute Kalimantan Selatan.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#4F46E5] transition-all group">
            <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#1E1B4B] mb-2">Stok Gudang Internal</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Stok pelumas aman di gudang internal Banjarmasin/Banjarbaru untuk mencegah kelangkaan oli saat terjadi spike permintaan.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#4F46E5] transition-all group">
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <FileCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#1E1B4B] mb-2">Pencatatan Sales Digital</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Laporan kunjungan sales terverifikasi GPS & foto geotagging menjamin transparansi pelayanan mitra di setiap lokasi.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm hover:border-[#4F46E5] transition-all group">
            <div className="w-12 h-12 rounded-xl bg-[#E0E7FF] text-[#4338CA] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-[#1E1B4B] mb-2">Fleksibilitas Piutang B2B</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Sistem Term of Payment (TOP) fleksibel didukung fitur konfirmasi cicilan real-time untuk mendukung efisiensi arus kas mitra.
            </p>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. PRODUCT SHOWCASE GRID (Categorized PCMO, MCMO, HDDEO) */}
      {/* ------------------------------------------------------------- */}
      <section id="katalog" className="py-20 bg-white border-y border-[#E2E8F0] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#4F46E5] mb-1.5">Katalog Varian Produk</h2>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#2B2D83] tracking-tight">Katalog Pelumas Kixx & Petronas</h3>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-2 bg-[#F4F5FB] p-1.5 rounded-xl border border-[#E2E8F0]">
              {['Semua', 'PCMO', 'MCMO', 'HDDEO', 'Industrial'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === cat 
                      ? 'bg-[#2B2D83] text-white shadow-sm' 
                      : 'text-[#64748B] hover:text-[#1E1B4B]'
                  }`}
                >
                  {cat === 'PCMO' ? 'Mobil (PCMO)' : cat === 'MCMO' ? 'Motor (MCMO)' : cat === 'HDDEO' ? 'Diesel Heavy Duty' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map(prod => (
              <div 
                key={prod.id} 
                className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#4F46E5] transition-all hover:shadow-md flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${prod.badgeBg}`}>
                      {prod.brand} • {prod.badge}
                    </span>
                    <span className="text-[10px] font-bold text-[#64748B] uppercase">{prod.category}</span>
                  </div>

                  <h4 className="text-sm font-bold text-[#1E1B4B] mb-1.5 line-clamp-2">{prod.name}</h4>
                  <p className="text-xs text-[#64748B] leading-relaxed mb-4">{prod.desc}</p>
                </div>

                <div className="px-5 py-3.5 bg-[#F4F5FB] border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-bold block">Viskositas</span>
                    <span className="font-bold text-[#2B2D83]">{prod.viscosity}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#64748B] uppercase font-bold block">Kemasan</span>
                    <span className="font-semibold text-[#334155]">{prod.pack}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. INTERACTIVE B2B ORDER & SAVINGS CALCULATOR */}
      {/* ------------------------------------------------------------- */}
      <section id="kalkulator" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Explanatory Banner */}
          <div className="lg:col-span-5 bg-[#2B2D83] text-white p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E0E7FF] text-[#4338CA] border border-[#C7D2FE]">
                SIMULASI DISKON GROSIR B2B
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mt-4 mb-3">Kalkulator Order & Ketentuan Tempo</h3>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-8">
                Hitung perkiraan harga bersih, besaran potongan harga, dan skema durasi kredit (Term of Payment) secara otomatis sesuai volume pembelian bulanan Anda.
              </p>
            </div>

            <div className="relative z-10 space-y-4 border-t border-white/20 pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-white/90">Diskon bertingkat hingga 12% untuk pesanan grosir</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-xs text-white/90">Fasilitas kredit tempo s/d 45 hari bagi mitra terverifikasi</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form Controls */}
          <div className="lg:col-span-7 p-8 lg:p-10 bg-[#F4F5FB] flex flex-col justify-between">
            <div className="space-y-6">
              
              <div>
                <label className="block text-xs font-bold text-[#1E1B4B] mb-2 uppercase tracking-wide">1. Varian Produk Utama</label>
                <select 
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5] text-[#1E1B4B] font-semibold"
                >
                  <option value="Kixx G1 SP 5W-30 (12x1L)">Kixx G1 SP 5W-30 Synthetic (12x1L / Dus)</option>
                  <option value="PETRONAS Syntium 7000 0W-20 (12x1L)">PETRONAS Syntium 7000 0W-20 (12x1L / Dus)</option>
                  <option value="PETRONAS Sprinta F900 (24x1L)">PETRONAS Sprinta F900 10W-40 (24x1L / Dus)</option>
                  <option value="Kixx HD1 15W-40 Drum (200L)">Kixx HD1 15W-40 Diesel (Drum 200L)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-[#1E1B4B] uppercase tracking-wide">2. Volume Pemesanan Bulanan</label>
                  <span className="text-sm font-black text-[#4F46E5]">{volumeDus} Dus / Karton</span>
                </div>
                <input 
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={volumeDus}
                  onChange={(e) => setVolumeDus(Number(e.target.value))}
                  className="w-full h-2 bg-[#C7D2FE] rounded-lg appearance-none cursor-pointer accent-[#4F46E5]"
                />
                <div className="flex justify-between text-[10px] text-[#64748B] font-semibold mt-1">
                  <span>5 Dus</span>
                  <span>50 Dus (Diskon Max 12%)</span>
                  <span>100 Dus</span>
                </div>
              </div>

              {/* Simulation Outcome Display Card */}
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-sm grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase font-bold block">Diskon Didapat ({discountPercent}%)</span>
                  <span className="text-base font-black text-[#15803D]">Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748B] uppercase font-bold block">Fasilitas Tempo (TOP)</span>
                  <span className="text-base font-black text-[#4338CA]">{topDays} Hari Kerja</span>
                </div>
                <div className="col-span-2 pt-3 border-t border-[#E2E8F0] flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase font-bold block">Perkiraan Nilai Bersih</span>
                    <span className="text-xl font-black text-[#2B2D83]">Rp {netTotal.toLocaleString('id-ID')}</span>
                  </div>
                  <a
                    href={`https://wa.me/6281234567890?text=Halo%20PT%20GANA,%20saya%20tertarik%20dengan%20simulasi%20order%20${volumeDus}%20dus%20${encodeURIComponent(selectedProduct)}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-[#2B2D83] hover:bg-[#1E1B4B] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    Ajukan Penawaran ini
                  </a>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. DISTRIBUTION & DELIVERY WORKFLOW */}
      {/* ------------------------------------------------------------- */}
      <section id="alur-kerja" className="py-20 bg-white border-y border-[#E2E8F0] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#4F46E5] mb-2">Alur Pengiriman Terukur</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#2B2D83] tracking-tight">
              Empat Langkah Distribusi Resmi PT GANA
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-[#F4F5FB] border border-[#E2E8F0] relative">
              <span className="w-8 h-8 rounded-full bg-[#2B2D83] text-white font-bold text-xs flex items-center justify-center mb-4 mx-auto">1</span>
              <h4 className="text-sm font-bold text-[#1E1B4B] mb-1.5">Input Orders ERP</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">Sales / Admin memasukkan pesanan barang dengan verifikasi kuota stok realtime.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F4F5FB] border border-[#E2E8F0] relative">
              <span className="w-8 h-8 rounded-full bg-[#2B2D83] text-white font-bold text-xs flex items-center justify-center mb-4 mx-auto">2</span>
              <h4 className="text-sm font-bold text-[#1E1B4B] mb-1.5">Surat Jalan & Packing</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">Kepala Gudang menerbitkan Surat Jalan (DO) resmi & meluncurkan tim QC packing.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F4F5FB] border border-[#E2E8F0] relative">
              <span className="w-8 h-8 rounded-full bg-[#2B2D83] text-white font-bold text-xs flex items-center justify-center mb-4 mx-auto">3</span>
              <h4 className="text-sm font-bold text-[#1E1B4B] mb-1.5">Delivery & Foto Geotag</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">Driver mengirimkan oli ke lokasi bengkel dengan lampiran bukti foto penerimaan barang.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F4F5FB] border border-[#E2E8F0] relative">
              <span className="w-8 h-8 rounded-full bg-[#2B2D83] text-white font-bold text-xs flex items-center justify-center mb-4 mx-auto">4</span>
              <h4 className="text-sm font-bold text-[#1E1B4B] mb-1.5">Rekonsiliasi Piutang</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">Status invoice otomatis ter-update dan riwayat pembayaran cicilan terpantau di portal.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. GANA-ERP DASHBOARD PREVIEW SECTION (Stitch Mockups) */}
      {/* ------------------------------------------------------------- */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#2B2D83] rounded-3xl p-8 lg:p-12 text-white relative overflow-hidden shadow-2xl">
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6 border-b border-white/10 pb-8">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E0E7FF] text-[#4338CA]">
                INTEGRATED B2B PORTAL
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mt-3">Pratinjau Dashboard ERP PT GANA</h3>
              <p className="text-xs sm:text-sm text-white/80 mt-1">Transparansi status pengiriman barang & konfirmasi pembayaran piutang.</p>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Login ke Dashboard Mitra</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Sample Order Mockup Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white text-[#1E1B4B] p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-[#4338CA] bg-[#E0E7FF] px-2.5 py-0.5 rounded-md">#INV-10240</span>
                <span className="text-[10px] font-bold bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded-full">Surat Jalan Ready</span>
              </div>
              <h4 className="text-sm font-bold text-[#1E1B4B]">Bengkel Jaya Motor</h4>
              <p className="text-xs text-[#64748B] mt-0.5">Order: 15 Dus Kixx G1 SP 5W-30 • Rp 6.750.000</p>
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center text-xs">
                <span className="text-[11px] text-[#64748B]">Driver: Pak Slamet (L-300)</span>
                <span className="font-bold text-[#15803D]">Tiba di Lokasi</span>
              </div>
            </div>

            <div className="bg-white text-[#1E1B4B] p-5 rounded-2xl shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-[#4338CA] bg-[#E0E7FF] px-2.5 py-0.5 rounded-md">#INV-10238</span>
                <span className="text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] px-2 py-0.5 rounded-full">Konfirmasi Pembayaran</span>
              </div>
              <h4 className="text-sm font-bold text-[#1E1B4B]">FIRDAUS JAYA SENTOSA</h4>
              <p className="text-xs text-[#64748B] mt-0.5">Order: 2 Drum Petronas Urania 15W-40 • Rp 18.400.000</p>
              <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex justify-between items-center text-xs">
                <span className="text-[11px] text-[#64748B]">Cicilan #1: Rp 9.200.000</span>
                <span className="font-bold text-[#B45309]">Pending Review Admin</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. FEATURE COMPARISON MATRIX (GANA vs Conventional) */}
      {/* ------------------------------------------------------------- */}
      <section id="perbandingan" className="py-20 bg-white border-y border-[#E2E8F0] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#4F46E5] mb-1.5">Matriks Perbandingan</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#2B2D83] tracking-tight">
              PT GANA vs Distributor Konvensional
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F4F5FB] border-b border-[#E2E8F0] text-[#1E1B4B]">
                  <th className="p-4 font-bold">Fitur & Layanan B2B</th>
                  <th className="p-4 font-bold text-[#2B2D83] bg-[#EEF2FF]">PT GANA (Distributor Resmi)</th>
                  <th className="p-4 font-bold text-[#64748B]">Distributor Konvensional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                <tr>
                  <td className="p-4 font-semibold text-[#1E1B4B]">Jaminan Keaslian Oli</td>
                  <td className="p-4 font-bold text-[#15803D] bg-[#EEF2FF]/50 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#15803D]" /> 100% Original Segel Pabrik
                  </td>
                  <td className="p-4 text-[#64748B]">Bervariasi / Tanpa Garansi</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-[#1E1B4B]">Kecepatan Pengiriman (SLA)</td>
                  <td className="p-4 font-bold text-[#2B2D83] bg-[#EEF2FF]/50">Maksimal 24 Jam Rute Kalsel</td>
                  <td className="p-4 text-[#64748B]">2 - 5 Hari Kerja</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-[#1E1B4B]">Sistem Invoice & Piutang</td>
                  <td className="p-4 font-bold text-[#4338CA] bg-[#EEF2FF]/50">Portal ERP Realtime Digital</td>
                  <td className="p-4 text-[#64748B]">Manual Buku Nota / Excel</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-[#1E1B4B]">Verifikasi Geotag Kunjungan</td>
                  <td className="p-4 font-bold text-[#15803D] bg-[#EEF2FF]/50 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#15803D]" /> Laporan Sales Geotag & Foto
                  </td>
                  <td className="p-4 text-[#64748B]">Tanpa Verifikasi Lokasi</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. CALL TO ACTION (CTA) BANNER */}
      {/* ------------------------------------------------------------- */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#2B2D83] to-[#4F46E5] rounded-3xl p-8 md:p-12 text-white text-center shadow-xl">
          <h3 className="text-2xl sm:text-3xl font-bold mb-3">Siap Tingkatkan Pasokan Oli Bengkel Anda?</h3>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl mx-auto mb-8">
            Dapatkan harga distributor resmi terbaik, layanan armada terukur, dan fasilitas tempo yang disesuaikan untuk kemajuan bisnis Anda.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 bg-white text-[#2B2D83] hover:bg-[#EEF2FF] font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Masuk ke Portal ERP Mitra
            </button>
            <a
              href="https://wa.me/6281234567890?text=Halo%20PT%20GANA,%20saya%20ingin%20bertanya%20mengenai%20syarat%20menjadi%20mitra."
              target="_blank"
              rel="noreferrer"
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Hubungi WA Sales Sekarang</span>
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 11. ENTERPRISE FOOTER (Matching Stitch Design) */}
      {/* ------------------------------------------------------------- */}
      <footer id="kontak" className="bg-[#1E1B4B] text-white pt-16 pb-10 border-t border-[#2B2D83]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-white/10">
            
            {/* Col 1 & 2: Company Summary */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 border border-white/20 overflow-hidden">
                  <img src="/logo-gana.jpg" alt="Logo PT GANA" className="w-full h-full object-contain" />
                </div>
                <div>
                  <span className="text-xl font-black text-white leading-none">PT GANA</span>
                  <span className="text-[10px] text-[#A5B4FC] block mt-0.5">Distributor Resmi Pelumas</span>
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed max-w-sm">
                PT. Gracia Anugerah Nusa Abadi (PT GANA) adalah distributor resmi pelumas GS Caltex Kixx dan PETRONAS Lubricants di Kalimantan Selatan.
              </p>
              <div className="flex items-center gap-3 text-xs text-white/80">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Jl. Jend. A. Yani, Banjarmasin / Banjarbaru, Kalsel</span>
              </div>
            </div>

            {/* Col 3: Navigation Links */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Navigasi Utama</h4>
              <ul className="space-y-2 text-xs text-white/70">
                <li><a href="#katalog" className="hover:text-white transition-colors">Katalog Produk</a></li>
                <li><a href="#keunggulan" className="hover:text-white transition-colors">Layanan B2B</a></li>
                <li><a href="#kalkulator" className="hover:text-white transition-colors">Simulasi Order</a></li>
                <li><a href="#alur-kerja" className="hover:text-white transition-colors">Alur Pengiriman</a></li>
              </ul>
            </div>

            {/* Col 4: Products */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Varian Pelumas</h4>
              <ul className="space-y-2 text-xs text-white/70">
                <li><span>Kixx PCMO & MCMO</span></li>
                <li><span>Petronas Syntium & Sprinta</span></li>
                <li><span>Heavy Duty Diesel (HDDEO)</span></li>
                <li><span>Industrial & Gear Oil</span></li>
              </ul>
            </div>

            {/* Col 5: ERP Access */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Portal ERP GANA</h4>
              <p className="text-xs text-white/70 mb-3">Portal internal terpadu untuk Owner, Admin, Sales, & Gudang.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Login Portal Mitra
              </button>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-white/50">
            <p>© 2026 PT. Gracia Anugerah Nusa Abadi (PT GANA). All rights reserved.</p>
            <p>Synced with Stitch Project ID: 802864247286909362</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
