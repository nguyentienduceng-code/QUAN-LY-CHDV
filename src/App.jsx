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
import BottomTabBar from './components/BottomTabBar';

import './styles/index.css';
import './styles/layout.css';

function ProtectedRoute({ children, requireRole }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requireRole && user.role !== requireRole) {
    // Tenant trying to access manager-only page → redirect to home
    return <Navigate to="/" replace />;
  }
  return children;
}

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

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
              <Route path="/" element={user.role === 'manager' ? <Home /> : <TenantPortal />} />
              
              {/* Manager-only Routes */}
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/finance" element={<ProtectedRoute requireRole="manager"><FinanceAndTenants /></ProtectedRoute>} />
              <Route path="/tenants" element={<ProtectedRoute requireRole="manager"><Tenants /></ProtectedRoute>} />
              <Route path="/contracts" element={<ProtectedRoute requireRole="manager"><Contracts /></ProtectedRoute>} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/settings" element={<ProtectedRoute requireRole="manager"><Settings /></ProtectedRoute>} />
              
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
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
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
        </Router>
        </AppDataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
