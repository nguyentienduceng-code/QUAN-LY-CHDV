import { useState, useRef, useEffect } from 'react';
import { X, User, Calendar, DollarSign, FileText, UploadCloud, File, Trash2, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppData } from '../context/AppDataContext';

export default function CreateContractModal({ isOpen, onClose, room, existingContract, onSuccess }) {
  const { addContract, updateContract, addTenant, updateRoom } = useAppData();
  
  const [tenantName, setTenantName] = useState('');
  const [contractId, setContractId] = useState(`CTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Calculate 1 year later by default
  const defaultEndDate = new Date();
  defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);
  const [endDate, setEndDate] = useState(defaultEndDate.toISOString().split('T')[0]);
  
  const [deposit, setDeposit] = useState((room?.price || 0) * 1);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (existingContract && isOpen) {
      setTenantName(existingContract.tenantName || existingContract.tenant || '');
      setContractId(existingContract.id || '');
      
      const parseDate = (dString) => {
        if (!dString) return '';
        const parts = dString.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return dString;
      };
      
      setStartDate(parseDate(existingContract.startDate));
      setEndDate(parseDate(existingContract.endDate));
      
      const parsedDeposit = existingContract.deposit 
        ? parseInt(String(existingContract.deposit).replace(/\D/g, ''), 10) 
        : 0;
      setDeposit(parsedDeposit);
      
      setFiles(existingContract.attachedFiles || []);
    } else if (isOpen) {
      setTenantName('');
      setContractId(`CTR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(defaultEndDate.toISOString().split('T')[0]);
      setDeposit((room?.price || 0) * 1);
      setFiles([]);
    }
  }, [existingContract, isOpen, room]);

  if (!isOpen || !room) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles.map(f => ({ name: f.name, size: f.size }))]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tenantName) {
      toast.error('Vui lòng nhập Tên khách thuê!');
      return;
    }
    if (existingContract) {
      updateContract(existingContract.id, {
        id: contractId,
        tenant: tenantName,
        tenantName: tenantName,
        startDate: new Date(startDate).toLocaleDateString('vi-VN'),
        endDate: new Date(endDate).toLocaleDateString('vi-VN'),
        deposit: deposit.toLocaleString('vi-VN'),
        attachedFiles: files
      });
      toast.success(`Đã cập nhật hợp đồng ${contractId}!`);
    } else {
      // Create primary tenant
      addTenant({
        name: tenantName,
        room: room.name,
        building: room.building || 'A',
        status: 'active',
        isRepresentative: true,
        note: 'Người đại diện hợp đồng'
      });

      // Create contract with extra data
      addContract({
        id: contractId,
        tenant: tenantName,
        tenantName: tenantName,
        room: room.name,
        startDate: new Date(startDate).toLocaleDateString('vi-VN'),
        endDate: new Date(endDate).toLocaleDateString('vi-VN'),
        deposit: deposit.toLocaleString('vi-VN'),
        status: 'active',
        attachedFiles: files
      });

      // Update room status
      updateRoom(room.id, {
        status: 'occupied',
        tenant: { name: tenantName }
      });
      
      toast.success(`Đã tạo hợp đồng ${contractId} thành công!`);
    }
    
    // Reset
    setTenantName('');
    setFiles([]);
    
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}></div>
      <div style={{ position: 'relative', width: '100%', maxWidth: '600px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '1.25rem' }}>{existingContract ? 'Cập Nhật Hợp Đồng' : 'Lập Hợp Đồng Mới'}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phòng {room.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div className="responsive-grid-2-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <User size={16} /> Tên Người Đại Diện (*)
              </label>
              <input 
                type="text" 
                value={tenantName}
                onChange={e => setTenantName(e.target.value)}
                placeholder="Nguyễn Văn A" 
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                autoFocus
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <Hash size={16} /> Mã Hợp Đồng
              </label>
              <input 
                type="text" 
                value={contractId}
                onChange={e => setContractId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div className="responsive-grid-2-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <Calendar size={16} /> Ngày Bắt Đầu
              </label>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <Calendar size={16} /> Ngày Kết Thúc
              </label>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <DollarSign size={16} /> Tiền Cọc (VNĐ)
            </label>
            <input 
              type="number" 
              value={deposit}
              onChange={e => setDeposit(parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--status-overdue)' }}>
              ≈ {deposit.toLocaleString('vi-VN')} đ
            </div>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <FileText size={16} /> Tải lên tài liệu Hợp đồng (Bản chụp, PDF...)
            </label>
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                border: isDragging ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-glass)', 
                background: isDragging ? 'rgba(59,130,246,0.05)' : 'var(--bg-secondary)',
                borderRadius: '12px', 
                padding: '32px 16px', 
                textAlign: 'center',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileInput} style={{ display: 'none' }} multiple />
              <UploadCloud size={32} color={isDragging ? 'var(--accent-primary)' : 'var(--text-secondary)'} style={{ marginBottom: '12px' }} />
              <div style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: '4px' }}>
                Kéo thả file vào đây hoặc nhấn để chọn
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Hỗ trợ: PDF, JPG, PNG, DOCX (Tối đa 10MB)
              </div>
            </div>
            
            {files.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {files.map((file, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <File size={16} color="var(--accent-primary)" flexShrink={0} />
                      <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(idx); }} style={{ background: 'transparent', border: 'none', color: 'var(--status-overdue)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </form>
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: '12px' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            Hủy
          </button>
          <button type="submit" onClick={handleSubmit} style={{ flex: 1, padding: '12px', background: 'var(--accent-primary)', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            {existingContract ? 'Cập Nhật Hợp Đồng' : 'Tạo Hợp Đồng'}
          </button>
        </div>
      </div>
    </div>
  );
}
