import { useState } from 'react';
import { CreditCard, FileText, Wrench, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import InvoiceReceiptModal from '../components/InvoiceReceiptModal';
import ReportIssueModal from '../components/ReportIssueModal';

export default function TenantPortal() {
  const { user } = useAuth();
  const { addTicket, invoices } = useAppData();
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const tenantName = user?.name || 'Nguyễn Văn A';
  const tenantRoom = user?.room || 'P.101';
  const myInvoice = invoices.find(inv => inv.room === tenantRoom && inv.status === 'unpaid') || invoices.find(inv => inv.room === tenantRoom);

  const handleReportIssue = (title) => {
    addTicket({
      title,
      room: user?.room || 'Không xác định',
      priority: 'high-priority'
    });
    toast.success('Đã gửi yêu cầu bảo trì thành công! Quản lý sẽ sớm liên hệ.');
    setIsReportModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
      {/* Mobile Device Mockup Container */}
      <div style={{ 
        width: '375px', 
        height: '812px', 
        background: '#f8fafc', // Light theme for tenant
        color: '#0f172a',
        borderRadius: '40px', 
        border: '8px solid var(--bg-secondary)',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        fontFamily: 'var(--font-main)'
      }}>
        {/* iOS Status Bar Mock */}
        <div style={{ height: '44px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '8px', color: '#0f172a', fontSize: '0.8rem', fontWeight: 'bold' }}>
          9:41
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Xin chào, {user?.name || 'Nguyễn Văn A'}</div>
          <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Phòng {user?.room || '101'} - Tòa nhà A</div>
        </div>

        {/* Invoice Card */}
        {myInvoice ? (
          <div style={{ margin: '0 20px 20px', background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Hóa đơn Tháng 6/2026</div>
              <button onClick={() => setIsReceiptModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>
                <Eye size={14} /> Chi tiết
              </button>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: myInvoice.status === 'unpaid' ? '#ef4444' : '#10b981', marginBottom: '4px' }}>{myInvoice.amount}đ</div>
            <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600', marginBottom: '20px' }}>Hạn chót: <span style={{ color: myInvoice.status === 'unpaid' ? '#ef4444' : 'inherit' }}>{myInvoice.due}</span></div>
            
            {myInvoice.status === 'unpaid' ? (
              <button style={{ width: '100%', background: '#10b981', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <CreditCard size={20} /> Thanh toán ngay
              </button>
            ) : (
              <button disabled style={{ width: '100%', background: '#f1f5f9', color: '#10b981', border: '1px solid #10b981', padding: '16px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'not-allowed' }}>
                Đã thanh toán xong
              </button>
            )}
          </div>
        ) : (
          <div style={{ margin: '0 20px 20px', background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <p style={{ color: '#64748b' }}>Bạn không có hóa đơn nào cần thanh toán.</p>
          </div>
        )}

        {/* Menu Grid */}
        <div style={{ padding: '0 20px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Dịch vụ của bạn</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            <button style={{ background: '#fff', border: 'none', borderRadius: '16px', padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '50%', color: '#3b82f6' }}><FileText size={24} /></div>
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Chi tiết Hợp đồng</span>
            </button>

            <button onClick={() => setIsReportModalOpen(true)} style={{ background: '#fff', border: 'none', borderRadius: '16px', padding: '20px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '50%', color: '#ef4444' }}><Wrench size={24} /></div>
              <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Báo hỏng hóc</span>
            </button>

          </div>
        </div>

        {/* Notifications Board */}
        <div style={{ padding: '0 20px', flex: 1 }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Thông báo từ Ban quản lý</h3>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', marginBottom: '12px' }}>
              <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px', fontSize: '0.95rem' }}>Lịch vệ sinh hành lang Tòa A</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Sáng Thứ 7 tuần này (16/06) từ 8h - 11h. Mong quý khách hạn chế để đồ ra ngoài.</div>
            </div>
            <div>
              <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px', fontSize: '0.95rem' }}>Khuyến mãi Internet Gói Gia Đình</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Đăng ký gói cước mới giảm 20% tháng đầu tiên. Vui lòng liên hệ BQL.</div>
            </div>
          </div>
        </div>
      </div>

      <InvoiceReceiptModal 
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={myInvoice}
      />

      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportIssue}
      />
    </div>
  );
}
