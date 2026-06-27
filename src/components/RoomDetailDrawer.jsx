import { X, User, Calendar, DollarSign, Wrench, Image as ImageIcon, Plus, UploadCloud, Edit3, Check, FileText, Trash2, ChevronDown } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AVAILABLE_AMENITIES = ['Máy lạnh', 'Tủ lạnh', 'Giường nệm', 'Tủ quần áo', 'Bếp điện', 'Máy giặt', 'Ban công', 'Cửa sổ', 'Tivi', 'Sofa', 'Wifi'];

export default function RoomDetailDrawer({ isOpen, onClose, room, onCreateContract }) {
  const { user } = useAuth();
  const { removeRoom, updateRoom } = useAppData();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Inline editing state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editPrice, setEditPrice] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editType, setEditType] = useState('');
  const [editAmenities, setEditAmenities] = useState([]);
  const [isAmenitiesDropdownOpen, setIsAmenitiesDropdownOpen] = useState(false);

  const startEditing = () => {
    setEditPrice(String(room.price || ''));
    setEditArea(String(room.area || ''));
    setEditType(room.type || 'Studio');
    setEditAmenities(room.amenities || []);
    setIsEditingInfo(true);
  };

  const saveEditing = () => {
    const priceNum = parseInt(editPrice.replace(/\D/g, ''), 10);
    const areaNum = parseFloat(editArea);
    if (!priceNum || priceNum <= 0) {
      toast.error('Giá thuê không hợp lệ!');
      return;
    }
    updateRoom(room.id, {
      price: priceNum,
      area: areaNum || room.area,
      type: editType || room.type,
      amenities: editAmenities,
    });
    toast.success('Đã cập nhật thông tin phòng!');
    setIsEditingInfo(false);
    setIsAmenitiesDropdownOpen(false);
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX_SIZE = 800;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    toast.loading('Đang xử lý ảnh...', { id: 'upload-toast' });
    try {
      const newImages = [...(room.images || [])];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const compressedBase64 = await compressImage(file);
        newImages.push(compressedBase64);
      }
      updateRoom(room.id, { images: newImages });
      toast.success('Đã tải ảnh lên thành công!', { id: 'upload-toast' });
    } catch {
      toast.error('Lỗi file hệ thống, vui lòng thử lại!', { id: 'upload-toast' });
    }
  };

  const handleFileSelect = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDeleteImage = (idx) => {
    const newImages = [...(room.images || [])];
    newImages.splice(idx, 1);
    updateRoom(room.id, { images: newImages });
    toast.success('Đã xóa ảnh!');
  };

  if (!room) return null;

  const priceFormatted = typeof room.price === 'number'
    ? room.price.toLocaleString('vi-VN')
    : room.price;

  return (
    <>
      <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`drawer-content ${isOpen ? 'open' : ''}`}>

        {/* Header */}
        <div className="drawer-header">
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.2rem' }}>
              Phòng {room.name}
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'normal', marginLeft: '8px' }}>
                Nhà {room.building} • Tầng {room.floor || '?'}
              </span>
            </h2>
            <StatusBadge
              status={room.status}
              text={
                room.status === 'occupied' ? 'Đang thuê' :
                room.status === 'vacant' ? 'Phòng trống' :
                room.status === 'expiring' ? 'Sắp hết hạn' :
                room.status === 'overdue' ? 'Quá hạn thu' : 'Đang bảo trì'
              }
            />
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">

          {/* ── THÔNG TIN PHÒNG ── */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <DollarSign size={18} /> Thông Tin Phòng
              </h3>
              {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff') && !isEditingInfo && (
                <button
                  onClick={startEditing}
                  style={{ background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--accent-primary)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit3 size={13} /> Sửa
                </button>
              )}
              {isEditingInfo && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setIsEditingInfo(false)} style={{ background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>Hủy</button>
                  <button onClick={saveEditing} style={{ background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                    <Check size={13} /> Lưu
                  </button>
                </div>
              )}
            </div>

            {isEditingInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Giá thuê/tháng (VNĐ)</label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={e => setEditPrice(e.target.value)}
                    placeholder="VD: 4500000"
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Diện tích (m²)</label>
                    <input
                      type="number"
                      value={editArea}
                      onChange={e => setEditArea(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Loại phòng</label>
                    <select
                      value={editType}
                      onChange={e => setEditType(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' }}
                    >
                      <option value="Studio" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Studio</option>
                      <option value="1PN" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>1 Phòng ngủ</option>
                      <option value="2PN" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>2 Phòng ngủ</option>
                      <option value="Penthouse" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Penthouse</option>
                      <option value="Duplex" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Duplex</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tiện ích</label>
                  <div 
                    onClick={() => setIsAmenitiesDropdownOpen(!isAmenitiesDropdownOpen)}
                    style={{ width: '100%', padding: '9px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.95rem' }}>
                      {editAmenities.length > 0 ? editAmenities.join(', ') : 'Chọn tiện ích...'}
                    </span>
                    <ChevronDown size={14} color="var(--text-secondary)" />
                  </div>
                  {isAmenitiesDropdownOpen && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', zIndex: 10, maxHeight: '200px', overflowY: 'auto', padding: '6px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                      {AVAILABLE_AMENITIES.map(amenity => (
                        <div 
                          key={amenity}
                          onClick={() => {
                            if (editAmenities.includes(amenity)) {
                              setEditAmenities(editAmenities.filter(a => a !== amenity));
                            } else {
                              setEditAmenities([...editAmenities, amenity]);
                            }
                          }}
                          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', borderRadius: '4px', background: editAmenities.includes(amenity) ? 'rgba(59, 130, 246, 0.1)' : 'transparent', transition: 'background 0.2s' }}
                        >
                          <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: editAmenities.includes(amenity) ? 'var(--accent-primary)' : 'transparent', flexShrink: 0 }}>
                            {editAmenities.includes(amenity) && <Check size={14} color="#fff" />}
                          </div>
                          <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Diện tích</div>
                  <div style={{ fontWeight: '700', marginTop: '4px', fontSize: '1rem' }}>{room.area || '25'} m²</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Giá thuê/tháng</div>
                  <div style={{ fontWeight: '700', marginTop: '4px', fontSize: '1rem', color: 'var(--accent-primary)' }}>
                    {priceFormatted} đ
                  </div>
                </div>
                {room.type && (
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Loại phòng</div>
                    <div style={{ fontWeight: '600', marginTop: '4px' }}>{room.type}</div>
                  </div>
                )}
                {room.amenities && room.amenities.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Tiện ích</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {room.amenities.slice(0, 4).map((a, i) => (
                        <span key={i} style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)', border: '1px solid var(--border-glass)' }}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── KHÁCH THUÊ ── */}
          {room.status !== 'vacant' && (
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
                <User size={18} /> Khách Thuê
              </h3>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Họ và tên</div>
                <div style={{ fontWeight: '700', marginTop: '4px', fontSize: '1rem' }}>{room.tenant?.name || 'Nguyễn Văn A'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Số điện thoại</div>
                  <div style={{ fontWeight: '600', marginTop: '4px', fontSize: '0.9rem' }}>
                    <a href={`tel:${room.tenant?.phone}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                      {room.tenant?.phone || '090 123 4567'}
                    </a>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>CCCD</div>
                  <div style={{ fontWeight: '600', marginTop: '4px', fontSize: '0.9rem' }}>{room.tenant?.idCard || '001099001234'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <Calendar size={18} color="var(--accent-primary)" />
                <div style={{ fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Hạn HĐ: </span>
                  <span style={{ fontWeight: '600', color: room.status === 'expiring' ? 'var(--status-expiring-text)' : 'inherit' }}>
                    {room.tenant?.contractEnd || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ── ẢNH PHÒNG ── */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
              <ImageIcon size={18} /> Ảnh Phòng
              {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff') && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ marginLeft: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '6px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    <Plus size={14} /> Thêm ảnh
                  </button>
                </>
              )}
            </h3>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: isDragging ? '2px dashed var(--accent-primary)' : '2px dashed transparent',
                background: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                borderRadius: '8px',
                padding: isDragging ? '16px' : '0',
                transition: 'all 0.2s ease-in-out',
                position: 'relative'
              }}
            >
              {isDragging && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10, 14, 26, 0.8)', zIndex: 10, borderRadius: '8px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                  <UploadCloud size={32} style={{ marginBottom: '8px' }} />
                  Thả ảnh vào đây
                </div>
              )}

              {room.images && room.images.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {room.images.map((img, i) => (
                    <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={img}
                        alt={`Phòng ${room.name} - ${i + 1}`}
                        style={{ width: '110px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-glass)' }}
                      />
                      {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff') && (
                        <button
                          onClick={() => handleDeleteImage(i)}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239,68,68,0.85)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                        >
                          <Trash2 size={11} color="#fff" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff') && fileInputRef.current?.click()}
                  style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '28px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-glass)', cursor: (user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff') ? 'pointer' : 'default' }}
                >
                  <UploadCloud size={28} style={{ marginBottom: '8px', opacity: 0.4, display: 'block', margin: '0 auto 8px' }} />
                  Chưa có ảnh nào.{' '}
                  {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff') && <span style={{ color: 'var(--accent-primary)' }}>Nhấp để tải ảnh lên</span>}
                </div>
              )}
            </div>
          </div>

          {/* ── LỊCH SỬ BẢO TRÌ ── */}
          {(room.status === 'overdue' || room.status === 'maintenance') && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
                <Wrench size={18} /> Lịch sử & Lưu ý
              </h3>
              {room.status === 'overdue' && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--status-overdue-text)', borderRadius: '4px', marginBottom: '10px' }}>
                  <div style={{ fontWeight: '600', color: 'var(--status-overdue-text)', marginBottom: '4px' }}>Nợ hóa đơn chưa thanh toán</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Vui lòng vào trang Hóa Đơn để xem chi tiết.</div>
                </div>
              )}
              {room.status === 'maintenance' && (
                <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderLeft: '4px solid var(--status-maintenance-text)', borderRadius: '4px' }}>
                  <div style={{ fontWeight: '600', color: 'var(--status-maintenance-text)', marginBottom: '4px' }}>Đang trong quá trình bảo trì</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Kiểm tra trang Bảo Trì để theo dõi tiến độ.</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'staff') && (
          <div className="drawer-footer">
            {room.status === 'vacant' ? (
              <>
                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc chắn muốn xóa phòng ${room.name}?`)) {
                      removeRoom(room.id);
                      onClose();
                      toast.success(`Đã xóa phòng ${room.name}!`);
                    }
                  }}
                  style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-overdue-text)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={16} /> Xóa
                </button>
                <button
                  onClick={() => { 
                    if (onCreateContract) {
                      onCreateContract(room);
                    } else {
                      onClose(); 
                      navigate('/tenants'); 
                    }
                  }}
                  style={{ flex: 1, padding: '12px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Tạo Hợp Đồng Mới
                </button>
              </>
            ) : (
              <button
                onClick={() => { onClose(); navigate('/invoices'); }}
                style={{ flex: 1, padding: '12px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <FileText size={16} /> Xem Hóa Đơn Phòng Này
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
