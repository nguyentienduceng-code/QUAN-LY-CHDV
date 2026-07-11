import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, LogOut, User, Home as HomeIcon, FileText, FileSearch, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ toggleSidebar }) {
  const { user, logout } = useAuth();
  const { notifications, markNotificationAsRead, rooms, tenants, contracts, invoices } = useAppData();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Global search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    const results = [];

    // Search Rooms
    rooms?.forEach(r => {
      if (r.name.toLowerCase().includes(query)) {
        results.push({ type: 'room', id: r.id, name: r.name, detail: `Phòng ${r.name} - Nhà ${r.building || 'A'}`, path: '/rooms' });
      }
    });

    // Search Tenants
    tenants?.forEach(t => {
      if ((t.name || '').toLowerCase().includes(query) || (t.phone || '').includes(query)) {
        results.push({ type: 'tenant', id: t.id, name: t.name, detail: `Khách: ${t.name} (Phòng ${t.room})`, path: '/tenants' });
      }
    });

    // Search Contracts
    contracts?.forEach(c => {
      if ((c.id || '').toLowerCase().includes(query) || (c.tenantName || '').toLowerCase().includes(query)) {
        results.push({ type: 'contract', id: c.id, name: c.id, detail: `HĐ: ${c.id} - ${c.tenantName}`, path: '/contracts' });
      }
    });

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
  }, [searchQuery, rooms, tenants, contracts]);

  // BUG-08: Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifications && notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (showSearchDropdown && searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showSearchDropdown]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  // Tính số ngày dùng thử còn lại
  let trialRemaining = null;
  if (user?.plan === 'trial' && user?.trialEndsAt) {
    const remainingMs = new Date(user.trialEndsAt) - new Date();
    trialRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
  }

  // Tính số ngày sử dụng còn lại (nếu đã mua gói)
  let subscriptionRemaining = null;
  if ((user?.plan === 'pro' || user?.plan === 'basic') && user?.subscriptionEndsAt) {
    const remainingMs = new Date(user.subscriptionEndsAt) - new Date();
    subscriptionRemaining = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
  }

  return (
    <header className="header" style={{ color: 'var(--sidebar-text)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu size={24} color="var(--sidebar-text)" />
        </button>
        {(user?.role !== 'tenant' && user?.role !== 'guest') && (
          <div className="search-bar" ref={searchRef} style={{ position: 'relative' }}>
            <Search size={18} color="var(--sidebar-text-muted)" />
            <input 
              type="text" 
              placeholder="Tìm kiếm phòng, khách, hợp đồng..." 
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => { if (searchQuery.trim()) setShowSearchDropdown(true); }}
              style={{ color: 'var(--sidebar-text)' }} 
            />
            {showSearchDropdown && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                width: '100%',
                minWidth: '250px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                zIndex: 50,
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {searchResults.map((result, idx) => (
                  <div 
                    key={`${result.type}-${result.id}-${idx}`}
                    onClick={() => {
                      navigate(result.path);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    style={{
                      padding: '12px 16px',
                      borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid var(--border-glass)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'background 0.2s',
                      color: 'var(--text-primary)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {result.type === 'room' && <HomeIcon size={16} color="var(--accent-primary)" />}
                    {result.type === 'tenant' && <Users size={16} color="var(--status-occupied-text)" />}
                    {result.type === 'contract' && <FileText size={16} color="var(--status-expiring-text)" />}
                    <div style={{ fontSize: '0.9rem' }}>{result.detail}</div>
                  </div>
                ))}
              </div>
            )}
            {showSearchDropdown && searchQuery.trim() && searchResults.length === 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: '8px', width: '100%',
                background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)',
                borderRadius: '8px', padding: '16px', textAlign: 'center',
                color: 'var(--text-secondary)', fontSize: '0.9rem', zIndex: 50
              }}>
                Không tìm thấy kết quả phù hợp.
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {trialRemaining !== null && (
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.5)', color: '#f59e0b', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
             Dùng thử: {trialRemaining} ngày
          </div>
        )}
        
        {subscriptionRemaining !== null && subscriptionRemaining <= 3 && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ef4444', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap', animation: 'pulse 2s infinite' }}>
             Sắp hết hạn: {subscriptionRemaining} ngày
          </div>
        )}
        
        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }} ref={notifRef}>
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
              position: 'fixed', top: '60px', right: '8px',
              width: 'min(320px, calc(100vw - 16px))',
              background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
              borderRadius: '12px', boxShadow: '0 16px 40px rgba(0,0,0,0.4)', zIndex: 9999,
              color: 'var(--text-primary)'
            }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-glass)', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Thông báo</span>
                {unreadCount > 0 && <span style={{ background: 'var(--status-overdue)', color: '#fff', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem' }}>{unreadCount} mới</span>}
              </div>
              <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {notifications?.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có thông báo mới</div>
                ) : (
                  notifications?.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => markNotificationAsRead(n.id)}
                      style={{ 
                        padding: '12px 16px', borderBottom: '1px solid var(--border-glass)', 
                        background: n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.08)',
                        cursor: 'pointer', transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '0.88rem', fontWeight: n.isRead ? '500' : '700', color: 'var(--text-primary)', marginBottom: '3px', lineHeight: '1.3' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', opacity: 0.7 }}>
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
              {(user?.role !== 'tenant' && user?.role !== 'guest') ? 'Quản Lý' : `Khách Thuê - ${user?.room || ''}`}
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
