import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { updateTenantTransaction, deleteTenantCascade } from '../utils/firestoreTransactions';

export const useTenantManager = ({ isCloudMode, ownerId, setTenants, setContracts, setInvoices, setRooms }) => {
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
        // Use transaction to prevent race conditions
        await updateTenantTransaction(id, updatedData, ownerId);
        toast.success("Cập nhật khách thuê thành công");
      } catch (err) {
        console.error("Lỗi khi cập nhật khách thuê trên Cloud:", err);
        toast.error(err.message || "Lỗi khi cập nhật khách thuê");
      }
    } else {
      setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
      toast.success("Cập nhật khách thuê thành công (Local)");
    }
  };

  const deleteTenant = async (id, allData = {}) => {
    if (isCloudMode) {
      try {
        // Use cascade delete to remove related data atomically
        await deleteTenantCascade(id, ownerId);
        toast.success("Đã xóa khách thuê và dữ liệu liên quan");
      } catch (err) {
        console.error("Lỗi khi xóa khách thuê trên Cloud:", err);
        toast.error(err.message || "Lỗi khi xóa khách thuê");
      }
    } else {
      // Local mode: cascade delete
      const { tenants, contracts, invoices, rooms } = allData;

      if (!tenants || !setContracts || !setInvoices || !setRooms) {
        // Fallback to simple delete if cascade utilities not provided
        setTenants(prev => prev.filter(t => t.id !== id));
        toast.success("Xóa khách thuê thành công (Local)");
        toast('Lưu ý: Vui lòng xóa thủ công các hợp đồng và hóa đơn liên quan', {
          icon: '⚠️',
          duration: 5000
        });
        return;
      }

      try {
        // Import cascade utility dynamically
        const { localCascadeDeleteTenant } = await import('../utils/localCascadeOperations');

        localCascadeDeleteTenant(
          id,
          { tenants, contracts, invoices, rooms },
          { setTenants, setContracts, setInvoices, setRooms }
        );

        toast.success("Đã xóa khách thuê và dữ liệu liên quan");
      } catch (err) {
        console.error("Lỗi cascade delete local:", err);
        toast.error(err.message || "Lỗi khi xóa khách thuê");
      }
    }
  };

  return { addTenant, updateTenant, deleteTenant };
};
