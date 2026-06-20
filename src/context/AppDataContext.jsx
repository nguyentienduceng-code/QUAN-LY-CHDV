/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { generateMockData } from '../utils/mockData';

const AppDataContext = createContext(null);

const initialRooms = [
  { id: 101, name: '101', building: 'A', floor: 1, type: 'Studio', price: 4000000, status: 'occupied', area: 25 }
];
const initialTenants = [
  { id: 'TEN-101', name: 'Nguyễn Văn Khách', email: 'khach1@gmail.com', phone: '0901234567', idCard: '079123456789', room: '101', building: 'A', status: 'active', note: 'Tài khoản dùng thử tính năng Khách thuê' }
];
const initialContracts = [
  { id: 'CTR-2026-101', tenant: 'Nguyễn Văn Khách', room: '101', startDate: '01/01/2026', endDate: '31/12/2026', deposit: '4.000.000', status: 'active' }
];
const initialInvoices = [
  {
    id: 'INV-06-2026-101',
    tenant: 'Nguyễn Văn Khách',
    room: '101',
    amount: '4.500.000',
    due: '05/07/2026',
    status: 'unpaid',
    items: [
      { id: 1, name: 'Tiền phòng', qty: 1, price: 4000000, total: 4000000 },
      { id: 2, name: 'Tiền điện', qty: 100, price: 3500, total: 350000 },
      { id: 3, name: 'Phí dịch vụ', qty: 1, price: 150000, total: 150000 }
    ]
  }
];

const initialTickets = {
  reported: [
    { id: 'TKT-001', room: '101', title: 'Hỏng vòi nước', desc: 'Vòi nước ở bồn rửa mặt bị rỉ nước liên tục', priority: 'high', date: '20/06/2026' }
  ],
  inProgress: [],
  resolved: []
};

const initialUsers = [
  { id: 'usr-admin', email: 'admin@gmail.com', name: 'Quản trị viên', role: 'admin', room: null },
  { id: 'usr-staff1', email: 'staff@gmail.com', name: 'Nhân viên 1', role: 'staff', room: null },
  { id: 'usr-viewer1', email: 'investor@gmail.com', name: 'Nhà đầu tư', role: 'viewer', room: null },
  { id: 'usr-khach1', email: 'khach1@gmail.com', name: 'Nguyễn Văn Khách', role: 'tenant', room: '101' },
];

