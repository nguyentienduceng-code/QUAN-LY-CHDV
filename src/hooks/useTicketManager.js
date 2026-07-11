import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export const useTicketManager = ({ isCloudMode, ownerId, setTickets }) => {
  const addTicket = async (ticket) => {
    const newId = ticket.id || `${ownerId}_TKT_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const newTicket = { 
      ...ticket, 
      id: newId, 
      status: ticket.status || 'reported', 
      ownerId,
      date: ticket.date || new Date().toLocaleDateString('vi-VN')
    };
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'tickets', String(newTicket.id)), newTicket);
        toast.success("Báo cáo sự cố thành công");
      } catch (err) {
        console.error("Lỗi khi thêm sự cố lên Cloud:", err);
        toast.error("Lỗi khi báo cáo sự cố");
      }
    } else {
      setTickets(prev => ({
        ...prev,
        reported: [newTicket, ...(prev.reported || [])]
      }));
      toast.success("Báo cáo sự cố thành công (Local)");
    }
  };

  const updateTicketStatus = async (id, currentStatus, newStatus) => {
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'tickets', String(id)), { status: newStatus }, { merge: true });
        toast.success("Cập nhật trạng thái thành công");
      } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái sự cố trên Cloud:", err);
        toast.error("Lỗi khi cập nhật trạng thái");
      }
    } else {
      setTickets(prev => {
        const ticket = prev[currentStatus]?.find(t => t.id === id);
        if (!ticket) return prev;
        const updatedTicket = { ...ticket, status: newStatus };
        return {
          ...prev,
          [currentStatus]: prev[currentStatus].filter(t => t.id !== id),
          [newStatus]: [updatedTicket, ...(prev[newStatus] || [])]
        };
      });
      toast.success("Cập nhật trạng thái thành công (Local)");
    }
  };

  const deleteTicket = async (id, currentStatus) => {
    if (isCloudMode) {
      try {
        await deleteDoc(doc(db, 'tickets', String(id)));
        toast.success("Xóa sự cố thành công");
      } catch (err) {
        console.error("Lỗi khi xóa sự cố trên Cloud:", err);
        toast.error("Lỗi khi xóa sự cố");
      }
    } else {
      setTickets(prev => ({
        ...prev,
        [currentStatus]: prev[currentStatus].filter(t => t.id !== id)
      }));
      toast.success("Xóa sự cố thành công (Local)");
    }
  };

  return { addTicket, updateTicketStatus, deleteTicket };
};
