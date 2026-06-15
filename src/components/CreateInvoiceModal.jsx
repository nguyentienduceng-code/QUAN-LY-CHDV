import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';

export default function CreateInvoiceModal({ isOpen, onClose, onSave }) {
  const { tenants, rooms, settings } = useAppData();
  
  const [tenant, setTenant] = useState(tenants[0]?.name || '');
  const [room, setRoom] = useState(tenants[0]?.room || '');
  
  const currentMonthInput = new Date().toISOString().slice(0, 7); // yyyy-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonthInput);

  const initialBuilding = rooms.find(r => r.name === tenants[0]?.room)?.building || settings.buildings[0];
  const initialPrices = settings.prices?.[initialBuilding] || settings;

  const [items, setItems] = useState([
    { id: 1, name: 'Tiền phòng', qty: 1, price: 4000000 },
    { id: 2, name: 'Tiền điện (Chỉ số: 0 - 0)', qty: 0, price: initialPrices.electricityPrice || 3500 },
    { id: 3, name: 'Tiền nước (Chỉ số: 0 - 0)', qty: 0, price: initialPrices.waterPrice || 100000 },
    { id: 4, name: 'Phí dịch vụ', qty: 1, price: initialPrices.serviceFee || 150000 }
  ]);

  const [elecOld, setElecOld] = useState(0);
  const [elecNew, setElecNew] = useState(0);
  const [waterOld, setWaterOld] = useState(0);
  const [waterNew, setWaterNew] = useState(0);

  if (!isOpen) return null;

  const handleTenantChange = (tenantName) => {
    setTenant(tenantName);
    const t = tenants.find(x => x.name === tenantName);
    if (t) {
      setRoom(t.room);
      // Find room price and building
      const roomInfo = rooms.find(r => r.name === t.room);
      const bName = roomInfo?.building || settings.buildings[0];
      const prices = settings.prices?.[bName] || settings;

      setItems(prev => prev.map(item => {
        if (item.id === 1) return { ...item, price: roomInfo?.price || 4000000 };
        if (item.id === 2) return { ...item, price: prices.electricityPrice || 3500 };
        if (item.id === 3) return { ...item, price: prices.waterPrice || 100000 };
        if (item.id === 4) return { ...item, price: prices.serviceFee || 150000 };
        return item;
      }));
    }
  };

  const handleMeterChange = (type, field, val) => {
    const value = parseInt(val) || 0;
    if (type === 'elec') {
      if (field === 'old') setElecOld(value);
      if (field === 'new') setElecNew(value);
    } else {
      if (field === 'old') setWaterOld(value);
      if (field === 'new') setWaterNew(value);
    }
    
    // Update items array directly to avoid useEffect timing issues
    setItems(prev => prev.map(item => {
      if (item.id === 2 && type === 'elec') {
        const o = field === 'old' ? value : elecOld;
        const n = field === 'new' ? value : elecNew;
        return { ...item, qty: Math.max(0, n - o), name: `Tiền điện (Chỉ số: ${o} - ${n})` };
      }
      if (item.id === 3 && type === 'water') {
        const o = field === 'old' ? value : waterOld;
        const n = field === 'new' ? value : waterNew;
        return { ...item, qty: Math.max(0, n - o), name: `Tiền nước (Chỉ số: ${o} - ${n})` };
      }
      return item;
    }));
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), name: 'Khoản phí khác', qty: 1, price: 0 }]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  };

  const handleSave = () => {
    const finalItems = items.map(item => ({ ...item, total: item.qty * item.price }));
    const amount = calculateTotal().toLocaleString('vi-VN');
    
    const [year, month] = selectedMonth.split('-');
    let dueMonth = parseInt(month, 10) + 1;
    let dueYear = parseInt(year, 10);
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear++;
    }
    const dueDate = `05/${dueMonth.toString().padStart(2, '0')}/${dueYear}`;
    const invoiceId = `INV-${month}-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

    onSave({ id: invoiceId, tenant, room, amount, items: finalItems, due: dueDate });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}></div>
      <div style={{ position: 'relative', width: '100%', maxWidth: '600px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--border-glass)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Tạo Hóa Đơn Mới</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tháng Hóa Đơn</label>
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)} 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', colorScheme: 'dark' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Khách Thuê</label>
              <select 
                value={tenant} 
                onChange={e => handleTenantChange(e.target.value)} 
                style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
              >
                {tenants.map(t => <option key={t.id} value={t.name} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{t.name} ({t.room})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phòng</label>
              <input type="text" value={room} readOnly style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-secondary)', outline: 'none' }} />
            </div>
          </div>

          <div style={{ marginBottom: '16px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Chỉ số Điện / Nước</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--accent-primary)' }}>⚡ Điện</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CS Cũ</label>
                  <input type="number" value={elecOld} onChange={e => handleMeterChange('elec', 'old', e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CS Mới</label>
                  <input type="number" value={elecNew} onChange={e => handleMeterChange('elec', 'new', e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '12px', color: '#3b82f6' }}>💧 Nước</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CS Cũ</label>
                  <input type="number" value={waterOld} onChange={e => handleMeterChange('water', 'old', e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CS Mới</label>
                  <input type="number" value={waterNew} onChange={e => handleMeterChange('water', 'new', e.target.value)} style={{ width: '100%', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Chi tiết các khoản thu</span>
            <button onClick={handleAddItem} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
              <Plus size={14} /> Thêm Dòng
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="text" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Tên khoản phí" style={{ flex: 2, padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }} disabled={item.id === 2 || item.id === 3} />
                <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)} placeholder="SL" style={{ flex: 1, padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }} disabled={item.id === 2 || item.id === 3} />
                <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} placeholder="Đơn giá" style={{ flex: 1.5, padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }} />
                <div style={{ flex: 1.5, textAlign: 'right', fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                  {(item.qty * item.price).toLocaleString('vi-VN')} đ
                </div>
                <button onClick={() => handleRemoveItem(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--status-overdue)', cursor: 'pointer', padding: '4px' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Tổng Cộng:</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--status-occupied)' }}>{calculateTotal().toLocaleString('vi-VN')} đ</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Hủy</button>
          <button onClick={handleSave} style={{ padding: '10px 20px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Lưu & Tạo Hóa Đơn</button>
        </div>
      </div>
    </div>
  );
}
