/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';

const AppDataContext = createContext(null);

const initialRooms = Array.from({ length: 40 }).map((_, i) => {
  const num = i + 1;
  const building = num <= 15 ? 'A' : num <= 30 ? 'B' : 'C';
  const floor = Math.floor((num - 1) % 15 / 5) + 1; 
  const roomName = `P.${floor}${num % 5 === 0 ? '05' : '0' + (num % 5)}`;
  
  let status = 'vacant';
  if (num % 7 === 0) status = 'expiring';
  else if (num % 11 === 0) status = 'overdue';
  else if (num % 13 === 0) status = 'maintenance';
  else if (num % 2 !== 0 || num % 4 === 0) status = 'occupied';

  const tenant = status !== 'vacant' ? {
    id: `TEN-${1000 + num}`,
    name: num % 2 === 0 ? 'Nguyễn Văn B' : 'Nguyễn Văn A',
    email: `khach${num}@gmail.com`,
    phone: '090 123 ' + (1000 + num),
    idCard: '00109900' + (1000 + num),
    contractEnd: status === 'expiring' ? '30/06/2026' : '15/12/2026'
  } : null;

  return { 
    id: num, 
    name: roomName, 
    status, 
    area: 20 + (num % 10),
    price: 4000000 + (num % 5) * 500000,
    floor,
    building,
    tenant,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1502672260266-1c1e52504431?auto=format&fit=crop&w=800&q=80']
  };
});

const initialTenants = initialRooms
  .filter(r => r.tenant)
  .map(r => ({
    ...r.tenant,
    room: r.name,
    roomId: r.id,
    building: r.building,
    status: 'active'
  }));

const initialContracts = initialTenants.map((t, i) => ({
  id: `CTR-2026-${100 + i}`,
  tenantName: t.name,
  room: `Nhà ${t.building} - ${t.room}`,
  startDate: '15/12/2025',
  endDate: t.contractEnd,
  deposit: (5000000).toLocaleString('vi-VN'),
  status: t.contractEnd === '30/06/2026' ? 'expiring' : 'active'
}));

const mockInvoiceItems = [
  { name: 'Tiền phòng', qty: 1, price: 4000000, total: 4000000 },
  { name: 'Tiền điện (Chỉ số: 100 - 150)', qty: 50, price: 3500, total: 175000 },
  { name: 'Tiền nước', qty: 2, price: 100000, total: 200000 },
  { name: 'Phí dịch vụ', qty: 1, price: 125000, total: 125000 }
];

const initialInvoices = [
  { id: 'INV-2026-06-01', tenant: 'Nguyễn Văn A', room: 'P.101', amount: '4.500.000', due: '05/06/2026', status: 'paid', items: mockInvoiceItems },
  { id: 'INV-2026-06-02', tenant: 'Trần Thị B', room: 'P.102', amount: '4.000.000', due: '05/06/2026', status: 'paid', items: mockInvoiceItems },
  { id: 'INV-2026-06-03', tenant: 'Lê Văn C', room: 'P.103', amount: '4.800.000', due: '05/06/2026', status: 'partial', items: mockInvoiceItems },
  { id: 'INV-2026-06-04', tenant: 'Phạm Thị D', room: 'P.201', amount: '4.500.000', due: '05/06/2026', status: 'unpaid', items: mockInvoiceItems },
  { id: 'INV-2026-06-05', tenant: 'Hoàng Văn E', room: 'P.202', amount: '5.200.000', due: '05/06/2026', status: 'unpaid', items: mockInvoiceItems },
];

const initialTickets = {
  reported: [
    { id: 'TKT-101', title: 'Hỏng điều hòa', room: 'P.301', priority: 'high-priority', date: '14/06/2026', assignee: null, comments: 0 },
    { id: 'TKT-102', title: 'Nước rỉ ở bồn rửa', room: 'P.105', priority: 'medium', date: '13/06/2026', assignee: null, comments: 2 },
    { id: 'TKT-103', title: 'Mạng Wifi yếu', room: 'P.204', priority: 'low', date: '14/06/2026', assignee: null, comments: 1 },
  ],
  inProgress: [
    { id: 'TKT-099', title: 'Sửa chập điện nhẹ', room: 'P.202', priority: 'high-priority', date: '12/06/2026', assignee: 'Kỹ thuật A', comments: 3 },
    { id: 'TKT-098', title: 'Cửa phòng tắm kẹt', room: 'P.108', priority: 'medium', date: '11/06/2026', assignee: 'Thợ Mộc B', comments: 1 },
  ],
  resolved: [
    { id: 'TKT-095', title: 'Thay bóng đèn hành lang', room: 'Tầng 2', priority: 'low', date: '10/06/2026', assignee: 'Kỹ thuật A', comments: 0, attached: true },
    { id: 'TKT-090', title: 'Bơm ga máy lạnh', room: 'P.405', priority: 'medium', date: '08/06/2026', assignee: 'Kỹ thuật Điện lạnh', comments: 4, attached: true },
  ]
};

