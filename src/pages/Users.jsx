import { useState } from 'react';
import { Shield, Plus, Edit, Trash2, Key } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Users() {
  const { users, addUser, updateUser, deleteUser, rooms } = useAppData();
  const { user } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'tenant',
    room: ''
  });

  if (user?.role !== 'admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        <Shield size={64} style={{ marginBottom: '16px', color: 'var(--status-overdue)' }} />
        <h2>Truy cập bị từ chối</h2>
        <p>Bạn không có quyền xem trang này.</p>
      </div>
    );
  }

  const handleOpenModal = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        name: userToEdit.name || '',
        email: userToEdit.email || '',
        role: userToEdit.role || 'tenant',
        room: userToEdit.room || ''
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'tenant', room: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.email) {
      toast.error('Vui lòng nhập Email!');
      return;
    }
    if (formData.role === 'tenant' && !formData.room) {
      toast.error('Khách thuê bắt buộc phải gắn với một phòng!');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, formData);
      toast.success('Cập nhật người dùng thành công!');
    } else {
      addUser(formData);
      toast.success('Thêm người dùng mới thành công!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      deleteUser(id);
      toast.success('Đã xóa người dùng!');
    }
  };

  const roleText = {
    admin: 'Quản lý chính',
    staff: 'Nhân viên',
    viewer: 'Người theo dõi',
    tenant: 'Khách thuê',
    guest: 'Chưa phân quyền'
  };

  const roleColor = {
    admin: 'var(--status-overdue)',
    staff: 'var(--accent-primary)',
    viewer: '#8b5cf6',
    tenant: 'var(--status-occupied)',
    guest: 'var(--text-secondary)'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Key size={28} color="var(--accent-primary)" />
          Phân Quyền & Tài Khoản
        </h1>
        <button 
          onClick={() => handleOpenModal()} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
        >
          <Plus size={16} /> Thêm Tài Khoản
        </button>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="mobile-card-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
              <tr>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Email Đăng Nhập</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Họ Tên</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Vai Trò</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Phòng</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => (
                <tr key={u.id} style={{ borderBottom: index === users.length - 1 ? 'none' : '1px solid var(--border-glass)', transition: 'background 0.2s' }}>
                  <td data-label="Email" style={{ padding: '16px', fontWeight: '500', color: 'var(--accent-primary)' }}>{u.email}</td>
                  <td data-label="Họ Tên" style={{ padding: '16px', fontWeight: '600' }}>{u.name}</td>
                  <td data-label="Vai Trò" style={{ padding: '16px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', color: roleColor[u.role] || 'var(--text-secondary)', border: `1px solid ${roleColor[u.role]}` }}>
                      {roleText[u.role] || u.role}
                    </span>
                  </td>
                  <td data-label="Phòng" style={{ padding: '16px' }}>
                    {u.room ? <span style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>P.{u.room}</span> : <span style={{ color: 'var(--text-secondary)' }}>-</span>}
                  </td>
                  <td data-label="Thao Tác" style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleOpenModal(u)} style={{ padding: '6px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(u.id)} style={{ padding: '6px', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--status-overdue)', borderRadius: '4px', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setIsModalOpen(false)}></div>
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editingUser ? 'Sửa Người Dùng' : 'Thêm Người Dùng'}</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email (Dùng để đăng nhập qua Google)</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="nguyenvana@gmail.com"
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Họ tên</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }} 
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phân quyền</label>
                <select 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value, room: e.target.value !== 'tenant' ? '' : formData.room})} 
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="admin">Quản lý chính (Toàn quyền)</option>
                  <option value="staff">Nhân viên (Vận hành, Không xóa)</option>
                  <option value="viewer">Nhà đầu tư (Chỉ xem thống kê)</option>
                  <option value="tenant">Khách thuê (Chỉ xem phòng của mình)</option>
                  <option value="guest">Khách (Chưa duyệt)</option>
                </select>
              </div>

              {formData.role === 'tenant' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gán vào Phòng</label>
                  <select 
                    value={formData.room} 
                    onChange={e => setFormData({...formData, room: e.target.value})} 
                    style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                  >
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.name}>Phòng {r.name} - Nhà {r.building}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Hủy</button>
              <button onClick={handleSave} style={{ padding: '10px 20px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Lưu Tài Khoản</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
