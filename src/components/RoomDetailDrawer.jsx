import { X, User, Calendar, DollarSign, Wrench, Image as ImageIcon, Plus, UploadCloud } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

export default function RoomDetailDrawer({ isOpen, onClose, room }) {
  const { user } = useAuth();
  const { removeRoom, updateRoom } = useAppData();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleAddImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (!room) return null;

  return (
    <>
      <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`drawer-content ${isOpen ? 'open' : ''}`}>
        
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h2 style={{ margin: '0 0 8px' }}>Phòng {room.name} - Nhà {room.building}</h2>
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
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* Thông tin chung */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
              <DollarSign size={18} /> Thông Tin Chung
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Diện tích</div>
                <div style={{ fontWeight: '600', marginTop: '4px' }}>{room.area || '25'} m²</div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Giá thuê/tháng</div>
                <div style={{ fontWeight: '600', marginTop: '4px', color: 'var(--status-occupied)' }}>{room.price || '4.500.000'} đ</div>
              </div>
            </div>
          </div>

          {/* Khách thuê */}
          {room.status !== 'vacant' && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
                <User size={18} /> Khách Thuê
              </h3>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Họ và tên</div>
                <div style={{ fontWeight: '600', marginTop: '4px' }}>{room.tenant?.name || 'Nguyễn Văn A'}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Số điện thoại</div>
                  <div style={{ fontWeight: '600', marginTop: '4px' }}>{room.tenant?.phone || '090 123 4567'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CCCD</div>
                  <div style={{ fontWeight: '600', marginTop: '4px' }}>{room.tenant?.idCard || '001099001234'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <Calendar size={18} color="var(--accent-primary)" />
                <div style={{ fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Hạn HĐ: </span>
                  <span style={{ fontWeight: '600', color: room.status === 'expiring' ? 'var(--status-expiring)' : 'inherit' }}>
                    {room.tenant?.contractEnd || '15/07/2026'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ảnh Phòng */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
              <ImageIcon size={18} /> Ảnh Phòng
              {user?.role === 'manager' && (
                <>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileSelect}
                  />
                  <button onClick={handleAddImageClick} style={{ marginLeft: 'auto', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '4px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
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
                    <img key={i} src={img} alt="Room" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-glass)' }} />
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '24px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed var(--border-glass)' }}>
                  Chưa có ảnh nào. <br/> {user?.role === 'manager' ? 'Kéo thả ảnh vào đây hoặc bấm "Thêm ảnh"' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Lịch sử & Trạng thái phụ */}
          {(room.status === 'overdue' || room.status === 'maintenance') && (
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '16px' }}>
                <Wrench size={18} /> Lịch sử & Lưu ý
              </h3>
              {room.status === 'overdue' && (
                <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--status-overdue)', borderRadius: '4px' }}>
                  <div style={{ fontWeight: '600', color: 'var(--status-overdue)', marginBottom: '4px' }}>Nợ hóa đơn tháng trước</div>
                  <div style={{ fontSize: '0.9rem' }}>4.500.000 đ (Hạn: 05/06)</div>
                </div>
              )}
              {room.status === 'maintenance' && (
                <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderLeft: '4px solid var(--status-maintenance)', borderRadius: '4px' }}>
                  <div style={{ fontWeight: '600', color: 'var(--status-maintenance)', marginBottom: '4px' }}>Yêu cầu sửa chữa (TKT-099)</div>
                  <div style={{ fontSize: '0.9rem' }}>Khách báo điều hòa kêu to, chảy nước.</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {user?.role === 'manager' && room.status === 'vacant' && (
          <div className="drawer-footer">
            <button 
              onClick={() => {
                if (confirm(`Bạn có chắc chắn muốn xóa phòng ${room.name}?`)) {
                  removeRoom(room.id);
                  onClose();
                }
              }} 
              style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--status-overdue)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
            >
              Xóa Phòng
            </button>
            <button style={{ flex: 1, padding: '12px', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Tạo Hợp Đồng Mới
            </button>
          </div>
        )}
      </div>
    </>
  );
}
