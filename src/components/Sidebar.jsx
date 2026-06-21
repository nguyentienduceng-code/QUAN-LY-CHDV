import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home as HomeIcon, Grid, Users, FileSpreadsheet, Wrench, Moon, Sun, Settings, Key, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }, [isDark]);
  
  const managerNavItems = [
    { path: '/', label: 'Tổng quan', icon: <HomeIcon size={20} /> },
    { path: '/rooms', label: 'Quản lý Phòng', icon: <Grid size={20} /> },
    { path: '/finance', label: 'Khách & Hóa Đơn', icon: <Users size={20} /> },
    { path: '/maintenance', label: 'Bảo trì (Kanban)', icon: <Wrench size={20} /> },
  ];

  if (user?.role === 'admin') {
    managerNavItems.push({ path: '/settings', label: 'Cấu hình', icon: <Settings size={20} /> });
    managerNavItems.push({ path: '/users', label: 'Phân quyền', icon: <Key size={20} /> });
  }
  
  if (user?.email === 'nguyentienducbmt123@gmail.com') {
    managerNavItems.push({ path: '/super-admin', label: 'Phê duyệt (MoMo)', icon: <Shield size={20} /> });
  }

  const tenantNavItems = [
    { path: '/', label: 'Phòng của tôi', icon: <HomeIcon size={20} /> },
    { path: '/invoices', label: 'Hóa đơn của tôi', icon: <FileSpreadsheet size={20} /> },
    { path: '/rooms', label: 'Phòng trống', icon: <Grid size={20} /> },
  ];

  const navItems = (user?.role !== 'tenant' && user?.role !== 'guest') ? managerNavItems : tenantNavItems;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header gradient-text" style={{ padding: '24px', fontSize: '1.25rem', fontWeight: '800', borderBottom: '1px solid var(--border-glass)', letterSpacing: '1px' }}>
        {(user?.role !== 'tenant' && user?.role !== 'guest') ? 'RentFlow' : 'Tenant Portal'}
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border-glass)' }}>
        <button 
          onClick={() => setIsDark(!isDark)}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
            padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-glass)',
            background: 'var(--bg-secondary)', color: 'var(--text-primary)',
            cursor: 'pointer', transition: 'var(--transition)'
          }}
        >
          {isDark ? <Sun size={20} color="var(--accent-primary)" /> : <Moon size={20} />}
          <span style={{ fontWeight: '500' }}>{isDark ? 'Giao Diện Sáng' : 'Giao Diện Tối'}</span>
        </button>
      </div>
    </aside>
  );
}
