import { NavLink } from 'react-router-dom';
import { Home, Grid, Users, PenTool, FileSpreadsheet, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomTabBar() {
  const { user } = useAuth();

  const managerNavItems = [
    { path: '/', label: 'Trang chủ', icon: <Home size={22} /> },
    { path: '/rooms', label: 'Phòng', icon: <Grid size={22} /> },
    { path: '/finance', label: 'Quản lý', icon: <Users size={22} /> },
    { path: '/maintenance', label: 'Bảo trì', icon: <PenTool size={22} /> },
  ];

  const tenantNavItems = [
    { path: '/', label: 'Trang chủ', icon: <Home size={22} /> },
    { path: '/invoices', label: 'Hóa đơn', icon: <FileSpreadsheet size={22} /> },
    { path: '/rooms', label: 'Tìm phòng', icon: <UserCheck size={22} /> },
  ];

  const navItems = user?.role === 'manager' ? managerNavItems : tenantNavItems;

  if (!user) return null;

  return (
    <nav className="bottom-tab-bar">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `bottom-tab-item ${isActive ? 'active' : ''}`}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
