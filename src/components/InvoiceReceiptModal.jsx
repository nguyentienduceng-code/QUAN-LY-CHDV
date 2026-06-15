import { X, Printer, Send, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

export default function InvoiceReceiptModal({ isOpen, onClose, invoice }) {
  const { user } = useAuth();
  const { settings, rooms } = useAppData();
  if (!isOpen || !invoice) return null;

  // Extract raw number from amount string (e.g. "4.500.000" -> 4500000)
  const numericAmount = parseInt(invoice.amount.replace(/\./g, ''), 10) || 0;
  
  // Find building config for this invoice's room
  const room = rooms?.find(r => r.name === invoice.room);
  const building = room ? room.building : (settings.buildings[0] || 'A');
  const bConfig = settings.prices?.[building] || {};
  const bankName = bConfig.bankName || 'MB';
  const bankAccount = bConfig.bankAccount || '0901234567';
  const bankOwner = bConfig.bankOwner || 'NGUYEN VAN A';

  // Generate VietQR URL
  const qrUrl = `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.png?amount=${numericAmount}&addInfo=${encodeURIComponent(`Thanh toan ${invoice.id}`)}&accountName=${encodeURIComponent(bankOwner)}`;

  const handlePrint = () => {
    import('react-hot-toast').then(toast => toast.default.success('Đang kết nối máy in...'));
    setTimeout(() => window.print(), 500);
  };

  const handleSend = () => {
    import('react-hot-toast').then(toast => toast.default.success(`Đã gửi Phiếu Thu qua Zalo cho khách hàng ${invoice.tenant} thành công!`));
  };

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #invoice-print-area, #invoice-print-area * {
              visibility: visible;
            }
            #invoice-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              box-shadow: none !important;
              border: none !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} className="no-print"></div>
        <div id="invoice-print-area" style={{ position: 'relative', width: '450px', background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        {/* Header - Receipt Style */}
        <div style={{ padding: '24px 24px 16px', textAlign: 'center', borderBottom: '2px dashed #cbd5e1', position: 'relative' }}>
          <button className="no-print" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
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
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 1.5fr', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px', fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>
            <span>Nội dung</span>
            <span style={{ textAlign: 'center' }}>SL</span>
            <span style={{ textAlign: 'right' }}>Đơn giá</span>
            <span style={{ textAlign: 'right' }}>Thành tiền</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            {(invoice.items || []).map((item, index) => (
              <div key={index} style={{ borderBottom: index < (invoice.items.length - 1) ? '1px dashed #f1f5f9' : 'none', paddingBottom: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 1.5fr', alignItems: 'center' }}>
                  <span style={{ fontWeight: '500', color: '#1e293b' }}>{item.name}</span>
                  <span style={{ textAlign: 'center', color: '#334155' }}>{item.qty}</span>
                  <span style={{ textAlign: 'right', color: '#334155' }}>{item.price?.toLocaleString('vi-VN')}</span>
                  <span style={{ textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>{item.total?.toLocaleString('vi-VN')}</span>
                </div>
                {(item.oldIndex !== undefined && item.newIndex !== undefined && item.oldIndex !== null && item.newIndex !== null) && (
                  <div style={{ marginTop: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div style={{ background: '#f1f5f9', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                      <div style={{ color: '#94a3b8', marginBottom: '2px', fontWeight: '600' }}>T. TRƯỚC</div>
                      <div style={{ fontWeight: '700', color: '#dc2626', fontSize: '13px' }}>{item.oldIndex}</div>
                    </div>
                    <div style={{ background: '#f0fdf4', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                      <div style={{ color: '#16a34a', marginBottom: '2px', fontWeight: '600' }}>T. NÀY</div>
                      <div style={{ fontWeight: '700', color: '#16a34a', fontSize: '13px' }}>{item.newIndex}</div>
                    </div>
                  </div>
                )}
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

          {/* QR Code Section */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', color: '#3b82f6', fontWeight: 'bold' }}>
              <QrCode size={18} /> Quét mã để thanh toán (VietQR)
            </div>
            <img 
              src={qrUrl} 
              alt="VietQR Payment" 
              style={{ width: '200px', height: '200px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', background: '#fff' }} 
            />
            <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#64748b' }}>
              Chuyển khoản đến:<br/>
              <strong style={{ color: '#0f172a' }}>{bankName} - {bankAccount}</strong><br/>
              Chủ TK: <strong style={{ color: '#0f172a' }}>{bankOwner}</strong>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {user?.role === 'manager' ? (
          <div className="no-print" style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', display: 'flex', gap: '12px' }}>
            <button onClick={handlePrint} style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Printer size={16} /> In Biên Lai
            </button>
            <button onClick={handleSend} style={{ flex: 1, padding: '10px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <Send size={16} /> Gửi Khách
            </button>
          </div>
        ) : (
          <div className="no-print" style={{ padding: '8px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}></div>
        )}
      </div>
    </div>
    </>
  );
}
