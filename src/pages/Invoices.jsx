import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { Plus, Eye, Download, Filter, ChevronDown, ChevronRight, Building, User, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import GeneratePeriodicInvoicesModal from '../components/GeneratePeriodicInvoicesModal';

import { useAppData } from '../context/AppDataContext';
import { useCustomConfirm } from '../context/CustomPromptContext';
import CreateInvoiceModal from '../components/CreateInvoiceModal';
import InvoiceReceiptModal from '../components/InvoiceReceiptModal';
import UpdateIndexModal from '../components/UpdateIndexModal';

export default function Invoices({ initialInvoiceId }) {
  const { user } = useAuth();
  const customConfirm = useCustomConfirm();
  const { invoices, addInvoice, tenants, rooms, settings, updateInvoice, deleteInvoice } = useAppData();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedInvoiceToUpdate, setSelectedInvoiceToUpdate] = useState(null);
  
  const [lastOpenedInitialId, setLastOpenedInitialId] = useState(null);

  useEffect(() => {
    if (initialInvoiceId && initialInvoiceId !== lastOpenedInitialId && invoices.length > 0) {
      const inv = invoices.find(i => i.id === initialInvoiceId);
      if (inv) {
        setSelectedInvoice(inv);
        setIsReceiptModalOpen(true);
        setLastOpenedInitialId(initialInvoiceId);
      }
    }
  }, [initialInvoiceId, invoices, lastOpenedInitialId]);
  
  // Accordion & Filter State for Manager
  const [activeBuilding, setActiveBuilding] = useState('All');
  const [expandedRooms, setExpandedRooms] = useState([]);

  const displayedInvoices = user?.role === 'tenant' 
    ? invoices.filter(i => i.room === user.room)
    : invoices;

  // Group invoices by Building -> Room
  const groupedData = {};
  if (user?.role !== 'tenant' && user?.role !== 'guest') {
    displayedInvoices.forEach(inv => {
      // Find building for this room
      const roomInfo = rooms.find(r => r.name === inv.room);
      const bldg = roomInfo ? roomInfo.building : 'Khác';
      
      // Lọc theo allowedBuildings
      if (user?.role !== 'admin' && user?.role !== 'manager' && user?.role !== 'staff' && user?.allowedBuildings && !user.allowedBuildings.includes('all')) {
        if (!user.allowedBuildings.includes(bldg)) return;
      }
      
      if (!groupedData[bldg]) groupedData[bldg] = {};
      if (!groupedData[bldg][inv.room]) groupedData[bldg][inv.room] = [];
      groupedData[bldg][inv.room].push(inv);
    });
  }

  const toggleRoom = (roomName) => {
    setExpandedRooms(prev => 
      prev.includes(roomName) ? prev.filter(r => r !== roomName) : [...prev, roomName]
    );
  };

  const handleCreateSave = (invoiceData) => {
    addInvoice(invoiceData);
    toast.success('Đã tạo hóa đơn chi tiết thành công!');
  };

  const handleViewInvoice = (inv) => {
    setSelectedInvoice(inv);
    setIsReceiptModalOpen(true);
  };

  const handleOpenUpdateModal = (inv) => {
    setSelectedInvoiceToUpdate(inv);
    setIsUpdateModalOpen(true);
  };

  const handleZaloDebt = (inv) => {
    const tenantInfo = tenants.find(t => t.name === inv.tenant);
    if (!tenantInfo || !tenantInfo.phone) {
      toast.error('Không tìm thấy số điện thoại khách thuê!');
      return;
    }
    const msg = `Chào bạn, phòng ${inv.room} hiện đang nợ hóa đơn ${inv.id} số tiền ${inv.amount} VNĐ. Vui lòng thanh toán trước hạn chót ${inv.due}. Cảm ơn bạn!`;
    const url = `https://zalo.me/${tenantInfo.phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ margin: 0 }}>Tài chính & Hóa đơn</h1>
        <div className="page-header-actions">
          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff') && (
            <>
              <button onClick={() => setIsGenerateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <Plus size={16} /> Tạo HĐ Định Kỳ
              </button>
              <button onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
                <Plus size={16} /> Tạo Hóa Đơn Lẻ
              </button>
            </>
          )}
        </div>
      </div>

      {(user?.role !== 'tenant' && user?.role !== 'guest') && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          {['All', ...settings.buildings].map(b => (
            <button
              key={b}
              onClick={() => setActiveBuilding(b)}
              style={{
                padding: '8px 16px',
                background: activeBuilding === b ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: activeBuilding === b ? '#fff' : 'var(--text-secondary)',
                border: activeBuilding === b ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              {b === 'All' ? 'Tất cả Tòa' : (String(b).toLowerCase().startsWith('nhà') ? b : `Nhà ${b}`)}
            </button>
          ))}
        </div>
      )}

      {/* Data Table / Accordion */}
      <div style={{ 
        background: 'var(--bg-card)', 
        borderRadius: 'var(--radius)', 
        border: '1px solid var(--border-glass)',
        overflow: 'hidden'
      }}>
        
        {user?.role === 'tenant' ? (
          <div className="table-responsive">
            <table className="mobile-card-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                <tr>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Mã Hóa Đơn</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Phòng</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Số Tiền (VNĐ)</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Hạn Chót</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Trạng Thái</th>
                  <th style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {displayedInvoices.map((inv, index) => (
                  <tr key={inv.id} style={{ borderBottom: index === displayedInvoices.length - 1 ? 'none' : '1px solid var(--border-glass)' }}>
                    <td data-label="Mã HĐ" style={{ padding: '16px', fontWeight: '500' }}>{inv.id}</td>
                    <td data-label="Phòng" style={{ padding: '16px' }}><span style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>{inv.room}</span></td>
                    <td data-label="Số Tiền" style={{ padding: '16px', fontWeight: '600' }}>{inv.amount}</td>
                    <td data-label="Hạn Chót" style={{ padding: '16px', color: 'var(--text-secondary)' }}>{inv.due}</td>
                    <td data-label="Trạng Thái" style={{ padding: '16px' }}>
                      <StatusBadge status={inv.status} text={inv.status === 'paid' ? 'Đã thanh toán' : inv.status === 'partial' ? 'Thanh toán 1 phần' : 'Chưa thanh toán'} />
                    </td>
                    <td data-label="Hành Động" style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => handleViewInvoice(inv)} style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                        <Eye size={14} /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Manager Accordion View */
          <div>
            {Object.keys(groupedData)
              .filter(bldg => activeBuilding === 'All' || bldg === activeBuilding)
              .sort()
              .map((bldg) => (
              <div key={bldg}>
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)' }}>
                  <Building size={16} color="var(--accent-primary)" /> Tòa Nhà {bldg}
                </div>
                {Object.keys(groupedData[bldg]).sort().map(roomName => {
                  const roomInvoices = groupedData[bldg][roomName];
                  const isExpanded = expandedRooms.includes(roomName);
                  const totalUnpaid = roomInvoices.filter(i => i.status !== 'paid').length;
                  const tenantName = roomInvoices[0]?.tenant || 'N/A';

                  return (
                    <div key={roomName} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <div 
                        onClick={() => toggleRoom(roomName)}
                        style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'background 0.2s', background: isExpanded ? 'var(--bg-secondary)' : 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = isExpanded ? 'var(--bg-secondary)' : 'transparent'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {isExpanded ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
                          <div>
                            <span style={{ fontWeight: 'bold', fontSize: '1.05rem', marginRight: '12px', display: 'inline-block', width: '60px' }}>{roomName}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}><User size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {tenantName}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{roomInvoices.length} Hóa đơn</span>
                          {totalUnpaid > 0 ? (
                            <StatusBadge status="overdue" text={`${totalUnpaid} nợ`} />
                          ) : (
                            <StatusBadge status="occupied" text="Hoàn tất" />
                          )}
                        </div>
                      </div>

                      {/* Dropdown Content */}
                      {isExpanded && (
                        <div style={{ background: 'var(--bg-primary)', padding: '16px', borderTop: '1px solid var(--border-glass)' }}>
                          <div className="table-responsive">
                            <table className="mobile-card-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-glass)' }}>
                              <tr>
                                <th style={{ padding: '8px 16px', fontWeight: '600' }}>Mã HĐ</th>
                                <th style={{ padding: '8px 16px', fontWeight: '600' }}>Số Tiền</th>
                                <th style={{ padding: '8px 16px', fontWeight: '600' }}>Ngày Tạo</th>
                                <th style={{ padding: '8px 16px', fontWeight: '600' }}>Hạn Chót</th>
                                <th style={{ padding: '8px 16px', fontWeight: '600' }}>Trạng Thái</th>
                                <th style={{ padding: '8px 16px', textAlign: 'right', fontWeight: '600' }}>Thao Tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {roomInvoices.map((inv, idx) => (
                                <tr key={inv.id} style={{ borderBottom: idx === roomInvoices.length - 1 ? 'none' : '1px solid var(--border-glass)' }}>
                                  <td data-label="Mã HĐ" style={{ padding: '12px 16px', fontWeight: '500' }}>{inv.id}</td>
                                  <td data-label="Số Tiền" style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--accent-primary)' }}>{inv.amount}</td>
                                  <td data-label="Ngày Tạo" style={{ padding: '12px 16px' }}>{inv.createdAt || 'N/A'}</td>
                                  <td data-label="Hạn Chót" style={{ padding: '12px 16px' }}>{inv.due}</td>
                                  <td data-label="Trạng Thái" style={{ padding: '12px 16px' }}>
                                    <StatusBadge status={inv.status} text={inv.status === 'paid' ? 'Đã thu' : inv.status === 'partial' ? 'Thu 1 phần' : 'Chưa thu'} />
                                  </td>
                                  <td data-label="Thao Tác" style={{ padding: '12px 16px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                      <button onClick={() => handleViewInvoice(inv)} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Eye size={12} /> Xem
                                      </button>
                                      {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff') && (
                                        <button onClick={() => handleOpenUpdateModal(inv)} style={{ padding: '4px 8px', background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                          Chốt số
                                        </button>
                                      )}
                                      {inv.status === 'unpaid' ? (
                                        <>
                                          {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff') && (
                                            <button 
                                              onClick={() => {
                                                updateInvoice(inv.id, { status: 'paid' });
                                                toast.success(`Đã xác nhận thanh toán hóa đơn ${inv.id}!`);
                                              }} 
                                              style={{ padding: '4px 8px', background: '#10b981', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}
                                            >
                                              Thu tiền
                                            </button>
                                          )}
                                          <button onClick={() => handleZaloDebt(inv)} style={{ padding: '4px 8px', background: 'var(--status-overdue)', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Đòi nợ</button>
                                        </>
                                      ) : (
                                        (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff') && (
                                          <button 
                                            onClick={() => {
                                              updateInvoice(inv.id, { status: 'unpaid' });
                                              toast.success(`Đã hoàn tiền và chuyển trạng thái ${inv.id} về Chưa thu.`);
                                            }} 
                                            style={{ padding: '4px 8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                                          >
                                            Hoàn tiền
                                          </button>
                                        )
                                      )}
                                      {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff') && (
                                        <button 
                                          onClick={async () => {
                                            const ok = await customConfirm(`Bạn có chắc muốn xóa hóa đơn ${inv.id}?`);
                                            if (ok) {
                                              deleteInvoice(inv.id);
                                            }
                                          }} 
                                          style={{ padding: '4px 8px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                          <Trash2 size={12} /> Xóa
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
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateInvoiceModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSave={handleCreateSave}
        tenants={tenants}
      />

      <GeneratePeriodicInvoicesModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
      />

      <UpdateIndexModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        invoice={selectedInvoiceToUpdate}
      />

      <InvoiceReceiptModal 
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
