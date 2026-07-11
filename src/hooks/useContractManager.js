import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export const useContractManager = ({ isCloudMode, ownerId, setContracts }) => {
  const addContract = async (contract) => {
    const newId = contract.id || `${ownerId}_CTR_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const newContract = { ...contract, id: newId, status: 'active', ownerId };
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'contracts', String(newContract.id)), newContract);
        toast.success("Thêm hợp đồng thành công");
      } catch (err) {
        console.error("Lỗi khi thêm hợp đồng lên Cloud:", err);
        toast.error("Lỗi khi thêm hợp đồng");
      }
    } else {
      setContracts(prev => [newContract, ...prev]);
      toast.success("Thêm hợp đồng thành công (Local)");
    }
  };

  const updateContract = async (id, updatedData) => {
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'contracts', String(id)), updatedData, { merge: true });
        toast.success("Cập nhật hợp đồng thành công");
      } catch (err) {
        console.error("Lỗi khi cập nhật hợp đồng trên Cloud:", err);
        toast.error("Lỗi khi cập nhật hợp đồng");
      }
    } else {
      setContracts(prev => prev.map(ctr => ctr.id === id ? { ...ctr, ...updatedData } : ctr));
      toast.success("Cập nhật hợp đồng thành công (Local)");
    }
  };

  const deleteContract = async (id) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'contracts', String(id)));
        toast.success("Xóa hợp đồng thành công");
      } catch (err) {
        console.error("Lỗi khi xóa hợp đồng trên Cloud:", err);
        toast.error("Lỗi khi xóa hợp đồng");
      }
    } else {
      setContracts(prev => prev.filter(ctr => ctr.id !== id));
      toast.success("Xóa hợp đồng thành công (Local)");
    }
  };

  return { addContract, updateContract, deleteContract };
};
