import { useState, useRef } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Save, Settings as SettingsIcon, Zap, Droplets, Shield, CreditCard, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const { settings, setSettings, clearAllData, loadMockData } = useAppData();
  const [formData, setFormData] = useState(settings);
  const [selectedBuilding, setSelectedBuilding] = useState(settings.buildings[0] || 'A');
  const [isDragging, setIsDragging] = useState(false);
  const qrInputRef = useRef(null);

  // Monthly utility entry state
  const now = new Date();
  const defaultMonth = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
  const [utilityMonth, setUtilityMonth] = useState(defaultMonth);
  const [utilityElec, setUtilityElec] = useState('');
  const [utilityWater, setUtilityWater] = useState('');

  const currentMode = formData.prices?.[selectedBuilding]?.utilityCalcMode || 'tenant_only';
  const monthlyUtility = formData.prices?.[selectedBuilding]?.monthlyUtility || {};

  const handleAddMonthlyUtility = () => {
    if (!utilityMonth) { toast.error('Vui lòng chọn tháng!'); return; }
    if (currentMode === 'tenant_only') { toast.error('Chế độ hiện tại không cần nhập chỉ số dịch vụ!'); return; }
    const elec = Number(utilityElec) || 0;
    const water = Number(utilityWater) || 0;
    setFormData(prev => ({
      ...prev,
      prices: {
        ...prev.prices,
        [selectedBuilding]: {
          ...(prev.prices[selectedBuilding] || {}),
          monthlyUtility: {
            ...(prev.prices[selectedBuilding]?.monthlyUtility || {}),
            [utilityMonth]: { elec, water }
          }
        }
      }
    }));
    toast.success(`Đã lưu chỉ số tháng ${utilityMonth} vào bộ nhớ tạm. Nhấn "Lưu Thay Đổi" để xác nhận.`);
  };

  const handleDeleteMonthlyUtility = (monthKey) => {
    setFormData(prev => {
      const newMonthly = { ...(prev.prices[selectedBuilding]?.monthlyUtility || {}) };
      delete newMonthly[monthKey];
      return {
        ...prev,
        prices: {
          ...prev.prices,
          [selectedBuilding]: { ...(prev.prices[selectedBuilding] || {}), monthlyUtility: newMonthly }
        }
      };
    });
  };

  const handleImageUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ.');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 400; // Giới hạn kích thước ảnh QR để Base64 không quá nặng
        
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff'; // Nền trắng cho QR
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // Nén 85%
        
        setFormData(prev => ({
          ...prev,
          prices: {
            ...prev.prices,
            [selectedBuilding]: {
              ...(prev.prices[selectedBuilding] || {}),
              qrImageLink: dataUrl
            }
          }
        }));
        
        toast.success('Đã tải lên & tối ưu hóa ảnh mã QR!');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

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
    const updated = { ...formData };
    if (updated.prices) {
      Object.keys(updated.prices).forEach(b => {
        updated.prices[b] = {
          ...updated.prices[b],
          electricityPrice: Number(updated.prices[b].electricityPrice || 0),
          waterPrice: Number(updated.prices[b].waterPrice || 0),
          serviceFee: Number(updated.prices[b].serviceFee || 0),
          baseRent: Number(updated.prices[b].baseRent || 0),
          baseElectricityPrice: Number(updated.prices[b].baseElectricityPrice || 0),
          baseWaterPrice: Number(updated.prices[b].baseWaterPrice || 0),
          utilityCalcMode: updated.prices[b].utilityCalcMode || 'tenant_only',
          monthlyUtility: updated.prices[b].monthlyUtility || {},
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
              onClick={() => { setSelectedBuilding(b); setUtilityElec(''); setUtilityWater(''); }}
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
        <div className="grid-layout">
          
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
                  <Droplets size={16} /> Giá Nước Gốc (VNĐ/khối)
                </label>
                <input 
                  type="number" 
                  name="baseWaterPrice" 
                  value={formData.prices?.[selectedBuilding]?.baseWaterPrice || ''} 
                  onChange={handlePriceChange} 
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
                />
              </div>

              {/* Monthly Utility Section */}
              <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-glass)', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  <Zap size={16} /> Phương thức tính Điện/Nước Gốc
                </label>

                <select
                  name="utilityCalcMode"
                  value={currentMode}
                  onChange={handlePriceChange}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', appearance: 'auto', marginBottom: '12px', fontFamily: 'inherit' }}
                >
                  <option value="tenant_only" style={{ background: '#1e293b' }}>Chỉ theo hóa đơn khách thuê</option>
                  <option value="add_service" style={{ background: '#1e293b' }}>Cộng thêm điện/nước dịch vụ chung</option>
                  <option value="total_building" style={{ background: '#1e293b' }}>Nhập tổng toàn nhà (đồng hồ tổng)</option>
                </select>

                {currentMode !== 'tenant_only' && (
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px', padding: '8px', background: 'rgba(212,184,149,0.05)', borderRadius: '6px', borderLeft: '3px solid var(--accent-primary)' }}>
                      {currentMode === 'add_service'
                        ? 'Nhập số điện/nước dùng cho hành lang, giặt ủi, dịch vụ chung... mỗi tháng riêng biệt.'
                        : 'Nhập tổng số điện/nước trên đồng hồ tổng của toàn tòa nhà mỗi tháng.'}
                    </div>

                    {/* Monthly entry form */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'end', marginBottom: '12px' }}>
                      <div style={{ flex: '1 1 80px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Tháng</label>
                        <input
                          type="text"
                          placeholder="MM-YYYY"
                          value={utilityMonth}
                          onChange={e => setUtilityMonth(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div style={{ flex: '1 1 80px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                          {currentMode === 'add_service' ? 'Điện DV (kWh)' : 'Tổng Điện (kWh)'}
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={utilityElec}
                          onChange={e => setUtilityElec(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                        />
                      </div>
                      <div style={{ flex: '1 1 80px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                          {currentMode === 'add_service' ? 'Nước DV (m³)' : 'Tổng Nước (m³)'}
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          value={utilityWater}
                          onChange={e => setUtilityWater(e.target.value)}
                          style={{ width: '100%', padding: '8px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddMonthlyUtility}
                        style={{ padding: '8px 12px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', whiteSpace: 'nowrap' }}
                      >
                        <Plus size={16} /> Thêm
                      </button>
                    </div>

                    {/* Monthly history table */}
                    {Object.keys(monthlyUtility).length > 0 && (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
                              <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: '600', borderBottom: '1px solid var(--border-glass)' }}>Tháng</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600', borderBottom: '1px solid var(--border-glass)' }}>Điện (kWh)</th>
                              <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-secondary)', fontWeight: '600', borderBottom: '1px solid var(--border-glass)' }}>Nước (m³)</th>
                              <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-glass)' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(monthlyUtility)
                              .sort(([a], [b]) => {
                                const [am, ay] = a.split('-').map(Number);
                                const [bm, by] = b.split('-').map(Number);
                                return by !== ay ? by - ay : bm - am;
                              })
                              .map(([monthKey, vals]) => (
                                <tr key={monthKey} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                  <td style={{ padding: '8px 10px', color: 'var(--text-primary)', fontWeight: '500' }}>
                                    {(() => { const [m, y] = monthKey.split('-'); return `T${m}/${y}`; })()}
                                  </td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--status-occupied-text)' }}>{vals.elec?.toLocaleString('vi-VN')}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#60a5fa' }}>{vals.water?.toLocaleString('vi-VN')}</td>
                                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMonthlyUtility(monthKey)}
                                      style={{ background: 'transparent', border: 'none', color: 'var(--status-overdue)', cursor: 'pointer', padding: '4px' }}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {Object.keys(monthlyUtility).length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                        Chưa có dữ liệu. Hãy nhập chỉ số tháng đầu tiên ở trên.
                      </div>
                    )}
                  </div>
                )}
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
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', appearance: 'auto', fontFamily: 'inherit' }}
                >
                  <option value="" style={{ background: '#1e293b', color: '#fff' }}>-- Chọn ngân hàng --</option>
                  <option value="MB" style={{ background: '#1e293b', color: '#fff' }}>MBBank (Quân Đội)</option>
                  <option value="VCB" style={{ background: '#1e293b', color: '#fff' }}>Vietcombank</option>
                  <option value="TCB" style={{ background: '#1e293b', color: '#fff' }}>Techcombank</option>
                  <option value="VPB" style={{ background: '#1e293b', color: '#fff' }}>VPBank</option>
                  <option value="ACB" style={{ background: '#1e293b', color: '#fff' }}>ACB (Á Châu)</option>
                  <option value="BIDV" style={{ background: '#1e293b', color: '#fff' }}>BIDV</option>
                  <option value="CTG" style={{ background: '#1e293b', color: '#fff' }}>VietinBank</option>
                  <option value="VBA" style={{ background: '#1e293b', color: '#fff' }}>Agribank</option>
                  <option value="TPB" style={{ background: '#1e293b', color: '#fff' }}>TPBank</option>
                  <option value="STB" style={{ background: '#1e293b', color: '#fff' }}>Sacombank</option>
                  <option value="VIB" style={{ background: '#1e293b', color: '#fff' }}>VIB</option>
                  <option value="HDB" style={{ background: '#1e293b', color: '#fff' }}>HDBank</option>
                  <option value="SHB" style={{ background: '#1e293b', color: '#fff' }}>SHB</option>
                  <option value="MOMO" style={{ background: '#1e293b', color: '#fff' }}>Ví MoMo</option>
                  <option value="VIETTELMONEY" style={{ background: '#1e293b', color: '#fff' }}>Viettel Money</option>
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

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <CreditCard size={16} /> Ảnh Mã QR Cá Nhân (Tùy chọn)
                </label>
                
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) handleImageUpload(e.dataTransfer.files[0]); }}
                  onClick={() => qrInputRef.current.click()}
                  style={{
                    width: '100%', padding: '24px', background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)', 
                    border: isDragging ? '2px dashed #3b82f6' : '2px dashed var(--border-glass)', 
                    borderRadius: '12px', color: 'var(--text-primary)', textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden'
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={qrInputRef} 
                    style={{ display: 'none' }} 
                    onChange={(e) => { if (e.target.files && e.target.files[0]) handleImageUpload(e.target.files[0]); }} 
                  />
                  
                  {formData.prices?.[selectedBuilding]?.qrImageLink ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <img 
                        src={formData.prices?.[selectedBuilding]?.qrImageLink} 
                        alt="QR Mã Thanh toán" 
                        style={{ width: '120px', height: '120px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-glass)', background: '#fff', padding: '4px' }} 
                      />
                      <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 'bold' }}>Nhấp hoặc Kéo thả ảnh mới để thay thế</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: 0.7 }}>
                      <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                        <CreditCard size={32} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '4px' }}>Nhấp để chọn hoặc kéo thả ảnh vào đây</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Tự động tối ưu dung lượng tải lên</div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '12px', position: 'relative' }}>
                  <input 
                    type="text" 
                    name="qrImageLink" 
                    value={formData.prices?.[selectedBuilding]?.qrImageLink || ''} 
                    onChange={handlePriceChange} 
                    placeholder="Hoặc dán Link URL ảnh (https://...) vào đây"
                    style={{ width: '100%', padding: '10px 12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-secondary)', outline: 'none', fontSize: '0.85rem' }} 
                  />
                </div>
                
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Nếu tải lên/dán ảnh, hệ thống sẽ sử dụng ảnh này làm QR chuyển khoản. Nếu để trống, hệ thống dùng VietQR tự động.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 4: Quản Lý Dữ Liệu (Dành cho thử nghiệm) */}
        {(user?.role === 'admin' || user?.email === 'nguyentienducbmt123@gmail.com') && (
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
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
        <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)' }}>
          <Save size={20} /> Lưu Thay Đổi
        </button>
      </div>
    </div>
  );
}
