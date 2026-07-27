import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Pagination Component
 * Provides UI controls for navigating paginated data
 */
export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  loading = false
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      borderTop: '1px solid var(--border-glass)',
      background: 'var(--bg-secondary)',
      borderRadius: '0 0 12px 12px'
    }}>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        Hiển thị <strong style={{ color: 'var(--text-primary)' }}>{startItem}</strong> đến{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{endItem}</strong> trong tổng số{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong> kết quả
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || loading}
          style={{
            padding: '8px 12px',
            background: currentPage === 1 ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
            border: '1px solid var(--border-glass)',
            borderRadius: '6px',
            color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
          title="Trang đầu"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          style={{
            padding: '8px 12px',
            background: currentPage === 1 ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
            border: '1px solid var(--border-glass)',
            borderRadius: '6px',
            color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
          title="Trang trước"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span
              key={`ellipsis-${index}`}
              style={{
                padding: '8px 12px',
                color: 'var(--text-tertiary)'
              }}
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              disabled={loading}
              style={{
                padding: '8px 14px',
                background: currentPage === page ? 'var(--accent-primary)' : 'var(--bg-primary)',
                border: '1px solid var(--border-glass)',
                borderRadius: '6px',
                color: currentPage === page ? '#fff' : 'var(--text-primary)',
                cursor: 'pointer',
                fontWeight: currentPage === page ? '600' : '400',
                minWidth: '40px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== page) {
                  e.target.style.background = 'var(--bg-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== page) {
                  e.target.style.background = 'var(--bg-primary)';
                }
              }}
            >
              {page}
            </button>
          )
        ))}

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          style={{
            padding: '8px 12px',
            background: currentPage === totalPages ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
            border: '1px solid var(--border-glass)',
            borderRadius: '6px',
            color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
          title="Trang sau"
        >
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          style={{
            padding: '8px 12px',
            background: currentPage === totalPages ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
            border: '1px solid var(--border-glass)',
            borderRadius: '6px',
            color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s'
          }}
          title="Trang cuối"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
