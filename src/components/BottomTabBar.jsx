import { NavLink } from 'react-router-dom';
import { Home, Grid, Users, Wrench, FileText, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomTabBar() {
  const { user } = useAuth();

  const managerNavItems = [
    { path: '/', label: 'Tổng quan', icon: <Home size={20} /> },
    { path: '/rooms', label: 'Phòng', icon: <Grid size={20} /> },
    { path: '/tenants', label: 'Khách', icon: <Users size={20} /> },
    { path: '/invoices', label: 'Hóa đơn', icon: <FileText size={20} /> },
    { path: '/maintenance', label: 'Bảo trì', icon: <Wrench size={20} /> },
  ];

  const tenantNavItems = [
    { path: '/', label: 'Trang chủ', icon: <Home size={20} /> },
    { path: '/invoices', label: 'Hóa đơn', icon: <FileText size={20} /> },
    { path: '/rooms', label: 'Phòng trống', icon: <Grid size={20} /> },
  ];

  const navItems = (user?.role !== 'tenant' && user?.role !== 'guest') ? managerNavItems : tenantNavItems;

  if (!user) return null;

  return (
    <nav className="bottom-tab-bar">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `bottom-tab-item ${isActive ? 'active' : ''}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