export const AppDataProvider = ({ children }) => {
  const [rooms, setRooms] = useState(() => JSON.parse(localStorage.getItem('rentflow_rooms')) || initialRooms);
  const [tenants, setTenants] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('rentflow_tenants'));
    if (stored && stored.length > 0) return stored;
    return initialTenants;
  });
  const [contracts, setContracts] = useState(() => JSON.parse(localStorage.getItem('rentflow_contracts')) || initialContracts);
  const [invoices, setInvoices] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('rentflow_invoices'));
    if (stored && stored.length > 0) return stored;
    return initialInvoices;
  });
  const [tickets, setTickets] = useState(() => JSON.parse(localStorage.getItem('rentflow_tickets')) || initialTickets);
  const [users, setUsers] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('rentflow_users'));
    if (stored && stored.length > 0) return stored;
    return initialUsers;
  });

  useEffect(() => {
    // Ensure khach1@gmail.com tenant and invoices are present in loaded state
    if (!tenants.some(t => t.email === 'khach1@gmail.com')) {
      const testTenant = { id: 'TEN-101', name: 'Nguyễn Văn Khách', email: 'khach1@gmail.com', phone: '0901234567', idCard: '079123456789', room: '101', building: 'A', status: 'active', note: 'Tài khoản dùng thử tính năng Khách thuê' };
      setTenants(prev => [testTenant, ...prev]);
      
      setRooms(rPrev => {
        if (!rPrev.some(r => r.name === '101')) {
          return [{ id: 101, name: '101', building: 'A', floor: 1, type: 'Studio', price: 4000000, status: 'occupied', area: 25 }, ...rPrev];
        }
        return rPrev.map(r => r.name === '101' ? { ...r, status: 'occupied' } : r);
      });

      setInvoices(iPrev => {
        if (!iPrev.some(i => i.room === '101')) {
          return [{
            id: 'INV-06-2026-101',
            tenant: 'Nguyễn Văn Khách',
            room: '101',
            amount: '4.500.000',
            due: '05/07/2026',
            status: 'unpaid',
            items: [
              { id: 1, name: 'Tiền phòng', qty: 1, price: 4000000, total: 4000000 },
              { id: 2, name: 'Tiền điện', qty: 100, price: 3500, total: 350000 },
              { id: 3, name: 'Phí dịch vụ', qty: 1, price: 150000, total: 150000 }
            ]
          }, ...iPrev];
        }
        return iPrev;
      });

      setUsers(uPrev => {
        if (!uPrev.some(u => u.email === 'khach1@gmail.com')) {
          return [...uPrev, { id: 'usr-khach1', email: 'khach1@gmail.com', name: 'Nguyễn Văn Khách', role: 'tenant', room: '101' }];
        }
        return uPrev;
      });
    }
  }, [tenants]);

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
  useEffect(() => { localStorage.setItem('rentflow_users', JSON.stringify(users)); }, [users]);
  
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
      // Clone each array to avoid mutating original state
      const sourceList = [...prev[sourceCol]];
      const destList = sourceCol === destCol ? sourceList : [...prev[destCol]];
      const [movedItem] = sourceList.splice(sourceIndex, 1);
      if (!movedItem) return prev; // safety guard
      destList.splice(destIndex, 0, movedItem);
      return {
        ...prev,
        [sourceCol]: sourceList,
        [destCol]: destList,
      };
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
    
    // Update contracts that contain the old building name in their room string
    setContracts(prev => prev.map(c => {
      if (c.room && typeof c.room === 'string' && c.room.includes(`Nhà ${oldName} -`)) {
        return { ...c, room: c.room.replace(`Nhà ${oldName} -`, `Nhà ${newName} -`) };
      } else if (c.room && typeof c.room === 'string' && c.room.includes(`${oldName} -`)) {
        return { ...c, room: c.room.replace(`${oldName} -`, `${newName} -`) };
      }
      return c;
    }));
    
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

  const addUser = (userData) => {
    setUsers(prev => [...prev, { ...userData, id: `usr-${Date.now()}` }]);
  };

  const updateUser = (id, updatedData) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedData } : u));
  };

  const deleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const importExcelData = (parsedData) => {
    // Merge Rooms
    if (parsedData.rooms && parsedData.rooms.length > 0) {
      setRooms(prev => {
        const newRooms = [...prev];
        parsedData.rooms.forEach(r => {
          const index = newRooms.findIndex(existing => existing.id === r.id || existing.name === r.name);
          if (index >= 0) {
            newRooms[index] = { ...newRooms[index], ...r };
          } else {
            newRooms.push({ ...r, id: r.id || `R${Date.now()}-${Math.random()}` });
          }
        });
        return newRooms;
      });

      // Update buildings list if new buildings are found
      setSettings(prev => {
        const newBuildings = [...new Set(parsedData.rooms.map(r => r.building))];
        const updatedBuildings = [...prev.buildings];
        let changed = false;
        newBuildings.forEach(b => {
          if (b && !updatedBuildings.includes(b)) {
            updatedBuildings.push(b);
            changed = true;
          }
        });
        
        if (changed) {
          const templatePrices = prev.prices[prev.buildings[0]] || defaultSettings.prices['A'];
          const newPrices = { ...prev.prices };
          newBuildings.forEach(b => {
            if (!newPrices[b]) newPrices[b] = { ...templatePrices };
          });
          return { ...prev, buildings: updatedBuildings, prices: newPrices };
        }
        return prev;
      });
    }

    // Merge Tenants
    if (parsedData.tenants && parsedData.tenants.length > 0) {
      setTenants(prev => {
        const newTenants = [...prev];
        parsedData.tenants.forEach(t => {
          const index = newTenants.findIndex(existing => existing.id === t.id || (existing.name === t.name && existing.room === t.room));
          if (index >= 0) {
            newTenants[index] = { ...newTenants[index], ...t };
          } else {
            newTenants.push({ ...t, id: t.id || `KH-${Date.now()}-${Math.random()}` });
          }
        });
        return newTenants;
      });
    }

    return true;
  };

  return (
    <AppDataContext.Provider value={{ 
      rooms, setRooms, addRoom, removeRoom, updateRoom,
      tenants, setTenants, addTenant, updateTenant, deleteTenant,
      contracts, setContracts, addContract,
      invoices, setInvoices, addInvoice, updateInvoice,
      tickets, addTicket, updateTicket, moveTicket,
      users, setUsers, addUser, updateUser, deleteUser,
      notifications, markNotificationAsRead,
      settings, setSettings, renameBuilding, addNewBuilding,
      loadMockData, clearAllData, importExcelData
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
