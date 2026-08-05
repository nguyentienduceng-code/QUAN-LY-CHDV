import { doc, setDoc, deleteDoc, getDoc, writeBatch, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { updateRoomTransaction } from '../utils/firestoreTransactions';

export const useRoomManager = ({ isCloudMode, ownerId, setRooms }) => {
  const addRoom = async (room) => {
    const newId = room.id || Date.now();
    const newRoom = { ...room, id: newId, ownerId };

    // Convert price to number if exists
    if (newRoom.price) {
      newRoom.price = Number(String(newRoom.price).replace(/[^0-9.-]+/g, '')) || 0;
    }

    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'rooms', String(newRoom.id)), newRoom);
        toast.success("Thêm phòng thành công");
      } catch (err) {
        console.error("Lỗi khi thêm phòng lên Cloud:", err);
        toast.error("Lỗi khi thêm phòng");
      }
    } else {
      setRooms(prev => [...prev, newRoom]);
      toast.success("Thêm phòng thành công (Local)");
    }
  };

  const updateRoom = async (id, updatedData) => {
    if (isCloudMode) {
      try {
        // Use transaction to prevent race conditions
        await updateRoomTransaction(id, updatedData, ownerId);
        toast.success("Cập nhật phòng thành công");
      } catch (err) {
        console.error("Lỗi khi cập nhật phòng trên Cloud:", err);
        toast.error(err.message || "Lỗi khi cập nhật phòng");
      }
    } else {
      const dataToUpdate = { ...updatedData };
      if ('price' in dataToUpdate) {
        dataToUpdate.price = Number(String(dataToUpdate.price).replace(/[^0-9.-]+/g, '')) || 0;
      }
      setRooms(prev => prev.map(r => r.id === id ? { ...r, ...dataToUpdate } : r));
      toast.success("Cập nhật phòng thành công (Local)");
    }
  };

  const deleteRoom = async (id) => {
    if (isCloudMode) {
      try {
        const roomRef = doc(db, 'rooms', String(id));
        const roomSnap = await getDoc(roomRef);
        
        if (!roomSnap.exists()) {
          // If room doesn't exist, we can't get its name to cascade delete, so just return
          return;
        }

        const roomName = roomSnap.data().name;
        const batch = writeBatch(db);

        // 1. Delete Room
        batch.delete(roomRef);

        // 2. Delete Tenants
        const tenantsSnap = await getDocs(query(collection(db, 'tenants'), where('room', '==', roomName), where('ownerId', '==', ownerId)));
        tenantsSnap.forEach(d => batch.delete(d.ref));

        // 3. Delete Contracts
        const contractsSnap = await getDocs(query(collection(db, 'contracts'), where('room', '==', roomName), where('ownerId', '==', ownerId)));
        contractsSnap.forEach(d => batch.delete(d.ref));

        // 4. Delete Invoices
        const invoicesSnap = await getDocs(query(collection(db, 'invoices'), where('room', '==', roomName), where('ownerId', '==', ownerId)));
        invoicesSnap.forEach(d => batch.delete(d.ref));

        await batch.commit();

        toast.success("Xóa phòng thành công");
      } catch (err) {
        console.error("Lỗi khi xóa phòng trên Cloud:", err);
        toast.error("Lỗi khi xóa phòng");
      }
    } else {
      setRooms(prev => prev.filter(r => r.id !== id));
      toast.success("Xóa phòng thành công (Local)");
    }
  };

  return { addRoom, updateRoom, deleteRoom };
};
