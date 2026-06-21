import { useState, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SuperAdmin() {
  const { users, updateUser } = useAppData();
  const { user } = useAuth();
  
  // Lọc ra các user đang chờ duyệt
  const pendingUsers = users.filter(u => u.plan === 'pending_pro' || u.plan === 'pending_basic');

  if (user?.email !== 'nguyentienducbmt123@gmail.com' && user?.email !== 'admin@gmail.com') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        <Shield size={64} style={{ marginBottom: '16px', color: 'var(--status-overdue)' }} />
        <h2>Truy cập bị từ chối</h2>
        <p>Đây là khu vực nội bộ dành cho Chủ phần mềm.</p>
      </div>
    );
  }

  const handleApprove = (userId, currentPlan) => {
    if (window.confirm(`Bạn xác nhận đã nhận được tiền và cấp Gói ${currentPlan === 'pending_pro' ? 'PRO' : 'CƠ BẢN'} cho tài khoản này?`)) {
      if (currentPlan === 'pending_pro') {
        updateUser(userId, { role: 'admin', plan: 'pro' });
      } else {
        updateUser(userId, { role: 'manager', plan: 'basic' });
      }
      toast.success('Đã duyệt nâng cấp tài khoản thành công!');
    }
  };

  const handleReject = (userId) => {
    if (window.confirm('Từ chối yêu cầu này? Tài khoản sẽ bị khóa nâng cấp.')) {
      updateUser(userId, { plan: 'trial' }); // Đẩy về dùng thử hoặc khóa
      toast.success('Đã từ chối nâng cấp.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={28} color="var(--accent-primary)" />
          Super Admin - Phê duyệt Thanh toán
        </h1>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border-glass)', overflow: 'hidden', padding: '24px' }}>
        <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '16px' }}>Danh sách chờ duyệt Nâng Cấp Gói PRO (MoMo)</h3>
        
        {pendingUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Không có yêu cầu nâng cấp nào đang chờ xử lý.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {pendingUsers.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{u.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Email: {u.email}</div>
                  <div style={{ marginTop: '8px', display: 'inline-block', background: u.plan === 'pending_pro' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: u.plan === 'pending_pro' ? '#f59e0b' : '#3b82f6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    YÊU CẦU: {u.plan === 'pending_pro' ? 'GÓI PRO (199K)' : 'GÓI BASIC (69K)'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => handleApprove(u.id, u.plan)}
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <CheckCircle size={18} /> Duyệt & Nâng Cấp
                  </button>
                  <button 
                    onClick={() => handleReject(u.id)}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <XCircle size={18} /> Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
