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
        <div id="invoice-print-area" style={{ position: 'relative', width: '500px', maxWidth: '100vw', background: '#ffffff', color: '#0f172a', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
        
        <button className="no-print" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.05)', border: 'none', color: '#64748b', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'background 0.2s' }}><X size={18} /></button>

        {/* Paid Watermark (Stamp Style) */}
        {invoice.status === 'paid' && (
          <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%) rotate(-25deg)', fontSize: '5rem', fontWeight: '900', color: 'rgba(16, 185, 129, 0.1)', zIndex: 0, pointerEvents: 'none', border: '12px solid rgba(16, 185, 129, 0.1)', borderRadius: '16px', padding: '20px 40px', letterSpacing: '8px', whiteSpace: 'nowrap' }}>
            ĐÃ THU
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '40px 32px 0', position: 'relative', zIndex: 1 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '900', color: '#1e293b', letterSpacing: '-0.5px' }}>HÓA ĐƠN</h1>
              <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px', fontWeight: '600', fontFamily: 'monospace' }}>MÃ: #{invoice.id}</div>
              <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800', background: invoice.status === 'paid' ? '#ecfdf5' : '#fef2f2', color: invoice.status === 'paid' ? '#059669' : '#dc2626', border: invoice.status === 'paid' ? '1px solid #a7f3d0' : '1px solid #fecaca' }}>
                {invoice.status === 'paid' ? <><CheckCircle2 size={14}/> ĐÃ THANH TOÁN</> : '● CHƯA THANH TOÁN'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#3b82f6', letterSpacing: '0.5px' }}>{building.toLowerCase().startsWith('nhà') ? building.toUpperCase() : `TÒA NHÀ ${building.toUpperCase()}`}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '6px', fontWeight: '500' }}>Ngày lập: {new Date().toLocaleDateString('vi-VN')}</div>
            </div>
          </div>

          {/* Info Section */}
          <div style={{ margin: '32px 32px 24px', display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1.5, background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px', marginBottom: '8px' }}>Thông tin khách hàng</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>{invoice.tenant}</div>
              <div style={{ fontSize: '0.95rem', color: '#475569', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>Phòng: <span style={{ background: '#e2e8f0', color: '#1e293b', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', fontSize: '0.9rem' }}>{invoice.room}</span></div>
            </div>
            <div style={{ flex: 1, background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px', marginBottom: '8px' }}>Hạn thanh toán</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '900', color: invoice.status === 'paid' ? '#94a3b8' : '#ef4444' }}>{invoice.due}</div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ margin: '0 32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 1.5fr', background: '#f1f5f9', padding: '10px 16px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Nội dung chi tiết</span>
              <span style={{ textAlign: 'center' }}>SL</span>
              <span style={{ textAlign: 'right' }}>Đơn giá</span>
              <span style={{ textAlign: 'right' }}>Thành tiền</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem', marginTop: '8px' }}>
              {(invoice.items || []).map((item, index) => (
                <div key={index} style={{ borderBottom: '1px solid #f1f5f9', padding: '14px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 1.5fr', alignItems: 'center' }}>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{item.name}</span>
                    <span style={{ textAlign: 'center', color: '#475569', fontWeight: '500' }}>{item.qty}</span>
                    <span style={{ textAlign: 'right', color: '#475569', fontFamily: 'monospace', fontSize: '0.95rem' }}>{item.price?.toLocaleString('vi-VN')}</span>
                    <span style={{ textAlign: 'right', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace', fontSize: '1rem' }}>{item.total?.toLocaleString('vi-VN')}</span>
                  </div>
                  {(item.oldIndex !== undefined && item.newIndex !== undefined && item.oldIndex !== null && item.newIndex !== null) && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px', marginLeft: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                        <span style={{ color: '#94a3b8', fontWeight: '600' }}>CHỈ SỐ CŨ:</span>
                        <span style={{ fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{item.oldIndex}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                        <span style={{ color: '#94a3b8', fontWeight: '600' }}>CHỈ SỐ MỚI:</span>
                        <span style={{ fontWeight: '700', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>{item.newIndex}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Total Section */}
          <div style={{ margin: '24px 32px 0', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', maxWidth: '340px', background: 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)', color: '#fff', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: '0 12px 25px -5px rgba(30, 58, 138, 0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#93c5fd', letterSpacing: '1px' }}>TỔNG THANH TOÁN</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.5px' }}>{invoice.amount}</span>
                <span style={{ fontSize: '1.4rem', color: '#60a5fa', fontWeight: '700' }}>₫</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {invoice.status === 'paid' ? (
            <div style={{ margin: '32px 32px 0', padding: '24px', background: '#ecfdf5', borderRadius: '16px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: '#10b981', marginBottom: '16px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}>
                <CheckCircle2 size={24} color="#fff" />
              </div>
              <h3 style={{ margin: '0 0 8px', color: '#065f46', fontWeight: '800', fontSize: '1.2rem' }}>Giao Dịch Hoàn Tất</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#047857', fontWeight: '500' }}>Cảm ơn bạn đã thanh toán đúng hạn!</p>
            </div>
          ) : (
            <div style={{ margin: '32px 32px 0', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ flex: '0 0 140px' }}>
                <div style={{ padding: '8px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                  <img 
                    src={qrUrl} 
                    alt="VietQR" 
                    style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px' }} 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              </div>
              <div style={{ flex: 1, fontSize: '0.9rem', color: '#475569' }}>
                <div style={{ fontWeight: '800', color: '#1e293b', marginBottom: '12px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}><QrCode size={18} color="#3b82f6" /> CHUYỂN KHOẢN</div>
                <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr', gap: '8px', marginBottom: '6px', alignItems: 'start' }}>
                  <span style={{ color: '#94a3b8', fontWeight: '500' }}>Ngân hàng:</span>
                  <strong style={{ color: '#0f172a', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4' }}>{bankName}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', fontWeight: '500' }}>Số TK:</span>
                  <strong style={{ color: '#0f172a', fontSize: '1.05rem', letterSpacing: '0.5px' }}>{bankAccount}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr', gap: '8px', alignItems: 'start' }}>
                  <span style={{ color: '#94a3b8', fontWeight: '500' }}>Chủ TK:</span>
                  <strong style={{ color: '#0f172a', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4' }}>{bankOwner}</strong>
                </div>
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
