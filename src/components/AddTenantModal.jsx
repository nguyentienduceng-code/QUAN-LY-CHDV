import { useState } from 'react';
import { X, User, Phone, CreditCard, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppData } from '../context/AppDataContext';

export default function AddTenantModal({ isOpen, onClose, roomName, onSuccess }) {
  const { addTenant } = useAppData();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [idCard, setIdCard] = useState('');
  const [isRepresentative, setIsRepresentative] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error('Vui lòng nhập Tên và Số điện thoại!');
      return;
    }
    
    addTenant({
      name,
      phone,
      idCard,
      room: roomName,
      isRepresentative,
      status: 'active'
    });
    
    toast.success('Đã khai báo khách cư trú thành công!');
    setName('');
    setPhone('');
    setIdCard('');
    setIsRepresentative(false);
    
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}></div>
      <div style={{ position: 'relative', width: '100%', maxWidth: '420px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Thêm Khách Cư Trú</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <User size={16} /> Họ và Tên (*)
            </label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nhập tên khách thuê" 
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <Phone size={16} /> Số điện thoại (*)
            </label>
            <input 
              type="text" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="VD: 0901234567" 
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <CreditCard size={16} /> CCCD / CMND
            </label>
            <input 
              type="text" 
              value={idCard}
              onChange={e => setIdCard(e.target.value)}
              placeholder="Nhập số CCCD" 
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <input 
              type="checkbox" 
              checked={isRepresentative} 
              onChange={e => setIsRepresentative(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
              <Shield size={16} color="var(--accent-primary)" /> Đặt làm người đại diện phòng
            </div>
          </label>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
              Hủy
            </button>
            <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
              Lưu Thông Tin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
