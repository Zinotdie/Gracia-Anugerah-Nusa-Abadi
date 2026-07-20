import Sidebar from '../components/Sidebar';
import NotificationCenter from '../components/NotificationCenter';
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [role, setRole] = useState(() => localStorage.getItem('userRole') || 'admin');
  const [fullName, setFullName] = useState(() => localStorage.getItem('userFullName') || 'Admin');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem('userRole') || 'admin');
    setFullName(localStorage.getItem('userFullName') || 'Admin');
  }, []);

  const currentRole = (role || 'admin').toLowerCase().trim();
  const nameDisplay = fullName || 'User';

  let headerTitle = 'Admin - Central Control';
  if (currentRole === 'kepala_gudang' || currentRole === 'kepala gudang') {
    headerTitle = 'Kepala Gudang - Inventory Supervisor';
  } else if (currentRole === 'staff_gudang' || currentRole === 'staff gudang') {
    headerTitle = 'Staff Gudang - Warehouse Operations';
  } else if (currentRole === 'owner') {
    headerTitle = 'Owner - Executive Dashboard';
  } else if (currentRole === 'sales') {
    headerTitle = 'Sales - Field Operations';
  }

  const initial = nameDisplay.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-white font-sans text-[#1E293B]">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Simple Header */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-[#64748B] md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-base font-bold text-[#1E293B] hidden sm:block">{headerTitle}</h2>
              <h2 className="text-base font-bold text-[#1E293B] sm:hidden">Dashboard</h2>
              <p className="text-xs text-[#64748B] hidden sm:block">Selamat datang di sistem GANA</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter role={currentRole} />
            <div className="w-px h-6 bg-[#E2E8F0] mx-1"></div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-[#1E293B] block">{nameDisplay}</span>
              <span className="text-xs text-[#64748B] capitalize hidden sm:block">{currentRole.replace('_', ' ')}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center font-bold text-white shadow-sm shrink-0">
              {initial}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
