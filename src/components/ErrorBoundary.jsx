import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState(prev => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1
    }));

    // Log to error tracking service (e.g., Sentry) in production
    if (import.meta.env.PROD) {
      // TODO: Add error tracking service integration
      console.error('Production error:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isRecurringError = this.state.errorCount > 2;

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            position: 'relative',
            zIndex: 10,
            maxWidth: '600px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={40} color="#EF4444" />
            </div>

            <h1 style={{
              margin: '0 0 16px',
              fontSize: '1.75rem',
              color: 'var(--text-primary)',
              fontWeight: '700'
            }}>
              {isRecurringError ? 'Lỗi liên tục xảy ra' : 'Đã xảy ra lỗi'}
            </h1>

            <p style={{
              margin: '0 0 32px',
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              {isRecurringError
                ? 'Ứng dụng gặp lỗi nghiêm trọng và không thể tiếp tục. Vui lòng liên hệ hỗ trợ kỹ thuật.'
                : 'Ứng dụng gặp sự cố không mong muốn. Bạn có thể thử tải lại trang hoặc quay về trang chủ.'
              }
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {!isRecurringError && (
                <button
                  onClick={this.handleReset}
                  style={{
                    padding: '12px 24px',
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  <RefreshCw size={18} />
                  Thử lại
                </button>
              )}

              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <RefreshCw size={18} />
                Tải lại trang
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '12px 24px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <Home size={18} />
                Về trang chủ
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details style={{
                marginTop: '32px',
                textAlign: 'left',
                background: 'rgba(0,0,0,0.2)',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  🔍 Chi tiết lỗi (Development only)
                </summary>
                <div style={{
                  marginTop: '12px',
                  fontSize: '0.85rem'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: 'var(--status-overdue)' }}>Error:</strong>
                    <pre style={{
                      marginTop: '4px',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '4px',
                      overflow: 'auto',
                      color: '#FF6B6B'
                    }}>
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong style={{ color: 'var(--accent-primary)' }}>Component Stack:</strong>
                      <pre style={{
                        marginTop: '4px',
                        padding: '8px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '4px',
                        overflow: 'auto',
                        fontSize: '0.8rem'
                      }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>

          <div className="bg-animation">
            <div className="bg-orb bg-orb-1"></div>
            <div className="bg-orb bg-orb-2"></div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

