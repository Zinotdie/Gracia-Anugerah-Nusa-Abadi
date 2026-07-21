import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Building2 } from 'lucide-react';
import api from '../utils/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Fungsi pembantu untuk menebak/menentukan role dari username (jika backend mewajibkan field 'role' saat login)
  const getRoleFromUsername = (uname) => {
    const u = uname.toLowerCase();
    if (u.includes('admin')) return 'admin';
    if (u.includes('kepala') || u.includes('gudang')) return 'kepala_gudang';
    if (u.includes('staff')) return 'staff_gudang';
    if (u.includes('owner')) return 'owner';
    if (u.includes('sales')) return 'sales';
    return 'admin'; // fallback default
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setErrorMsg('');
    setIsLoading(true);

    const userRole = getRoleFromUsername(username);

    // Kirim request login ke backend ngrok sesuai endpoint /api/auth/login
    api.post('/api/auth/login', { 
      username, 
      password,
      role: userRole
    })
      .then((res) => {
        // Mengambil token dan data user dari response Axios sesuai struktur backend Anda
        const { token, data } = res.data;
        const { role, nama } = data;

        if (role) {
          localStorage.setItem('userRole', role);
        }
        if (nama) {
          localStorage.setItem('userFullName', nama);
        }
        if (token) {
          localStorage.setItem('userToken', token);
        }
        const userId = data?.id || data?.id_sales || data?.userId || '';
        if (userId) {
          localStorage.setItem('userId', userId);
        }

        setIsLoading(false);
        navigate('/dashboard');
      })
      .catch((err) => {
        setIsLoading(false);
        // Menampilkan pesan error dari backend jika ada, atau default error
        const errorMessage = err.response?.data?.message || 'Gagal terhubung ke server atau username/password salah!';
        setErrorMsg(errorMessage);
      });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] w-full max-w-[400px] flex flex-col items-center">

        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6 w-full text-center">
          <div className="h-16 w-16 bg-white border border-[#E2E8F0] p-1.5 rounded-2xl flex items-center justify-center mb-3 shadow-md overflow-hidden">
            <img src="/logo-gana.jpg" alt="Logo PT GANA" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-black text-[#2B2D83] tracking-tight">PT GANA</h1>
          <p className="text-xs font-semibold text-[#64748B]">Sistem Informasi ERP & Distribusi Pelumas</p>
        </div>

        {errorMsg && (
          <div className="w-full bg-[#FEE2E2] text-[#DC2626] text-sm font-semibold p-3 rounded-lg mb-4 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#334155]">Username</label>
            <input
              type="text"
              placeholder="Masukkan username"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#0B56A6] focus:border-[#0B56A6] transition-all text-sm placeholder:text-[#94A3B8]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#334155]">Password</label>
            <input
              type="password"
              placeholder="Masukkan password"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] focus:outline-none focus:ring-1 focus:ring-[#0B56A6] focus:border-[#0B56A6] transition-all text-sm placeholder:text-[#94A3B8]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full bg-[#8cc63f] hover:bg-[#7db338] active:bg-[#6c9c30] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Masuk'
            )}
          </button>
        </form>

        <div className="mt-8 text-center pt-5 w-full">
          <p className="text-xs text-[#94A3B8] font-medium">
            Sistem ERP untuk Manajemen Distribusi
          </p>
        </div>
      </div>
    </div>
  );
}
