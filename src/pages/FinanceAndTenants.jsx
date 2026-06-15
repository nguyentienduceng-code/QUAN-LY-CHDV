import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import Tenants from './Tenants';
import Invoices from './Invoices';
import { Users, FileSpreadsheet, List, Eye, MessageSquare, Home as HomeIcon } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import TenantDetailDrawer from '../components/TenantDetailDrawer';
import toast from 'react-hot-toast';

export default function FinanceAndTenants() {
  const [activeTab, setActiveTab] = useState('tenants');
  const [selectedRoomName, setSelectedRoomName] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { tenants, contracts, invoices, rooms } = useAppData();

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title gradient-text">Quản Lý Khách & Hóa Đơn</h1>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('tenants')} 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'tenants' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'tenants' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}
        >
          <HomeIcon size={18} /> Phòng & Khách Thuê
        </button>
        <button 
          onClick={() => setActiveTab('invoices')} 
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === 'invoices' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'invoices' ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}
        >
          <FileSpreadsheet size={18} /> Hóa Đơn
        </button>
      </div>

      <div className="tab-content-wrapper">
        {activeTab === 'tenants' && <Tenants />}
        {activeTab === 'invoices' && <Invoices />}
      </div>

      <TenantDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        roomName={selectedRoomName} 
      />
    </div>
  );
}
