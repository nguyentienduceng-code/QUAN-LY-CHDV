import { X, Printer, Send, QrCode, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';

export default function InvoiceReceiptModal({ isOpen, onClose, invoice }) {
  const { user } = useAuth();
  const { settings, rooms, updateInvoice, tenants } = useAppData();
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
  const customQrLink = bConfig.qrImageLink;

  // Generate VietQR URL (Without Amount to ensure safety)
  const qrUrl = customQrLink || `https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.png?addInfo=${encodeURIComponent(`Thanh toan ${invoice.id}`)}&accountName=${encodeURIComponent(bankOwner)}`;

  const handlePrint = () => {
    import('react-hot-toast').then(toast => toast.default.success('Đang kết nối máy in...'));
    setTimeout(() => window.print(), 500);
  };

  const handleSend = () => {
    const tenantInfo = tenants?.find(t => t.name === invoice.tenant);
    if (!tenantInfo || !tenantInfo.phone) {
      import('react-hot-toast').then(toast => toast.default.error('Hồ sơ khách thuê này chưa cập nhật Số điện thoại!'));
      return;
    }
    
    let msg = `[RentFlow] Thông báo cước phòng ${invoice.room}\n`;
    msg += `- Mã HĐ: ${invoice.id}\n`;
    msg += `- Tổng tiền: ${invoice.amount} VNĐ\n`;
    msg += `- Hạn thanh toán: ${invoice.due}\n\n`;
    if (invoice.status !== 'paid') {
      msg += `💳 THÔNG TIN CHUYỂN KHOẢN:\n`;
      msg += `• Ngân hàng: ${bankName}\n`;
      msg += `• Số TK: ${bankAccount}\n`;
      msg += `• Chủ TK: ${bankOwner}\n\n`;
      msg += `(Vui lòng ghi chú mã HĐ: ${invoice.id})\nCảm ơn bạn!`;
    } else {
      msg += `✅ Hóa đơn này đã được xác nhận thanh toán. Cảm ơn bạn!`;
    }

    const url = `https://zalo.me/${tenantInfo.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    import('react-hot-toast').then(toast => toast.default.success('Đang mở Zalo...'));
  };

  const handleMarkAsPaid = () => {
    updateInvoice(invoice.id, { status: 'paid' });
    import('react-hot-toast').then(toast => toast.default.success(`Đã xác nhận thanh toán hóa đơn ${invoice.id}!`));
  };

  const handleMarkAsUnpaid = () => {
    updateInvoice(invoice.id, { status: 'unpaid' });
    import('react-hot-toast').then(toast => toast.default.success(`Đã chuyển trạng thái hóa đơn ${invoice.id} về Chưa thanh toán.`));
  };

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              margin: 5mm;
              size: portrait;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
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
              width: 100% !important;
              max-width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
              transform: scale(0.95);
              transform-origin: top center;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} className="no-print"></div>
        <div id="invoice-print-area" style={{ position: 'relative', width: '450px', maxWidth: '100vw', background: '#fff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
        
        {/* Paid Watermark */}
        {invoice.status === 'paid' && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', fontSize: '8rem', fontWeight: '900', color: 'rgba(16, 185, 129, 0.05)', zIndex: 0, pointerEvents: 'none', letterSpacing: '8px', whiteSpace: 'nowrap' }}>
            ĐÃ THU
          </div>
        )}

        {/* Header - Receipt Style */}
        <div style={{ padding: '32px 24px 20px', textAlign: 'center', background: 'linear-gradient(to bottom, #f8fafc, #ffffff)', borderBottom: '2px dashed #cbd5e1', position: 'relative', zIndex: 1 }}>
          <button className="no-print" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.05)', border: 'none', color: '#64748b', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.25)', transform: 'rotate(-5deg)' }}>
              <FileText size={28} color="#ffffff" style={{ transform: 'rotate(5deg)' }} />
            </div>
          </div>

          <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: '900', textTransform: 'uppercase', color: '#0f172a', letterSpacing: '1px' }}>HÓA ĐƠN DỊCH VỤ</h2>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#64748b', fontWeight: '600' }}>{building.toLowerCase().startsWith('nhà') ? building : `Tòa Nhà ${building}`}</p>
          
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 16px', 
            borderRadius: '30px', 
            fontSize: '0.75rem', 
            fontWeight: '800', 
            marginTop: '12px',
            background: invoice.status === 'paid' ? '#ecfdf5' : '#fef2f2',
            color: invoice.status === 'paid' ? '#059669' : '#dc2626',
            border: invoice.status === 'paid' ? '1px solid #10b981' : '1px solid #f87171',
            boxShadow: invoice.status === 'paid' ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 4px 12px rgba(239, 68, 68, 0.15)'
          }}>
            {invoice.status === 'paid' ? <><CheckCircle2 size={14}/> ĐÃ THANH TOÁN</> : '● CHƯA THANH TOÁN'}
          </div>
          
          <div style={{ marginTop: '24px', fontSize: '0.95rem', textAlign: 'left', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>Khách hàng:</span>
              <span style={{ fontWeight: '700', color: '#0f172a' }}>{invoice.tenant}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>Phòng:</span>
              <span style={{ fontWeight: '700', color: '#0f172a', fontSize: '1.1rem' }}>{invoice.room}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>Mã HĐ:</span>
              <span style={{ fontWeight: '600', color: '#475569', fontFamily: 'monospace' }}>{invoice.id}</span>
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
          
          <div style={{ marginTop: '24px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#0f172a' }}>TỔNG CỘNG:</span>
            <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#10b981', background: '#ecfdf5', padding: '4px 12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>{invoice.amount} đ</span>
          </div>
          
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '0 8px' }}>
            <span style={{ color: '#64748b', fontWeight: '500' }}>Hạn thanh toán:</span>
            <span style={{ fontWeight: '800', color: '#ef4444', background: '#fef2f2', padding: '4px 10px', borderRadius: '6px' }}>{invoice.due}</span>
          </div>

          {/* QR Code Section */}
          {invoice.status === 'paid' ? (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#10b981' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', border: '2px solid #10b981', marginBottom: '12px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h3 style={{ margin: '0 0 4px', color: '#059669', fontWeight: '800', fontSize: '1rem' }}>Giao Dịch Hoàn Tất</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Hóa đơn này đã được xác nhận thanh toán.</p>
            </div>
          ) : (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px', color: '#2563eb', fontWeight: '800', fontSize: '1.1rem' }}>
                <QrCode size={20} /> QUÉT MÃ VIETQR
              </div>
              <div style={{ display: 'inline-block', padding: '12px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                <img 
                  src={qrUrl} 
                  alt="VietQR Payment" 
                  style={{ width: '220px', height: '220px', objectFit: 'contain', display: 'block' }} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    const fallbackInfo = document.getElementById(`qr-fallback-${invoice.id}`);
                    if (fallbackInfo) fallbackInfo.style.display = 'block';
                  }}
                />
              </div>
              <div id={`qr-fallback-${invoice.id}`} style={{ display: 'none', color: '#ef4444', fontSize: '0.85rem', marginTop: '8px', padding: '8px', background: '#fef2f2', border: '1px dashed #f87171', borderRadius: '8px' }}>
                Ngân hàng/Ví điện tử này chưa hỗ trợ tạo mã VietQR tự động. Vui lòng chuyển khoản thủ công.
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                Chuyển khoản đến:<br/>
                <strong style={{ color: '#0f172a' }}>{bankName} - {bankAccount}</strong><br/>
                Chủ TK: <strong style={{ color: '#0f172a' }}>{bankOwner}</strong>
              </div>
              <div style={{ marginTop: '16px', padding: '12px', background: '#fffbeb', border: '1px dashed #f59e0b', borderRadius: '8px', fontSize: '0.8rem', color: '#b45309' }}>
                <strong>Lưu ý an toàn:</strong> Vui lòng tự nhập số tiền <strong>{invoice.amount} đ</strong> và kiểm tra kỹ thông tin người nhận trước khi chuyển khoản.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {(user?.role === 'admin' || user?.role === 'staff') ? (
          <div className="no-print" style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {invoice.status !== 'paid' ? (
              <button 
                onClick={handleMarkAsPaid} 
                style={{ width: '100%', padding: '12px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.95rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
              >
                Xác Nhận Đã Thu Tiền (Đóng Tiền)
              </button>
            ) : (
              <button 
                onClick={handleMarkAsUnpaid} 
                style={{ width: '100%', padding: '12px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.95rem', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}
              >
                Chuyển Trạng Thái Chưa Thanh Toán
              </button>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handlePrint} style={{ flex: 1, padding: '10px', background: '#fff', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <Printer size={16} /> In Biên Lai
              </button>
              <button onClick={handleSend} style={{ flex: 1, padding: '10px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <Send size={16} /> Gửi Zalo
              </button>
            </div>
          </div>
        ) : (
          <div className="no-print" style={{ padding: '8px', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}></div>
        )}
      </div>
    </div>
    </>
  );
}
