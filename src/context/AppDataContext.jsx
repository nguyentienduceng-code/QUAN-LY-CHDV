/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { generateMockData } from '../utils/mockData';
import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

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
  },
  announcements: [
    { id: 1, title: 'Lịch vệ sinh hành lang Tòa A', message: 'Sáng Thứ 7 tuần này (16/06) từ 8h - 11h. Mong quý khách hạn chế để đồ ra ngoài.', date: '14/06/2026' },
    { id: 2, title: 'Khuyến mãi Internet Gói Gia Đình', message: 'Đăng ký gói cước mới giảm 20% tháng đầu tiên. Vui lòng liên hệ BQL.', date: '10/06/2026' }
  ]
};

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

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Hệ thống', message: 'Chào mừng bạn đến với hệ thống Quản lý CHDV', isRead: false, date: new Date().toLocaleDateString('vi-VN') }
  ]);

  const [isCloudMode, setIsCloudMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync state to LocalStorage (only when in local offline mode)
  useEffect(() => { if (!isCloudMode) localStorage.setItem('rentflow_rooms', JSON.stringify(rooms)); }, [rooms, isCloudMode]);
  useEffect(() => { if (!isCloudMode) localStorage.setItem('rentflow_tenants', JSON.stringify(tenants)); }, [tenants, isCloudMode]);
  useEffect(() => { if (!isCloudMode) localStorage.setItem('rentflow_contracts', JSON.stringify(contracts)); }, [contracts, isCloudMode]);
  useEffect(() => { if (!isCloudMode) localStorage.setItem('rentflow_invoices', JSON.stringify(invoices)); }, [invoices, isCloudMode]);
  useEffect(() => { if (!isCloudMode) localStorage.setItem('rentflow_tickets', JSON.stringify(tickets)); }, [tickets, isCloudMode]);
  useEffect(() => { if (!isCloudMode) localStorage.setItem('rentflow_settings', JSON.stringify(settings)); }, [settings, isCloudMode]);
  useEffect(() => { if (!isCloudMode) localStorage.setItem('rentflow_users', JSON.stringify(users)); }, [users, isCloudMode]);

  // Firestore Sync & Auto Migration
  useEffect(() => {
    let unsubscribes = [];
    
    const migrateLocalStorageToFirestore = async () => {
      try {
        console.log("Di cư dữ liệu: Khởi chạy...");
        await setDoc(doc(db, 'settings', 'global'), settings);
        
        for (const r of rooms) {
          await setDoc(doc(db, 'rooms', String(r.id)), r);
        }
        for (const t of tenants) {
          await setDoc(doc(db, 'tenants', String(t.id)), t);
        }
        for (const c of contracts) {
          await setDoc(doc(db, 'contracts', String(c.id)), c);
        }
        for (const inv of invoices) {
          await setDoc(doc(db, 'invoices', String(inv.id)), inv);
        }
        
        const allTickets = [
          ...tickets.reported.map(t => ({ ...t, status: 'reported' })),
          ...tickets.inProgress.map(t => ({ ...t, status: 'inProgress' })),
          ...tickets.resolved.map(t => ({ ...t, status: 'resolved' }))
        ];
        for (const t of allTickets) {
          await setDoc(doc(db, 'tickets', String(t.id)), t);
        }
        
        for (const u of users) {
          await setDoc(doc(db, 'users', String(u.id)), u);
        }
        console.log("Di cư dữ liệu lên Firestore hoàn tất!");
      } catch (e) {
        console.error("Lỗi khi di cư dữ liệu lên Firestore:", e);
      }
    };

    const setupFirestoreListeners = () => {
      const unsubs = [];
      
      unsubs.push(onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
        if (docSnap.exists()) setSettings(docSnap.data());
      }));
      
      unsubs.push(onSnapshot(collection(db, 'rooms'), (querySnap) => {
        const list = [];
        querySnap.forEach(d => list.push(d.data()));
        setRooms(list);
      }));
      
      unsubs.push(onSnapshot(collection(db, 'tenants'), (querySnap) => {
        const list = [];
        querySnap.forEach(d => list.push(d.data()));
        setTenants(list);
      }));
      
      unsubs.push(onSnapshot(collection(db, 'contracts'), (querySnap) => {
        const list = [];
        querySnap.forEach(d => list.push(d.data()));
        setContracts(list);
      }));
      
      unsubs.push(onSnapshot(collection(db, 'invoices'), (querySnap) => {
        const list = [];
        querySnap.forEach(d => list.push(d.data()));
        setInvoices(list);
      }));
      
      unsubs.push(onSnapshot(collection(db, 'tickets'), (querySnap) => {
        const data = { reported: [], inProgress: [], resolved: [] };
        querySnap.forEach(d => {
          const item = d.data();
          const status = item.status || 'reported';
          if (data[status]) data[status].push(item);
          else data.reported.push(item);
        });
        setTickets(data);
      }));
      
      unsubs.push(onSnapshot(collection(db, 'users'), (querySnap) => {
        const list = [];
        querySnap.forEach(d => list.push(d.data()));
        setUsers(list);
      }));

      return unsubs;
    };

    const initApp = async () => {
      try {
        const testDocRef = doc(db, 'settings', 'global');
        const testDoc = await getDoc(testDocRef);
        
        setIsCloudMode(true);
        console.log("Connected to Firebase Firestore Cloud Database successfully.");
        
        if (!testDoc.exists()) {
          console.log("Firestore settings not found. Performing auto-migration from localStorage...");
          await migrateLocalStorageToFirestore();
        }
        
        // Initial Fetch
        const [
          settingsSnap,
          roomsSnap,
          tenantsSnap,
          contractsSnap,
          invoicesSnap,
          ticketsSnap,
          usersSnap
        ] = await Promise.all([
          getDoc(doc(db, 'settings', 'global')),
          getDocs(collection(db, 'rooms')),
          getDocs(collection(db, 'tenants')),
          getDocs(collection(db, 'contracts')),
          getDocs(collection(db, 'invoices')),
          getDocs(collection(db, 'tickets')),
          getDocs(collection(db, 'users'))
        ]);
        
        if (settingsSnap.exists()) setSettings(settingsSnap.data());
        
        const rList = [];
        roomsSnap.forEach(d => rList.push(d.data()));
        setRooms(rList);
        
        const tList = [];
        tenantsSnap.forEach(d => tList.push(d.data()));
        setTenants(tList);
        
        const cList = [];
        contractsSnap.forEach(d => cList.push(d.data()));
        setContracts(cList);
        
        const iList = [];
        invoicesSnap.forEach(d => iList.push(d.data()));
        setInvoices(iList);
        
        const ticketsData = { reported: [], inProgress: [], resolved: [] };
        ticketsSnap.forEach(d => {
          const item = d.data();
          const status = item.status || 'reported';
          if (ticketsData[status]) ticketsData[status].push(item);
          else ticketsData.reported.push(item);
        });
        setTickets(ticketsData);
        
        const uList = [];
        usersSnap.forEach(d => uList.push(d.data()));
        setUsers(uList);
        
        setLoading(false);
        toast.success("Đồng bộ dữ liệu Cloud (Firebase) thành công!", { duration: 3000 });
        
        // Now register real-time listeners
        unsubscribes = setupFirestoreListeners();
      } catch (err) {
        console.warn("Could not connect to Firestore Cloud Database. Falling back to LocalStorage mode.", err);
        setIsCloudMode(false);
        setLoading(false);
        // Silently load local content. No need to show annoying toast if user works locally.
      }
    };
    
    initApp();
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  // ─── CRUDS Actions ──────────────────────────────────────────

  // Add new tenant
  const addTenant = async (tenant) => {
    const newTenant = { ...tenant, id: tenant.id || `TEN-${1000 + tenants.length + 1}`, status: 'active' };
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'tenants', String(newTenant.id)), newTenant);
      } catch (err) {
        console.error("Lỗi khi thêm khách thuê lên Cloud:", err);
      }
    } else {
      setTenants(prev => [newTenant, ...prev]);
    }
  };

  const updateTenant = async (id, updatedData) => {
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'tenants', String(id)), updatedData, { merge: true });
      } catch (err) {
        console.error("Lỗi khi cập nhật khách thuê trên Cloud:", err);
      }
    } else {
      setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    }
  };

  const deleteTenant = async (id) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'tenants', String(id)));
      } catch (err) {
        console.error("Lỗi khi xóa khách thuê trên Cloud:", err);
      }
    } else {
      setTenants(prev => prev.filter(t => t.id !== id));
    }
  };

  // Add new contract
  const addContract = async (contract) => {
    const newContract = { ...contract, id: contract.id || `CTR-2026-${100 + contracts.length + 1}`, status: 'active' };
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'contracts', String(newContract.id)), newContract);
      } catch (err) {
        console.error("Lỗi khi thêm hợp đồng lên Cloud:", err);
      }
    } else {
      setContracts(prev => [newContract, ...prev]);
    }
  };

  // Add new invoice
  const addInvoice = async (invoice) => {
    const newInvoice = { ...invoice, id: invoice.id || `INV-2026-06-0${invoices.length + 1}`, status: invoice.status || 'unpaid' };
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'invoices', String(newInvoice.id)), newInvoice);
      } catch (err) {
        console.error("Lỗi khi thêm hóa đơn lên Cloud:", err);
      }
    } else {
      setInvoices(prev => [newInvoice, ...prev]);
    }
  };

  const updateInvoice = async (id, updatedData) => {
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'invoices', String(id)), updatedData, { merge: true });
      } catch (err) {
        console.error("Lỗi khi cập nhật hóa đơn trên Cloud:", err);
      }
    } else {
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updatedData } : inv));
    }
  };

  // Add a new ticket from Tenant Portal
  const addTicket = async (ticket) => {
    const newTicket = { 
      ...ticket, 
      id: ticket.id || `TKT-${Math.floor(Math.random() * 1000)}`, 
      date: ticket.date || new Date().toLocaleDateString('vi-VN'),
      status: 'reported'
    };
    
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'tickets', String(newTicket.id)), newTicket);
        
        const newNotif = {
          id: Date.now(),
          title: 'Yêu cầu bảo trì mới',
          message: `Phòng ${ticket.room} báo: ${ticket.title}`,
          isRead: false,
          date: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})
        };
        setNotifications(prev => [newNotif, ...prev]);
      } catch (err) {
        console.error("Lỗi khi thêm ticket lên Cloud:", err);
      }
    } else {
      setTickets(prev => ({
        ...prev,
        reported: [newTicket, ...prev.reported]
      }));
      setNotifications(prev => [{
        id: Date.now(),
        title: 'Yêu cầu bảo trì mới',
        message: `Phòng ${ticket.room} báo: ${ticket.title}`,
        isRead: false,
        date: new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})
      }, ...prev]);
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const updateTicket = async (id, updatedData) => {
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'tickets', String(id)), updatedData, { merge: true });
      } catch (err) {
        console.error("Lỗi khi cập nhật ticket trên Cloud:", err);
      }
    } else {
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
    }
  };

  const moveTicket = async (sourceCol, destCol, sourceIndex, destIndex) => {
    if (isCloudMode) {
      try {
        const ticketToMove = tickets[sourceCol][sourceIndex];
        if (ticketToMove) {
          await setDoc(doc(db, 'tickets', String(ticketToMove.id)), { status: destCol }, { merge: true });
        }
      } catch (err) {
        console.error("Lỗi khi di chuyển ticket trên Cloud:", err);
      }
    } else {
      setTickets(prev => {
        const sourceList = [...prev[sourceCol]];
        const destList = sourceCol === destCol ? sourceList : [...prev[destCol]];
        const [movedItem] = sourceList.splice(sourceIndex, 1);
        if (!movedItem) return prev;
        destList.splice(destIndex, 0, movedItem);
        return {
          ...prev,
          [sourceCol]: sourceList,
          [destCol]: destList,
        };
      });
    }
  };

  // Room Management
  const addRoom = async (roomData) => {
    const newRoom = { ...roomData, id: Date.now(), status: 'vacant', tenant: null };
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'rooms', String(newRoom.id)), newRoom);
      } catch (err) {
        console.error("Lỗi khi thêm phòng lên Cloud:", err);
      }
    } else {
      setRooms(prev => [...prev, newRoom]);
    }
  };

  const removeRoom = async (roomId) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'rooms', String(roomId)));
      } catch (err) {
        console.error("Lỗi khi xóa phòng trên Cloud:", err);
      }
    } else {
      setRooms(prev => prev.filter(r => r.id !== roomId));
    }
  };

  const updateRoom = async (id, updatedData) => {
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'rooms', String(id)), updatedData, { merge: true });
      } catch (err) {
        console.error("Lỗi khi cập nhật phòng trên Cloud:", err);
      }
    } else {
      setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updatedData } : r));
    }
  };

  // Building Management
  const renameBuilding = async (oldName, newName) => {
    if (!newName || newName === oldName || settings.buildings.includes(newName)) return false;
    
    if (isCloudMode) {
      try {
        const newBuildings = settings.buildings.map(b => b === oldName ? newName : b);
        const newPrices = { ...settings.prices };
        if (newPrices[oldName]) {
          newPrices[newName] = newPrices[oldName];
          delete newPrices[oldName];
        }
        await setDoc(doc(db, 'settings', 'global'), { buildings: newBuildings, prices: newPrices }, { merge: true });
        
        for (const r of rooms) {
          if (r.building === oldName) {
            await setDoc(doc(db, 'rooms', String(r.id)), { building: newName }, { merge: true });
          }
        }
        
        for (const t of tenants) {
          if (t.building === oldName) {
            await setDoc(doc(db, 'tenants', String(t.id)), { building: newName }, { merge: true });
          }
        }
        
        return true;
      } catch (err) {
        console.error("Lỗi đổi tên nhà trên Cloud:", err);
        return false;
      }
    } else {
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
      
      setContracts(prev => prev.map(c => {
        if (c.room && typeof c.room === 'string' && c.room.includes(`Nhà ${oldName} -`)) {
          return { ...c, room: c.room.replace(`Nhà ${oldName} -`, `Nhà ${newName} -`) };
        } else if (c.room && typeof c.room === 'string' && c.room.includes(`${oldName} -`)) {
          return { ...c, room: c.room.replace(`${oldName} -`, `${newName} -`) };
        }
        return c;
      }));
      
      return true;
    }
  };

  const addNewBuilding = async (name) => {
    if (!name || settings.buildings.includes(name)) return false;
    if (isCloudMode) {
      try {
        const newBuildings = [...settings.buildings, name];
        const templatePrices = settings.prices[settings.buildings[0]] || defaultSettings.prices['A'];
        const newPrices = { ...settings.prices, [name]: { ...templatePrices } };
        await setDoc(doc(db, 'settings', 'global'), { buildings: newBuildings, prices: newPrices }, { merge: true });
        return true;
      } catch (err) {
        console.error("Lỗi thêm nhà mới trên Cloud:", err);
        return false;
      }
    } else {
      setSettings(prev => {
        const newBuildings = [...prev.buildings, name];
        const templatePrices = prev.prices[prev.buildings[0]] || defaultSettings.prices['A'];
        const newPrices = { ...prev.prices, [name]: { ...templatePrices } };
        return { ...prev, buildings: newBuildings, prices: newPrices };
      });
      return true;
    }
  };

  // Mock Data
  const loadMockData = async () => {
    const firstBuilding = settings.buildings[0] || 'A';
    const data = generateMockData(firstBuilding);
    if (isCloudMode) {
      try {
        for (const r of data.rooms) {
          await setDoc(doc(db, 'rooms', String(r.id)), r);
        }
        for (const t of data.tenants) {
          await setDoc(doc(db, 'tenants', String(t.id)), t);
        }
        for (const c of data.contracts) {
          await setDoc(doc(db, 'contracts', String(c.id)), c);
        }
        for (const inv of data.invoices) {
          await setDoc(doc(db, 'invoices', String(inv.id)), inv);
        }
        const allTickets = [
          ...data.tickets.reported.map(t => ({ ...t, status: 'reported' })),
          ...data.tickets.inProgress.map(t => ({ ...t, status: 'inProgress' })),
          ...data.tickets.resolved.map(t => ({ ...t, status: 'resolved' }))
        ];
        for (const t of allTickets) {
          await setDoc(doc(db, 'tickets', String(t.id)), t);
        }
        return true;
      } catch (err) {
        console.error("Lỗi nạp dữ liệu mẫu lên Cloud:", err);
        return false;
      }
    } else {
      setRooms(data.rooms);
      setTenants(data.tenants);
      setContracts(data.contracts);
      setInvoices(data.invoices);
      setTickets(data.tickets);
      return true;
    }
  };

  const clearAllData = async () => {
    if (isCloudMode) {
      try {
        const collectionsToDelete = ['rooms', 'tenants', 'contracts', 'invoices', 'tickets', 'users'];
        for (const colName of collectionsToDelete) {
          const snap = await getDocs(collection(db, colName));
          for (const docSnap of snap.docs) {
            await deleteDoc(doc(db, colName, docSnap.id));
          }
        }
        return true;
      } catch (err) {
        console.error("Lỗi xóa dữ liệu trên Cloud:", err);
        return false;
      }
    } else {
      setRooms([]);
      setTenants([]);
      setContracts([]);
      setInvoices([]);
      setTickets({ reported: [], inProgress: [], resolved: [] });
      return true;
    }
  };

  const handleUpdateSettings = async (newSettings) => {
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'settings', 'global'), newSettings);
      } catch (err) {
        console.error("Lỗi khi lưu cài đặt trên Cloud:", err);
      }
    } else {
      setSettings(newSettings);
    }
  };

  const addUser = async (userData) => {
    const newUser = { ...userData, id: `usr-${Date.now()}` };
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'users', String(newUser.id)), newUser);
      } catch (err) {
        console.error("Lỗi khi thêm user lên Cloud:", err);
      }
    } else {
      setUsers(prev => [...prev, newUser]);
    }
  };

  const updateUser = async (id, updatedData) => {
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'users', String(id)), updatedData, { merge: true });
      } catch (err) {
        console.error("Lỗi khi cập nhật user trên Cloud:", err);
      }
    } else {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedData } : u));
    }
  };

  const deleteUser = async (id) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'users', String(id)));
      } catch (err) {
        console.error("Lỗi khi xóa user trên Cloud:", err);
      }
    } else {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const importExcelData = async (parsedData) => {
    if (parsedData.rooms && parsedData.rooms.length > 0) {
      if (isCloudMode) {
        try {
          for (const r of parsedData.rooms) {
            const docId = r.id || `R${Date.now()}-${Math.random()}`;
            await setDoc(doc(db, 'rooms', String(docId)), { ...r, id: docId }, { merge: true });
          }
        } catch (err) {
          console.error("Lỗi import phòng lên Cloud:", err);
        }
      } else {
        setRooms(prev => {
          const newRooms = [...prev];
          parsedData.rooms.forEach(r => {
            const index = newRooms.findIndex(existing => existing.id === r.id || existing.name === r.name);
            if (index >= 0) newRooms[index] = { ...newRooms[index], ...r };
            else newRooms.push({ ...r, id: r.id || `R${Date.now()}-${Math.random()}` });
          });
          return newRooms;
        });
      }
    }

    if (parsedData.tenants && parsedData.tenants.length > 0) {
      if (isCloudMode) {
        try {
          for (const t of parsedData.tenants) {
            const docId = t.id || `KH${Date.now()}-${Math.random()}`;
            await setDoc(doc(db, 'tenants', String(docId)), { ...t, id: docId }, { merge: true });
          }
        } catch (err) {
          console.error("Lỗi import khách thuê lên Cloud:", err);
        }
      } else {
        setTenants(prev => {
          const newTenants = [...prev];
          parsedData.tenants.forEach(t => {
            const index = newTenants.findIndex(existing => existing.id === t.id || (existing.name === t.name && existing.room === t.room));
            if (index >= 0) newTenants[index] = { ...newTenants[index], ...t };
            else newTenants.push({ ...t, id: t.id || `KH-${Date.now()}-${Math.random()}` });
          });
          return newTenants;
        });
      }
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
      settings, setSettings: handleUpdateSettings, renameBuilding, addNewBuilding,
      loadMockData, clearAllData, importExcelData,
      isCloudMode, loading
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
