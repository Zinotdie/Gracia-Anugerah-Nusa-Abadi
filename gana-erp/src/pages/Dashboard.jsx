import { useEffect, useState } from 'react';
import DashboardAdmin from './DashboardAdmin';
import DashboardKepalaGudang from './DashboardKepalaGudang';
import DashboardStaffGudang from './DashboardStaffGudang';
import DashboardOwner from './DashboardOwner';
import DashboardSales from './DashboardSales';

export default function Dashboard() {
  const [role, setRole] = useState(() => localStorage.getItem('userRole') || 'admin');

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole') || 'admin';
    setRole(savedRole);
  }, []);

  const normalizedRole = (role || '').toLowerCase().trim();

  if (normalizedRole === 'kepala_gudang' || normalizedRole === 'kepala gudang') {
    return <DashboardKepalaGudang />;
  } else if (normalizedRole === 'staff_gudang' || normalizedRole === 'staff gudang') {
    return <DashboardStaffGudang />;
  } else if (normalizedRole === 'owner') {
    return <DashboardOwner />;
  } else if (normalizedRole === 'sales') {
    return <DashboardSales />;
  }

  return <DashboardAdmin />;
}
