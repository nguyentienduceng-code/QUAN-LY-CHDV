import { X, Wrench, Zap, Droplet, Wind, FileQuestion } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ReportIssueModal({ isOpen, onClose, onSubmit }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'dien', name: 'Sự cố Điện', icon: <Zap size={24} color="#eab308" /> },
    { id: 'nuoc', name: 'Sự cố Nước', icon: <Droplet size={24} color="#3b82f6" /> },
    { id: 'maylanh', name: 'Máy lạnh', icon: <Wind size={24} color="#06b6d4" /> },
    { id: 'khac', name: 'Vấn đề Khác', icon: <FileQuestion size={24} color="#64748b" /> },
  ];

  const handleSubmit = () => {
    if (!selectedCategory) {
      toast.error('Vui lòng chọn loại sự cố!');
      return;
    }
    const catName = categories.find(c => c.id === selectedCategory)?.name;
    const title = description ? `${catName}: ${description}` : catName;
    onSubmit(title);
    setSelectedCategory('');
    setDescription('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={onClose}></div>
      <div style={{ position: 'relative', width: '100%', maxWidth: '375px', background: '#fff', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', animation: 'slideUp 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={20} color="#ef4444" /> Báo hỏng hóc
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <p style={{ margin: '0 0 12px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Loại sự cố</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => setSelectedCategory(cat.id)}
                style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', 
                  padding: '16px 8px', borderRadius: '12px', cursor: 'pointer',
                  background: selectedCategory === cat.id ? '#eff6ff' : '#f8fafc',
                  border: `2px solid ${selectedCategory === cat.id ? '#3b82f6' : '#e2e8f0'}`,
                  transition: 'all 0.2s'
                }}
              >
                {cat.icon}
                <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#334155' }}>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <p style={{ margin: '0 0 8px', fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>Mô tả chi tiết (Tùy chọn)</p>
          <textarea 
            placeholder="Ví dụ: Đèn phòng tắm không sáng..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', resize: 'none', minHeight: '80px', fontFamily: 'inherit' }}
          />
        </div>

        <button onClick={handleSubmit} style={{ width: '100%', padding: '16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>
          Gửi Yêu Cầu
        </button>
        
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
