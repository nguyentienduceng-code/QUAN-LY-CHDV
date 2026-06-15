/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { generateMockData } from '../utils/mockData';

const AppDataContext = createContext(null);

const initialRooms = [];
const initialTenants = [];
const initialContracts = [];
const initialInvoices = [];

const initialTickets = {
  reported: [],
  inProgress: [],
  resolved: []
};

export const AppDataProvider = ({ children }) => {
  const [rooms, setRooms] = useState(() => JSON.parse(localStorage.getItem('rentflow_rooms')) || initialRooms);
  const [tenants, setTenants] = useState(() => JSON.parse(localStorage.getItem('rentflow_tenants')) || initialTenants);
  const [contracts, setContracts] = useState(() => JSON.parse(localStorage.getItem('rentflow_contracts')) || initialContracts);
  const [invoices, setInvoices] = useState(() => JSON.parse(localStorage.getItem('rentflow_invoices')) || initialInvoices);
  const [tickets, setTickets] = useState(() => JSON.parse(localStorage.getItem('rentflow_tickets')) || initialTickets);

  const defaultSettings = {
    electricityPrice: 3500,
    waterPrice: 100000,
    serviceFee: 150000,
    buildings: ['A', 'B', 'C'],
    floors: [1, 2, 3, 4],
    prices: {
      A: { electricityPrice: 3500, waterPrice: 100000, serviceFee: 150000, baseRent: 30000000, baseElectricityPrice: 2500, baseWaterPrice: 50000, bankName: 'MB', bankAccount: '0901234567', bankOwner: 'NGUYEN VAN A' },
      B: { electricityPrice: 3500, waterPrice: 100000, serviceFee: 150000, baseRent: 30000000, baseElectricityPrice: 2500, baseWaterPrice: 50000, bankName: 'VCB', bankAccount: '0987654321', bankOwner: 'NGUYEN VAN B' },
      C: { electricityPrice: 3500, waterPrice: 100000, serviceFee: 150000, baseRent: 30000000, baseElectricityPrice: 2500, baseWaterPrice: 50000, bankName: 'ACB', bankAccount: '0123456789', bankOwner: 'NGUYEN VAN C' }
    }
  };
  
  const [settings, setSettings] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('rentflow_settings'));
    if (stored && !stored.prices) {
      stored.prices = {};
      (stored.buildings || defaultSettings.buildings).forEach(b => {
        stored.prices[b] = {
          electricityPrice: stored.electricityPrice || 3500,
          waterPrice: stored.waterPrice || 100000,
          serviceFee: stored.serviceFee || 150000,
          baseRent: 30000000,
          baseElectricityPrice: 2500,
          baseWaterPrice: 50000,
          bankName: stored.bankName || 'MB',
          bankAccount: stored.bankAccount || '0901234567',
          bankOwner: stored.bankOwner || 'NGUYEN VAN A'
        };
      });
    } else if (stored && stored.prices) {
      // Ensure existing properties have base costs and payment info
      Object.keys(stored.prices).forEach(b => {
        const p = stored.prices[b];
        if (p.baseRent === undefined) p.baseRent = 30000000;
        if (p.baseElectricityPrice === undefined) p.baseElectricityPrice = 2500;
        if (p.baseWaterPrice === undefined) p.baseWaterPrice = 50000;
        if (!p.bankName) p.bankName = stored.bankName || 'MB';
        if (!p.bankAccount) p.bankAccount = stored.bankAccount || '0901234567';
        if (!p.bankOwner) p.bankOwner = stored.bankOwner || 'NGUYEN VAN A';
      });
    }
    return stored ? { ...defaultSettings, ...stored, buildings: stored.buildings || defaultSettings.buildings, floors: stored.floors || defaultSettings.floors, prices: stored.prices || defaultSettings.prices } : defaultSettings;
  });

  useEffect(() => { localStorage.setItem('rentflow_rooms', JSON.stringify(rooms)); }, [rooms]);
  useEffect(() => { localStorage.setItem('rentflow_tenants', JSON.stringify(tenants)); }, [tenants]);
  useEffect(() => { localStorage.setItem('rentflow_contracts', JSON.stringify(contracts)); }, [contracts]);
  useEffect(() => { localStorage.setItem('rentflow_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('rentflow_tickets', JSON.stringify(tickets)); }, [tickets]);
  useEffect(() => { localStorage.setItem('rentflow_settings', JSON.stringify(settings)); }, [settings]);
  
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

  const updateInvoice = (id, updatedData) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updatedData } : inv));
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

  const updateTicket = (id, updatedData) => {
    setTickets(prev => {
      const newState = { reported: [...prev.reported], inProgress: [...prev.inProgress], resolved: [...prev.resolved] };
      for (const col of ['reported', 'inProgress', 'resolved']) {
        const index = newState[col].findIndex(t => t.id === id);
        if (index !== -1) {
          newState[col][index] = { ...newState[col][index], ...updatedData };
          break;
        }
      }
      return newState;
    });
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

  // Building Management
  const renameBuilding = (oldName, newName) => {
    if (!newName || newName === oldName || settings.buildings.includes(newName)) return false;
    
    setSettings(prev => {
      const newBuildings = prev.buildings.map(b => b === oldName ? newName : b);
      const newPrices = { ...prev.prices };
      if (newPrices[oldName]) {
        newPrices[newName] = newPrices[oldName];
        delete newPrices[oldName];
      }
      return { ...prev, buildings: newBuildings, prices: newPrices };
    });

    setRooms(prev => prev.map(r => r.building === oldName ? { ...r, building: newName } : r));
    setTenants(prev => prev.map(t => t.building === oldName ? { ...t, building: newName } : t));
    return true;
  };

  const addNewBuilding = (name) => {
    if (!name || settings.buildings.includes(name)) return false;
    setSettings(prev => {
      const newBuildings = [...prev.buildings, name];
      const templatePrices = prev.prices[prev.buildings[0]] || defaultSettings.prices['A'];
      const newPrices = { ...prev.prices, [name]: { ...templatePrices } };
      return { ...prev, buildings: newBuildings, prices: newPrices };
    });
    return true;
  };

  // Mock Data
  const loadMockData = () => {
    const firstBuilding = settings.buildings[0];
    const data = generateMockData(firstBuilding);
    setRooms(data.rooms);
    setTenants(data.tenants);
    setContracts(data.contracts);
    setInvoices(data.invoices);
    setTickets(data.tickets);
    return true;
  };

  const clearAllData = () => {
    setRooms([]);
    setTenants([]);
    setContracts([]);
    setInvoices([]);
    setTickets({ reported: [], inProgress: [], resolved: [] });
    return true;
  };

  return (
    <AppDataContext.Provider value={{ 
      rooms, setRooms, addRoom, removeRoom, updateRoom,
      tenants, setTenants, addTenant, updateTenant, deleteTenant,
      contracts, setContracts, addContract,
      invoices, setInvoices, addInvoice, updateInvoice,
      tickets, addTicket, updateTicket, moveTicket,
      notifications, markNotificationAsRead,
      settings, setSettings, renameBuilding, addNewBuilding,
      loadMockData, clearAllData
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
