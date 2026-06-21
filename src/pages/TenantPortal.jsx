import { useState } from 'react';
import { CreditCard, FileText, Wrench, Eye, Bell, QrCode, CheckCircle2, Crown, Home, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useAppData } from '../context/AppDataContext';
import { useNavigate } from 'react-router-dom';
import InvoiceReceiptModal from '../components/InvoiceReceiptModal';
import ReportIssueModal from '../components/ReportIssueModal';

export default function TenantPortal() {
  const { user, logout, upgradeUserAccount } = useAuth();
  const { addTicket, invoices } = useAppData();
  const navigate = useNavigate();
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // Nâng cấp tài khoản states
  const [selectedPlan, setSelectedPlan] = useState(null); // 'basic' | 'pro'
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const handleUpgrade = async () => {
    if (!selectedPlan) return;
    
    if (selectedPlan === 'pro' || selectedPlan === 'basic') {
      setShowPayment(true);
      return;
    }
  };

  const handleConfirmPayment = async () => {
    setIsUpgrading(true);
    toast.loading('Đang gửi thông tin xác nhận...', { id: 'upgrade' });
    setTimeout(async () => {
      try {
        await upgradeUserAccount(selectedPlan === 'pro' ? 'pending_pro' : 'pending_basic');
        toast.success('Đã gửi yêu cầu! Vui lòng chờ BQL duyệt.', { id: 'upgrade' });
      } catch (err) {
        toast.error('Lỗi gửi yêu cầu!', { id: 'upgrade' });
      }
      setIsUpgrading(false);
    }, 2000);
  };

  const isTrialExpired = user?.plan === 'trial' && new Date() > new Date(user?.trialEndsAt);
  const isGraceExpired = user?.plan?.startsWith('pending') && user?.gracePeriodEndsAt && new Date() > new Date(user.gracePeriodEndsAt);
  const isSubscriptionExpired = (user?.plan === 'pro' || user?.plan === 'basic') && user?.subscriptionEndsAt && new Date() > new Date(user.subscriptionEndsAt);

  if (user?.role === 'guest' || isTrialExpired || isGraceExpired || isSubscriptionExpired) {
    if ((user?.plan === 'pending_pro' || user?.plan === 'pending_basic') && !isGraceExpired) {
      return (
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 16px 100px', fontFamily: 'var(--font-main)', textAlign: 'center' }}>
          <div className="bg-animation">
            <div className="bg-orb bg-orb-1"></div>
            <div className="bg-orb bg-orb-2"></div>
          </div>
          <div style={{ position: 'relative', zIndex: 1, background: 'rgba(10, 14, 26, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)', borderRadius: '24px', padding: '32px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '16px', borderRadius: '50%', marginBottom: '24px' }}>
              <Bell size={40} style={{ animation: 'pulse 2s infinite' }} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '12px' }}>Đang chờ duyệt thanh toán</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Cảm ơn <strong>{user.name}</strong>. Yêu cầu nâng cấp của bạn đang được Quản trị viên kiểm tra và phê duyệt.
            </p>
            <button onClick={logout} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}>
              Đăng xuất
            </button>
          </div>
        </div>
      );
    }

    if (showPayment) {
      return (
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 16px 100px', fontFamily: 'var(--font-main)', textAlign: 'center' }}>
          <div className="bg-animation">
            <div className="bg-orb bg-orb-1"></div>
          </div>
          <div style={{ position: 'relative', zIndex: 1, background: 'rgba(10, 14, 26, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)', borderRadius: '24px', padding: '32px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>Thanh toán Gói {selectedPlan === 'pro' ? 'PRO' : 'CƠ BẢN'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
              Vui lòng chuyển khoản số tiền <strong>{selectedPlan === 'pro' ? '199.000đ' : '69.000đ'}</strong> vào tài khoản MoMo bên dưới để kích hoạt gói cước.
            </p>

            <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
              <div style={{ background: '#A50064', color: '#fff', display: 'inline-flex', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', marginBottom: '16px', fontSize: '1.2rem' }}>
                Ví MoMo
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '2px' }}>0981 019 694</div>
              <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>NGUYỄN TIẾN ĐỨC</div>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Nội dung chuyển khoản:<br/>
                <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{selectedPlan === 'pro' ? 'PRO' : 'BASIC'} {user.email}</strong>
              </div>
            </div>

            <button 
              onClick={handleConfirmPayment}
              disabled={isUpgrading}
              style={{ width: '100%', padding: '14px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '12px', cursor: isUpgrading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '1rem', marginBottom: '12px' }}
            >
              {isUpgrading ? 'Đang xử lý...' : 'Tôi đã chuyển khoản'}
            </button>
            <button 
              onClick={() => setShowPayment(false)}
              disabled={isUpgrading}
              style={{ width: '100%', padding: '14px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-glass)', borderRadius: '12px', cursor: 'pointer', fontWeight: '600' }}
            >
              Quay lại chọn gói
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 16px 100px', fontFamily: 'var(--font-main)', textAlign: 'center' }}>
        <div className="bg-animation">
          <div className="bg-orb bg-orb-1"></div>
          <div className="bg-orb bg-orb-2"></div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, background: 'rgba(10, 14, 26, 0.7)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)', borderRadius: '24px', padding: '32px 20px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '8px' }}>
            {isGraceExpired ? 'Đã quá hạn Chờ duyệt' : isSubscriptionExpired ? 'Hết hạn Sử dụng' : isTrialExpired ? 'Hết hạn Dùng thử' : 'Nâng cấp Tài Khoản'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '24px' }}>
            {isGraceExpired 
              ? `Thời gian ân hạn 3 ngày chờ duyệt đã kết thúc. Vui lòng liên hệ BQL hoặc chuyển khoản lại.`
              : isSubscriptionExpired
              ? `Gói cước 30 ngày của bạn đã hết hạn. Vui lòng thanh toán gia hạn để tiếp tục.`
              : isTrialExpired 
              ? `Thời gian dùng thử 30 ngày của bạn đã kết thúc. Vui lòng nâng cấp gói để tiếp tục quản lý nhà trọ.`
              : `Chào ${user.name}, chọn một gói để bắt đầu quản lý nhà trọ của bạn.`}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', textAlign: 'left' }}>
            {/* Gói Cơ Bản */}
            <div 
              onClick={() => setSelectedPlan('basic')}
              style={{ padding: '20px', background: selectedPlan === 'basic' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.02)', border: '2px solid', borderColor: selectedPlan === 'basic' ? '#3b82f6' : 'var(--border-glass)', borderRadius: '16px', cursor: 'pointer', transition: 'var(--transition)', position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectedPlan === 'basic' ? '#3b82f6' : 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <Home size={20} /> Cơ Bản
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.1rem' }}>69k<span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/tháng</span></div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><CheckCircle2 size={14} color="#10b981" /> Quản lý tối đa 1 nhà (chi nhánh)</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><CheckCircle2 size={14} color="#10b981" /> Tính tiền điện nước cơ bản</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} color="#10b981" /> Tối đa 15 phòng</li>
              </ul>
              {selectedPlan === 'basic' && <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#3b82f6', borderRadius: '50%', padding: '4px', color: '#fff' }}><CheckCircle2 size={16} /></div>}
            </div>

            {/* Gói Pro */}
            <div 
              onClick={() => setSelectedPlan('pro')}
              style={{ padding: '20px', background: selectedPlan === 'pro' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.02)', border: '2px solid', borderColor: selectedPlan === 'pro' ? '#f59e0b' : 'var(--border-glass)', borderRadius: '16px', cursor: 'pointer', transition: 'var(--transition)', position: 'relative' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: selectedPlan === 'pro' ? '#f59e0b' : 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  <Crown size={20} /> PRO <span style={{ background: '#f59e0b', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '10px', marginLeft: '4px' }}>Khuyên dùng</span>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.1rem' }}>199k<span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/tháng</span></div>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><CheckCircle2 size={14} color="#f59e0b" /> Quản lý nhiều nhà (không giới hạn)</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}><CheckCircle2 size={14} color="#f59e0b" /> Không giới hạn số lượng phòng</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={14} color="#f59e0b" /> Báo cáo doanh thu chi tiết & Phân quyền n/v</li>
              </ul>
              {selectedPlan === 'pro' && <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#f59e0b', borderRadius: '50%', padding: '4px', color: '#fff' }}><CheckCircle2 size={16} /></div>}
            </div>
          </div>

          <button 
            onClick={handleUpgrade}
            disabled={!selectedPlan || isUpgrading}
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: !selectedPlan ? 'rgba(255,255,255,0.1)' : (selectedPlan === 'pro' ? 'var(--accent-gradient)' : '#3b82f6'), 
              color: !selectedPlan ? 'var(--text-secondary)' : '#fff', 
              border: 'none', 
              borderRadius: '12px', 
              cursor: (!selectedPlan || isUpgrading) ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'var(--transition)',
              marginBottom: '16px'
            }}
          >
            {isUpgrading ? 'Đang xử lý...' : (selectedPlan === 'pro' ? 'Tiếp tục Thanh Toán' : 'Bắt đầu sử dụng')}
            {!isUpgrading && selectedPlan && <ArrowRight size={18} />}
          </button>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.5' }}>
            Hoặc nếu bạn là khách thuê, vui lòng báo Quản lý gán phòng để truy cập.
          </p>
          <button 
            onClick={logout} 
            style={{ 
              marginTop: '12px', 
              width: '100%', 
              padding: '10px', 
              background: 'transparent', 
              border: '1px solid var(--border-glass)', 
              color: 'var(--text-secondary)', 
              borderRadius: '12px', 
              cursor: 'pointer', 
              fontSize: '0.9rem',
              transition: 'var(--transition)'
            }}
          >
            Đăng xuất tài khoản
          </button>
        </div>
      </div>
    );
  }

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
              {myInvoice.status === 'unpaid' ? 'CHƯA THANH TOÁN' : 'ĐÃ THANH TOÁN'}
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '4px' }}>{myInvoice.amount} đ</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '16px' }}>Hạn chót: {myInvoice.due}</div>

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

