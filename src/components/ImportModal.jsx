import { useState, useRef } from 'react';
import { X, Upload, FileDown, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { downloadImportTemplate, parseExcelImport } from '../utils/importExcel';
import toast from 'react-hot-toast';

export default function ImportModal({ isOpen, onClose }) {
  const { importExcelData } = useAppData();
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Vui lòng chọn file Excel hợp lệ (.xlsx, .xls)');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    setErrors([]);
    setParsedData(null);

    try {
      const data = await parseExcelImport(selectedFile);
      setParsedData(data);
      if (data.errors && data.errors.length > 0) {
        setErrors(data.errors);
        toast.error('Phát hiện lỗi định dạng trong file. Vui lòng kiểm tra lại!');
      } else {
        toast.success('Đọc file thành công!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi đọc file Excel. Vui lòng thử lại!');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (!parsedData) return;
    
    // Check if there are critical errors that should block import
    if (errors.length > 0 && !window.confirm('File có lỗi định dạng (xem danh sách bên dưới). Bạn vẫn muốn bỏ qua các lỗi này và import những dữ liệu hợp lệ?')) {
      return;
    }

    try {
      importExcelData(parsedData);
      toast.success('Cập nhật dữ liệu từ Excel thành công!');
      onClose();
      // Reset state
      setFile(null);
      setParsedData(null);
      setErrors([]);
    } catch (err) {
      toast.error('Có lỗi xảy ra khi cập nhật dữ liệu vào hệ thống!');
      console.error(err);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}></div>
      <div className="card" style={{ position: 'relative', width: '600px', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--accent-primary)' }}>Nhập Dữ Liệu Từ Excel</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
          {/* Step 1: Download Template */}
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Bước 1: Tải File Mẫu</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Tải file mẫu về máy, điền đầy đủ thông tin vào các Sheet (Danh Sach Phong, Khach Thue, Chi So Dien Nuoc) theo đúng định dạng.
            </p>
            <button 
              onClick={downloadImportTemplate}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}
            >
              <FileDown size={18} /> Tải File Excel Mẫu
            </button>
          </div>

          {/* Step 2: Upload */}
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem' }}>Bước 2: Tải lên File đã điền</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Lưu ý: Hệ thống sẽ dựa vào Mã Phòng / Mã Khách để ghi đè dữ liệu cũ hoặc tạo mới nếu chưa tồn tại.
            </p>
            
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange}
            />
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                border: '2px dashed var(--border-glass)', 
                borderRadius: '12px', 
                padding: '32px 16px', 
                textAlign: 'center', 
                cursor: 'pointer',
                background: file ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                borderColor: file ? 'var(--status-occupied)' : 'var(--border-glass)'
              }}
            >
              {isProcessing ? (
                <div style={{ color: 'var(--accent-primary)' }}>Đang đọc file...</div>
              ) : file ? (
                <div>
                  <CheckCircle size={32} color="var(--status-occupied)" style={{ marginBottom: '8px' }} />
                  <div style={{ fontWeight: 'bold' }}>{file.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Nhấn vào đây để chọn file khác
                  </div>
                </div>
              ) : (
                <div>
                  <Upload size={32} color="var(--text-secondary)" style={{ marginBottom: '8px' }} />
                  <div style={{ fontWeight: '500' }}>Nhấn để chọn file tải lên (.xlsx)</div>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Preview */}
          {parsedData && (
            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>Bước 3: Xác nhận Dữ Liệu</h3>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ flex: 1, padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{parsedData.rooms.length}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Phòng</div>
                </div>
                <div style={{ flex: 1, padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--status-occupied)' }}>{parsedData.tenants.length}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Khách Thuê</div>
                </div>
                <div style={{ flex: 1, padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--status-overdue)' }}>{parsedData.meters.length}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Chỉ số Đ/N</div>
                </div>
              </div>

              {errors.length > 0 && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--status-overdue)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-overdue)', fontWeight: 'bold', marginBottom: '8px' }}>
                    <AlertCircle size={18} /> Có {errors.length} cảnh báo lỗi:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '24px', fontSize: '0.85rem', color: 'var(--status-overdue)' }}>
                    {errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                    {errors.length > 5 && <li>...và {errors.length - 5} lỗi khác</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            Hủy Bỏ
          </button>
          <button 
            onClick={handleImport}
            disabled={!parsedData}
            style={{ 
              padding: '10px 20px', 
              background: parsedData ? 'var(--status-occupied)' : 'var(--bg-secondary)', 
              color: parsedData ? '#fff' : 'var(--text-secondary)', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: parsedData ? 'pointer' : 'not-allowed', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle size={18} /> Xác Nhận Import
          </button>
        </div>
      </div>
    </div>
  );
}
