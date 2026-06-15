import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Save, Settings as SettingsIcon, Zap, Droplets, Shield, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { settings, setSettings } = useAppData();
  const [formData, setFormData] = useState(settings);
  const [selectedBuilding, setSelectedBuilding] = useState(settings.buildings[0] || 'A');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [selectedBuilding]: {
          ...(prev.prices[selectedBuilding] || {}),
          [name]: value
        }
      }
    }));
  };

  const handleSave = () => {
    // Convert string inputs to numbers where appropriate
    const updated = { ...formData };
    
    // Ensure all prices are numbers
    if (updated.prices) {
      Object.keys(updated.prices).forEach(b => {
        updated.prices[b] = {
          electricityPrice: Number(updated.prices[b].electricityPrice || 0),
          waterPrice: Number(updated.prices[b].waterPrice || 0),
          serviceFee: Number(updated.prices[b].serviceFee || 0),
          baseRent: Number(updated.prices[b].baseRent || 0),
          baseElectricityPrice: Number(updated.prices[b].baseElectricityPrice || 0),
          baseWaterPrice: Number(updated.prices[b].baseWaterPrice || 0),
        };
      });
    }

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
        {/* Bảng giá dịch vụ theo Nhà */}
        <div className="card">
          <div className="card-title">Cấu hình Đơn giá mặc định (Theo Nhà)</div>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '8px' }}>
            {formData.buildings.map(b => (
              <button
                key={b}
                onClick={() => setSelectedBuilding(b)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: selectedBuilding === b ? 'var(--accent-primary)' : 'var(--border-glass)',
                  background: selectedBuilding === b ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: selectedBuilding === b ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: selectedBuilding === b ? '600' : 'normal',
                  minWidth: '80px'
                }}
              >
                Nhà {b}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Giá Bán cho khách */}
            <div style={{ padding: '16px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} /> Đơn Giá Thu (Khách Thuê)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Zap size={16} /> Giá Điện (VNĐ/kWh)
                  </label>
                  <input 
                    type="number" 
                    name="electricityPrice" 
                    value={formData.prices?.[selectedBuilding]?.electricityPrice || ''} 
                    onChange={handlePriceChange} 
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
                    value={formData.prices?.[selectedBuilding]?.waterPrice || ''} 
                    onChange={handlePriceChange} 
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
                  />
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Shield size={16} /> Phí Dịch vụ (Rác, Wifi, Quản lý)
                  </label>
                  <input 
                    type="number" 
                    name="serviceFee" 
                    value={formData.prices?.[selectedBuilding]?.serviceFee || ''} 
                    onChange={handlePriceChange} 
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
                  />
                </div>
              </div>
            </div>

            {/* Giá Nhập (Gốc) */}
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '16px', color: 'var(--status-overdue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} /> Đơn Giá Gốc (Chi phí trả chủ)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Giá thuê khoán trả chủ (VNĐ/Tháng)
                  </label>
                  <input 
                    type="number" 
                    name="baseRent" 
                    value={formData.prices?.[selectedBuilding]?.baseRent || ''} 
                    onChange={handlePriceChange} 
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Zap size={16} /> Giá Điện Gốc (VNĐ/kWh)
                  </label>
                  <input 
                    type="number" 
                    name="baseElectricityPrice" 
                    value={formData.prices?.[selectedBuilding]?.baseElectricityPrice || ''} 
                    onChange={handlePriceChange} 
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
                  />
                </div>
                
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <Droplets size={16} /> Giá Nước Gốc (VNĐ/người/tháng)
                  </label>
                  <input 
                    type="number" 
                    name="baseWaterPrice" 
                    value={formData.prices?.[selectedBuilding]?.baseWaterPrice || ''} 
                    onChange={handlePriceChange} 
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
                  />
                </div>
              </div>
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
