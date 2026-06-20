import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { UserCircle, KeySquare, ChevronRight, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [role, setRole] = useState('manager'); // 'manager' | 'tenant'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('password123');
  const { login, loginWithGoogle, loginWithEmail } = useAuth();
  const appData = useAppData();
  const { tenants, users } = appData;
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast.success('Đăng nhập qua Google thành công!');
      navigate('/tenant-portal');
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/configuration-not-found' || error.message.includes('CONFIGURATION_NOT_FOUND') || error.code === 'auth/invalid-api-key') {
        toast.success('Đã vào Chế độ Demo: Đăng nhập Google thành công (Do Firebase chưa cấu hình)!');
        login({ name: 'Khách Demo Google', role: 'tenant', room: 'P.VIP', email: 'khach.google@gmail.com' });
        navigate('/tenant-portal');
      } else {
        toast.error('Lỗi: ' + error.message);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Try Firebase Email/Password Sign-in if credentials provided
    if (identifier) {
      try {
        const firebaseUser = await loginWithEmail(identifier, password);
        if (firebaseUser) {
          const registeredUser = users?.find(u => u.email === firebaseUser.email);
          const mappedRole = registeredUser?.role || (role === 'manager' ? 'admin' : 'tenant');
          const mappedRoom = registeredUser?.room || null;
          const mappedName = registeredUser?.name || firebaseUser.displayName || firebaseUser.email.split('@')[0];
          
          login({ name: mappedName, role: mappedRole, email: firebaseUser.email, room: mappedRoom });
          toast.success('Đăng nhập hệ thống (Firebase) thành công!');
          navigate(mappedRole === 'tenant' || mappedRole === 'guest' ? '/tenant-portal' : '/');
          return;
        }
      } catch (fbError) {
        console.warn("Firebase email auth failed, falling back to mock authentication:", fbError.message);
        // If password is wrong or other Auth errors, let it fall through to mock login
      }
    }

    // Fallback Mock Login logic
    if (role === 'manager') {
      const emailToSearch = identifier || 'admin';
      const userToLogin = users?.find(u => u.email === emailToSearch || u.id === emailToSearch || u.id === `usr-${emailToSearch}`);
      
      if (userToLogin) {
        login({ name: userToLogin.name, role: userToLogin.role, email: userToLogin.email });
        navigate('/');
      } else if (emailToSearch === 'admin') {
        // Fallback default admin
        login({ name: 'Admin (Quản lý)', role: 'admin', email: 'admin@gmail.com' });
        navigate('/');
      } else {
        toast.error('Tài khoản quản lý không tồn tại!');
      }
    } else {
      const emailToSearch = identifier || 'khach1@gmail.com';
      const tenant = tenants?.find(t => t.email === emailToSearch);
      if (tenant) {
        // Find if this tenant has a mapped user role
        const mappedUser = users?.find(u => u.email === emailToSearch);
        login({ name: tenant.name, role: mappedUser?.role || 'tenant', room: tenant.room, email: tenant.email });
        navigate('/tenant-portal');
      } else {
        toast.error('Email khách thuê không tồn tại!');
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
                placeholder={role === 'manager' ? 'admin@gmail.com' : 'khach1@gmail.com'}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                <button type="button" onClick={handleGoogleLogin} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
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
