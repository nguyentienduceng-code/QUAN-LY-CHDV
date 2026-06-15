import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import RoomDetailDrawer from '../components/RoomDetailDrawer';
import { Filter, Plus, ChevronDown, ChevronRight, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAppData } from '../context/AppDataContext';

export default function Rooms() {
  const { user } = useAuth();
  const { rooms, addRoom, settings, setSettings, renameBuilding, addNewBuilding } = useAppData();
  const [activeBuilding, setActiveBuilding] = useState(settings.buildings[0] || 'A');
  const [activeFloor, setActiveFloor] = useState(settings.floors[0] || 1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const [isBuildingExpanded, setIsBuildingExpanded] = useState(false);
  const [isFloorExpanded, setIsFloorExpanded] = useState(false);
  const [isStatusExpanded, setIsStatusExpanded] = useState(true);

  // Filter rooms based on role and status
  let displayedRooms = user?.role === 'tenant' 
    ? rooms.filter(r => r.status === 'vacant') 
    : rooms.filter(r => r.building === activeBuilding);
  
  if (statusFilter !== 'all') {
    displayedRooms = displayedRooms.filter(r => r.status === statusFilter);
  }

  const handleRoomClick = (room) => {
    if (room.status === 'vacant' && user?.role === 'manager') {
      const tenantName = prompt(`Tạo hợp đồng cho phòng ${room.name}.\nNhập tên khách thuê mới:`);
      if (tenantName) {
        toast.success('Đã tạo hợp đồng thành công (Mô phỏng)!');
      }
    } else {
      setSelectedRoom(room);
      setIsDrawerOpen(true);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleAddRoom = () => {
    const name = prompt(`Nhập Tên Phòng Mới cho Tòa ${activeBuilding} (Ví dụ: P.109):`);
    if (!name) return;

    const floorMatch = name.match(/\d+/);
    const autoFloor = floorMatch ? Math.floor(parseInt(floorMatch[0], 10) / 100) : 1;
    
    const floorStr = prompt(`Phòng ${name} thuộc Tầng số mấy?`, autoFloor.toString());
    if (!floorStr) return;
    const floor = parseInt(floorStr, 10) || autoFloor;

    const price = prompt('Nhập Giá Thuê Cơ Bản (VNĐ):') || '4000000';
    const area = prompt('Nhập Diện Tích (m2):') || '25';
    
    addRoom({ name, price: parseInt(price, 10), area: parseInt(area, 10), floor, building: activeBuilding });
    toast.success(`Đã thêm phòng ${name} vào Tầng ${floor} ${activeBuilding.toLowerCase().startsWith('nhà') ? activeBuilding : 'Nhà ' + activeBuilding}!`);
  };

  const handleEditBuildings = (e) => {
    e.stopPropagation();
    const newBuildings = prompt('Nhập danh sách Tên Nhà, cách nhau bằng dấu phẩy (VD: A, B, C, D):', settings.buildings.join(', '));
    if (newBuildings) {
      const arr = newBuildings.split(',').map(s => s.trim()).filter(Boolean);
      setSettings(prev => ({ ...prev, buildings: arr }));
      if (!arr.includes(activeBuilding)) setActiveBuilding(arr[0] || '');
      toast.success('Đã cập nhật danh sách Nhà!');
    }
  };

  const handleEditFloors = (e) => {
    e.stopPropagation();
    const newFloors = prompt('Nhập danh sách số Tầng, cách nhau bằng dấu phẩy (VD: 1, 2, 3, 4, 5):', settings.floors.join(', '));
    if (newFloors) {
      const arr = newFloors.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      setSettings(prev => ({ ...prev, floors: arr }));
      if (!arr.includes(activeFloor)) setActiveFloor(arr[0] || 1);
      toast.success('Đã cập nhật danh sách Tầng!');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'occupied': return { bg: 'var(--status-occupied-bg)', text: 'var(--status-occupied-text)', border: 'var(--status-occupied-text)' };
      case 'vacant': return { bg: 'var(--status-vacant-bg)', text: 'var(--status-vacant-text)', border: 'var(--status-vacant-text)' };
      case 'expiring': return { bg: 'var(--status-expiring-bg)', text: 'var(--status-expiring-text)', border: 'var(--status-expiring-text)' };
      case 'overdue': return { bg: 'var(--status-overdue-bg)', text: 'var(--status-overdue-text)', border: 'var(--status-overdue-text)' };
      case 'maintenance': return { bg: 'var(--status-maintenance-bg)', text: 'var(--status-maintenance-text)', border: 'var(--status-maintenance-text)' };
      default: return { bg: 'var(--bg-secondary)', text: 'var(--text-secondary)', border: 'var(--text-secondary)' };
    }
  };

  const roomsByFloor = displayedRooms.reduce((acc, room) => {
    if (!acc[room.floor]) acc[room.floor] = [];
    acc[room.floor].push(room);
    return acc;
  }, {});
  const sortedFloors = Object.keys(roomsByFloor).map(Number).sort((a, b) => b - a);

  return (
    <div className="rooms-layout" style={{ display: 'flex', gap: '24px', height: '100%' }}>
      {/* Sidebar Filters */}
      {user?.role === 'manager' && (
        <div className="rooms-filter-sidebar" style={{ width: '250px', flexShrink: 0 }}>
          <Card title={<><Filter size={18} /> Bộ Lọc</>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div 
                onClick={() => setIsBuildingExpanded(!isBuildingExpanded)}
                style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Danh Sách Tòa Nhà
                </div>
                {isBuildingExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
              
              {isBuildingExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {settings.buildings.map(b => (
                    <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        onClick={() => setActiveBuilding(b)}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: activeBuilding === b ? 'var(--accent-primary)' : 'var(--border-glass)',
                          background: activeBuilding === b ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          color: activeBuilding === b ? 'var(--accent-primary)' : 'var(--text-primary)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'var(--transition)'
                        }}
                      >
                        {b.toLowerCase().startsWith('nhà') ? b : `Nhà ${b}`}
                      </button>
                      {user?.role === 'manager' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const newName = prompt(`Nhập tên mới cho ${b.toLowerCase().startsWith('nhà') ? b : 'Nhà ' + b}:`, b);
                            if (newName && newName.trim() && newName.trim() !== b) {
                              if (renameBuilding(b, newName.trim())) {
                                toast.success('Đổi tên thành công!');
                                if (activeBuilding === b) setActiveBuilding(newName.trim());
                              } else {
                                toast.error('Tên nhà không hợp lệ hoặc đã tồn tại.');
                              }
                            }
                          }} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }} 
                          title="Đổi tên"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {user?.role === 'manager' && (
                    <button 
                      onClick={() => {
                        const newName = prompt('Nhập tên tòa nhà mới:');
                        if (newName && newName.trim()) {
                          if (addNewBuilding(newName.trim())) {
                            toast.success('Thêm nhà thành công!');
                            setActiveBuilding(newName.trim());
                          } else {
                            toast.error('Tên nhà đã tồn tại.');
                          }
                        }
                      }}
                      style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'transparent', border: '1px dashed var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      <Plus size={16} /> Thêm Nhà Mới
                    </button>
                  )}
                </div>
              )}

              <div 
                onClick={() => setIsStatusExpanded(!isStatusExpanded)}
                style={{ fontWeight: '600', marginTop: '16px', marginBottom: '8px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
              >
                Lọc Theo Trạng Thái {isStatusExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
              
              {isStatusExpanded && (
                <>
                  <button onClick={() => setStatusFilter('all')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: statusFilter === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: '1px solid var(--text-secondary)' }}></div> Tất cả
                  </button>
                  <button onClick={() => setStatusFilter('occupied')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: statusFilter === 'occupied' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--status-occupied-text)' }}></div> Đang Thuê
                  </button>
                  <button onClick={() => setStatusFilter('vacant')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: statusFilter === 'vacant' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--status-vacant-text)' }}></div> Trống
                  </button>
                  <button onClick={() => setStatusFilter('expiring')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: statusFilter === 'expiring' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--status-expiring-text)' }}></div> Sắp hết HĐ
                  </button>
                  <button onClick={() => setStatusFilter('overdue')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: statusFilter === 'overdue' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--status-overdue-text)' }}></div> Quá Hạn Thu
                  </button>
                  <button onClick={() => setStatusFilter('maintenance')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: statusFilter === 'maintenance' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--status-maintenance-text)' }}></div> Đang Bảo Trì
                  </button>
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Grid View */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className="page-title" style={{ margin: 0 }}>
            {user?.role === 'manager' ? `Sơ Đồ Tòa ${activeBuilding.toLowerCase().startsWith('nhà') ? activeBuilding : 'Nhà ' + activeBuilding}` : 'Phòng Trống Dành Cho Bạn'}
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {user?.role === 'manager' && (
              <StatusBadge status="occupied" text={`Đang thuê: ${displayedRooms.filter(r => r.status === 'occupied' || r.status === 'expiring' || r.status === 'overdue').length}`} />
            )}
            <StatusBadge status="vacant" text={`Trống: ${displayedRooms.filter(r => r.status === 'vacant').length}`} />
            {user?.role === 'manager' && (
              <button onClick={handleAddRoom} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '600', marginLeft: '12px' }}>
                <Plus size={16} /> Tạo Phòng Mới
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {sortedFloors.map(floor => (
            <div key={floor}>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                <div style={{ width: '4px', height: '18px', background: 'var(--accent-primary)', borderRadius: '2px' }}></div>
                Tầng {floor}
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                gap: '16px' 
              }}>
                {roomsByFloor[floor].map(room => {
                  const style = getStatusStyle(room.status);
                  return (
                    <div 
                      key={room.id}
                      onClick={() => handleRoomClick(room)}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 'var(--radius-sm)',
                        background: style.bg,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: style.text,
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: 'var(--card-shadow)',
                        transition: 'transform 0.2s',
                        border: `1px solid ${style.border}`
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <div style={{ fontSize: '1.2rem' }}>{room.name}</div>
                      {user?.role === 'tenant' && (
                        <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>Nhà {room.building}</div>
                      )}
                      {user?.role === 'manager' && room.tenant && (
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '4px' }}>1 Khách</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {sortedFloors.length === 0 && (
            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '24px 0' }}>
              Không có phòng nào phù hợp với bộ lọc.
            </div>
          )}
        </div>
      </div>

      <RoomDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={closeDrawer} 
        room={selectedRoom} 
      />
    </div>
  );
}
