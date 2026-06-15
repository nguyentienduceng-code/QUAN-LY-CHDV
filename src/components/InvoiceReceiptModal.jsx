import { X, Printer, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function InvoiceReceiptModal({ isOpen, onClose, invoice }) {
  const { user } = useAuth();
  if (!isOpen || !invoice) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}></div>
      <div style={{ position: 'relative', width: '450px', background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        {/* Header - Receipt Style */}
        <div style={{ padding: '24px 24px 16px', textAlign: 'center', borderBottom: '2px dashed #cbd5e1', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', fontWeight: '800', textTransform: 'uppercase' }}>Phiếu Thu Tiền</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Căn hộ Dịch Vụ - Tòa nhà A</p>
          <div style={{ marginTop: '16px', fontSize: '0.9rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Khách hàng:</span>
              <span style={{ fontWeight: '600' }}>{invoice.tenant}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Phòng:</span>
              <span style={{ fontWeight: '600' }}>{invoice.room}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Mã HĐ:</span>
              <span style={{ fontWeight: '600' }}>{invoice.id}</span>
            </div>
          </div>
        </div>

        {/* Body - Items */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontFamily: 'monospace', fontSize: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px', fontSize: '12px' }}>
            <span style={{ flex: 2 }}>Nội dung</span>
            <span style={{ flex: 0.8, textAlign: 'center' }}>SL</span>
            <span style={{ flex: 1.2, textAlign: 'right' }}>Đơn giá</span>
            <span style={{ flex: 1.5, textAlign: 'right' }}>Thành tiền</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            {(invoice.items || []).map((item, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ flex: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                <span style={{ flex: 0.8, textAlign: 'center' }}>{item.qty}</span>
                <span style={{ flex: 1.2, textAlign: 'right' }}>{item.price?.toLocaleString('vi-VN')}</span>
                <span style={{ flex: 1.5, textAlign: 'right' }}>{item.total?.toLocaleString('vi-VN')}</span>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>TỔNG CỘNG:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>{invoice.amount} đ</span>
          </div>
          
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
            <span style={{ color: '#64748b' }}>Hạn thanh toán:</span>
            <span style={{ fontWeight: '600', color: '#ef4444' }}>{invoice.due}</span>
          </div>
        </div>

        {/* Footer Actions */}
        {user?.role === 'manager' ? (
          <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', display: 'flex', gap: '12px' }}>
            <button style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Printer size={16} /> In Biên Lai
            </button>
            <button style={{ flex: 1, padding: '10px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Send size={16} /> Gửi Khách
            </button>
          </div>
        ) : (
          <div style={{ padding: '8px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}></div>
        )}
      </div>
    </div>
  );
}
