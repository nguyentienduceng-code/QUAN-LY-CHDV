import { FolderOpen } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = FolderOpen, 
  title = 'Không có dữ liệu', 
  message = 'Chưa có thông tin nào được hiển thị ở đây.',
  action = null
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      background: 'var(--bg-card)',
      border: '1px dashed var(--border-glass)',
      borderRadius: 'var(--radius)',
      textAlign: 'center',
      color: 'var(--text-secondary)'
    }}>
      <div style={{ 
        width: '64px', height: '64px', borderRadius: '50%', 
        background: 'rgba(255,255,255,0.05)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <Icon size={32} color="var(--text-secondary)" />
      </div>
      <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '1.2rem' }}>{title}</h3>
      <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', maxWidth: '300px' }}>{message}</p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}
