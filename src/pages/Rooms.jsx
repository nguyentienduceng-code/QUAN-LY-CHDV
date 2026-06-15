import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import RoomDetailDrawer from '../components/RoomDetailDrawer';
import { Filter, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAppData } from '../context/AppDataContext';

export default function Rooms() {
  const { user } = useAuth();
  const { rooms, addRoom } = useAppData();
  const [activeBuilding, setActiveBuilding] = useState('A');
  const [activeFloor, setActiveFloor] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const [isBuildingExpanded, setIsBuildingExpanded] = useState(true);
  const [isFloorExpanded, setIsFloorExpanded] = useState(true);
  const [isStatusExpanded, setIsStatusExpanded] = useState(true);

  // Filter rooms based on role and status
  let displayedRooms = user?.role === 'tenant' 
    ? rooms.filter(r => r.status === 'vacant') 
    : rooms.filter(r => r.building === activeBuilding && r.floor === activeFloor);
  
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
    const price = prompt('Nhập Giá Thuê Cơ Bản (VNĐ):') || '4000000';
    const area = prompt('Nhập Diện Tích (m2):') || '25';
    addRoom({ name, price: parseInt(price, 10), area: parseInt(area, 10), floor: activeFloor, building: activeBuilding });
    toast.success(`Đã thêm phòng ${name} vào Nhà ${activeBuilding} - Tầng ${activeFloor}!`);
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

  return (
    <div className="rooms-layout" style={{ display: 'flex', gap: '24px', height: '100%' }}>
      {/* Sidebar Filters */}
      <div className="rooms-filter-sidebar" style={{ width: '250px', flexShrink: 0 }}>
        <Card title={<><Filter size={18} /> Bộ Lọc</>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div 
              onClick={() => setIsBuildingExpanded(!isBuildingExpanded)}
              style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
            >
              Nhà {isBuildingExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {isBuildingExpanded && ['A', 'B', 'C'].map(b => (
              <button 
                key={b}
                onClick={() => setActiveBuilding(b)}
                style={{
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
                Nhà {b}
              </button>
            ))}

            <div 
              onClick={() => setIsFloorExpanded(!isFloorExpanded)}
              style={{ fontWeight: '600', marginTop: '16px', marginBottom: '8px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
            >
              Tầng {isFloorExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            {isFloorExpanded && [1, 2, 3, 4].map(f => (
              <button 
                key={f}
                onClick={() => setActiveFloor(f)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: activeFloor === f ? 'var(--accent-primary)' : 'var(--border-glass)',
                  background: activeFloor === f ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: activeFloor === f ? 'var(--accent-primary)' : 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                Tầng {f}
              </button>
            ))}

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

      {/* Grid View */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className="page-title" style={{ margin: 0 }}>Sơ Đồ Tầng {activeFloor} - Nhà {activeBuilding}</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <StatusBadge status="occupied" text={`Đang thuê: ${displayedRooms.filter(r => r.status === 'occupied' || r.status === 'expiring' || r.status === 'overdue').length}`} />
            <StatusBadge status="vacant" text={`Trống: ${displayedRooms.filter(r => r.status === 'vacant').length}`} />
            {user?.role === 'manager' && (
              <button onClick={handleAddRoom} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '600', marginLeft: '12px' }}>
                <Plus size={16} /> Tạo Phòng Mới
              </button>
            )}
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
          gap: '16px' 
        }}>
          {displayedRooms.map(room => {
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
                {room.tenant && <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '4px' }}>1 Khách</div>}
              </div>
            );
          })}
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
