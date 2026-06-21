/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import { useState } from 'react';
import { X, Users, FileText, FileSpreadsheet, Trash2, Plus, File, Edit3 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useAppData } from '../context/AppDataContext';
import toast from 'react-hot-toast';
import AddTenantModal from './AddTenantModal';
import CreateContractModal from './CreateContractModal';

export default function TenantDetailDrawer({ isOpen, onClose, roomName }) {
  const { tenants, contracts, invoices, deleteTenant, rooms } = useAppData();
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [isEditContractOpen, setIsEditContractOpen] = useState(false);
  
  if (!isOpen || !roomName) return null;

  const roomObj = rooms?.find(r => r.name === roomName);
  const roomTenants = tenants.filter(t => t.room === roomName);
  const contract = contracts.find(c => c.room.includes(roomName));
  const roomInvoices = invoices.filter(i => i.room === roomName);

  const handleDeleteTenant = (id, name) => {
    if (confirm(`Bạn có chắc chắn muốn xóa khách hàng ${name} khỏi phòng này?`)) {
      deleteTenant(id);
      toast.success('Đã xóa khách thuê thành công!');
    }
  };

  return (
    <>
      <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`drawer-content ${isOpen ? 'open' : ''}`} style={{ width: '500px', maxWidth: '100vw' }}>
        
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h2 style={{ margin: '0 0 8px' }}>Phòng {roomName}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <StatusBadge status="occupied" text={`${roomTenants.length} Khách thuê`} />
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          
          {/* Hợp đồng */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <FileText size={18} /> Hợp đồng Thuê
              </h3>
              {contract && (
                <button 
                  onClick={() => setIsEditContractOpen(true)} 
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem' }}
                >
                  <Edit3 size={16} /> Sửa
                </button>
              )}
            </div>
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
                {contract.attachedFiles && contract.attachedFiles.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Tệp đính kèm:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {contract.attachedFiles.map((file, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                          <File size={16} color="var(--accent-primary)" />
                          <span style={{ fontSize: '0.85rem' }}>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>Chưa có hợp đồng nào được tạo.</div>
            )}
          </div>

          {/* Danh sách Khách Thuê */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Users size={18} /> Khách đang cư trú
              </h3>
              <button onClick={() => setIsAddTenantOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                <Plus size={16} /> Thêm khách
              </button>
            </div>
            
            {roomTenants.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {roomTenants.map((t, idx) => (
                  <div key={t.id} style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '600', fontSize: '1.05rem' }}>{t.name} {idx === 0 && <span style={{ fontSize: '0.75rem', background: 'var(--status-occupied)', color: '#fff', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px', fontWeight: 'normal' }}>Đại diện</span>}</div>
                      <button onClick={() => handleDeleteTenant(t.id, t.name)} style={{ background: 'transparent', border: 'none', color: 'var(--status-overdue)', cursor: 'pointer' }} title="Xóa khách">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                      <div><span style={{ color: 'var(--text-secondary)' }}>SĐT:</span> {t.phone}</div>
                      <div><span style={{ color: 'var(--text-secondary)' }}>CCCD:</span> {t.idCard}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>Phòng trống, không có khách.</div>
            )}
          </div>

          {/* Lịch sử Hóa đơn */}
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
              <FileSpreadsheet size={18} /> Lịch sử Hóa đơn
            </h3>
            {roomInvoices.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {roomInvoices.map((inv, idx) => (
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
      </div>
      <AddTenantModal 
        isOpen={isAddTenantOpen} 
        onClose={() => setIsAddTenantOpen(false)} 
        roomName={roomName}
      />
      <CreateContractModal 
        isOpen={isEditContractOpen} 
        onClose={() => setIsEditContractOpen(false)} 
        room={roomObj}
        existingContract={contract}
      />
    </>
  );
}
