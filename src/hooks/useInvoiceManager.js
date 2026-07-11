import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export const useInvoiceManager = ({ isCloudMode, ownerId, setInvoices }) => {
  const addInvoice = async (invoice) => {
    const monthStr = invoice.month || new Date().toISOString().slice(0, 7).replace('-', '');
    const newId = invoice.id || `${ownerId}_INV_${monthStr}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Ensure amount is a number
    const safeAmount = Number(String(invoice.amount).replace(/[^0-9.-]+/g, '')) || 0;
    
    const newInvoice = { ...invoice, id: newId, amount: safeAmount, status: invoice.status || 'unpaid', ownerId };
    
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'invoices', String(newInvoice.id)), newInvoice);
        toast.success("Thêm hóa đơn thành công");
      } catch (err) {
        console.error("Lỗi khi thêm hóa đơn lên Cloud:", err);
        toast.error("Lỗi khi thêm hóa đơn");
      }
    } else {
      setInvoices(prev => [newInvoice, ...prev]);
      toast.success("Thêm hóa đơn thành công (Local)");
    }
    return newInvoice;
  };

  const updateInvoice = async (id, updatedData) => {
    // Ensure amount is a number if it's being updated
    const dataToUpdate = { ...updatedData };
    if ('amount' in dataToUpdate) {
      dataToUpdate.amount = Number(String(dataToUpdate.amount).replace(/[^0-9.-]+/g, '')) || 0;
    }

    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'invoices', String(id)), dataToUpdate, { merge: true });
        toast.success("Cập nhật hóa đơn thành công");
      } catch (err) {
        console.error("Lỗi khi cập nhật hóa đơn trên Cloud:", err);
        toast.error("Lỗi khi cập nhật hóa đơn");
      }
    } else {
      setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...dataToUpdate } : inv));
      toast.success("Cập nhật hóa đơn thành công (Local)");
    }
  };

  const deleteInvoice = async (id) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'invoices', String(id)));
        toast.success("Xóa hóa đơn thành công");
      } catch (err) {
        console.error("Lỗi khi xóa hóa đơn trên Cloud:", err);
        toast.error("Lỗi khi xóa hóa đơn");
      }
    } else {
      setInvoices(prev => prev.filter(inv => inv.id !== id));
      toast.success("Xóa hóa đơn thành công (Local)");
    }
  };

  return { addInvoice, updateInvoice, deleteInvoice };
};
