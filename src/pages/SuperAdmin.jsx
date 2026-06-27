import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, CheckCircle, XCircle, Lock, Unlock, Users, Plus, Eye, Key, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, firebaseSignUpWithEmail } from '../firebase';

const getUsageStatus = (u) => {
  if (u.email === 'nguyentienducbmt123@gmail.com') {
    return { text: 'Không giới hạn', color: '#10b981', badge: 'rgba(16, 185, 129, 0.15)' };
  }
  
  const now = new Date();
  
  if (u.plan === 'pro' || u.plan === 'basic') {
    if (!u.subscriptionEndsAt) {
      return { text: 'Hoạt động (Vô hạn)', color: '#10b981', badge: 'rgba(16, 185, 129, 0.15)' };
    }
    const ends = new Date(u.subscriptionEndsAt);
    const diffTime = ends - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      return { text: `Hoạt động (Còn ${diffDays} ngày)`, color: '#10b981', badge: 'rgba(16, 185, 129, 0.15)' };
    } else {
      return { text: 'Đã hết hạn cước', color: '#ef4444', badge: 'rgba(239, 68, 68, 0.15)' };
    }
  }
  
  // Trial plan
  if (u.trialEndsAt) {
    const ends = new Date(u.trialEndsAt);
    const diffTime = ends - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      return { text: `Dùng thử (Còn ${diffDays} ngày)`, color: '#f59e0b', badge: 'rgba(245, 158, 11, 0.15)' };
    } else {
      return { text: 'Hết hạn dùng thử', color: '#ef4444', badge: 'rgba(239, 68, 68, 0.15)' };
    }
  }
  
  return { text: 'Hết hạn dùng thử', color: '#ef4444', badge: 'rgba(239, 68, 68, 0.15)' };
};

