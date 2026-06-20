import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Home from './pages/Home';
import Rooms from './pages/Rooms';
import Tenants from './pages/Tenants';
import Contracts from './pages/Contracts';
import Invoices from './pages/Invoices';
import Maintenance from './pages/Maintenance';

import TenantPortal from './pages/TenantPortal';
import FinanceAndTenants from './pages/FinanceAndTenants';
import Settings from './pages/Settings';
import Users from './pages/Users';
import BottomTabBar from './components/BottomTabBar';
import { useAppData } from './context/AppDataContext';
import DevBackdoor from './components/DevBackdoor';

import './styles/index.css';
import './styles/layout.css';

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Tenant trying to access manager-only page → redirect to home
    return <Navigate to="/" replace />;
  }
  return children;
}

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { loading } = useAppData();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="bg-animation">
          <div className="bg-orb bg-orb-1"></div>
          <div className="bg-orb bg-orb-2"></div>
        </div>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ fontWeight: '600', fontSize: '1.1rem', letterSpacing: '0.5px' }} className="gradient-text">Đang đồng bộ dữ liệu...</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Vui lòng chờ trong giây lát</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-animation">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>
      <div className="app-container">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        {isSidebarOpen && (
          <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
        )}
        <main className="main-content">
          <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <div className="page-content">
            <Routes>
              {/* Common / Conditional Home */}
              <Route path="/" element={user?.role !== 'tenant' && user?.role !== 'guest' ? <Home /> : <TenantPortal />} />
              
              {/* Manager/Staff Routes */}
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/finance" element={<ProtectedRoute allowedRoles={['admin', 'staff', 'viewer']}><FinanceAndTenants /></ProtectedRoute>} />
              <Route path="/tenants" element={<ProtectedRoute allowedRoles={['admin', 'staff', 'viewer']}><Tenants /></ProtectedRoute>} />
              <Route path="/contracts" element={<ProtectedRoute allowedRoles={['admin', 'staff', 'viewer']}><Contracts /></ProtectedRoute>} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><Users /></ProtectedRoute>} />
              
              {/* Tenant Routes */}
              <Route path="/tenant-portal" element={<TenantPortal />} />
            </Routes>
          </div>
        </main>
        <BottomTabBar />
      </div>
    </>
  );
}

import { AppDataProvider } from './context/AppDataContext';
import { CustomPromptProvider } from './context/CustomPromptContext';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <CustomPromptProvider>
      <AuthProvider>
        <AppDataProvider>
          <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-main)',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            },
            success: {
              style: {
                background: '#ECFDF5',
                color: '#065F46',
                border: '1px solid #34D399',
              },
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              style: {
                background: '#FEF2F2',
                color: '#991B1B',
                border: '1px solid #F87171',
              },
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            } />
          </Routes>
          {import.meta.env.DEV && <DevBackdoor />}
        </Router>
        </AppDataProvider>
      </AuthProvider>
      </CustomPromptProvider>
    </ErrorBoundary>
  );
}

export default App;
