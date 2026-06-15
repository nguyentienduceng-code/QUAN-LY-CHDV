import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import Tenants from './Tenants';
import Contracts from './Contracts';
import Invoices from './Invoices';
import { Users, FileText, FileSpreadsheet, List, Eye, MessageSquare } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import TenantDetailDrawer from '../components/TenantDetailDrawer';
import toast from 'react-hot-toast';

export default function FinanceAndTenants() {
  const [activeTab, setActiveTab] = useState('master');
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeBuilding, setActiveBuilding] = useState('All');
  const { tenants, contracts, invoices, rooms } = useAppData();

  // Generate Master Data
  const masterData = tenants.map(t => {
    const contract = contracts.find(c => c.tenantName === t.name) || {};
    const tenantInvoices = invoices.filter(i => i.tenant === t.name);
    const unpaidInvoices = tenantInvoices.filter(i => i.status === 'unpaid' || i.status === 'partial');
    
    // Calculate total debt
    let totalDebt = 0;
    unpaidInvoices.forEach(inv => {
      totalDebt += parseInt(inv.amount.replace(/\./g, '')) || 0;
    });

    return {
      ...t,
      contractEnd: contract.endDate || t.contractEnd || 'N/A',
      deposit: contract.deposit || '0',
      totalDebt,
      unpaidInvoicesCount: unpaidInvoices.length,
      building: t.building || rooms.find(r => r.name === t.room)?.building || 'Khác'
    };
  });

  const filteredMasterData = activeBuilding === 'All' 
    ? masterData 
    : masterData.filter(d => d.building === activeBuilding);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Quản Lý Lưu Trú & Tài Chính</h1>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('master')} 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'master' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'master' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}
        >
          <List size={18} /> Bảng Tổng Hợp
        </button>
        <button 
          onClick={() => setActiveTab('tenants')} 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'tenants' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'tenants' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}
        >
          <Users size={18} /> Khách Thuê
        </button>
        <button 
          onClick={() => setActiveTab('contracts')} 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'contracts' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'contracts' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}
        >
          <FileText size={18} /> Hợp Đồng
        </button>
        <button 
          onClick={() => setActiveTab('invoices')} 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'invoices' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'invoices' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}
        >
          <FileSpreadsheet size={18} /> Hóa Đơn
        </button>
      </div>

      {activeTab === 'master' && (
        <div style={{ 
          background: 'var(--bg-card)', 
          borderRadius: 'var(--radius)', 
          border: '1px solid var(--border-glass)',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', gap: '12px', padding: '16px', borderBottom: '1px solid var(--border-glass)' }}>
            {['All', 'A', 'B', 'C'].map(b => (
              <button
                key={b}
                onClick={() => setActiveBuilding(b)}
                style={{
                  padding: '6px 16px',
                  background: activeBuilding === b ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: activeBuilding === b ? '#fff' : 'var(--text-secondary)',
                  border: activeBuilding === b ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: '0.2s',
                  fontSize: '0.9rem'
                }}
              >
                {b === 'All' ? 'Tất cả Tòa' : `Nhà ${b}`}
              </button>
            ))}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="mobile-card-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                <tr>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Mã Khách</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Họ và Tên</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Phòng</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Hạn Hợp Đồng</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Tiền Cọc (VNĐ)</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Công Nợ</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {filteredMasterData.map((data, index) => (
                  <tr key={data.id} style={{ borderBottom: index === filteredMasterData.length - 1 ? 'none' : '1px solid var(--border-glass)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td data-label="Mã Khách" style={{ padding: '16px', fontWeight: '500', color: 'var(--text-secondary)' }}>{data.id}</td>
                    <td data-label="Họ và Tên" style={{ padding: '16px', fontWeight: '600' }}>{data.name}</td>
                    <td data-label="Phòng" style={{ padding: '16px' }}>
                      <span style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{data.room}</span>
                    </td>
                    <td data-label="Hạn Hợp Đồng" style={{ padding: '16px' }}>{data.contractEnd}</td>
                    <td data-label="Tiền Cọc (VNĐ)" style={{ padding: '16px', fontWeight: '600', color: 'var(--accent-primary)' }}>{data.deposit}</td>
                    <td data-label="Công Nợ" style={{ padding: '16px' }}>
                      {data.totalDebt > 0 ? (
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--status-overdue)' }}>{data.totalDebt.toLocaleString('vi-VN')} đ</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--status-overdue)', marginTop: '4px' }}>({data.unpaidInvoicesCount} HĐ Nợ)</div>
                        </div>
                      ) : (
                        <StatusBadge status="occupied" text="Hoàn tất" />
                      )}
                    </td>
                    <td data-label="Hành Động" style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => { setSelectedTenantId(data.id); setIsDrawerOpen(true); }}
                          style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={14} /> Chi tiết
                        </button>
                        {data.totalDebt > 0 && (
                          <button onClick={() => toast.success(`Đã nhắc nợ ${data.name} qua Zalo!`)} style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--status-overdue)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MessageSquare size={14} /> Nhắc Nợ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hide headers in subcomponents using a wrapper class */}
      <div className="tab-content-wrapper">
        {activeTab === 'tenants' && <Tenants />}
        {activeTab === 'contracts' && <Contracts />}
        {activeTab === 'invoices' && <Invoices />}
      </div>

      <TenantDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        tenantId={selectedTenantId} 
      />
    </div>
  );
}
