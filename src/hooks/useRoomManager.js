import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

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
    const dataToUpdate = { ...updatedData };
    if ('price' in dataToUpdate) {
      dataToUpdate.price = Number(String(dataToUpdate.price).replace(/[^0-9.-]+/g, '')) || 0;
    }

    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'rooms', String(id)), dataToUpdate, { merge: true });
        toast.success("Cập nhật phòng thành công");
      } catch (err) {
        console.error("Lỗi khi cập nhật phòng trên Cloud:", err);
        toast.error("Lỗi khi cập nhật phòng");
      }
    } else {
      setRooms(prev => prev.map(r => r.id === id ? { ...r, ...dataToUpdate } : r));
      toast.success("Cập nhật phòng thành công (Local)");
    }
  };

  const deleteRoom = async (id) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'rooms', String(id)));
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
