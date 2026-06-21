import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import RoomDetailDrawer from '../components/RoomDetailDrawer';
import CreateContractModal from '../components/CreateContractModal';
import { Filter, Plus, ChevronDown, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAppData } from '../context/AppDataContext';
import { useCustomPrompt } from '../context/CustomPromptContext';

export default function Rooms() {
  const { user } = useAuth();
  const { rooms, addRoom, removeRoom, settings, setSettings, renameBuilding, addNewBuilding, deleteBuilding } = useAppData();
  const customPrompt = useCustomPrompt();
  const [activeBuilding, setActiveBuilding] = useState(settings.buildings[0] || 'A');
  const [activeFloor, setActiveFloor] = useState(settings.floors[0] || 1);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const [isBuildingExpanded, setIsBuildingExpanded] = useState(false);
  const [isFloorExpanded, setIsFloorExpanded] = useState(false);
  const [isStatusExpanded, setIsStatusExpanded] = useState(true);
  const [contractModalRoom, setContractModalRoom] = useState(null);

  // Filter rooms based on role and status
  let displayedRooms = user?.role === 'tenant' 
    ? rooms.filter(r => r.status === 'vacant') 
    : rooms.filter(r => r.building === activeBuilding);
  
  if (statusFilter !== 'all') {
    displayedRooms = displayedRooms.filter(r => r.status === statusFilter);
  }

  const handleRoomClick = async (room) => {
    if (room.status === 'vacant' && (user?.role === 'admin' || user?.role === 'staff')) {
      setContractModalRoom(room);
    } else {
      setSelectedRoom(room);
      setIsDrawerOpen(true);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleAddRoom = async () => {
    if (user?.plan === 'basic' && rooms.length >= 15) {
      toast.error('Gói Cơ Bản chỉ cho phép tạo tối đa 15 phòng. Vui lòng nâng cấp Gói PRO để thêm phòng!');
      return;
    }

    const name = await customPrompt(`Nhập Tên Phòng Mới cho Tòa ${activeBuilding} (Ví dụ: P.109):`);
    if (!name) return;

    const floorMatch = name.match(/\d+/);
    const autoFloor = floorMatch ? Math.floor(parseInt(floorMatch[0], 10) / 100) : 1;
    
    const floorStr = await customPrompt(`Phòng ${name} thuộc Tầng số mấy?`, autoFloor.toString());
    if (!floorStr) return;
    const floor = parseInt(floorStr, 10) || autoFloor;

    const price = await customPrompt('Nhập Giá Thuê Cơ Bản (VNĐ):', '4000000');
    if (!price) return;
    const area = await customPrompt('Nhập Diện Tích (m2):', '25');
    if (!area) return;
    
    addRoom({ name, price: parseInt(price, 10), area: parseInt(area, 10), floor, building: activeBuilding });
    toast.success(`Đã thêm phòng ${name} vào Tầng ${floor} ${String(activeBuilding).toLowerCase().startsWith('nhà') ? activeBuilding : 'Nhà ' + activeBuilding}!`);
  };

  const handleEditBuildings = async (e) => {
    e.stopPropagation();
    const newBuildings = await customPrompt('Nhập danh sách Tên Nhà, cách nhau bằng dấu phẩy (VD: A, B, C, D):', settings.buildings.join(', '));
    if (newBuildings) {
      const arr = newBuildings.split(',').map(s => s.trim()).filter(Boolean);
      setSettings(prev => ({ ...prev, buildings: arr }));
      if (!arr.includes(activeBuilding)) setActiveBuilding(arr[0] || '');
      toast.success('Đã cập nhật danh sách Nhà!');
    }
  };

  const handleEditFloors = async (e) => {
    e.stopPropagation();
    const newFloors = await customPrompt('Nhập danh sách số Tầng, cách nhau bằng dấu phẩy (VD: 1, 2, 3, 4, 5):', settings.floors.join(', '));
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

  // ─── DETECT FLOOR: dùng room.floor nếu có, không thì trích từ tên phòng
  //   VD: '101' → floor 1 | '202' → floor 2 | 'A301' → floor 3
  const getFloor = (room) => {
    if (room.floor !== undefined && room.floor !== null && !isNaN(Number(room.floor))) {
      return Number(room.floor);
    }
    // Trích số tầng từ tên phòng: lấy các chữ số đầu, bỏ 2 chữ số cuối
    const digits = room.name.replace(/\D/g, ''); // '101' | '302' | 'A201' → '201'
    if (digits.length >= 3) {
      return parseInt(digits.slice(0, digits.length - 2), 10) || 1;
    }
    return 1;
  };

  const roomsByFloor = displayedRooms.reduce((acc, room) => {
    const floorKey = getFloor(room);
    if (!acc[floorKey]) acc[floorKey] = [];
    acc[floorKey].push(room);
    return acc;
  }, {});

  // Sắp xếp: tầng CAO nhất ở trên (giống mô hình tòa nhà nhìn từ mặt đứng)
  const sortedFloors = Object.keys(roomsByFloor).map(Number).filter(n => !isNaN(n)).sort((a, b) => b - a);
  const maxFloor = sortedFloors[0] || 1;

  return (
    <div className="rooms-layout" style={{ display: 'flex', gap: '24px', height: '100%' }}>
      {/* Sidebar Filters */}
      {(user?.role === 'admin' || user?.role === 'staff') && (
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
                        {String(b).toLowerCase().startsWith('nhà') ? b : `Nhà ${b}`}
                      </button>
                      {(user?.role === 'admin' || user?.role === 'staff') && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              const newName = await customPrompt(`Nhập tên mới cho ${String(b).toLowerCase().startsWith('nhà') ? b : 'Nhà ' + b}:`, b);
                              if (newName && newName.trim() && newName.trim() !== b) {
                                if (renameBuilding(b, newName.trim())) {
                                  toast.success('Đổi tên thành công!');
                                  if (activeBuilding === b) setActiveBuilding(newName.trim());
                                } else {
                                  toast.error('Tên nhà không hợp lệ hoặc đã tồn tại.');
                                }
                              }
                            }} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px 4px' }} 
                            title="Đổi tên"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`CẢNH BÁO: Xóa tòa nhà này sẽ XÓA TOÀN BỘ PHÒNG, KHÁCH, VÀ HỢP ĐỒNG thuộc tòa nhà này. Hành động này không thể hoàn tác!\n\nBạn có chắc chắn muốn xóa Tòa ${b}?`)) {
                                if (deleteBuilding && deleteBuilding(b)) {
                                  toast.success('Đã xóa tòa nhà và toàn bộ dữ liệu liên quan!');
                                  if (activeBuilding === b) setActiveBuilding(settings.buildings.find(bl => bl !== b) || '');
                                }
                              }
                            }} 
                            style={{ background: 'transparent', border: 'none', color: 'var(--status-overdue)', cursor: 'pointer', padding: '8px 4px' }} 
                            title="Xóa nhà"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {(user?.role === 'admin' || user?.role === 'staff') && (
                    <button 
                      onClick={async () => {
                        if (user?.plan === 'basic') {
                          toast.error('Gói Cơ Bản chỉ cho phép quản lý 1 tòa nhà. Vui lòng nâng cấp Gói PRO để thêm nhà!');
                          return;
                        }
                        const newName = await customPrompt('Nhập tên tòa nhà mới:');
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
        <div className="page-header">
          <h1 className="page-title" style={{ margin: 0 }}>
            {(user?.role !== 'tenant' && user?.role !== 'guest') ? `Sơ Đồ Tòa ${String(activeBuilding).toLowerCase().startsWith('nhà') ? activeBuilding : 'Nhà ' + activeBuilding}` : 'Phòng Trống Dành Cho Bạn'}
          </h1>
          <div className="page-header-actions">
            {(user?.role === 'admin' || user?.role === 'staff') && (
              <StatusBadge status="occupied" text={`Đang thuê: ${displayedRooms.filter(r => r.status === 'occupied' || r.status === 'expiring' || r.status === 'overdue').length}`} />
            )}
            <StatusBadge status="vacant" text={`Trống: ${displayedRooms.filter(r => r.status === 'vacant').length}`} />
            {(user?.role === 'admin' || user?.role === 'staff') && (
              <button onClick={handleAddRoom} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-primary)', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: '600', marginLeft: '12px', opacity: (user?.plan === 'basic' && rooms.length >= 15) ? 0.5 : 1 }}>
                <Plus size={16} /> Tạo Phòng Mới
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {/* Building visual model: tầng cao ở trên, tầng thấp ở dưới */}
          {sortedFloors.map((floor, floorIdx) => {
            const isTop = floorIdx === 0;
            const isBottom = floorIdx === sortedFloors.length - 1;
            const floorRooms = roomsByFloor[floor] || [];
            const occupiedCount = floorRooms.filter(r => r.status !== 'vacant').length;
            const vacantCount = floorRooms.filter(r => r.status === 'vacant').length;

            return (
              <div
                key={floor}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  borderLeft: '3px solid var(--accent-primary)',
                  marginBottom: isBottom ? 0 : '0',
                  position: 'relative',
                }}
              >
                {/* Floor label cột bên trái */}
                <div style={{
                  width: '80px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px 8px',
                  borderRight: '1px dashed var(--border-glass)',
                  background: isTop
                    ? 'rgba(209,176,122,0.08)'
                    : isBottom
                    ? 'rgba(255,255,255,0.02)'
                    : 'transparent',
                  gap: '4px',
                }}>
                  {isTop && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '2px' }}>▲ TOP</div>
                  )}
                  <div style={{
                    fontSize: '1.5rem',
                    fontWeight: '900',
                    color: isTop ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    lineHeight: 1,
                  }}>
                    {floor}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Tầng</div>
                  <div style={{ marginTop: '6px', fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--status-occupied-text)', fontWeight: '600' }}>{occupiedCount}</span> thuê
                    {vacantCount > 0 && <> · <span style={{ color: 'var(--status-vacant-text)', fontWeight: '600' }}>{vacantCount}</span> trống</>}
                  </div>
                  {isBottom && (
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>▼ TRỆT</div>
                  )}
                </div>

                {/* Room grid */}
                <div style={{ flex: 1, padding: '16px 16px 16px 20px', borderBottom: isBottom ? 'none' : '1px solid var(--border-glass)' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                      gap: '12px',
                    }}
                    className="rooms-grid-mobile"
                  >
                    {floorRooms.map(room => {
                      const style = getStatusStyle(room.status);
                      const priceDisplay = room.price
                        ? `${(room.price / 1000000).toFixed(1)}tr/th`
                        : '';
                      return (
                        <div
                          key={room.id}
                          onClick={() => handleRoomClick(room)}
                          title={`Phòng ${room.name} | ${room.area || '?'}m² | ${priceDisplay}`}
                          style={{
                            position: 'relative',
                            aspectRatio: '1',
                            borderRadius: 'var(--radius-sm)',
                            background: style.bg,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: style.text,
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: 'var(--card-shadow)',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            border: `1px solid ${style.border}`,
                            gap: '4px',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.transform = 'scale(1.07)';
                            e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.3)`;
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'var(--card-shadow)';
                          }}
                        >
                          <div style={{ fontSize: '1.15rem', letterSpacing: '0.03em' }}>{room.name}</div>
                          {priceDisplay && (
                            <div style={{ fontSize: '0.62rem', opacity: 0.75, fontWeight: '500' }}>{priceDisplay}</div>
                          )}
                          {user?.role === 'tenant' && (
                            <div style={{ fontSize: '0.7rem', opacity: 0.75 }}>Nhà {room.building}</div>
                          )}

                          {(user?.role === 'admin' || user?.role === 'staff') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`CẢNH BÁO: Xóa phòng này sẽ mất dữ liệu liên quan. Bạn có chắc chắn muốn xóa phòng ${room.name}?`)) {
                                  removeRoom(room.id);
                                  toast.success(`Đã xóa phòng ${room.name}!`);
                                }
                              }}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(0,0,0,0.2)',
                                color: 'var(--status-overdue)',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                transition: '0.2s'
                              }}
                              title="Xóa phòng"
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Ground indicator */}
          {sortedFloors.length > 0 && (
            <div style={{
              height: '8px',
              background: 'linear-gradient(to right, var(--accent-primary), transparent)',
              borderRadius: '0 0 4px 4px',
              marginLeft: '3px',
              opacity: 0.4,
            }} />
          )}

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
        onCreateContract={(room) => {
          closeDrawer();
          setContractModalRoom(room);
        }}
      />
      <CreateContractModal 
        isOpen={!!contractModalRoom} 
        onClose={() => setContractModalRoom(null)} 
        room={contractModalRoom}
      />
    </div>
  );
}
