import { useState } from 'react';
import { Menu, Search, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const { notifications, markNotificationAsRead } = useAppData();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <header className="header" style={{ color: 'var(--sidebar-text)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={24} color="var(--sidebar-text)" />
        </button>
        {user?.role === 'manager' && (
          <div className="search-bar">
            <Search size={18} color="var(--sidebar-text-muted)" />
            <input type="text" placeholder="Tìm kiếm phòng, khách thuê, hóa đơn..." style={{ color: 'var(--sidebar-text)' }} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }}>
          <div style={{ cursor: 'pointer', position: 'relative' }} onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} color="var(--sidebar-text-muted)" />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '16px', height: '16px', background: 'var(--status-overdue-bg)', color: 'var(--status-overdue-text)', borderRadius: '50%', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {unreadCount}
              </span>
            )}
          </div>

          {showNotifications && (
            <div style={{
              position: 'absolute', top: '100%', right: '0', marginTop: '16px',
              width: '320px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
              borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 100,
              color: 'var(--text-primary)'
            }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-glass)', fontWeight: 'bold', fontSize: '1rem' }}>
                Thông báo
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications?.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có thông báo mới</div>
                ) : (
                  notifications?.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markNotificationAsRead(n.id)}
                      style={{ 
                        padding: '16px', borderBottom: '1px solid var(--border-glass)', 
                        background: n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                        cursor: 'pointer', transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '0.9rem', fontWeight: n.isRead ? '500' : 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {n.date}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '20px', borderLeft: '1px solid var(--border-glass)' }}>
          <div className="hide-on-mobile" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--sidebar-text)' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--sidebar-text-muted)' }}>
              {user?.role === 'manager' ? 'Quản Lý' : `Khách Thuê - ${user?.room}`}
            </div>
          </div>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sidebar-text-muted)' }}>
            <User size={20} />
          </div>
          <button 
            onClick={handleLogout}
            style={{ background: 'transparent', border: 'none', color: 'var(--status-overdue-text)', cursor: 'pointer', marginLeft: '8px', padding: '4px' }}
            title="Đăng xuất"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
