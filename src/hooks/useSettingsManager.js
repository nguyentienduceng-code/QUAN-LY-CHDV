import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

export const useSettingsManager = ({ isCloudMode, ownerId, setSettings }) => {
  const handleUpdateSettings = async (newSettings) => {
    if (isCloudMode) {
      try {
        await setDoc(doc(db, 'settings', String(ownerId)), newSettings, { merge: true });
        toast.success("Cập nhật cấu hình thành công");
      } catch (err) {
        console.error("Lỗi khi cập nhật cấu hình lên Cloud:", err);
        toast.error("Lỗi khi cập nhật cấu hình");
      }
    } else {
      setSettings(prev => ({ ...prev, ...newSettings }));
      toast.success("Cập nhật cấu hình thành công (Local)");
    }
  };

  return { handleUpdateSettings };
};
