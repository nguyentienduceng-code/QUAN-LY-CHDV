import { useAppData } from '../context/AppDataContext';
import { Plus, Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import TenantDetailDrawer from '../components/TenantDetailDrawer';
import { exportAllDataToExcel } from '../utils/exportExcel';
import { useState } from 'react';

export default function Tenants() {
  const appData = useAppData();
  const { tenants, addTenant, deleteTenant } = appData;
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAddTenant = () => {
    const name = prompt('Nhập Họ và Tên Khách mới:');
    if (!name) return;
    const room = prompt('Nhập Số Phòng (Ví dụ: P.105):') || 'Chưa xếp';
    const phone = prompt('Nhập Số Điện Thoại:') || 'Đang cập nhật';
    const idCard = prompt('Nhập CCCD:') || 'Chưa cập nhật';
    const note = prompt('Nhập Ghi chú (VD: Khách VIP):') || 'Khách mới';
    addTenant({ name, room, phone, idCard, note });
    toast.success('Đã thêm khách thuê thành công!');
  };



  const handleDeleteTenant = (id) => {
    if (confirm('Bạn có chắc chắn muốn xóa khách này khỏi hệ thống?')) {
      deleteTenant(id);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Quản Lý Khách Thuê</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-bar" style={{ width: '250px' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input type="text" placeholder="Tìm kiếm khách..." />
          </div>
          <button onClick={() => toast('Chức năng đang phát triển', { icon: '🚧' })} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', cursor: 'pointer' }}>
            Nhập Excel
          </button>
          <button 
            onClick={() => {
              exportAllDataToExcel(appData);
              toast.success('Đã tải danh sách dữ liệu (.xlsx)');
            }} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            Xuất Excel
          </button>
          <button onClick={handleAddTenant} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
            <Plus size={16} /> Thêm Khách Mới
          </button>
        </div>
      </div>

      <div className="spec-table-container">
        <div className="table-responsive">
          <table className="spec-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
              <tr>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Mã Khách</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Họ và Tên</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Phòng</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Số Điện Thoại</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>CCCD</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Ghi chú</th>
                <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t, index) => (
                <tr key={t.id} style={{ borderBottom: index === tenants.length - 1 ? 'none' : '1px solid var(--border-glass)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '16px', fontWeight: '500' }}>{t.id}</td>
                  <td style={{ padding: '16px', fontWeight: '600' }}>{t.name}</td>
                  <td style={{ padding: '16px' }}><span style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{t.room}</span></td>
                  <td style={{ padding: '16px' }}>{t.phone}</td>
                  <td style={{ padding: '16px' }}>{t.idCard}</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t.note || (t.status === 'active' ? 'Khách mới' : (t.status === 'vip' ? 'Khách VIP' : ''))}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setSelectedTenantId(t.id); setIsDrawerOpen(true); }} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={14} /> Chi tiết
                      </button>
                      <button onClick={() => handleDeleteTenant(t.id)} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--status-overdue)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TenantDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        tenantId={selectedTenantId} 
      />
    </div>
  );
}
