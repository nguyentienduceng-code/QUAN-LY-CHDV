import { useState } from 'react';
import { CreditCard, FileText, Wrench, Eye, Bell, QrCode } from 'lucide-react';
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

  const tenantRoom = user?.room || 'P.101';
  const myInvoices = invoices.filter(inv => inv.room === tenantRoom);
  const myInvoice = myInvoices.find(inv => inv.status === 'unpaid') || myInvoices[0];
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handleReportIssue = (title) => {
    addTicket({
      title,
      room: user?.room || 'Không xác định',
      priority: 'high-priority'
    });
    toast.success('Đã gửi yêu cầu bảo trì thành công! Quản lý sẽ sớm liên hệ.');
    setIsReportModalOpen(false);
  };

  const handleViewInvoice = (inv) => {
    setSelectedInvoice(inv);
    setIsReceiptModalOpen(true);
  };

  // find elec/water items from invoice
  const getMeterInfo = (inv) => {
    if (!inv?.items) return null;
    const elec = inv.items.find(i => i.id === 2);
    const water = inv.items.find(i => i.id === 3);
    return { elec, water };
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 0 100px', fontFamily: 'var(--font-main)' }}>

      {/* Header greeting */}
      <div style={{ padding: '20px 16px 12px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Xin chào, {user?.name || 'Khách Thuê'}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>Phòng {user?.room || 'P.101'} • Tòa nhà A</div>
        </div>
        <div style={{ background: 'var(--accent-primary)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '1.2rem' }}>
          {(user?.name || 'K')[0]}
        </div>
      </div>

      {/* Current Invoice Card */}
      {myInvoice ? (
        <div style={{ margin: '0 16px 16px', background: myInvoice.status === 'unpaid' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '16px', padding: '20px', color: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '4px' }}>Hóa đơn hiện tại</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>{myInvoice.id}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>
              {myInvoice.status === 'unpaid' ? 'CHƯ A THĂNH TOÁN' : 'ĐÃ THĂNH TOÁN'}
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px' }}>{myInvoice.amount} đ</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '16px' }}>Hạn chật: {myInvoice.due}</div>

          {/* Meter readings mini display */}
          {(() => {
            const m = getMeterInfo(myInvoice);
            if (!m || (!m.elec && !m.water)) return null;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                {m.elec && (
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '4px' }}>⚡ ĐIỆN (kWh)</div>
                    {m.elec.oldIndex !== null && m.elec.newIndex !== null ? (
                      <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{m.elec.oldIndex} → {m.elec.newIndex} <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>({m.elec.qty} kWh)</span></div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Chưa chốt số</div>
                    )}
                  </div>
                )}
                {m.water && (
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '4px' }}>💧 NƯỚC (m³)</div>
                    {m.water.oldIndex !== null && m.water.newIndex !== null ? (
                      <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{m.water.oldIndex} → {m.water.newIndex} <span style={{ opacity: 0.75, fontSize: '0.75rem' }}>({m.water.qty} m³)</span></div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Chưa chốt số</div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => handleViewInvoice(myInvoice)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: '10px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Eye size={16} /> Xem chi tiết
            </button>
            {myInvoice.status === 'unpaid' && (
              <button style={{ flex: 1, padding: '12px', background: '#fff', border: 'none', color: '#dc2626', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <CreditCard size={16} /> Thanh toán
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ margin: '0 16px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Không có hóa đơn nào cần thanh toán.
        </div>
      )}

      {/* Invoice History */}
      {myInvoices.length > 1 && (
        <div style={{ margin: '0 16px 16px' }}>
          <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '10px', color: 'var(--text-primary)' }}>Lịch sử hóa đơn</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myInvoices.slice(0, 5).map(inv => (
              <div key={inv.id} onClick={() => handleViewInvoice(inv)}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{inv.id}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hạn: {inv.due}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', color: inv.status === 'paid' ? '#10b981' : '#ef4444', fontSize: '1rem' }}>{inv.amount} đ</div>
                  <div style={{ fontSize: '0.75rem', color: inv.status === 'paid' ? '#10b981' : '#ef4444' }}>{inv.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Grid */}
      <div style={{ padding: '0 16px', marginBottom: '16px' }}>
        <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>Dịch vụ của bạn</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <button style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '14px', padding: '18px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div style={{ background: 'rgba(59,130,246,0.1)', padding: '12px', borderRadius: '50%', color: '#3b82f6' }}><FileText size={24} /></div>
            <span style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text-primary)' }}>Hợp đồng</span>
          </button>
          <button onClick={() => setIsReportModalOpen(true)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '14px', padding: '18px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div style={{ background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '50%', color: '#ef4444' }}><Wrench size={24} /></div>
            <span style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text-primary)' }}>Báo hỏng</span>
          </button>
        </div>
      </div>

      {/* Announcements */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} /> Thông báo từ BQL
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-glass)' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.9rem' }}>Lịch vệ sinh hành lang Tòa A</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Sáng Thứ 7 tuần này (16/06) từ 8h - 11h. Mong quý khách hạn chế để đồ ra ngoài.</div>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.9rem' }}>Khuyến mãi Internet Gói Gia Đình</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Đăng ký gói cước mới giảm 20% tháng đầu tiên. Vui lòng liên hệ BQL.</div>
          </div>
        </div>
      </div>

      <InvoiceReceiptModal 
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={selectedInvoice || myInvoice}
      />

      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportIssue}
      />
    </div>
  );
}

