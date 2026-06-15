import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Save, Settings as SettingsIcon, Zap, Droplets, Shield, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { settings, setSettings } = useAppData();
  const [formData, setFormData] = useState(settings);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Convert string inputs to numbers where appropriate
    const updated = {
      ...formData,
      electricityPrice: Number(formData.electricityPrice),
      waterPrice: Number(formData.waterPrice),
      serviceFee: Number(formData.serviceFee)
    };
    setSettings(updated);
    toast.success('Đã lưu cấu hình chung thành công!');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <SettingsIcon size={24} />
        </div>
        <h1 className="page-title" style={{ margin: 0 }}>Cài đặt & Cấu hình</h1>
      </div>

      <div className="grid-layout">
        {/* Bảng giá dịch vụ mặc định */}
        <div className="card">
          <div className="card-title">Cấu hình Đơn giá mặc định</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Zap size={16} /> Giá Điện (VNĐ/kWh)
              </label>
              <input 
                type="number" 
                name="electricityPrice" 
                value={formData.electricityPrice} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
              />
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Droplets size={16} /> Giá Nước (VNĐ/người/tháng)
              </label>
              <input 
                type="number" 
                name="waterPrice" 
                value={formData.waterPrice} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
              />
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Shield size={16} /> Phí Dịch vụ (Rác, Wifi, Quản lý)
              </label>
              <input 
                type="number" 
                name="serviceFee" 
                value={formData.serviceFee} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
              />
            </div>
          </div>
        </div>

        {/* Cấu hình Thanh toán / VietQR */}
        <div className="card">
          <div className="card-title">Cấu hình Thanh toán (VietQR)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <CreditCard size={16} /> Tên Ngân Hàng (VD: MB, VCB, ACB)
              </label>
              <input 
                type="text" 
                name="bankName" 
                value={formData.bankName} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
              />
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <CreditCard size={16} /> Số Tài Khoản
              </label>
              <input 
                type="text" 
                name="bankAccount" 
                value={formData.bankAccount} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
              />
            </div>
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <CreditCard size={16} /> Tên Chủ Tài Khoản (Không dấu)
              </label>
              <input 
                type="text" 
                name="bankOwner" 
                value={formData.bankOwner} 
                onChange={handleChange} 
                style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', textTransform: 'uppercase' }} 
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)' }}>
          <Save size={20} /> Lưu Thay Đổi
        </button>
      </div>
    </div>
  );
}
