import { X, User, FileText, FileSpreadsheet, Edit, Trash2, Save } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useAppData } from '../context/AppDataContext';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

export default function TenantDetailDrawer({ isOpen, onClose, tenantId }) {
  const { tenants, contracts, invoices, deleteTenant, updateTenant } = useAppData();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ phone: '', idCard: '', note: '' });

  const tenant = tenants.find(t => t.id === tenantId);

  useEffect(() => {
    if (tenant) {
      setEditForm({ phone: tenant.phone || '', idCard: tenant.idCard || '', note: tenant.note || '' });
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const contract = contracts.find(c => c.tenantName === tenant.name);
  const tenantInvoices = invoices.filter(i => i.tenant === tenant.name);

  const handleEdit = () => {
    if (isEditing) {
      updateTenant(tenant.id, editForm);
      toast.success('Đã lưu thông tin khách thuê!');
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleDelete = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa khách hàng ${tenant.name}?`)) {
      deleteTenant(tenant.id);
      onClose();
      toast.success('Đã xóa khách thuê thành công!');
    }
  };

  return (
    <>
      <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`drawer-content ${isOpen ? 'open' : ''}`}>
        
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h2 style={{ margin: '0 0 8px' }}>{tenant.name}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <StatusBadge status="occupied" text={`Phòng: ${tenant.room}`} />
              <StatusBadge status="active" text={tenant.id} />
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          
          {/* Thông tin cá nhân */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
              <User size={18} /> Thông tin Cá nhân
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Số điện thoại</div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.phone} 
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                    style={{ width: '100%', padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--accent-primary)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                ) : (
                  <div style={{ fontWeight: '600' }}>{tenant.phone}</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>CCCD</div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.idCard} 
                    onChange={e => setEditForm({...editForm, idCard: e.target.value})}
                    style={{ width: '100%', padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--accent-primary)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                ) : (
                  <div style={{ fontWeight: '600' }}>{tenant.idCard}</div>
                )}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ghi chú</div>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editForm.note} 
                    onChange={e => setEditForm({...editForm, note: e.target.value})}
                    style={{ width: '100%', padding: '8px', background: 'var(--bg-primary)', border: '1px solid var(--accent-primary)', borderRadius: '4px', color: 'var(--text-primary)', outline: 'none' }}
                  />
                ) : (
                  <div style={{ fontWeight: '600' }}>{tenant.note || 'Không có ghi chú'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Hợp đồng */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
              <FileText size={18} /> Hợp đồng Thuê
            </h3>
            {contract ? (
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Mã HĐ:</span>
                  <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{contract.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Thời hạn:</span>
                  <span style={{ fontWeight: '600' }}>{contract.startDate} - {contract.endDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tiền cọc:</span>
                  <span style={{ fontWeight: '600' }}>{contract.deposit} đ</span>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>Chưa có hợp đồng nào được tạo.</div>
            )}
          </div>

          {/* Lịch sử Hóa đơn */}
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
              <FileSpreadsheet size={18} /> Lịch sử Hóa đơn
            </h3>
            {tenantInvoices.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tenantInvoices.map((inv, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{inv.id}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hạn: {inv.due}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', color: inv.status === 'unpaid' ? 'var(--status-overdue)' : 'var(--status-occupied)', marginBottom: '4px' }}>{inv.amount} đ</div>
                      <StatusBadge status={inv.status} text={inv.status === 'paid' ? 'Đã đóng' : 'Chưa đóng'} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>Không có dữ liệu hóa đơn.</div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="drawer-footer" style={{ display: 'flex', gap: '12px' }}>
          {!isEditing && (
            <button onClick={handleDelete} style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-overdue)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Trash2 size={18} /> Xóa Khách
            </button>
          )}
          <button onClick={handleEdit} style={{ flex: 1, padding: '12px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {isEditing ? (
              <><Save size={18} /> Lưu Thay Đổi</>
            ) : (
              <><Edit size={18} /> Cập nhật Thông tin</>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
