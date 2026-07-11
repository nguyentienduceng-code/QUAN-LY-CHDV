/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { generateMockData } from '../utils/mockData';
import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, query, where 
} from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { SUPER_ADMIN_EMAIL } from '../config/constants';
import { useRoomManager } from '../hooks/useRoomManager';
import { useTenantManager } from '../hooks/useTenantManager';
import { useContractManager } from '../hooks/useContractManager';
import { useInvoiceManager } from '../hooks/useInvoiceManager';
import { useTicketManager } from '../hooks/useTicketManager';
import { useSettingsManager } from '../hooks/useSettingsManager';
import { useUserManager } from '../hooks/useUserManager';

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
  const { user } = useAuth();
  const ownerId = user?.ownerId;
  
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
    if (!user || !user.ownerId) {
      setLoading(false);
      return;
    }
    const ownerId = user.ownerId;
    let unsubscribes = [];
    
    const setupInitialCloudData = async () => {
      try {
        console.log("Khởi tạo dữ liệu mẫu cho tài khoản mới...");
        await setDoc(doc(db, 'settings', ownerId), defaultSettings);
        
        for (const r of initialRooms) {
          await setDoc(doc(db, 'rooms', String(r.id)), { ...r, ownerId });
        }
        for (const t of initialTenants) {
          await setDoc(doc(db, 'tenants', String(t.id)), { ...t, ownerId });
        }
        for (const c of initialContracts) {
          await setDoc(doc(db, 'contracts', String(c.id)), { ...c, ownerId });
        }
        for (const inv of initialInvoices) {
          await setDoc(doc(db, 'invoices', String(inv.id)), { ...inv, ownerId });
        }
        
        const allTickets = [
          ...initialTickets.reported.map(t => ({ ...t, status: 'reported', ownerId })),
          ...initialTickets.inProgress.map(t => ({ ...t, status: 'inProgress', ownerId })),
          ...initialTickets.resolved.map(t => ({ ...t, status: 'resolved', ownerId }))
        ];
        for (const t of allTickets) {
          await setDoc(doc(db, 'tickets', String(t.id)), t);
        }
        
        for (const u of initialUsers) {
          const newUserId = u.email || String(u.id);
          await setDoc(doc(db, 'users', newUserId), { ...u, id: newUserId, ownerId });
        }
        console.log("Khởi tạo dữ liệu mẫu hoàn tất!");
      } catch (e) {
        console.error("Lỗi khi khởi tạo dữ liệu mẫu:", e);
      }
    };

    const setupFirestoreListeners = () => {
      const unsubs = [];
      
      const isTenant = user?.role === 'tenant';
      const tenantEmail = user?.email;
      const tenantRoom = user?.room;

      unsubs.push(onSnapshot(doc(db, 'settings', ownerId), (docSnap) => {
        if (docSnap.exists()) setSettings(docSnap.data());
      }));
      
      // Rooms
      const roomsQuery = isTenant
        ? (tenantRoom ? query(collection(db, 'rooms'), where('ownerId', '==', ownerId), where('name', '==', tenantRoom)) : query(collection(db, 'rooms'), where('name', '==', 'INVALID_EMPTY')))
        : query(collection(db, 'rooms'), where('ownerId', '==', ownerId));
      unsubs.push(onSnapshot(roomsQuery, (querySnap) => {
        const list = [];
        querySnap.forEach(d => list.push(d.data()));
        setRooms(list);
      }));
      
      // Tenants
      const tenantsQuery = isTenant
        ? (tenantEmail ? query(collection(db, 'tenants'), where('ownerId', '==', ownerId), where('email', '==', tenantEmail)) : query(collection(db, 'tenants'), where('email', '==', 'INVALID_EMPTY')))
        : query(collection(db, 'tenants'), where('ownerId', '==', ownerId));
      unsubs.push(onSnapshot(tenantsQuery, (querySnap) => {
        const list = [];
        querySnap.forEach(d => list.push(d.data()));
        setTenants(list);
      }));
      
      // Contracts
      const contractsQuery = isTenant
        ? (tenantRoom ? query(collection(db, 'contracts'), where('ownerId', '==', ownerId), where('room', '==', tenantRoom)) : query(collection(db, 'contracts'), where('room', '==', 'INVALID_EMPTY')))
        : query(collection(db, 'contracts'), where('ownerId', '==', ownerId));
      unsubs.push(onSnapshot(contractsQuery, (querySnap) => {
        const list = [];
        querySnap.forEach(d => list.push(d.data()));
        setContracts(list);
      }));
      
      // Invoices
      const invoicesQuery = isTenant
        ? (tenantRoom ? query(collection(db, 'invoices'), where('ownerId', '==', ownerId), where('room', '==', tenantRoom)) : query(collection(db, 'invoices'), where('room', '==', 'INVALID_EMPTY')))
        : query(collection(db, 'invoices'), where('ownerId', '==', ownerId));
      unsubs.push(onSnapshot(invoicesQuery, (querySnap) => {
        const list = [];
        querySnap.forEach(d => list.push(d.data()));
        setInvoices(list);
      }));
      
      // Tickets
      // Tickets might not have a 'room' property in all cases, or they do. Let's assume tenant sees all tickets they reported or all tickets for their ownerId. For simplicity, just ownerId, since firestore rules allow them to read tickets for the ownerId. But if we want to restrict, we can add where('reporter', '==', user.name). 
      // Actually, firestore rules allow them to read all tickets for ownerId. So let's keep it as is.
      unsubs.push(onSnapshot(query(collection(db, 'tickets'), where('ownerId', '==', ownerId)), (querySnap) => {
        const data = { reported: [], inProgress: [], resolved: [] };
        querySnap.forEach(d => {
          const item = d.data();
          const status = item.status || 'reported';
          if (data[status]) data[status].push(item);
          else data.reported.push(item);
        });
        setTickets(data);
      }));
      
      const usersQuery = user?.email === SUPER_ADMIN_EMAIL 
        ? collection(db, 'users') 
        : (isTenant 
            ? query(collection(db, 'users'), where('email', '==', tenantEmail))
            : query(collection(db, 'users'), where('ownerId', '==', ownerId)));
        
      unsubs.push(onSnapshot(usersQuery, (querySnap) => {
        const list = [];
        querySnap.forEach(d => list.push(d.data()));
        setUsers(list);
      }));

      return unsubs;
    };

    const initApp = async () => {
      try {
        const testDocRef = doc(db, 'settings', ownerId);
        const testDoc = await getDoc(testDocRef);
        
        setIsCloudMode(true);
        console.log("Connected to Firebase Firestore Cloud Database successfully.");
        
        if (!testDoc.exists()) {
          console.log("Firestore settings not found. Khởi tạo dữ liệu mẫu...");
          await setupInitialCloudData();
        }
        
        const isTenant = user?.role === 'tenant';
        const tenantEmail = user?.email;
        const tenantRoom = user?.room;

        const roomsQueryInit = isTenant
          ? (tenantRoom ? query(collection(db, 'rooms'), where('ownerId', '==', ownerId), where('name', '==', tenantRoom)) : query(collection(db, 'rooms'), where('name', '==', 'INVALID_EMPTY')))
          : query(collection(db, 'rooms'), where('ownerId', '==', ownerId));

        const tenantsQueryInit = isTenant
          ? (tenantEmail ? query(collection(db, 'tenants'), where('ownerId', '==', ownerId), where('email', '==', tenantEmail)) : query(collection(db, 'tenants'), where('email', '==', 'INVALID_EMPTY')))
          : query(collection(db, 'tenants'), where('ownerId', '==', ownerId));

        const contractsQueryInit = isTenant
          ? (tenantRoom ? query(collection(db, 'contracts'), where('ownerId', '==', ownerId), where('room', '==', tenantRoom)) : query(collection(db, 'contracts'), where('room', '==', 'INVALID_EMPTY')))
          : query(collection(db, 'contracts'), where('ownerId', '==', ownerId));

        const invoicesQueryInit = isTenant
          ? (tenantRoom ? query(collection(db, 'invoices'), where('ownerId', '==', ownerId), where('room', '==', tenantRoom)) : query(collection(db, 'invoices'), where('room', '==', 'INVALID_EMPTY')))
          : query(collection(db, 'invoices'), where('ownerId', '==', ownerId));

        const usersQueryInit = user?.email === SUPER_ADMIN_EMAIL 
          ? collection(db, 'users') 
          : (isTenant 
              ? query(collection(db, 'users'), where('email', '==', tenantEmail))
              : query(collection(db, 'users'), where('ownerId', '==', ownerId)));

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
          getDoc(doc(db, 'settings', ownerId)),
          getDocs(roomsQueryInit),
          getDocs(tenantsQueryInit),
          getDocs(contractsQueryInit),
          getDocs(invoicesQueryInit),
          getDocs(query(collection(db, 'tickets'), where('ownerId', '==', ownerId))),
          getDocs(usersQueryInit)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.ownerId]);

  // ─── HOOKS ──────────────────────────────────────────
  const { addRoom, updateRoom, deleteRoom: removeRoom } = useRoomManager({ isCloudMode, ownerId, setRooms });
  const { addTenant, updateTenant, deleteTenant } = useTenantManager({ isCloudMode, ownerId, setTenants });
  const { addContract, updateContract, deleteContract } = useContractManager({ isCloudMode, ownerId, setContracts });
  const { addInvoice, updateInvoice, deleteInvoice } = useInvoiceManager({ isCloudMode, ownerId, setInvoices });
  const { addTicket, updateTicketStatus, updateTicket, deleteTicket } = useTicketManager({ isCloudMode, ownerId, setTickets });
  const { handleUpdateSettings } = useSettingsManager({ isCloudMode, ownerId, setSettings });
  const { addUser, updateUser, deleteUser } = useUserManager({ isCloudMode, ownerId, setUsers });

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
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
        await setDoc(doc(db, 'settings', ownerId), { buildings: newBuildings, prices: newPrices }, { merge: true });
        
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
        await setDoc(doc(db, 'settings', ownerId), { buildings: newBuildings, prices: newPrices }, { merge: true });
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

  const deleteBuilding = async (name) => {
    if (!name || !settings.buildings.includes(name)) return false;
    
    // Tìm danh sách ID các phòng, khách, hợp đồng, hóa đơn cần xóa
    const roomsToDelete = rooms.filter(r => r.building === name);
    const tenantsToDelete = tenants.filter(t => t.building === name);
    // Hợp đồng liên kết với phòng
    const roomNames = roomsToDelete.map(r => r.name);
    const contractsToDelete = contracts.filter(c => roomNames.some(rn => typeof c.room === 'string' && c.room.includes(rn)));
    const invoicesToDelete = invoices.filter(i => roomNames.some(rn => typeof i.room === 'string' && i.room.includes(rn)));

    if (isCloudMode) {
      try {
        const newBuildings = settings.buildings.filter(b => b !== name);
        const newPrices = { ...settings.prices };
        delete newPrices[name];
        await setDoc(doc(db, 'settings', ownerId), { buildings: newBuildings, prices: newPrices }, { merge: true });
        
        for (const r of roomsToDelete) await deleteDoc(doc(db, 'rooms', String(r.id)));
        for (const t of tenantsToDelete) await deleteDoc(doc(db, 'tenants', String(t.id)));
        for (const c of contractsToDelete) await deleteDoc(doc(db, 'contracts', String(c.id)));
        for (const i of invoicesToDelete) await deleteDoc(doc(db, 'invoices', String(i.id)));
        
        return true;
      } catch (err) {
        console.error("Lỗi xóa nhà trên Cloud:", err);
        return false;
      }
    } else {
      setSettings(prev => {
        const newBuildings = prev.buildings.filter(b => b !== name);
        const newPrices = { ...prev.prices };
        delete newPrices[name];
        return { ...prev, buildings: newBuildings, prices: newPrices };
      });
      
      setRooms(prev => prev.filter(r => r.building !== name));
      setTenants(prev => prev.filter(t => t.building !== name));
      setContracts(prev => prev.filter(c => !roomNames.some(rn => typeof c.room === 'string' && c.room.includes(rn))));
      setInvoices(prev => prev.filter(i => !roomNames.some(rn => typeof i.room === 'string' && i.room.includes(rn))));
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
          await setDoc(doc(db, 'rooms', String(r.id)), { ...r, ownerId });
        }
        for (const t of data.tenants) {
          await setDoc(doc(db, 'tenants', String(t.id)), { ...t, ownerId });
        }
        for (const c of data.contracts) {
          await setDoc(doc(db, 'contracts', String(c.id)), { ...c, ownerId });
        }
        for (const inv of data.invoices) {
          await setDoc(doc(db, 'invoices', String(inv.id)), { ...inv, ownerId });
        }
        const allTickets = [
          ...data.tickets.reported.map(t => ({ ...t, status: 'reported', ownerId })),
          ...data.tickets.inProgress.map(t => ({ ...t, status: 'inProgress', ownerId })),
          ...data.tickets.resolved.map(t => ({ ...t, status: 'resolved', ownerId }))
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
          const snap = await getDocs(query(collection(db, colName), where('ownerId', '==', ownerId)));
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
      setUsers([]);
      return true;
    }
  };

  const importExcelData = async (parsedData) => {
    const importCollection = async (collectionName, dataList, idPrefix, setState) => {
      if (!dataList || dataList.length === 0) return;
      if (isCloudMode) {
        try {
          for (const item of dataList) {
            const docId = item.id || `${idPrefix}${Date.now()}-${Math.random()}`;
            await setDoc(doc(db, collectionName, String(docId)), { ...item, id: docId, ownerId }, { merge: true });
          }
        } catch (err) {
          console.error(`Lỗi import ${collectionName} lên Cloud:`, err);
        }
      } else {
        setState(prev => {
          const newData = [...prev];
          dataList.forEach(item => {
            const index = newData.findIndex(existing => existing.id === item.id);
            if (index >= 0) newData[index] = { ...newData[index], ...item };
            else newData.push({ ...item, id: item.id || `${idPrefix}-${Date.now()}-${Math.random()}` });
          });
          return newData;
        });
      }
    };

    if (parsedData.rooms) await importCollection('rooms', parsedData.rooms, 'R', setRooms);
    if (parsedData.tenants) await importCollection('tenants', parsedData.tenants, 'KH', setTenants);
    if (parsedData.contracts) await importCollection('contracts', parsedData.contracts, 'HD', setContracts);
    if (parsedData.invoices) await importCollection('invoices', parsedData.invoices, 'INV', setInvoices);
    if (parsedData.tickets) await importCollection('tickets', parsedData.tickets, 'TK', () => {}); // Tickets don't have setTickets exposed directly, but it's fine
    if (parsedData.users) await importCollection('users', parsedData.users, 'USR', setUsers);
    
    return true;
  };

  return (
    <AppDataContext.Provider value={{ 
      rooms, setRooms, addRoom, removeRoom, updateRoom,
      tenants, setTenants, addTenant, updateTenant, deleteTenant,
      contracts, setContracts, addContract, updateContract, deleteContract,
      invoices, setInvoices, addInvoice, updateInvoice, deleteInvoice,
      tickets, addTicket, updateTicket, moveTicket,
      users, setUsers, addUser, updateUser, deleteUser,
      notifications, markNotificationAsRead,
      settings, setSettings: handleUpdateSettings, renameBuilding, addNewBuilding, deleteBuilding,
      loadMockData, clearAllData, importExcelData,
      isCloudMode, loading
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
