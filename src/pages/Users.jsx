import { useState, useMemo } from 'react';
import { Shield, Plus, Edit, Trash2, Key, ChevronDown, ChevronRight, Building, User } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useCustomConfirm } from '../context/CustomPromptContext';
import toast from 'react-hot-toast';

export default function Users() {
  const { users, addUser, updateUser, deleteUser, rooms, settings, tenants } = useAppData();
  const { user } = useAuth();
  const customConfirm = useCustomConfirm();
  
  const displayUsers = useMemo(() => {
    const merged = [...users];
    
    if (tenants && Array.isArray(tenants)) {
      tenants.forEach(t => {
        if (t.email && t.email.trim() !== '') {
          // Chỉ thêm nếu email chưa tồn tại trong danh sách users cứng
          const exists = merged.find(u => u.email.toLowerCase() === t.email.toLowerCase());
          if (!exists) {
            merged.push({
              id: `auto-${t.id || Math.random()}`,
              email: t.email,
              name: t.name || 'Khách thuê',
              role: 'tenant',
              room: t.room,
              isAutoSynced: true
            });
          }
        }
      });
    }
    
    return merged;
  }, [users, tenants]);
  
  const groupedUsers = useMemo(() => {
    const groups = {
      globals: [],
      buildings: {},
      guests: []
    };
    
    displayUsers.forEach(u => {
      if (u.role === 'guest') {
        groups.guests.push(u);
      } else if (u.role === 'admin' || u.role === 'staff' || (u.allowedBuildings && u.allowedBuildings.includes('all'))) {
        groups.globals.push(u);
      } else if (u.role === 'investor' || u.role === 'tech') {
        if (u.allowedBuildings && u.allowedBuildings.length > 0) {
          u.allowedBuildings.forEach(bldg => {
            if (!groups.buildings[bldg]) groups.buildings[bldg] = { managers: [], floors: {} };
            groups.buildings[bldg].managers.push(u);
          });
        } else {
          groups.globals.push(u);
        }
      } else if (u.role === 'tenant') {
        const roomInfo = rooms?.find(r => r.name === u.room);
        const building = roomInfo ? roomInfo.building : 'Khác';
        
        const getFloor = (r) => {
          if (r && r.floor !== undefined && r.floor !== null && !isNaN(Number(r.floor))) return Number(r.floor);
          const digits = u.room.replace(/\D/g, '');
          if (digits.length >= 3) return parseInt(digits.slice(0, digits.length - 2), 10) || 1;
          return 1;
        };
        const floor = getFloor(roomInfo);

        if (!groups.buildings[building]) groups.buildings[building] = { managers: [], floors: {} };
        if (!groups.buildings[building].floors[floor]) groups.buildings[building].floors[floor] = {};
        if (!groups.buildings[building].floors[floor][u.room]) groups.buildings[building].floors[floor][u.room] = [];
        groups.buildings[building].floors[floor][u.room].push(u);
      }
    });
    
    return groups;
  }, [displayUsers, rooms]);

  const [expandedBuildings, setExpandedBuildings] = useState([]);
  const toggleBuilding = (bldg) => {
    setExpandedBuildings(prev => prev.includes(bldg) ? prev.filter(b => b !== bldg) : [...prev, bldg]);
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'tenant',
    room: '',
    allowedBuildings: ['all']
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
        room: userToEdit.room || '',
        allowedBuildings: userToEdit.allowedBuildings || ['all']
      });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'tenant', room: '', allowedBuildings: ['all'] });
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
      if (editingUser.isAutoSynced) {
        addUser(formData);
        toast.success('Đã cấp quyền chính thức cho khách thuê!');
      } else {
        updateUser(editingUser.id, formData);
        toast.success('Cập nhật người dùng thành công!');
      }
    } else {
      addUser(formData);
      toast.success('Thêm người dùng mới thành công!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id, isAutoSynced) => {
    if (isAutoSynced) {
      toast.error('Tài khoản này được đồng bộ tự động. Vui lòng xóa email trong tab "Khách & Hóa Đơn" để gỡ bỏ.');
      return;
    }
    const ok = await customConfirm('Bạn có chắc muốn xóa người dùng này?');
    if (ok) {
      deleteUser(id);
      toast.success('Đã xóa người dùng!');
    }
  };

  const roleText = {
    admin: 'Quản lý chính',
    staff: 'Nhân viên',
    investor: 'Nhà đầu tư',
    tech: 'Kỹ thuật',
    tenant: 'Khách thuê',
    guest: 'Chưa phân quyền'
  };

  const roleColor = {
    admin: 'var(--status-overdue)',
    staff: 'var(--accent-primary)',
    investor: '#8b5cf6',
    tech: '#f59e0b',
    tenant: 'var(--status-occupied)',
    guest: 'var(--text-secondary)'
  };

  const UserRow = ({ u }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border-glass)', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 200px' }}>
        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{u.name}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: '500', marginTop: '4px' }}>
          {u.email}
          {u.isAutoSynced && <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 6px', borderRadius: '4px' }}>Tự động</span>}
        </div>
      </div>
      <div style={{ flex: '1 1 120px' }}>
        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', color: roleColor[u.role] || 'var(--text-secondary)', border: `1px solid ${roleColor[u.role]}` }}>
          {roleText[u.role] || u.role}
        </span>
      </div>
      {u.room && (
        <div style={{ width: '80px' }}>
          <span style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}>P.{u.room}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => handleOpenModal(u)} style={{ padding: '6px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer' }}>
          <Edit size={16} />
        </button>
        <button onClick={() => handleDelete(u.id, u.isAutoSynced)} style={{ padding: '6px', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--status-overdue)', borderRadius: '4px', cursor: 'pointer' }}>
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Key size={28} color="var(--accent-primary)" />
          Phân Quyền & Tài Khoản
        </h1>
        <div className="page-header-actions">
          <button 
            onClick={() => handleOpenModal()} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
          >
            <Plus size={16} /> Thêm Tài Khoản
          </button>
        </div>
      </div>

      {/* GLOBAL USERS */}
      {groupedUsers.globals.length > 0 && (
        <div style={{ marginBottom: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-glass)', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={20} /> Hệ Thống Chung (Quản trị, Nhân sự)
          </div>
          {groupedUsers.globals.map(u => <UserRow key={u.id} u={u} />)}
        </div>
      )}

      {/* BUILDINGS */}
      {Object.keys(groupedUsers.buildings).sort().map(bldg => {
        const buildingData = groupedUsers.buildings[bldg];
        const isExpanded = expandedBuildings.includes(bldg);
        return (
          <div key={bldg} style={{ marginBottom: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
            <div 
              onClick={() => toggleBuilding(bldg)}
              style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderBottom: isExpanded ? '1px solid var(--border-glass)' : 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              <Building size={20} color="var(--accent-primary)" /> Tòa Nhà {bldg}
            </div>
            {isExpanded && (
              <div>
                {/* Managers of this building */}
                {buildingData.managers.length > 0 && (
                  <div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)', fontWeight: '600', color: '#f59e0b' }}>
                      Quản lý Tòa nhà (Nhà đầu tư / Kỹ thuật)
                    </div>
                    {buildingData.managers.map(u => <UserRow key={`mgr-${u.id}`} u={u} />)}
                  </div>
                )}
                
                {/* Floors */}
                {Object.keys(buildingData.floors).sort((a,b)=>a-b).map(floor => (
                  <div key={floor}>
                    <div style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)', borderTop: '1px solid var(--border-glass)', fontWeight: 'bold', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Tầng {floor}
                    </div>
                    {Object.keys(buildingData.floors[floor]).sort().map(roomName => (
                      <div key={roomName} style={{ paddingLeft: '16px', borderLeft: '4px solid var(--accent-primary)' }}>
                        {buildingData.floors[floor][roomName].map(u => <UserRow key={u.id} u={u} />)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* GUESTS */}
      {groupedUsers.guests.length > 0 && (
        <div style={{ marginBottom: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius)', border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
          <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-glass)', fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--status-overdue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={20} /> Khách Chưa Phân Quyền
          </div>
          {groupedUsers.guests.map(u => <UserRow key={u.id} u={u} />)}
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setIsModalOpen(false)}></div>
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
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
                  <option value="investor">Nhà đầu tư (Chỉ xem thống kê)</option>
                  <option value="tech">Kỹ thuật (Xem bảo trì)</option>
                  <option value="tenant">Khách thuê (Chỉ xem phòng của mình)</option>
                  <option value="guest">Khách (Chưa duyệt)</option>
                </select>
              </div>

              {(formData.role === 'investor' || formData.role === 'tech') && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Nhà được phép truy cập</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.allowedBuildings.includes('all')} 
                        onChange={(e) => {
                          if (e.target.checked) setFormData({...formData, allowedBuildings: ['all']});
                          else setFormData({...formData, allowedBuildings: []});
                        }} 
                      />
                      <span>Tất cả các nhà</span>
                    </label>
                    <hr style={{ borderTop: '1px dashed var(--border-glass)', borderBottom: 'none', margin: '4px 0' }} />
                    {settings?.buildings?.map(b => (
                      <label key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          disabled={formData.allowedBuildings.includes('all')}
                          checked={formData.allowedBuildings.includes('all') || formData.allowedBuildings.includes(b)} 
                          onChange={(e) => {
                            const newArr = [...formData.allowedBuildings].filter(i => i !== 'all');
                            if (e.target.checked) newArr.push(b);
                            else {
                              const idx = newArr.indexOf(b);
                              if (idx > -1) newArr.splice(idx, 1);
                            }
                            setFormData({...formData, allowedBuildings: newArr});
                          }} 
                        />
                        <span>Nhà {b}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
