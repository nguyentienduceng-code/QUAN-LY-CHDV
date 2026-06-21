import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Save, Settings as SettingsIcon, Zap, Droplets, Shield, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { settings, setSettings, clearAllData, loadMockData } = useAppData();
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
      <div className="page-header" style={{ alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            <SettingsIcon size={24} />
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>Cài đặt & Cấu hình</h1>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexDirection: 'column' }}>
        {/* Mobile/Desktop responsive tab layout */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
          {formData.buildings.map(b => (
            <button
              key={b}
              onClick={() => setSelectedBuilding(b)}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedBuilding === b ? 'var(--accent-primary)' : 'var(--border-glass)',
                background: selectedBuilding === b ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: selectedBuilding === b ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: '600',
                minWidth: '100px',
                transition: '0.2s',
                boxShadow: selectedBuilding === b ? '0 4px 12px rgba(212, 184, 149, 0.2)' : 'none'
              }}
            >
              Cấu hình Nhà {b}
            </button>
          ))}
        </div>

        {/* 3 Panels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          
          {/* Panel 1: Đơn Giá Gốc */}
          <div className="card" style={{ borderTop: '4px solid var(--status-overdue)' }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-overdue)' }}>
              <Shield size={20} /> Đơn Giá Gốc (Chi phí trả chủ)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div>
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

          {/* Panel 2: Đơn Giá Thu */}
          <div className="card" style={{ borderTop: '4px solid var(--accent-primary)' }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
              <Zap size={20} /> Đơn Giá Thu (Khách Thuê)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
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
              
              <div>
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

          {/* Panel 3: Cấu hình Thanh toán */}
          <div className="card" style={{ borderTop: '4px solid #3b82f6' }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
              <CreditCard size={20} /> Cấu hình Thanh toán (VietQR)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <CreditCard size={16} /> Tên Ngân Hàng (VD: MB, VCB)
                </label>
                <select 
                  name="bankName" 
                  value={formData.prices?.[selectedBuilding]?.bankName || ''} 
                  onChange={handlePriceChange} 
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', appearance: 'none' }}
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  <option value="MB">MBBank (Quân Đội)</option>
                  <option value="VCB">Vietcombank</option>
                  <option value="TCB">Techcombank</option>
                  <option value="VPB">VPBank</option>
                  <option value="ACB">ACB (Á Châu)</option>
                  <option value="BIDV">BIDV</option>
                  <option value="CTG">VietinBank</option>
                  <option value="VBA">Agribank</option>
                  <option value="TPB">TPBank</option>
                  <option value="STB">Sacombank</option>
                  <option value="VIB">VIB</option>
                  <option value="HDB">HDBank</option>
                  <option value="SHB">SHB</option>
                  <option value="MOMO">Ví MoMo</option>
                  <option value="VIETTELMONEY">Viettel Money</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <CreditCard size={16} /> Số Tài Khoản
                </label>
                <input 
                  type="text" 
                  name="bankAccount" 
                  value={formData.prices?.[selectedBuilding]?.bankAccount || ''} 
                  onChange={handlePriceChange} 
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
                />
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <CreditCard size={16} /> Tên Chủ TK (Không dấu)
                </label>
                <input 
                  type="text" 
                  name="bankOwner" 
                  value={formData.prices?.[selectedBuilding]?.bankOwner || ''} 
                  onChange={handlePriceChange} 
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', textTransform: 'uppercase' }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel 4: Quản Lý Dữ Liệu (Dành cho thử nghiệm) */}
        <div className="card" style={{ borderTop: '4px solid var(--status-unpaid)', marginTop: '8px' }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-unpaid)' }}>
            <SettingsIcon size={20} /> Quản Lý Dữ Liệu (Thử nghiệm)
          </div>
          <p style={{ margin: '16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Khu vực này dùng để làm sạch hoặc tạo bộ dữ liệu mẫu phục vụ cho việc dùng thử hệ thống.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              onClick={() => {
                if (window.confirm('CẢNH BÁO: Thao tác này sẽ XÓA TOÀN BỘ dữ liệu Khách, Phòng, Hóa đơn đang có. Bạn chắc chắn chứ?')) {
                  clearAllData();
                  toast.success('Đã làm trống toàn bộ dữ liệu hệ thống!');
                }
              }}
              style={{ padding: '10px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px dashed var(--status-unpaid)', color: 'var(--status-unpaid)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
            >
              Xóa Trắng Dữ Liệu
            </button>
            <button 
              type="button" 
              onClick={() => {
                loadMockData();
                toast.success('Đã nạp bộ dữ liệu mẫu thành công!');
              }}
              style={{ padding: '10px 16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
            >
              Nạp Dữ Liệu Mẫu
            </button>
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
