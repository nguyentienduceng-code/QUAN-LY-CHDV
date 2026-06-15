import { useAppData } from '../context/AppDataContext';
import { Plus, Search, Eye, Users, FileText, ChevronDown, ChevronRight, Home as HomeIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import TenantDetailDrawer from '../components/TenantDetailDrawer';
import { exportAllDataToExcel } from '../utils/exportExcel';
import { useState, useMemo } from 'react';
import StatusBadge from '../components/StatusBadge';

export default function Tenants() {
  const appData = useAppData();
  const { tenants, rooms, contracts, invoices } = appData;
  const [selectedRoomName, setSelectedRoomName] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeBuilding, setActiveBuilding] = useState('All');
  const [expandedFloors, setExpandedFloors] = useState({});

  const toggleFloor = (buildingFloorKey) => {
    setExpandedFloors(prev => ({
      ...prev,
      [buildingFloorKey]: !prev[buildingFloorKey]
    }));
  };

  const handleAddTenant = () => {
    toast('Chức năng thêm khách mới đang được nâng cấp!', { icon: '🚧' });
  };

  // Group data: Building -> Floor -> Room -> Tenants
  const hierarchicalData = useMemo(() => {
    const buildingsMap = {};

    // Group rooms by building and floor
    rooms.forEach(room => {
      // Only show rooms that are not completely vacant, or show all? 
      // The user wants to manage tenants, so we show rooms that have tenants or contracts.
      // Let's show all occupied or expiring rooms.
      if (room.status === 'vacant') return;

      const building = room.building || 'A';
      const floorMatch = room.name.match(/\.?(\d+)\d{2}/);
      const floor = floorMatch ? parseInt(floorMatch[1]) : 1;

      if (!buildingsMap[building]) buildingsMap[building] = {};
      if (!buildingsMap[building][floor]) buildingsMap[building][floor] = [];

      const roomTenants = tenants.filter(t => t.room === room.name);
      const roomContract = contracts.find(c => c.room.includes(room.name));
      const unpaidInvoices = invoices.filter(i => i.room === room.name && (i.status === 'unpaid' || i.status === 'partial'));
      
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
  }, [rooms, tenants, contracts, invoices]);

  const buildingsList = ['All', 'A', 'B', 'C'];
  const buildingsToRender = activeBuilding === 'All' ? Object.keys(hierarchicalData).sort() : [activeBuilding].filter(b => hierarchicalData[b]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
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
              {b === 'All' ? 'Tất cả Tòa' : `Nhà ${b}`}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div className="search-bar" style={{ width: '250px' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input type="text" placeholder="Tìm kiếm phòng/khách..." />
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
                          <div key={room.id} style={{ display: 'flex', borderBottom: index < floorRooms.length - 1 ? '1px solid var(--border-glass)' : 'none', padding: '16px', gap: '20px', alignItems: 'stretch' }}>
                            
                            {/* Room Info Left Side */}
                            <div style={{ width: '250px', borderRight: '1px dashed var(--border-glass)', paddingRight: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginBottom: '8px' }}>
                                  Phòng {room.name}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Users size={14} /> {room.tenants.length} Khách đang ở
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FileText size={14} /> HĐ hết hạn: <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{room.contract?.endDate || 'N/A'}</span>
                                </div>
                              </div>
                              
                              <div style={{ marginTop: '16px' }}>
                                {room.totalDebt > 0 ? (
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
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>Danh sách khách thuê:</div>
                              {room.tenants.length > 0 ? (
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', paddingLeft: '16px' }}>
                              <button 
                                onClick={() => { setSelectedRoomName(room.name); setIsDrawerOpen(true); }}
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
            Không có dữ liệu phòng đang thuê trong Tòa nhà này.
          </div>
        )}
      </div>

      <TenantDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        roomName={selectedRoomName} 
      />
    </div>
  );
}
