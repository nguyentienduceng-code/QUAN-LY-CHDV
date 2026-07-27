import { Component } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * PageErrorBoundary - Lightweight error boundary for page-level components
 * Shows error inline without breaking the entire app
 */
export default class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Page error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          margin: '20px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            margin: '0 auto 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertCircle size={30} color="#EF4444" />
          </div>

          <h3 style={{
            margin: '0 0 8px',
            fontSize: '1.25rem',
            color: 'var(--text-primary)'
          }}>
            Không thể tải nội dung
          </h3>

          <p style={{
            margin: '0 0 20px',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem'
          }}>
            {this.props.fallbackMessage || 'Đã xảy ra lỗi khi tải trang này'}
          </p>

          <button
            onClick={this.handleRetry}
            style={{
              padding: '10px 20px',
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            Thử lại
          </button>

          {import.meta.env.DEV && this.state.error && (
            <details style={{
              marginTop: '20px',
              textAlign: 'left',
              fontSize: '0.8rem'
            }}>
              <summary style={{
                cursor: 'pointer',
                color: 'var(--text-tertiary)'
              }}>
                Chi tiết lỗi
              </summary>
              <pre style={{
                marginTop: '8px',
                padding: '8px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '4px',
                overflow: 'auto',
                color: '#FF6B6B'
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
