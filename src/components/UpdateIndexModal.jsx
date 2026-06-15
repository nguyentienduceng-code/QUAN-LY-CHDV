import { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppData } from '../context/AppDataContext';

export default function UpdateIndexModal({ isOpen, onClose, invoice }) {
  const { updateInvoice } = useAppData();
  
  const [elecOld, setElecOld] = useState(0);
  const [elecNew, setElecNew] = useState(0);
  const [waterOld, setWaterOld] = useState(0);
  const [waterNew, setWaterNew] = useState(0);

  useEffect(() => {
    if (invoice && invoice.items) {
      const elecItem = invoice.items.find(i => i.id === 2);
      const waterItem = invoice.items.find(i => i.id === 3);
      setElecOld(elecItem?.oldIndex || 0);
      setElecNew(elecItem?.newIndex || 0);
      setWaterOld(waterItem?.oldIndex || 0);
      setWaterNew(waterItem?.newIndex || 0);
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const handleSave = () => {
    let newTotal = 0;
    const newItems = invoice.items.map(item => {
      let finalItem = { ...item };
      if (item.id === 2) {
        finalItem.oldIndex = elecOld;
        finalItem.newIndex = elecNew;
        finalItem.qty = Math.max(0, elecNew - elecOld);
        finalItem.total = finalItem.qty * finalItem.price;
      }
      if (item.id === 3) {
        finalItem.oldIndex = waterOld;
        finalItem.newIndex = waterNew;
        finalItem.qty = Math.max(0, waterNew - waterOld);
        finalItem.total = finalItem.qty * finalItem.price;
      }
      newTotal += finalItem.total;
      return finalItem;
    });

    updateInvoice(invoice.id, { items: newItems, amount: newTotal.toLocaleString('vi-VN') });
    toast.success(`Đã chốt số điện nước cho ${invoice.id}!`);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}></div>
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', padding: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Chốt Số Điện Nước</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{invoice.id} - Phòng {invoice.room}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--accent-primary)' }}>⚡ Điện</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>CS Cũ</label>
              <input type="number" value={elecOld || ''} onChange={e => setElecOld(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>CS Mới</label>
              <input type="number" value={elecNew || ''} onChange={e => setElecNew(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontWeight: '600', marginBottom: '12px', color: '#3b82f6' }}>💧 Nước</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>CS Cũ</label>
              <input type="number" value={waterOld || ''} onChange={e => setWaterOld(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>CS Mới</label>
              <input type="number" value={waterNew || ''} onChange={e => setWaterNew(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Hủy</button>
          <button onClick={handleSave} style={{ padding: '10px 16px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} /> Chốt Số & Tính Lại
          </button>
        </div>

      </div>
    </div>
  );
}