export default function SuperAdmin() {
  const { user } = useAuth();
  const [globalUsers, setGlobalUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Account State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('manager');
  const [newPlan, setNewPlan] = useState('trial');

  useEffect(() => {
    let active = true;
    async function fetchGlobalUsers() {
      try {
        const snap = await getDocs(collection(db, 'users'));
        if (!active) return;
        const uList = [];
        snap.forEach(document => {
          uList.push({ id: document.id, ...document.data() });
        });
        setGlobalUsers(uList);
      } catch (err) {
        console.error("Fetch global users error:", err);
      }
    }

    if (user?.email === 'nguyentienducbmt123@gmail.com') {
      fetchGlobalUsers();
    }
    return () => { active = false; };
  }, [user]);

  const updateUserGlobal = async (userId, data) => {
    try {
      await updateDoc(doc(db, 'users', userId), data);
      setGlobalUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u));
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật tài khoản!');
    }
  };
  
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
      updateUserGlobal(userId, { plan: 'trial' });
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

  const handleDeleteAccount = async (userId, name) => {
    if (userId === 'nguyentienducbmt123@gmail.com') {
      toast.error('Không thể xóa tài khoản hệ thống (Chủ sở hữu)!');
      return;
    }
    if (window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản ${name} (${userId}) không?\nHành động này không thể hoàn tác!`)) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setGlobalUsers(globalUsers.filter(u => u.id !== userId));
        toast.success(`Đã xóa tài khoản ${name} thành công`);
      } catch (err) {
        toast.error('Lỗi khi xóa tài khoản: ' + err.message);
      }
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      // Create with Firebase Auth
      const result = await firebaseSignUpWithEmail(newEmail, newPassword);
      
      const newAcc = {
        id: newEmail,
        email: newEmail,
        name: newName,
        role: newRole,
        plan: newPlan,
        uid: result.user.uid,
        ownerId: result.user.uid,
        trialEndsAt: newPlan === 'trial' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        status: 'active'
      };

      await setDoc(doc(db, 'users', newEmail), newAcc);
      setGlobalUsers([...globalUsers, newAcc]);
      setShowCreateModal(false);
      toast.success('Đã tạo tài khoản thành công!');
      
      setNewEmail(''); setNewPassword(''); setNewName('');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        if (window.confirm('Tài khoản này ĐÃ TỒN TẠI trên Firebase Auth nhưng bị mất hồ sơ hiển thị. Bạn có muốn PHỤC HỒI hồ sơ cho tài khoản này (Khách giữ nguyên mật khẩu cũ) không?')) {
          const newAcc = {
            id: newEmail,
            email: newEmail,
            name: newName,
            role: newRole,
            plan: newPlan,
            ownerId: newEmail, // Fallback temporary ownerId
            trialEndsAt: newPlan === 'trial' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
            status: 'active'
          };
          setDoc(doc(db, 'users', newEmail), newAcc).then(() => {
            setGlobalUsers([...globalUsers, newAcc]);
            setShowCreateModal(false);
            toast.success('Đã phục hồi hồ sơ thành công! Khách hàng có thể đăng nhập bằng mật khẩu cũ của họ.');
            setNewEmail(''); setNewPassword(''); setNewName('');
          }).catch(e => toast.error('Lỗi phục hồi: ' + e.message));
        }
      } else {
        toast.error('Lỗi: ' + (err.message || 'Không thể tạo tài khoản'));
      }
    }
  };

  const handleImpersonate = (ownerId) => {
    alert(`Tính năng này sẽ cho phép bạn xem Workspace (ownerId: ${ownerId}) dưới dạng Read-Only. Đang phát triển.`);
  };

  // Stats
  const totalAccounts = globalUsers.length;
  const proAccounts = globalUsers.filter(u => u.plan === 'pro').length;
  const basicAccounts = globalUsers.filter(u => u.plan === 'basic').length;
  const trialAccounts = globalUsers.filter(u => u.plan === 'trial' || !u.plan).length;
  const blockedAccounts = globalUsers.filter(u => u.status === 'blocked').length;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Shield size={28} color="var(--accent-primary)" />
          Super Admin - Trung tâm Cấp phép
        </h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-primary)', color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Plus size={18} /> Cấp tài khoản mới
        </button>
      </div>

      {/* OVERVIEW STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '12px', borderRadius: '50%' }}><Users size={24} color="var(--text-primary)" /></div>
          <div><div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tổng tài khoản</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalAccounts}</div></div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '50%' }}><Key size={24} color="#f59e0b" /></div>
          <div><div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Đang dùng PRO</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{proAccounts}</div></div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '50%' }}><Key size={24} color="#3b82f6" /></div>
          <div><div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Đang dùng BASIC</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{basicAccounts}</div></div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '50%' }}><Users size={24} color="#10b981" /></div>
          <div><div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Đang dùng Thử</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{trialAccounts}</div></div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '50%' }}><Lock size={24} color="#ef4444" /></div>
          <div><div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Bị khóa</div><div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{blockedAccounts}</div></div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border-glass)', overflow: 'hidden', padding: '24px' }}>
        <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '16px' }}>Danh sách chờ duyệt Nâng Cấp Gói PRO (MoMo)</h3>
        {pendingUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>Không có yêu cầu nâng cấp nào đang chờ xử lý.</div>
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
                  <button onClick={() => handleApprove(u.id, u.plan)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} /> Duyệt & Nâng Cấp</button>
                  <button onClick={() => handleReject(u.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><XCircle size={18} /> Từ chối</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border-glass)', overflow: 'auto', padding: '24px', marginTop: '32px' }}>
        <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '16px' }}>Toàn Bộ Tài Khoản Trên Hệ Thống</h3>
        
        {globalUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>Chưa có tài khoản nào.</div>
        ) : (
          <table className="data-table" style={{ width: '100%', minWidth: '1000px' }}>
            <thead>
              <tr>
                <th>Tên & Email</th>
                <th>Vai trò</th>
                <th>Gói (Plan)</th>
                <th>Trạng thái sử dụng</th>
                <th>Đăng nhập cuối</th>
                <th>Owner ID (Workspace)</th>
                <th style={{ textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {globalUsers.map(u => (
                <tr key={u.id} style={{ opacity: u.status === 'blocked' ? 0.6 : 1 }}>
                  <td>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{u.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                  </td>
                  <td>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', fontSize: '0.85rem' }}>{u.role || 'guest'}</span>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold',
                      background: u.plan === 'pro' ? 'rgba(245, 158, 11, 0.2)' : u.plan === 'basic' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.1)',
                      color: u.plan === 'pro' ? '#f59e0b' : u.plan === 'basic' ? '#3b82f6' : 'var(--text-secondary)'
                    }}>
                      {u.plan?.toUpperCase() || 'TRIAL'}
                    </span>
                    {(u.plan === 'pro' || u.plan === 'basic') && u.subscriptionEndsAt && (
                      <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>Hết hạn: {new Date(u.subscriptionEndsAt).toLocaleDateString('vi-VN')}</div>
                    )}
                  </td>
                  <td>
                    {u.status === 'blocked' ? (
                      <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>BỊ KHÓA</span>
                    ) : (() => {
                      const usage = getUsageStatus(u);
                      return (
                        <span style={{ 
                          color: usage.color, 
                          fontWeight: 'bold', 
                          fontSize: '0.85rem',
                          background: usage.badge,
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          {usage.text.toUpperCase()}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    {u.lastLoginAt ? (
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {new Date(u.lastLoginAt).toLocaleDateString('vi-VN')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {new Date(u.lastLoginAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Chưa đăng nhập</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    {u.ownerId}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleImpersonate(u.ownerId)}
                        title="Xem Workspace"
                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                      ><Eye size={16} /></button>
                      
                      {(u.plan === 'pro' || u.plan === 'basic') && (
                        <button 
                          onClick={() => handleExtend(u.id, u.name, u.subscriptionEndsAt)}
                          title="Gia hạn"
                          style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >+ Gia hạn</button>
                      )}
                      
                      <button 
                        onClick={() => handleToggleBlock(u.id, u.name, u.status)}
                        title={u.status === 'blocked' ? 'Mở Khóa' : 'Khóa'}
                        style={{ background: u.status === 'blocked' ? '#10b981' : 'rgba(239, 68, 68, 0.1)', color: u.status === 'blocked' ? '#fff' : '#ef4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        {u.status === 'blocked' ? <Unlock size={16} /> : <Lock size={16} />}
                      </button>
                      
                      <button 
                        onClick={() => handleDeleteAccount(u.id, u.name)}
                        title="Xóa tài khoản"
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE ACCOUNT MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', width: '400px', border: '1px solid var(--border-glass)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px' }}>Cấp Tài Khoản Khách Hàng</h3>
            <form onSubmit={handleCreateAccount}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Họ và tên</label>
                <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email đăng nhập</label>
                <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Mật khẩu</label>
                <input type="text" required value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>Gói cấp phép</label>
                <select value={newPlan} onChange={e => setNewPlan(e.target.value)} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff' }}>
                  <option value="trial">Dùng Thử (30 Ngày)</option>
                  <option value="basic">Gói BASIC</option>
                  <option value="pro">Gói PRO</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ flex: 1, padding: '10px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Tạo Tài Khoản</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
