export default function StatusBadge({ status, text }) {
  let bgColor, textColor, borderColor;

  switch (status) {
    case 'occupied':
    case 'paid':
      bgColor = '#10b981'; // Nền xanh lá đậm
      textColor = '#ffffff';
      borderColor = '#059669';
      break;
    case 'vacant':
      bgColor = '#64748b'; // Nền xám
      textColor = '#ffffff';
      borderColor = '#475569';
      break;
    case 'expiring':
    case 'partial':
    case 'in-progress':
      bgColor = '#f59e0b'; // Nền cam
      textColor = '#ffffff';
      borderColor = '#d97706';
      break;
    case 'overdue':
    case 'unpaid':
    case 'high-priority':
    case 'reported':
      bgColor = '#ef4444'; // Nền đỏ
      textColor = '#ffffff';
      borderColor = '#dc2626';
      break;
    case 'maintenance':
    case 'resolved':
      bgColor = '#3b82f6'; // Nền xanh dương
      textColor = '#ffffff';
      borderColor = '#2563eb';
      break;
    default:
      bgColor = 'var(--bg-secondary)';
      textColor = 'var(--text-secondary)';
      borderColor = 'var(--text-secondary)';
  }

  return (
    <span style={{
      backgroundColor: bgColor,
      color: textColor,
      border: `1px solid ${borderColor}`,
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '0.8rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px'
    }}>
      {text}
    </span>
  );
}
