import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export const useTenantManager = ({ isCloudMode, ownerId, setTenants }) => {
  const addTenant = async (tenant) => {
    const newId = tenant.id || `${ownerId}_TEN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const newTenant = { ...tenant, id: newId, status: 'active', ownerId };
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'tenants', String(newTenant.id)), newTenant);
        toast.success("Thêm khách thuê thành công");
      } catch (err) {
        console.error("Lỗi khi thêm khách thuê lên Cloud:", err);
        toast.error("Lỗi khi thêm khách thuê");
      }
    } else {
      setTenants(prev => [newTenant, ...prev]);
      toast.success("Thêm khách thuê thành công (Local)");
    }
  };

  const updateTenant = async (id, updatedData) => {
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'tenants', String(id)), updatedData, { merge: true });
        toast.success("Cập nhật khách thuê thành công");
      } catch (err) {
        console.error("Lỗi khi cập nhật khách thuê trên Cloud:", err);
        toast.error("Lỗi khi cập nhật khách thuê");
      }
    } else {
      setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
      toast.success("Cập nhật khách thuê thành công (Local)");
    }
  };

  const deleteTenant = async (id) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'tenants', String(id)));
        toast.success("Xóa khách thuê thành công");
      } catch (err) {
        console.error("Lỗi khi xóa khách thuê trên Cloud:", err);
        toast.error("Lỗi khi xóa khách thuê");
      }
    } else {
      setTenants(prev => prev.filter(t => t.id !== id));
      toast.success("Xóa khách thuê thành công (Local)");
    }
  };

  return { addTenant, updateTenant, deleteTenant };
};
