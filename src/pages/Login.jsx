import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { UserCircle, KeySquare, ChevronRight, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [role, setRole] = useState('manager'); // 'manager' | 'tenant'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration States
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const { user, login, loginWithGoogle, loginWithEmail, signUpWithEmail } = useAuth();
  const appData = useAppData();
  const { tenants, users } = appData;
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast.success('Đăng nhập qua Google thành công!');
      // Navigation is handled by the useEffect watching user state
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/configuration-not-found' || error.message.includes('CONFIGURATION_NOT_FOUND') || error.code === 'auth/invalid-api-key') {
        toast.success('Đã vào Chế độ Demo: Đăng nhập Google thành công!');
        if (role === 'manager') {
          login({ name: 'Quản Lý Demo Google', role: 'admin', email: 'admin.google@gmail.com', ownerId: 'demo-google' });
          navigate('/');
        } else {
          login({ name: 'Khách Demo Google', role: 'tenant', room: 'P.VIP', email: 'khach.google@gmail.com', ownerId: 'demo-google' });
          navigate('/tenant-portal');
        }
      } else {
        toast.error('Lỗi: ' + error.message);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      toast.error('Vui lòng nhập Email đăng nhập!');
      return;
    }
    
    // Try Firebase Email/Password Sign-in if credentials provided
    if (identifier) {
      try {
        const firebaseUser = await loginWithEmail(identifier, password);
        if (firebaseUser) {
          const registeredUser = users?.find(u => u.email === firebaseUser.email);
          const mappedRole = registeredUser?.role || 'guest';
          const mappedRoom = registeredUser?.room || null;
          const mappedName = registeredUser?.name || firebaseUser.displayName || firebaseUser.email.split('@')[0];
          const mappedOwnerId = registeredUser?.ownerId || firebaseUser.uid;
          
          login({ name: mappedName, role: mappedRole, email: firebaseUser.email, room: mappedRoom, ownerId: mappedOwnerId });
          toast.success('Đăng nhập hệ thống thành công!');
          return;
        }
      } catch (fbError) {
        console.warn("Firebase email auth failed:", fbError.message);
        const errStr = fbError.code?.toLowerCase() + " " + fbError.message?.toLowerCase();
        if (errStr.includes('configuration-not-found') || errStr.includes('invalid-api-key') || errStr.includes('api-key-not-valid')) {
          // Firebase not configured, let it fall through to mock login
          console.warn("Sử dụng Mock Authentication do Firebase chưa cấu hình.");
        } else {
          // Real Auth error (wrong password, user not found, invalid email, etc.)
          toast.error('Đăng nhập thất bại: Vui lòng kiểm tra lại Email và Mật khẩu!');
          return; // Chặn không cho rơi xuống mock login
        }
      }
    }

    // Fallback Mock Login logic
    if (role === 'manager') {
      const emailToSearch = identifier || 'admin';
      const userToLogin = users?.find(u => u.email === emailToSearch || u.id === emailToSearch || u.id === `usr-${emailToSearch}`);
      
      if (userToLogin) {
        login({ name: userToLogin.name, role: userToLogin.role, email: userToLogin.email, ownerId: userToLogin.ownerId || userToLogin.uid || 'demo-admin' });
        navigate('/');
      } else if (emailToSearch === 'admin') {
        // Fallback default admin
        login({ name: 'Admin (Quản lý)', role: 'admin', email: 'admin@gmail.com', ownerId: 'demo-admin' });
        navigate('/');
      } else if (emailToSearch === 'nguyentienducbmt123@gmail.com') {
        login({ name: 'Super Admin', role: 'admin', email: 'nguyentienducbmt123@gmail.com', ownerId: 'demo-admin' });
        navigate('/');
      } else {
        toast.error('Tài khoản quản lý không tồn tại trên dữ liệu mẫu!');
      }
    } else {
      const emailToSearch = identifier || 'khach1@gmail.com';
      const tenant = tenants?.find(t => t.email === emailToSearch);
      if (tenant) {
        // Find if this tenant has a mapped user role
        const mappedUser = users?.find(u => u.email === emailToSearch);
        login({ name: tenant.name, role: mappedUser?.role || 'tenant', room: tenant.room, email: tenant.email, ownerId: tenant.ownerId || mappedUser?.ownerId || 'demo-tenant' });
        navigate('/tenant-portal');
      } else {
        toast.error('Email khách thuê không tồn tại!');
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim()) {
      toast.error('Vui lòng nhập họ và tên!');
      return;
    }
    if (!regEmail.trim()) {
      toast.error('Vui lòng nhập email!');
      return;
    }
    if (regPassword.length < 6) {
      toast.error('Mật khẩu phải từ 6 ký tự trở lên!');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      const newUser = await signUpWithEmail(regEmail.trim(), regPassword, regName.trim());
      toast.success('Đăng ký tài khoản mới thành công!');
    } catch (error) {
      console.error(error);
      toast.error('Đăng ký thất bại: ' + (error.message || 'Lỗi không xác định'));
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
            {isRegistering ? 'Đăng Ký CHDV' : 'Quản Lý CHDV'}
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            {isRegistering ? 'Tạo tài khoản quản lý & khách thuê' : 'Hệ thống Quản lý Bất động sản'}
          </p>
        </div>

        {!isRegistering ? (
          <>
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
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Quên mật khẩu? Liên hệ Quản trị viên</span>
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

              <div style={{ position: 'relative', textAlign: 'center', margin: '16px 0' }}>
                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderBottom: '1px solid var(--border-glass)' }}></div>
                <span style={{ position: 'relative', background: 'rgba(10, 14, 26, 0.7)', padding: '0 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>hoặc</span>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  background: 'rgba(255,255,255,0.05)', 
                  color: 'var(--text-primary)', 
                  border: '1px solid var(--border-glass)', 
                  borderRadius: '12px', 
                  fontSize: '1rem', 
                  fontWeight: '500', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                  transition: '0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Đăng nhập bằng Google
              </button>
              
              <div style={{ marginTop: '24px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsRegistering(true)} 
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    background: 'rgba(234, 179, 8, 0.1)', 
                    color: 'var(--accent-primary)', 
                    border: '1px solid var(--accent-primary)', 
                    borderRadius: '12px', 
                    fontSize: '1rem', 
                    fontWeight: '500', 
                    cursor: 'pointer',
                    transition: '0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(234, 179, 8, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(234, 179, 8, 0.1)';
                  }}
                >
                  Chưa có tài khoản? <span style={{ fontWeight: 'bold' }}>Đăng ký ngay</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Họ và tên</label>
              <div style={{ position: 'relative' }}>
                <UserCircle size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  placeholder="Nguyễn Văn A"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none' }} 
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email đăng ký</label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input 
                  type="email" 
                  placeholder="username@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none' }} 
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <KeySquare size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  placeholder="Tối thiểu 6 ký tự"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none' }} 
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Xác nhận mật khẩu</label>
              <div style={{ position: 'relative' }}>
                <KeySquare size={20} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
                <input 
                  type="password" 
                  placeholder="Nhập lại mật khẩu"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 40px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '12px', color: '#fff', fontSize: '1rem', outline: 'none' }} 
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              style={{ 
                width: '100%', 
                padding: '14px', 
                background: 'var(--accent-primary)', 
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
              Đăng Ký Ngay <ChevronRight size={18} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Đã có tài khoản? <a href="#" onClick={(e) => { e.preventDefault(); setIsRegistering(false); }} style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>Đăng nhập ngay</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
