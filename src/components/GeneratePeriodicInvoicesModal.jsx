/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppData } from '../context/AppDataContext';

export default function GeneratePeriodicInvoicesModal({ isOpen, onClose }) {
  const { tenants, rooms, invoices, setInvoices, settings } = useAppData();
  
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7)); // yyyy-MM
  
  const activeTenants = tenants.filter(t => t.status === 'active' || !t.status);
  const [selectedTenantIds, setSelectedTenantIds] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTenantIds(activeTenants.map(t => t.id));
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

  const handleGenerate = () => {
    if (selectedTenantIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 phòng để xuất hóa đơn!');
      return;
    }

    const [year, month] = selectedMonth.split('-');
    const monthStr = `${month}-${year}`;

    const tenantsToGenerate = activeTenants.filter(t => selectedTenantIds.includes(t.id));
    
    // Check duplicates
    const duplicateTenants = tenantsToGenerate.filter(t => {
      // Find if there is an invoice starting with INV-MM-YYYY for this tenant
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

    const newInvoices = tenantsToGenerate.map((t) => {
      const room = rooms.find(r => r.name === t.room);
      const basePrice = room ? room.price : 4000000;
      
      const isDup = duplicateTenants.some(dt => dt.id === t.id);
      const noteSuffix = (generateSecondTime && isDup) ? ' - Hóa đơn lần 2' : '';
      
      const items = [
        { name: `Tiền phòng (Tháng ${monthStr}${noteSuffix})`, qty: 1, price: basePrice, total: basePrice },
        { name: 'Tiền điện (Chỉ số: --)', qty: 0, price: settings.electricityPrice || 3500, total: 0 },
        { name: 'Tiền nước', qty: 1, price: settings.waterPrice || 100000, total: settings.waterPrice || 100000 },
        { name: 'Phí dịch vụ', qty: 1, price: settings.serviceFee || 150000, total: settings.serviceFee || 150000 }
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
      <div style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--border-glass)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Xuất Hóa Đơn Định Kỳ</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
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
        </div>

        {/* Footer */}
        <div style={{ padding: '20px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Đã chọn: <span style={{ fontWeight: 'bold', color: 'var(--status-occupied)' }}>{selectedTenantIds.length}</span> phòng
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Hủy</button>
            <button onClick={handleGenerate} style={{ padding: '10px 20px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Sinh Hóa Đơn</button>
          </div>
        </div>
      </div>
    </div>
  );
}