export const AppDataProvider = ({ children }) => {
  const [rooms, setRooms] = useState(() => JSON.parse(localStorage.getItem('chdv_rooms')) || initialRooms);
  const [tenants, setTenants] = useState(() => JSON.parse(localStorage.getItem('chdv_tenants')) || initialTenants);
  const [contracts, setContracts] = useState(() => JSON.parse(localStorage.getItem('chdv_contracts')) || initialContracts);
  const [invoices, setInvoices] = useState(() => JSON.parse(localStorage.getItem('chdv_invoices')) || initialInvoices);
  const [tickets, setTickets] = useState(() => JSON.parse(localStorage.getItem('chdv_tickets')) || initialTickets);

  const defaultSettings = {
    electricityPrice: 3500,
    waterPrice: 100000,
    serviceFee: 150000,
    bankName: 'MB',
    bankAccount: '0901234567',
    bankOwner: 'NGUYEN VAN A',
    buildings: ['A', 'B', 'C'],
    floors: [1, 2, 3, 4]
  };
  
  const [settings, setSettings] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('chdv_settings'));
    return stored ? { ...defaultSettings, ...stored, buildings: stored.buildings || defaultSettings.buildings, floors: stored.floors || defaultSettings.floors } : defaultSettings;
  });

  useEffect(() => { localStorage.setItem('chdv_rooms', JSON.stringify(rooms)); }, [rooms]);
  useEffect(() => { localStorage.setItem('chdv_tenants', JSON.stringify(tenants)); }, [tenants]);
  useEffect(() => { localStorage.setItem('chdv_contracts', JSON.stringify(contracts)); }, [contracts]);
  useEffect(() => { localStorage.setItem('chdv_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('chdv_tickets', JSON.stringify(tickets)); }, [tickets]);
  useEffect(() => { localStorage.setItem('chdv_settings', JSON.stringify(settings)); }, [settings]);
  
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Hệ thống', message: 'Chào mừng bạn đến với hệ thống Quản lý CHDV', isRead: false, date: new Date().toLocaleDateString('vi-VN') }
  ]);

  // Add new tenant
  const addTenant = (tenant) => {
    setTenants(prev => [{ ...tenant, id: `TEN-${1000 + prev.length + 1}`, status: 'active' }, ...prev]);
  };

  const updateTenant = (id, updatedData) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
  };

  const deleteTenant = (id) => {
    setTenants(prev => prev.filter(t => t.id !== id));
  };

  // Add new contract
  const addContract = (contract) => {
    setContracts(prev => [{ ...contract, id: `CTR-2026-${100 + prev.length + 1}`, status: 'active' }, ...prev]);
  };

  // Add new invoice
  const addInvoice = (invoice) => {
    setInvoices(prev => [{ ...invoice, id: invoice.id || `INV-2026-06-0${prev.length + 1}`, status: invoice.status || 'unpaid' }, ...prev]);
  };

  // Add a new ticket from Tenant Portal
  const addTicket = (ticket) => {
    setTickets(prev => ({
      ...prev,
      reported: [{ ...ticket, id: `TKT-${Math.floor(Math.random() * 1000)}`, date: new Date().toLocaleDateString('vi-VN') }, ...prev.reported]
    }));
    
    setNotifications(prev => [{
      id: Date.now(),
      title: 'Yêu cầu bảo trì mới',
      message: `Phòng ${ticket.room} báo: ${ticket.title}`,
      isRead: false,
      date: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})
    }, ...prev]);
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // Move ticket (for Kanban)
  const moveTicket = (sourceCol, destCol, sourceIndex, destIndex) => {
    setTickets(prev => {
      const newCols = { ...prev };
      const [movedItem] = newCols[sourceCol].splice(sourceIndex, 1);
      newCols[destCol].splice(destIndex, 0, movedItem);
      return newCols;
    });
  };

  // Room Management
  const addRoom = (roomData) => {
    setRooms(prev => [...prev, { ...roomData, id: Date.now(), status: 'vacant', tenant: null }]);
  };

  const removeRoom = (roomId) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  const updateRoom = (id, updatedData) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
  };

  return (
    <AppDataContext.Provider value={{ 
      rooms, setRooms, addRoom, removeRoom, updateRoom,
      tenants, setTenants, addTenant, updateTenant, deleteTenant,
      contracts, setContracts, addContract,
      invoices, setInvoices, addInvoice,
      tickets, addTicket, moveTicket,
      notifications, markNotificationAsRead,
      settings, setSettings
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
