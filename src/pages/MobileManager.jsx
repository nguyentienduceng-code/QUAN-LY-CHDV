import { QrCode, ClipboardList, PenTool, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MobileManager() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
      {/* Mobile Device Mockup Container */}
      <div style={{ 
        width: '375px', 
        height: '812px', 
        background: 'var(--bg-primary)', 
        borderRadius: '40px', 
        border: '8px solid var(--bg-secondary)',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* iOS Status Bar Mock */}
        <div style={{ height: '44px', background: 'var(--accent-primary)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '8px', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>
          9:41
        </div>

        {/* App Header */}
        <div style={{ background: 'var(--accent-primary)', padding: '20px', color: '#fff', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Xin chào, Quản lý</h2>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Tòa nhà A - Thứ 6, 14/06</p>
        </div>

        {/* Action Buttons */}
        <div style={{ padding: '24px 20px', flex: 1, overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem' }}>Tác vụ nhanh</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <button style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--accent-primary)' }}><QrCode size={28} /></div>
              <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>Quét QR Check-in</span>
            </button>

            <button style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--status-occupied)' }}><ClipboardList size={28} /></div>
              <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>Chốt Số Điện Nước</span>
            </button>

            <button style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--status-maintenance)' }}><PenTool size={28} /></div>
              <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>Tạo Đơn Bảo Trì</span>
            </button>

            <button style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--status-overdue)' }}><FileText size={28} /></div>
              <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>Hóa Đơn Nợ</span>
            </button>
          </div>

          <h3 style={{ margin: '24px 0 16px', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Thông báo khẩn <span style={{ background: 'var(--status-overdue)', color: '#fff', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px' }}>2</span>
          </h3>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--status-overdue)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ fontWeight: '600', color: 'var(--status-overdue)', marginBottom: '4px', fontSize: '0.95rem' }}>Sự cố mất nước Tòa A</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nhiều phòng phản ánh mất nước lúc 8:00 sáng.</div>
          </div>

          <h3 style={{ margin: '24px 0 16px', fontSize: '1.1rem' }}>Liên hệ nhanh</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => toast('Đang gọi Kỹ thuật viên (Mr. Tuấn)...', { icon: '📞' })} style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Gọi Kỹ thuật</span>
            </button>
            <button onClick={() => toast('Đang gọi Bảo vệ (Ca sáng)...', { icon: '📞' })} style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Gọi Bảo vệ</span>
            </button>
          </div>

          <h3 style={{ margin: '24px 0 16px', fontSize: '1.1rem' }}>Hoạt động gần đây</h3>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '16px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-occupied)', marginTop: 6 }}></div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Khách thuê phòng 101 đã dọn vào</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>10 phút trước</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-expiring)', marginTop: 6 }}></div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Nguyễn Văn A (P.101) đã thanh toán hóa đơn</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>1 giờ trước</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-maintenance)', marginTop: 6 }}></div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>Thợ điện lạnh đã nhận thẻ bảo trì TKT-090</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>2 giờ trước</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
