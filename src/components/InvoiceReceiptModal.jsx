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
  const bankCode = bConfig.bankName || 'MB';
  const bankAccount = bConfig.bankAccount || '0901234567';
  const bankOwner = (bConfig.bankOwner || 'NGUYEN VAN A').toUpperCase();
  const customQrLink = bConfig.qrImageLink;

  const BANK_NAMES = {
    'MB': 'MBBank', 'VCB': 'Vietcombank', 'TCB': 'Techcombank', 'VPB': 'VPBank', 
    'ACB': 'ACB', 'BIDV': 'BIDV', 'CTG': 'VietinBank', 'VBA': 'Agribank', 
    'TPB': 'TPBank', 'STB': 'Sacombank', 'VIB': 'VIB', 'HDB': 'HDBank', 
    'SHB': 'SHB', 'MOMO': 'Ví MoMo', 'VIETTELMONEY': 'Viettel Money'
  };
  const displayBankName = BANK_NAMES[bankCode] || bankCode;

  // Generate VietQR URL (Without Amount to ensure safety)
  const qrUrl = customQrLink || `https://img.vietqr.io/image/${bankCode}-${bankAccount}-compact2.png?addInfo=${encodeURIComponent(`Thanh toan ${invoice.id}`)}&accountName=${encodeURIComponent(bankOwner)}`;

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
    
    let msg = `🌟 THÔNG BÁO CƯỚC PHÒNG ${invoice.room} 🌟\n`;
    msg += `Kính gửi Quý khách hàng,\n\n`;
    msg += `Mã Hóa Đơn: #${invoice.id}\n`;
    msg += `Tổng thanh toán: ${invoice.amount} VNĐ\n`;
    msg += `Hạn thanh toán: ${invoice.due}\n\n`;
    if (invoice.status !== 'paid') {
      msg += `💳 THÔNG TIN CHUYỂN KHOẢN:\n`;
      msg += `• Ngân hàng: ${displayBankName}\n`;
      msg += `• Số Tài khoản: ${bankAccount}\n`;
      msg += `• Chủ Tài khoản: ${bankOwner}\n\n`;
      msg += `📌 Vui lòng ghi chú: "Thanh toan ${invoice.id}" khi chuyển khoản.\n\n`;
      msg += `Trân trọng cảm ơn Quý khách!`;
    } else {
      msg += `✅ Hóa đơn đã được thanh toán thành công.\nTrân trọng cảm ơn Quý khách!`;
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
              left: 50%;
              top: 0;
              width: 100% !important;
              max-width: 550px !important;
              max-height: none !important;
              overflow: visible !important;
              box-shadow: none !important;
              border: 1px solid #EAE1D0 !important;
              margin: 0 !important;
              padding: 0 !important;
              transform: translateX(-50%) scale(0.95);
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
        <div id="invoice-print-area" style={{ position: 'relative', width: '520px', maxWidth: '100vw', background: '#FDFBF7', color: '#2C2C2C', borderRadius: '2px', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', fontFamily: '"Montserrat", "Lato", "Helvetica Neue", sans-serif', border: '1px solid #EAE1D0' }}>
        
        <button className="no-print" onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.03)', border: 'none', color: '#A69C8B', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'background 0.2s' }}><X size={18} /></button>

        {/* Paid Watermark (Stamp Style) */}
        {invoice.status === 'paid' && (
          <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', fontSize: '6rem', fontFamily: '"Playfair Display", serif', fontWeight: '900', color: 'rgba(4, 99, 7, 0.05)', zIndex: 0, pointerEvents: 'none', border: '6px solid rgba(4, 99, 7, 0.05)', padding: '20px 40px', letterSpacing: '8px', whiteSpace: 'nowrap' }}>
            ĐÃ THU
          </div>
        )}

        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '40px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '48px 40px 24px', position: 'relative', zIndex: 1 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2.4rem', fontFamily: '"Playfair Display", "Cormorant Garamond", serif', fontWeight: '700', color: '#2C2C2C', letterSpacing: '2px' }}>HÓA ĐƠN</h1>
              <div style={{ color: '#A69C8B', fontSize: '0.9rem', marginTop: '6px', fontWeight: '500', fontFamily: 'monospace', letterSpacing: '1px' }}>MÃ: #{invoice.id}</div>
              <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', border: invoice.status === 'paid' ? '1px solid #046307' : '1px solid #800020', color: invoice.status === 'paid' ? '#046307' : '#800020' }}>
                {invoice.status === 'paid' ? <><CheckCircle2 size={14}/> Đã Thanh Toán</> : 'Chưa Thanh Toán'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.25rem', fontFamily: '"Playfair Display", "Cormorant Garamond", serif', fontWeight: '600', color: '#3E2723', letterSpacing: '1px' }}>{building.toLowerCase().startsWith('nhà') ? building.toUpperCase() : `TÒA NHÀ ${building.toUpperCase()}`}</div>
              <div style={{ color: '#A69C8B', fontSize: '0.85rem', marginTop: '8px', fontWeight: '500' }}>Ngày lập: {new Date().toLocaleDateString('vi-VN')}</div>
            </div>
          </div>

          {/* Info Section */}
          <div style={{ margin: '0 40px 32px', display: 'flex', gap: '32px', borderTop: '1px solid #EAE1D0', borderBottom: '1px solid #EAE1D0', padding: '24px 0' }}>
            <div style={{ flex: 1.5 }}>
              <div style={{ fontSize: '0.7rem', color: '#A69C8B', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '2px', marginBottom: '8px' }}>Khách hàng</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2C2C2C', letterSpacing: '0.5px' }}>{invoice.tenant}</div>
              <div style={{ fontSize: '0.9rem', color: '#5C5C5C', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>Phòng: <span style={{ color: '#2C2C2C', fontWeight: '700', fontSize: '0.95rem' }}>{invoice.room}</span></div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid #EAE1D0', paddingLeft: '32px' }}>
              <div style={{ fontSize: '0.7rem', color: '#A69C8B', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '2px', marginBottom: '8px' }}>Hạn thanh toán</div>
              <div style={{ fontSize: '1.15rem', fontWeight: '600', color: invoice.status === 'paid' ? '#A69C8B' : '#800020' }}>{invoice.due}</div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ margin: '0 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 1.5fr', borderBottom: '1px solid #2C2C2C', paddingBottom: '12px', fontSize: '0.75rem', fontWeight: '700', color: '#2C2C2C', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <span>Nội dung chi tiết</span>
              <span style={{ textAlign: 'center' }}>SL</span>
              <span style={{ textAlign: 'right' }}>Đơn giá</span>
              <span style={{ textAlign: 'right' }}>Thành tiền</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem', marginTop: '12px' }}>
              {(invoice.items || []).map((item, index) => (
                <div key={index} style={{ borderBottom: '1px solid #EAE1D0', padding: '16px 0' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 1.5fr', alignItems: 'center' }}>
                    <span style={{ fontWeight: '500', color: '#2C2C2C' }}>{item.name}</span>
                    <span style={{ textAlign: 'center', color: '#5C5C5C' }}>{item.qty}</span>
                    <span style={{ textAlign: 'right', color: '#5C5C5C', fontFamily: '"Montserrat", monospace', fontSize: '0.95rem' }}>{item.price?.toLocaleString('vi-VN')}</span>
                    <span style={{ textAlign: 'right', fontWeight: '600', color: '#2C2C2C', fontFamily: '"Montserrat", monospace', fontSize: '1rem' }}>{item.total?.toLocaleString('vi-VN')}</span>
                  </div>
                  {(item.oldIndex !== undefined && item.newIndex !== undefined && item.oldIndex !== null && item.newIndex !== null) && (
                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                        <span style={{ color: '#A69C8B', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Chỉ số cũ:</span>
                        <span style={{ fontWeight: '600', color: '#5C5C5C' }}>{item.oldIndex}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                        <span style={{ color: '#A69C8B', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '1px' }}>Chỉ số mới:</span>
                        <span style={{ fontWeight: '600', color: '#2C2C2C' }}>{item.newIndex}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Total Section */}
          <div style={{ margin: '32px 40px 0', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '100%', maxWidth: '340px', borderTop: '3px double #C5A059', borderBottom: '3px double #C5A059', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#2C2C2C', letterSpacing: '2px', textTransform: 'uppercase' }}>Tổng Thanh Toán</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '2.4rem', fontFamily: '"Playfair Display", serif', fontWeight: '700', color: '#C5A059', letterSpacing: '0px' }}>{invoice.amount}</span>
                <span style={{ fontSize: '1.4rem', color: '#A69C8B', fontFamily: '"Playfair Display", serif' }}>₫</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {invoice.status === 'paid' ? (
            <div style={{ margin: '40px 40px 0', padding: '32px', border: '1px solid #EAE1D0', textAlign: 'center', background: '#FDFBF7' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', border: '1px solid #046307', marginBottom: '16px' }}>
                <CheckCircle2 size={24} color="#046307" />
              </div>
              <h3 style={{ margin: '0 0 8px', color: '#046307', fontFamily: '"Playfair Display", serif', fontWeight: '600', fontSize: '1.4rem', letterSpacing: '1px' }}>Giao Dịch Hoàn Tất</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#5C5C5C' }}>Cảm ơn quý khách đã thanh toán đúng hạn.</p>
            </div>
          ) : (
            <div style={{ margin: '40px 40px 0', padding: '32px', border: '1px solid #EAE1D0', display: 'flex', gap: '32px', alignItems: 'center', background: '#FDFBF7' }}>
              <div style={{ flex: '0 0 140px' }}>
                <div style={{ padding: '8px', border: '1px solid #D4AF37', background: '#fff' }}>
                  <img 
                    src={qrUrl} 
                    alt="VietQR" 
                    style={{ width: '100%', height: 'auto', display: 'block' }} 
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              </div>
              <div style={{ flex: 1, fontSize: '0.9rem', color: '#5C5C5C' }}>
                <div style={{ fontWeight: '600', color: '#2C2C2C', marginBottom: '16px', fontSize: '1.1rem', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid #EAE1D0', paddingBottom: '8px' }}>Chuyển Khoản</div>
                <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '12px', marginBottom: '8px', alignItems: 'start' }}>
                  <span style={{ color: '#A69C8B', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', paddingTop: '3px' }}>Ngân hàng:</span>
                  <strong style={{ color: '#2C2C2C', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4', fontWeight: '600' }}>{displayBankName}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#A69C8B', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Số TK:</span>
                  <strong style={{ color: '#2C2C2C', fontSize: '1.1rem', letterSpacing: '1px', fontFamily: '"Montserrat", monospace' }}>{bankAccount}</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '95px 1fr', gap: '12px', alignItems: 'start' }}>
                  <span style={{ color: '#A69C8B', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px', paddingTop: '3px' }}>Chủ TK:</span>
                  <strong style={{ color: '#2C2C2C', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.4', fontWeight: '600' }}>{bankOwner}</strong>
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
