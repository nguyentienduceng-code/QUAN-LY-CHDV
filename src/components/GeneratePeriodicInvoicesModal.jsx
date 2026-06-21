/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppData } from '../context/AppDataContext';

export default function GeneratePeriodicInvoicesModal({ isOpen, onClose }) {
  const { tenants, rooms, invoices, setInvoices, settings } = useAppData();
  
  const [step, setStep] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // yyyy-MM
  
  const activeTenants = tenants.filter(t => t.status === 'active' || !t.status);
  const [selectedTenantIds, setSelectedTenantIds] = useState([]);
  
  // { tenantId: { elecOld, elecNew, waterOld, waterNew } }
  const [meterIndices, setMeterIndices] = useState({});

  useEffect(() => {
    if (isOpen) {
      setSelectedTenantIds(activeTenants.map(t => t.id));
      setStep(1);
      setMeterIndices({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTenant = (id) => {
    setSelectedTenantIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedTenantIds.length === activeTenants.length) {
      setSelectedTenantIds([]);
    } else {
      setSelectedTenantIds(activeTenants.map(t => t.id));
    }
  };

  const handleNextStep = () => {
    if (selectedTenantIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 phòng để xuất hóa đơn!');
      return;
    }

    const [year, month] = selectedMonth.split('-');
    let prevM = parseInt(month, 10) - 1;
    let prevY = parseInt(year, 10);
    if (prevM === 0) { prevM = 12; prevY--; }
    const prevMonthStr = `${prevM.toString().padStart(2, '0')}-${prevY}`;

    const newIndices = {};
    activeTenants.filter(t => selectedTenantIds.includes(t.id)).forEach(t => {
      const lastInv = invoices.find(inv => inv.tenant === t.name && inv.id.startsWith(`INV-${prevMonthStr}`));
      let elecOld = 0, waterOld = 0;
      if (lastInv && lastInv.items) {
        const elecItem = lastInv.items.find(i => i.id === 2);
        const waterItem = lastInv.items.find(i => i.id === 3);
        if (elecItem) elecOld = elecItem.newIndex || 0;
        if (waterItem) waterOld = waterItem.newIndex || 0;
      }
      newIndices[t.id] = { elecOld, elecNew: elecOld, waterOld, waterNew: waterOld };
    });
    setMeterIndices(newIndices);
    setStep(2);
  };

  const handleMeterChange = (tenantId, field, value) => {
    setMeterIndices(prev => ({
      ...prev,
      [tenantId]: {
        ...prev[tenantId],
        [field]: parseInt(value) || 0
      }
    }));
  };

  const handleGenerate = () => {
    const [year, month] = selectedMonth.split('-');
    const monthStr = `${month}-${year}`;

    const tenantsToGenerate = activeTenants.filter(t => selectedTenantIds.includes(t.id));
    
    const duplicateTenants = tenantsToGenerate.filter(t => {
      return invoices.some(inv => inv.tenant === t.name && inv.id.startsWith(`INV-${monthStr}`));
    });

    let proceedGenerate = true;
    let generateSecondTime = false;

    if (duplicateTenants.length > 0) {
      const dupRooms = duplicateTenants.map(t => t.room).join(', ');
      const msg = `Cảnh báo: Các phòng sau đã có hóa đơn trong tháng ${month}/${year}: ${dupRooms}.\n\nBạn có chắc chắn muốn xuất đè thêm (Hóa đơn lần 2) không?`;
      if (window.confirm(msg)) {
        generateSecondTime = true;
      } else {
        proceedGenerate = false;
      }
    }

    if (!proceedGenerate) return;

    const createdAt = new Date().toLocaleString('vi-VN');

    const newInvoices = tenantsToGenerate.map((t) => {
      const room = rooms.find(r => r.name === t.room);
      const basePrice = room ? room.price : 4000000;
      const bName = room?.building || settings.buildings[0];
      const prices = settings.prices?.[bName] || settings;
      
      const isDup = duplicateTenants.some(dt => dt.id === t.id);
      const noteSuffix = (generateSecondTime && isDup) ? ' - Hóa đơn lần 2' : '';
      
      const indices = meterIndices[t.id] || { elecOld: 0, elecNew: 0, waterOld: 0, waterNew: 0 };
      const elecQty = Math.max(0, indices.elecNew - indices.elecOld);
      
      let waterTotal = prices.waterPrice || 100000;
      let waterQty = 1;
      
      // If water is calculated by meter
      if (indices.waterNew > 0 || indices.waterOld > 0) {
          waterQty = Math.max(0, indices.waterNew - indices.waterOld);
          // if base water price is high like 100,000 it might be per person, but let's just multiply
          waterTotal = waterQty * (prices.waterPrice || 25000);
      }

      const elecTotal = elecQty * (prices.electricityPrice || 3500);

      const items = [
        { id: 1, name: `Tiền phòng (Tháng ${monthStr}${noteSuffix})`, qty: 1, price: basePrice, total: basePrice },
        { id: 2, name: 'Tiền điện', oldIndex: indices.elecOld, newIndex: indices.elecNew, qty: elecQty, price: prices.electricityPrice || 3500, total: elecTotal },
        { id: 3, name: 'Tiền nước', oldIndex: indices.waterOld, newIndex: indices.waterNew, qty: waterQty, price: waterTotal/waterQty || 100000, total: waterTotal },
        { id: 4, name: 'Phí dịch vụ', qty: 1, price: prices.serviceFee || 150000, total: prices.serviceFee || 150000 }
      ];
      
      const totalAmount = items.reduce((acc, curr) => acc + curr.total, 0);
      
      let dueMonth = parseInt(month, 10) + 1;
      let dueYear = parseInt(year, 10);
      if (dueMonth > 12) {
        dueMonth = 1;
        dueYear++;
      }
      const dueDate = `05/${dueMonth.toString().padStart(2, '0')}/${dueYear}`;

      return {
        id: `INV-${monthStr}-${Math.floor(1000 + Math.random() * 9000)}`,
        tenant: t.name,
        room: t.room,
        amount: totalAmount.toLocaleString('vi-VN'),
        due: dueDate,
        status: 'unpaid',
        createdAt,
        items
      };
    });

    setInvoices(prev => [...newInvoices, ...prev]);
    toast.success(`Đã tạo thành công ${newInvoices.length} hóa đơn tháng ${monthStr}!`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}></div>
      <div style={{ position: 'relative', width: '100%', maxWidth: step === 1 ? '500px' : '900px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', transition: 'max-width 0.3s ease' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {step === 2 && (
              <button onClick={() => setStep(1)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={20} color="var(--text-primary)" />
              </button>
            )}
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{step === 1 ? 'Xuất Hóa Đơn Định Kỳ' : 'Chốt Điện Nước Hàng Loạt'}</h2>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {step === 1 ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Chọn Tháng Hóa Đơn</label>
                <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(e.target.value)} 
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Danh sách phòng hoạt động</label>
                  <button onClick={toggleAll} style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    {selectedTenantIds.length === activeTenants.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                  {activeTenants.map(t => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedTenantIds.includes(t.id)} 
                        onChange={() => toggleTenant(t.id)} 
                        style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }} 
                      />
                      <div>
                        <div style={{ fontWeight: '600' }}>Phòng {t.room}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t.name}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Hệ thống đã tự động lấy chỉ số Mới của tháng trước điền vào ô chỉ số Cũ của tháng này. Vui lòng nhập chỉ số Mới để hoàn tất.
              </div>
              <table style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '2px solid var(--border-glass)' }}>
                  <tr>
                    <th style={{ padding: '12px', fontWeight: '600' }}>Phòng</th>
                    <th style={{ padding: '12px', fontWeight: '600', color: 'var(--accent-primary)' }}>⚡ Điện CS Cũ</th>
                    <th style={{ padding: '12px', fontWeight: '600', color: 'var(--accent-primary)' }}>⚡ Điện CS Mới</th>
                    <th style={{ padding: '12px', fontWeight: '600', color: '#3b82f6' }}>💧 Nước CS Cũ</th>
                    <th style={{ padding: '12px', fontWeight: '600', color: '#3b82f6' }}>💧 Nước CS Mới</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTenants.filter(t => selectedTenantIds.includes(t.id)).map((t, idx) => {
                    const indices = meterIndices[t.id] || {};
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid var(--border-glass)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{t.room}</td>
                        <td style={{ padding: '12px' }}>
                          <input 
                            type="number" 
                            value={indices.elecOld || ''} 
                            onChange={e => handleMeterChange(t.id, 'elecOld', e.target.value)}
                            style={{ width: '80px', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input 
                            type="number" 
                            value={indices.elecNew || ''} 
                            onChange={e => handleMeterChange(t.id, 'elecNew', e.target.value)}
                            style={{ width: '80px', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--accent-primary)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input 
                            type="number" 
                            value={indices.waterOld || ''} 
                            onChange={e => handleMeterChange(t.id, 'waterOld', e.target.value)}
                            style={{ width: '80px', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input 
                            type="number" 
                            value={indices.waterNew || ''} 
                            onChange={e => handleMeterChange(t.id, 'waterNew', e.target.value)}
                            style={{ width: '80px', padding: '8px', background: 'var(--bg-card)', border: '1px solid #3b82f6', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {step === 1 && <>Đã chọn: <span style={{ fontWeight: 'bold', color: 'var(--status-occupied)' }}>{selectedTenantIds.length}</span> phòng</>}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Hủy</button>
            {step === 1 ? (
              <button onClick={handleNextStep} style={{ padding: '10px 20px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Tiếp theo: Chốt Điện Nước</button>
            ) : (
              <button onClick={handleGenerate} style={{ padding: '10px 20px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Hoàn Tất & Sinh Hóa Đơn</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
