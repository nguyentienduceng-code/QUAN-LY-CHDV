import { createContext, useState, useContext, useEffect } from 'react';
import { auth, signInWithGoogle, firebaseSignOut, firebaseSignInWithEmail, firebaseSignUpWithEmail, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, doc, setDoc } from 'firebase/firestore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('chdv_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const storedUser = localStorage.getItem('chdv_user');
      // Nếu đăng nhập bằng Google hoặc Email Firebase (có firebaseUser) và không có user cứng trong localStorage (manager)
      if (firebaseUser && !storedUser) {
        let registeredUser = null;
        try {
          // Try to get role from Firestore users collection directly by email ID
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.email));
          if (userDoc.exists()) {
            registeredUser = userDoc.data();
          }
        } catch (err) {
          console.warn("Lỗi truy vấn vai trò người dùng từ Firestore, sử dụng offline fallback:", err);
        }

        // Fallback to localStorage rentflow_users
        if (!registeredUser) {
          const allUsers = JSON.parse(localStorage.getItem('rentflow_users')) || [];
          registeredUser = allUsers.find(u => u.email === firebaseUser.email);
        }
        
        let finalRole = registeredUser?.role;
        let finalPlan = registeredUser?.plan;
        let finalTrialEndsAt = registeredUser?.trialEndsAt;
        let finalOwnerId = registeredUser?.ownerId || firebaseUser.uid;
        
        // Nếu là người dùng mới tinh (đăng nhập Google lần đầu)
        if (!registeredUser) {
          finalRole = 'admin';
          finalPlan = 'trial';
          finalTrialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          
          // Tự động lưu người dùng mới này vào local/firestore để lần sau đồng bộ
          const newUser = {
            id: firebaseUser.email,
            email: firebaseUser.email,
            name: firebaseUser.displayName || 'Người dùng Google',
            role: finalRole,
            plan: finalPlan,
            trialEndsAt: finalTrialEndsAt,
            uid: firebaseUser.uid,
            allowedBuildings: ['all'],
            ownerId: finalOwnerId
          };
          const localUsers = JSON.parse(localStorage.getItem('rentflow_users')) || [];
          if (!localUsers.find(u => u.email === firebaseUser.email)) {
            localUsers.push(newUser);
            localStorage.setItem('rentflow_users', JSON.stringify(localUsers));
          }
          setDoc(doc(db, 'users', newUser.id), newUser).catch(() => {});
        }
        
        if (firebaseUser.email === 'nguyentienducbmt123@gmail.com') {
          finalRole = 'admin';
          finalPlan = 'pro';
          finalTrialEndsAt = null;
        }

        setUser({
          name: registeredUser?.name || firebaseUser.displayName || 'Người dùng',
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,
          uid: firebaseUser.uid,
          role: finalRole,
          room: registeredUser?.room || null,
          allowedBuildings: registeredUser?.allowedBuildings || ['all'],
          plan: finalPlan,
          trialEndsAt: finalTrialEndsAt,
          ownerId: finalOwnerId
        });
      } else if (!firebaseUser && !storedUser) {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = (userData) => {
    const dataToSave = { ...userData };
    if (dataToSave.email === 'nguyentienducbmt123@gmail.com') {
      dataToSave.role = 'admin';
      dataToSave.plan = 'pro';
      dataToSave.trialEndsAt = null;
    }
    setUser(dataToSave);
    localStorage.setItem('chdv_user', JSON.stringify(dataToSave));
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      return result.user;
    } catch (error) {
      console.error("Lỗi đăng nhập Google:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const result = await firebaseSignInWithEmail(email, password);
      return result.user;
    } catch (error) {
      console.error("Lỗi đăng nhập Email Firebase:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password, name) => {
    try {
      const result = await firebaseSignUpWithEmail(email, password);
      const firebaseUser = result.user;

      let determinedRole = 'guest';
      let determinedRoom = null;
      let tenantName = name;

      // Check if email already matches a tenant in the system
      try {
        const tenantQuery = query(collection(db, 'tenants'), where('email', '==', email));
        const tenantSnapshot = await getDocs(tenantQuery);
        if (!tenantSnapshot.empty) {
          const tenantDoc = tenantSnapshot.docs[0].data();
          determinedRole = 'tenant';
          determinedRoom = tenantDoc.room || null;
          if (tenantDoc.name) {
            tenantName = tenantDoc.name;
          }
        }
      } catch (err) {
        console.warn("Lỗi kiểm tra tenant trong Firestore, thử sử dụng local storage:", err);
        const localTenants = JSON.parse(localStorage.getItem('rentflow_tenants')) || [];
        const matchedTenant = localTenants.find(t => t.email === email);
        if (matchedTenant) {
          determinedRole = 'tenant';
          determinedRoom = matchedTenant.room || null;
          if (matchedTenant.name) {
            tenantName = matchedTenant.name;
          }
        }
      }
      
      // Mặc định đăng ký mới sẽ nhận gói dùng thử 30 ngày (nếu không phải là khách thuê)
      let trialEndsAt = null;
      let plan = 'none';
      
      if (determinedRole === 'guest') {
        determinedRole = 'admin'; // Cấp thẳng quyền admin để trải nghiệm thả ga
        plan = 'trial';
        trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Force super admin permissions
      if (email === 'nguyentienducbmt123@gmail.com') {
        determinedRole = 'admin';
        plan = 'pro';
        trialEndsAt = null;
      }

      const newUser = {
        id: `usr-${firebaseUser.uid}`,
        email: email,
        name: tenantName,
        role: determinedRole,
        room: determinedRoom,
        uid: firebaseUser.uid,
        plan: plan,
        trialEndsAt: trialEndsAt
      };

      // Save to Firestore
      try {
        await setDoc(doc(db, 'users', newUser.id), newUser);
      } catch (err) {
        console.warn("Lỗi ghi thông tin người dùng vào Firestore, lưu local:", err);
        const localUsers = JSON.parse(localStorage.getItem('rentflow_users')) || [];
        localUsers.push(newUser);
        localStorage.setItem('rentflow_users', JSON.stringify(localUsers));
      }

      if (email === 'nguyentienducbmt123@gmail.com') {
        newUser.role = 'admin';
        newUser.plan = 'pro';
        newUser.trialEndsAt = null;
      }

      // Log in the user locally
      login({
        name: newUser.name,
        email: newUser.email,
        uid: newUser.uid,
        role: newUser.role,
        room: newUser.room,
        plan: newUser.plan,
        trialEndsAt: newUser.trialEndsAt
      });

      return newUser;
    } catch (error) {
      console.error("Lỗi đăng ký tài khoản Email Firebase:", error);
      throw error;
    }
  };

  const upgradeUserAccount = async (planId) => {
    if (!user) return null;
    
    let newRole = 'manager';
    let newPlan = planId; // 'basic', 'pro', 'pending_pro', 'pending_basic'
    let gracePeriodEndsAt = undefined;
    
    if (planId === 'pro' || planId === 'pending_pro') {
      newRole = 'admin'; // Cấp thẳng admin ngay cả khi đang pending để khách xài thử
    } else if (planId === 'basic' || planId === 'pending_basic') {
      newRole = 'manager';
    }

    if (planId.startsWith('pending_')) {
      gracePeriodEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    }

    const updatedData = { 
      role: newRole, 
      plan: newPlan,
      ownerId: user.uid || user.email // Chủ của workspace
    };
    
    if (gracePeriodEndsAt) {
      updatedData.gracePeriodEndsAt = gracePeriodEndsAt;
    }
    
    try {
      const userRef = doc(db, 'users', `usr-${user.uid || user.email}`);
      await setDoc(userRef, updatedData, { merge: true });
    } catch (err) {
      console.warn("Lỗi cập nhật role trên Firestore, lưu local:", err);
      const localUsers = JSON.parse(localStorage.getItem('rentflow_users')) || [];
      const userIndex = localUsers.findIndex(u => (u.uid === user.uid || u.email === user.email));
      if (userIndex !== -1) {
        localUsers[userIndex] = { ...localUsers[userIndex], ...updatedData };
      } else {
        localUsers.push({ ...user, ...updatedData, id: `usr-${user.uid || user.email}` });
      }
      localStorage.setItem('rentflow_users', JSON.stringify(localUsers));
    }

    const updatedUser = { ...user, ...updatedData };
    login(updatedUser);
    return updatedUser;
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('chdv_user');
    localStorage.removeItem('rentflow_rooms');
    localStorage.removeItem('rentflow_tenants');
    localStorage.removeItem('rentflow_contracts');
    localStorage.removeItem('rentflow_invoices');
    localStorage.removeItem('rentflow_tickets');
    localStorage.removeItem('rentflow_settings');
    localStorage.removeItem('rentflow_users');
    await firebaseSignOut().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, loginWithEmail, signUpWithEmail, upgradeUserAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
