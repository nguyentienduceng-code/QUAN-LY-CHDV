export default function StatusBadge({ status, text }) {
  let bgColor, textColor, borderColor;

  switch (status) {
    case 'occupied':
    case 'paid':
      bgColor = 'var(--status-occupied-bg)';
      textColor = 'var(--status-occupied-text)';
      borderColor = 'var(--status-occupied-text)';
      break;
    case 'vacant':
      bgColor = 'var(--status-vacant-bg)';
      textColor = 'var(--status-vacant-text)';
      borderColor = 'var(--status-vacant-text)';
      break;
    case 'expiring':
    case 'partial':
    case 'in-progress':
      bgColor = 'var(--status-expiring-bg)';
      textColor = 'var(--status-expiring-text)';
      borderColor = 'var(--status-expiring-text)';
      break;
    case 'overdue':
    case 'unpaid':
    case 'high-priority':
    case 'reported':
      bgColor = 'var(--status-overdue-bg)';
      textColor = 'var(--status-overdue-text)';
      borderColor = 'var(--status-overdue-text)';
      break;
    case 'maintenance':
    case 'resolved':
      bgColor = 'var(--status-maintenance-bg)';
      textColor = 'var(--status-maintenance-text)';
      borderColor = 'var(--status-maintenance-text)';
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
