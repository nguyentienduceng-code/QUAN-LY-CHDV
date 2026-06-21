import { useAppData } from '../context/AppDataContext';
import { Plus, Search, Eye, Users, FileText, ChevronDown, ChevronRight, Home as HomeIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import TenantDetailDrawer from '../components/TenantDetailDrawer';
import { exportAllDataToExcel } from '../utils/exportExcel';
import { useAuth } from '../context/AuthContext';
import { useState, useMemo } from 'react';
import StatusBadge from '../components/StatusBadge';
import { useCustomPrompt } from '../context/CustomPromptContext';
import CreateInvoiceModal from '../components/CreateInvoiceModal';
import CreateContractModal from '../components/CreateContractModal';

export default function Tenants() {
  const { user } = useAuth();
  const appData = useAppData();
  const { tenants, rooms, contracts, invoices, addInvoice } = appData;
  const [selectedRoomName, setSelectedRoomName] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [invoiceRoomName, setInvoiceRoomName] = useState(null);
  const [activeBuilding, setActiveBuilding] = useState('All');
  const [expandedFloors, setExpandedFloors] = useState({});
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'occupied' | 'vacant'
  const [searchQuery, setSearchQuery] = useState('');
  const [contractModalRoom, setContractModalRoom] = useState(null);

  const toggleFloor = (buildingFloorKey) => {
    setExpandedFloors(prev => ({
      ...prev,
      [buildingFloorKey]: !prev[buildingFloorKey]
    }));
  };

  const handleAddTenant = () => {
    toast('Chức năng thêm khách mới đang được nâng cấp!', { icon: '🚧' });
  };

  const handleCreateContract = async (room) => {
    setContractModalRoom(room);
  };

  const handleOpenCreateInvoice = (roomName) => {
    setInvoiceRoomName(roomName);
    setIsCreateModalOpen(true);
  };

  const handleCreateSave = (invoiceData) => {
    addInvoice(invoiceData);
    toast.success('Đã tạo hóa đơn nhanh thành công!');
  };

  // Group data: Building -> Floor -> Room -> Tenants
  const hierarchicalData = useMemo(() => {
    const buildingsMap = {};

    const filteredRooms = rooms.filter(r => {
      if (user?.role === 'admin' || user?.role === 'staff' || !user?.allowedBuildings || user.allowedBuildings.includes('all')) return true;
      return user.allowedBuildings.includes(r.building || 'A');
    });

    // Group rooms by building and floor
    filteredRooms.forEach(room => {
      const isRoomVacant = room.status === 'vacant';
      
      // Filter by status selection
      if (statusFilter === 'occupied' && isRoomVacant) return;
      if (statusFilter === 'vacant' && !isRoomVacant) return;

      const roomTenants = tenants.filter(t => t.room === room.name && (room.building === t.building || !t.building));
      const roomContract = contracts.find(c => c.room.includes(room.name) || c.room === room.name);
      const unpaidInvoices = invoices.filter(i => i.room === room.name && (i.status === 'unpaid' || i.status === 'partial'));

      // Filter by search query (room name, tenant name, phone, email, idCard)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchRoom = room.name.toLowerCase().includes(query);
        const matchBuilding = (room.building || '').toLowerCase().includes(query);
        const matchTenants = roomTenants.some(t => 
          (t.name || '').toLowerCase().includes(query) ||
          (t.phone || '').includes(query) ||
          (t.email || '').toLowerCase().includes(query) ||
          (t.idCard || '').includes(query)
        );
        const matchContract = roomContract && (roomContract.tenant || '').toLowerCase().includes(query);
        
        if (!matchRoom && !matchBuilding && !matchTenants && !matchContract) {
          return;
        }
      }

      const building = room.building || 'A';
      
      const getFloor = (r) => {
        if (r.floor !== undefined && r.floor !== null && !isNaN(Number(r.floor))) {
          return Number(r.floor);
        }
        const digits = r.name.replace(/\D/g, '');
        if (digits.length >= 3) {
          return parseInt(digits.slice(0, digits.length - 2), 10) || 1;
        }
        return 1;
      };
      const floor = getFloor(room);

      if (!buildingsMap[building]) buildingsMap[building] = {};
      if (!buildingsMap[building][floor]) buildingsMap[building][floor] = [];

      let totalDebt = 0;
      unpaidInvoices.forEach(inv => {
        totalDebt += parseInt(inv.amount.replace(/\./g, '')) || 0;
      });

      buildingsMap[building][floor].push({
        ...room,
        tenants: roomTenants,
        contract: roomContract,
        totalDebt,
        unpaidInvoicesCount: unpaidInvoices.length
      });
    });

    return buildingsMap;
  }, [rooms, tenants, contracts, invoices, statusFilter, searchQuery]);

  const buildingsList = ['All', ...appData.settings.buildings];
  const buildingsToRender = activeBuilding === 'All' ? Object.keys(hierarchicalData).sort() : [activeBuilding].filter(b => hierarchicalData[b]);

  return (
    <div>
      {/* Quick stats summary */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '150px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tổng Số Khách Thuê</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{tenants.length} người</span>
        </div>
        <div style={{ flex: 1, minWidth: '150px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phòng Đang Thuê</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--status-occupied-text)' }}>{rooms.filter(r => r.status !== 'vacant').length} / {rooms.length} phòng</span>
        </div>
        <div style={{ flex: 1, minWidth: '150px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phòng Trống</span>
          <span style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--status-vacant-text)' }}>{rooms.filter(r => r.status === 'vacant').length} / {rooms.length} phòng</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {buildingsList.map(b => (
            <button
              key={b}
              onClick={() => setActiveBuilding(b)}
              style={{
                padding: '8px 20px',
                background: activeBuilding === b ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: activeBuilding === b ? '#fff' : 'var(--text-secondary)',
                border: activeBuilding === b ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)',
                borderRadius: '20px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: '0.2s',
              }}
            >
              {b === 'All' ? 'Tất cả Tòa' : (String(b).toLowerCase().startsWith('nhà') ? b : `Nhà ${b}`)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Status filter select */}
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)} 
            style={{ 
              padding: '8px 12px', 
              background: 'var(--bg-secondary)', 
              border: '1px solid var(--border-glass)', 
              color: 'var(--text-primary)', 
              borderRadius: '8px', 
              outline: 'none', 
              cursor: 'pointer',
              fontWeight: '500' 
            }}
          >
            <option value="all" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Tất cả phòng</option>
            <option value="occupied" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Đang thuê</option>
            <option value="vacant" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Phòng trống</option>
          </select>

          <div className="search-bar" style={{ width: '220px' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Tìm phòng/khách..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
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
            <Plus size={16} /> Thêm Khách
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {buildingsToRender.map(building => (
          <div key={building} className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
              <HomeIcon size={24} /> Tòa Nhà {building}
            </div>
            
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.keys(hierarchicalData[building]).sort((a,b) => b - a).map(floor => {
                const floorRooms = hierarchicalData[building][floor];
                const floorKey = `${building}-${floor}`;
                const isExpanded = expandedFloors[floorKey] !== false; // Default true

                return (
                  <div key={floorKey} style={{ border: '1px solid var(--border-glass)', borderRadius: '8px', overflow: 'hidden' }}>
                    {/* Floor Header */}
                    <div 
                      onClick={() => toggleFloor(floorKey)}
                      style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderBottom: isExpanded ? '1px solid var(--border-glass)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Tầng {floor} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>({floorRooms.length} phòng)</span>
                      </div>
                      {isExpanded ? <ChevronDown size={20} color="var(--text-secondary)" /> : <ChevronRight size={20} color="var(--text-secondary)" />}
                    </div>

                    {/* Rooms in Floor */}
                    {isExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {floorRooms.map((room, index) => (
                          <div key={room.id} className="tenant-row-card" style={{ display: 'flex', borderBottom: index < floorRooms.length - 1 ? '1px solid var(--border-glass)' : 'none', padding: '16px', gap: '20px', alignItems: 'stretch' }}>
                            
                            {/* Room Info Left Side */}
                            <div className="tenant-left-col" style={{ width: '250px', borderRight: '1px dashed var(--border-glass)', paddingRight: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                                  Phòng {room.name}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Users size={14} /> {room.status === 'vacant' ? 0 : room.tenants.length} Khách đang ở
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FileText size={14} /> HĐ hết hạn: <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{room.contract?.endDate || 'N/A'}</span>
                                </div>
                              </div>
                              
                              <div style={{ marginTop: '16px' }}>
                                {room.status === 'vacant' ? (
                                  <StatusBadge status="vacant" text="Phòng trống" />
                                ) : room.totalDebt > 0 ? (
                                  <div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Công nợ:</div>
                                    <div style={{ fontWeight: 'bold', color: 'var(--status-overdue)' }}>{room.totalDebt.toLocaleString('vi-VN')} đ <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>({room.unpaidInvoicesCount} HĐ)</span></div>
                                  </div>
                                ) : (
                                  <StatusBadge status="occupied" text="Hoàn tất thu tiền" />
                                )}
                              </div>
                            </div>

                            {/* Tenants List Right Side */}
                            <div className="tenant-right-col" style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>
                                {room.status === 'vacant' ? 'Trạng thái phòng:' : 'Danh sách khách thuê:'}
                              </div>
                              {room.status === 'vacant' ? (
                                <div className="tenant-empty-state" style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.03)', borderRadius: '8px', border: '1px dashed rgba(59, 130, 246, 0.2)', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--status-vacant-text)' }}>Phòng trống</div>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chưa có hợp đồng hoặc khách hàng cư trú tại phòng này.</div>
                                </div>
                              ) : room.tenants.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  {room.tenants.map((t, idx) => (
                                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                          {idx + 1}
                                        </div>
                                        <div>
                                          <div style={{ fontWeight: '600' }}>{t.name} {idx === 0 && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--status-occupied)', borderRadius: '10px', marginLeft: '6px' }}>Đại diện</span>}</div>
                                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.phone} • CCCD: {t.idCard}</div>
                                        </div>
                                      </div>
                                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {t.note}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                  Chưa có thông tin khách thuê chi tiết.
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="tenant-actions-col" style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', paddingLeft: '16px' }}>
                              {user?.role !== 'investor' && (
                                <>
                                  {room.status === 'vacant' && (
                                    <button 
                                      onClick={() => handleCreateContract(room)}
                                      style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', transition: '0.2s' }}
                                    >
                                      Tạo Hợp Đồng
                                    </button>
                                  )}
                                  {room.status !== 'vacant' && (
                                    <button 
                                      onClick={() => handleOpenCreateInvoice(room.name)}
                                      style={{ padding: '8px 16px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: '0.2s' }}
                                    >
                                      <Plus size={16} /> Tạo Hóa Đơn
                                    </button>
                                  )}
                                </>
                              )}
                              <button 
                                onClick={() => {
                                  setSelectedRoomName(room.name); setIsDrawerOpen(true); }}
                                style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500', transition: '0.2s' }}
                              >
                                <Eye size={16} /> Chi tiết
                              </button>
                            </div>

                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {buildingsToRender.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Không có dữ liệu phòng phù hợp với bộ lọc trong Tòa nhà này.
          </div>
        )}
      </div>

      <TenantDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        roomName={selectedRoomName} 
        tenants={tenants}
        contracts={contracts}
      />

      <CreateInvoiceModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSave={handleCreateSave}
        initialRoomName={invoiceRoomName}
      />
      
      <CreateContractModal 
        isOpen={!!contractModalRoom} 
        onClose={() => setContractModalRoom(null)} 
        room={contractModalRoom}
      />
    </div>
  );
}
