import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export const useUserManager = ({ isCloudMode, ownerId, setUsers }) => {
  const addUser = async (newUser) => {
    const id = newUser.email || `user_${Date.now()}`;
    const userToSave = { ...newUser, id, ownerId };
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'users', String(id)), userToSave);
        toast.success("Thêm người dùng thành công");
      } catch (err) {
        console.error("Lỗi khi thêm user lên Cloud:", err);
        toast.error("Lỗi khi thêm người dùng");
      }
    } else {
      setUsers(prev => [...prev, userToSave]);
      toast.success("Thêm người dùng thành công (Local)");
    }
  };

  const updateUser = async (id, updatedData) => {
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'users', String(id)), updatedData, { merge: true });
        toast.success("Cập nhật người dùng thành công");
      } catch (err) {
        console.error("Lỗi khi cập nhật user trên Cloud:", err);
        toast.error("Lỗi khi cập nhật người dùng");
      }
    } else {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updatedData } : u));
      toast.success("Cập nhật người dùng thành công (Local)");
    }
  };

  const deleteUser = async (id) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'users', String(id)));
        toast.success("Xóa người dùng thành công");
      } catch (err) {
        console.error("Lỗi khi xóa user trên Cloud:", err);
        toast.error("Lỗi khi xóa người dùng");
      }
    } else {
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success("Xóa người dùng thành công (Local)");
    }
  };

  return { addUser, updateUser, deleteUser };
};
