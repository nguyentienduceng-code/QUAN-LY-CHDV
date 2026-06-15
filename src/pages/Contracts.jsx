import { useAppData } from '../context/AppDataContext';
import { Search, Plus, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import TenantDetailDrawer from '../components/TenantDetailDrawer';
import { exportAllDataToExcel } from '../utils/exportExcel';
import { useState } from 'react';

export default function Contracts() {
  const appData = useAppData();
  const { contracts, tenants, addContract } = appData;
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAddContract = () => {
    const tenantName = prompt('Nhập tên khách thuê:');
    if (!tenantName) return;
    const room = prompt('Nhập Tòa nhà và Số phòng (Ví dụ: Nhà A - P.101):');
    const deposit = prompt('Nhập tiền cọc (VNĐ):') || '5.000.000';
    addContract({ tenantName, room, deposit, startDate: new Date().toLocaleDateString('vi-VN'), endDate: '31/12/2026' });
    toast.success('Đã tạo hợp đồng mới!');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Quản Lý Hợp Đồng</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-bar" style={{ width: '300px' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input type="text" placeholder="Tìm kiếm hợp đồng..." />
          </div>
          <button 
            onClick={() => {
              exportAllDataToExcel(appData);
              toast.success('Đã tải dữ liệu hợp đồng (.xlsx)');
            }} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <Download size={16} /> Xuất Excel
          </button>
          <button onClick={handleAddContract} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
            <Plus size={16} /> Tạo HĐ Mới
          </button>
        </div>
      </div>

      <div style={{ 
        background: 'var(--bg-card)', 
        borderRadius: 'var(--radius)', 
        border: '1px solid var(--border-glass)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
            <tr>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Mã HĐ</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Khách Thuê</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Phòng</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Ngày Bắt Đầu</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Ngày Kết Thúc</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Tiền Cọc (VNĐ)</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Trạng Thái</th>
              <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c, index) => (
              <tr key={c.id} style={{ borderBottom: index === contracts.length - 1 ? 'none' : '1px solid var(--border-glass)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '16px', fontWeight: '500', color: 'var(--accent-primary)' }}>{c.id}</td>
                <td style={{ padding: '16px', fontWeight: '600' }}>{c.tenantName}</td>
                <td style={{ padding: '16px' }}><span style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{c.room}</span></td>
                <td style={{ padding: '16px' }}>{c.startDate}</td>
                <td style={{ padding: '16px', color: c.status === 'expiring' ? 'var(--status-expiring)' : 'inherit' }}>
                  {c.endDate} {c.status === 'expiring' && <span style={{ fontSize: '0.8rem', marginLeft: '4px' }}>(Còn 15 ngày)</span>}
                </td>
                <td style={{ padding: '16px', fontWeight: '600' }}>{c.deposit}</td>
                <td style={{ padding: '16px' }}>
                  <StatusBadge 
                    status={c.status === 'expiring' ? 'expiring' : 'occupied'} 
                    text={c.status === 'expiring' ? 'Sắp hết hạn' : 'Đang hiệu lực'} 
                  />
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => {
                        const t = tenants.find(t => t.name === c.tenantName);
                        if (t) {
                          setSelectedTenantId(t.id);
                          setIsDrawerOpen(true);
                        } else {
                          toast.error('Không tìm thấy thông tin khách hàng này!');
                        }
                      }}
                      style={{ padding: '6px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      Chi tiết
                    </button>
                    {c.status === 'expiring' && (
                      <button onClick={() => toast.success('Đã gửi thông báo Zalo ZNS cho khách hàng!')} style={{ padding: '6px 12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', color: 'var(--status-expiring)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Gửi Zalo</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TenantDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        tenantId={selectedTenantId} 
      />
    </div>
  );
}
