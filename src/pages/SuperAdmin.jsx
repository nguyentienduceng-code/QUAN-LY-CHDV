import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, CheckCircle, XCircle, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function SuperAdmin() {
  const { user } = useAuth();
  const [globalUsers, setGlobalUsers] = useState([]);
  
  useEffect(() => {
    if (user?.email === 'nguyentienducbmt123@gmail.com') {
      fetchGlobalUsers();
    }
  }, [user]);

  const fetchGlobalUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const uList = [];
      snap.forEach(document => {
        uList.push({ id: document.id, ...document.data() });
      });
      setGlobalUsers(uList);
    } catch (err) {
      console.error("Fetch global users error:", err);
    }
  };

  const updateUserGlobal = async (userId, data) => {
    try {
      await updateDoc(doc(db, 'users', userId), data);
      setGlobalUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật tài khoản!');
    }
  };
  
  // Lọc ra các user đang chờ duyệt
  const pendingUsers = globalUsers.filter(u => u.plan === 'pending_pro' || u.plan === 'pending_basic');
  const activeUsers = globalUsers.filter(u => u.plan === 'pro' || u.plan === 'basic');

  if (user?.email !== 'nguyentienducbmt123@gmail.com') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        <Shield size={64} style={{ marginBottom: '16px', color: 'var(--status-overdue)' }} />
        <h2>Truy cập bị từ chối</h2>
        <p>Đây là khu vực nội bộ dành cho Chủ phần mềm.</p>
      </div>
    );
  }

  const handleApprove = (userId, currentPlan) => {
    if (window.confirm(`Bạn xác nhận đã nhận được tiền và cấp Gói ${currentPlan === 'pending_pro' ? 'PRO' : 'CƠ BẢN'} cho tài khoản này (30 ngày)?`)) {
      const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      if (currentPlan === 'pending_pro') {
        updateUserGlobal(userId, { role: 'admin', plan: 'pro', subscriptionEndsAt, gracePeriodEndsAt: null, status: 'active' });
      } else {
        updateUserGlobal(userId, { role: 'manager', plan: 'basic', subscriptionEndsAt, gracePeriodEndsAt: null, status: 'active' });
      }
      toast.success('Đã duyệt nâng cấp tài khoản thành công!');
    }
  };

  const handleReject = (userId) => {
    if (window.confirm('Từ chối yêu cầu này? Tài khoản sẽ bị khóa nâng cấp.')) {
      updateUserGlobal(userId, { plan: 'trial' }); // Đẩy về dùng thử hoặc khóa
      toast.success('Đã từ chối nâng cấp.');
    }
  };

  const handleRevoke = (userId, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn THU HỒI gói cước của quản lý ${name}? (Đưa về gói dùng thử)`)) {
      updateUserGlobal(userId, { plan: 'trial', role: 'manager' });
      toast.success(`Đã thu hồi gói của ${name}`);
    }
  };

  const handleExtend = (userId, name, currentEndsAt) => {
    const promptDays = window.prompt(`Nhập số ngày muốn gia hạn thêm cho ${name}:`, '30');
    if (promptDays && !isNaN(promptDays)) {
      const days = parseInt(promptDays);
      const baseDate = currentEndsAt && new Date(currentEndsAt) > new Date() ? new Date(currentEndsAt) : new Date();
      const newEndsAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
      updateUserGlobal(userId, { subscriptionEndsAt: newEndsAt, gracePeriodEndsAt: null });
      toast.success(`Đã gia hạn thêm ${days} ngày cho ${name}`);
    }
  };

  const handleToggleBlock = (userId, name, currentStatus) => {
    const isBlocked = currentStatus === 'blocked';
    const action = isBlocked ? 'MỞ KHÓA' : 'KHÓA TRUY CẬP';
    if (window.confirm(`Bạn có chắc chắn muốn ${action} đối với tài khoản ${name}?`)) {
      updateUserGlobal(userId, { status: isBlocked ? 'active' : 'blocked' });
      toast.success(`Đã ${action.toLowerCase()} tài khoản ${name}`);
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

      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border-glass)', overflow: 'hidden', padding: '24px', marginTop: '32px' }}>
        <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '16px' }}>Danh sách Quản lý Đang hoạt động (Pro/Basic)</h3>
        
        {activeUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Chưa có khách hàng nào đang sử dụng gói trả phí.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {activeUsers.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{u.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Email: {u.email}</div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ background: u.plan === 'pro' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)', color: u.plan === 'pro' ? '#f59e0b' : '#3b82f6', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      {u.plan === 'pro' ? 'GÓI PRO' : 'GÓI BASIC'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: u.subscriptionEndsAt && new Date(u.subscriptionEndsAt) > new Date() ? '#10b981' : '#ef4444' }}>
                      Hết hạn: {u.subscriptionEndsAt ? new Date(u.subscriptionEndsAt).toLocaleDateString('vi-VN') : 'Không rõ'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => handleExtend(u.id, u.name, u.subscriptionEndsAt)}
                    style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    + Gia hạn
                  </button>
                  <button 
                    onClick={() => handleRevoke(u.id, u.name)}
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Thu hồi gói
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border-glass)', overflow: 'hidden', padding: '24px', marginTop: '32px' }}>
        <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '16px' }}>Toàn Bộ Tài Khoản Trên Hệ Thống</h3>
        
        {globalUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            Chưa có tài khoản nào.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {globalUsers.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: u.status === 'blocked' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: u.status === 'blocked' ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: u.status === 'blocked' ? 'line-through' : 'none' }}>{u.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Email: {u.email}</div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      Vai trò: {u.role || 'Khách'}
                    </span>
                    <span style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      Gói: {u.plan || 'Chưa rõ'}
                    </span>
                    {u.status === 'blocked' && (
                      <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        ĐÃ BỊ KHÓA
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => handleToggleBlock(u.id, u.name, u.status)}
                    style={{ background: u.status === 'blocked' ? '#10b981' : 'rgba(239, 68, 68, 0.1)', color: u.status === 'blocked' ? '#fff' : '#ef4444', border: u.status === 'blocked' ? 'none' : '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    {u.status === 'blocked' ? <Unlock size={16} /> : <Lock size={16} />}
                    {u.status === 'blocked' ? 'Mở Khóa' : 'Khóa Truy Cập'}
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
