import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { ShieldAlert, User, Key, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DevBackdoor() {
  const [isOpen, setIsOpen] = useState(false);
  const { login } = useAuth();
  const { clearAllData, loadMockData } = useAppData();

  const handleQuickLogin = (roleName) => {
    let userData = {};
    if (roleName === 'admin') {
      userData = { name: 'Admin Master', role: 'admin', email: 'admin@gmail.com' };
    } else if (roleName === 'staff') {
      userData = { name: 'Nhân viên Vận hành', role: 'staff', email: 'staff@gmail.com' };
    } else if (roleName === 'tenant') {
      userData = { name: 'Nguyễn Văn Khách', role: 'tenant', room: '101', email: 'khach1@gmail.com' };
    } else if (roleName === 'viewer') {
      userData = { name: 'Nhà đầu tư', role: 'viewer', email: 'investor@gmail.com' };
    }

    login(userData);
    toast.success(`Đăng nhập nhanh: ${userData.name} (${roleName.toUpperCase()})`);
    setIsOpen(false);
    
    // Redirect based on role
    if (roleName === 'tenant') {
      window.location.href = '/tenant-portal';
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '80px', right: '20px', zIndex: 99999 }}>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.3s'
        }}
        title="Developer Backdoor Panel"
      >
        <ShieldAlert size={20} />
      </button>

      {/* Backdoor Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '55px',
          right: 0,
          width: '240px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ef4444', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '8px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Key size={14} /> CỬA SAU DEV (QUICK LOGIN)
          </div>
          
          <button onClick={() => handleQuickLogin('admin')} style={btnStyle}>
            <Key size={14} color="var(--status-overdue)" /> Vai Admin (Quản lý)
          </button>
          
          <button onClick={() => handleQuickLogin('staff')} style={btnStyle}>
            <User size={14} color="var(--accent-primary)" /> Vai Staff (Nhân viên)
          </button>
          
          <button onClick={() => handleQuickLogin('tenant')} style={btnStyle}>
            <Users size={14} color="var(--status-occupied)" /> Vai Tenant (Khách thuê)
          </button>
          
          <button onClick={() => handleQuickLogin('viewer')} style={btnStyle}>
            <User size={14} color="#8b5cf6" /> Vai Viewer (Nhà đầu tư)
          </button>

          <div style={{ borderTop: '1px solid var(--border-glass)', marginTop: '8px', paddingTop: '8px', display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => {
                if (window.confirm("Xóa trắng tất cả cơ sở dữ liệu?")) {
                  clearAllData();
                  toast.success("Đã xóa dữ liệu");
                  setIsOpen(false);
                }
              }} 
              style={{ ...btnStyle, flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', justifyContent: 'center' }}
            >
              Xóa DB
            </button>
            <button 
              onClick={() => {
                loadMockData();
                toast.success("Đã nạp dữ liệu mẫu");
                setIsOpen(false);
              }} 
              style={{ ...btnStyle, flex: 1, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', justifyContent: 'center' }}
            >
              Nạp Mẫu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 12px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid var(--border-glass)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.85rem',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.2s',
  fontWeight: '500',
  width: '100%',
  boxSizing: 'border-box'
};
