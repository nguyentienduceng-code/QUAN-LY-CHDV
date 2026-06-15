import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { UserCircle, KeySquare, ChevronRight, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [role, setRole] = useState('manager'); // 'manager' | 'tenant'
  const [identifier, setIdentifier] = useState('');
  const { login } = useAuth();
  const { tenants } = useAppData();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (role === 'manager') {
      login({ name: 'Admin (Quản lý)', role: 'manager' });
      navigate('/');
    } else {
      const emailToSearch = identifier || 'khach1@gmail.com';
      const tenant = tenants.find(t => t.email === emailToSearch);
      if (tenant) {
        login({ name: tenant.name, role: 'tenant', room: tenant.room, email: tenant.email });
        navigate('/tenant-portal');
      } else {
        toast.error('Email không tồn tại trong hệ thống!');
      }
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', position: 'relative', zIndex: 1 }}>
      <div className="bg-animation">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
      </div>

      <div style={{ 
        width: '400px', 
        background: 'rgba(10, 14, 26, 0.7)', 
        backdropFilter: 'blur(16px)', 
        border: '1px solid var(--border-glass)', 
        borderRadius: '24px', 
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ margin: '0 0 8px', background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Quản Lý CHDV
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Hệ thống Quản lý Bất động sản</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <button 
            type="button"
            onClick={() => setRole('manager')}
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: role === 'manager' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              border: '1px solid',
              borderColor: role === 'manager' ? 'var(--accent-primary)' : 'var(--border-glass)',
              color: role === 'manager' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'var(--transition)'
            }}
          >
            Quản Lý
          </button>
          <button 
            type="button"
            onClick={() => setRole('tenant')}
            style={{ 
              flex: 1, 
              padding: '12px', 
              background: role === 'tenant' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              border: '1px solid',
              borderColor: role === 'tenant' ? 'var(--status-occupied)' : 'var(--border-glass)',
              color: role === 'tenant' ? 'var(--status-occupied)' : 'var(--text-secondary)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'var(--transition)'
            }}
          >
            Khách Thuê
          </button>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {role === 'manager' ? 'Tài khoản' : 'Email đăng nhập'}
            </label>
            <div style={{ position: 'relative' }}>
              {role === 'manager' ? (
                <UserCircle size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
              ) : (
                <Mail size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
              )}
              <input 
                type="text" 
                placeholder={role === 'manager' ? 'admin' : 'khach1@gmail.com'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none' }} 
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mật khẩu</label>
            <div style={{ position: 'relative' }}>
              <KeySquare size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                defaultValue="password123"
                style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none' }} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <a href="#" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>Quên mật khẩu?</a>
          </div>

          <button 
            type="submit" 
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: role === 'manager' ? 'var(--accent-primary)' : 'var(--status-occupied)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '12px', 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            Đăng Nhập <ChevronRight size={18} />
          </button>
          
          {role === 'tenant' && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
                Hoặc đăng nhập bằng
                <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '18px' }} /> Google
                </button>
                <button type="button" style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" style={{ width: '18px' }} /> Facebook
                </button>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Chưa có tài khoản? <a href="#" style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>Đăng ký ngay</a>
          </div>
        </form>
      </div>
    </div>
  );
}
