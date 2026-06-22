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
          // Try email query first
          const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            registeredUser = querySnap.docs[0].data();
          } else {
            // Try direct doc lookup fallback by email
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.email));
            if (userDoc.exists()) {
              registeredUser = userDoc.data();
            } else {
              // Try direct doc lookup fallback by uid
              const userDocUid = await getDoc(doc(db, 'users', `usr-${firebaseUser.uid}`));
              if (userDocUid.exists()) {
                registeredUser = userDocUid.data();
              }
            }
          }
        } catch (err) {
          console.warn("Lỗi truy vấn vai trò người dùng từ Firestore, sử dụng offline fallback:", err);
        }

        // Fallback to localStorage rentflow_users
        if (!registeredUser) {
          const allUsers = JSON.parse(localStorage.getItem('rentflow_users')) || [];
          registeredUser = allUsers.find(u => u.email === firebaseUser.email);
        }

        // Auto-heal/sync check against tenants collection
        let landlordOwnerId = registeredUser?.ownerId;
        let tenantRoom = registeredUser?.room;
        let tenantName = registeredUser?.name;
        let isTenantInDB = false;
        
        try {
          const tenantQuery = query(collection(db, 'tenants'), where('email', '==', firebaseUser.email));
          const tenantSnapshot = await getDocs(tenantQuery);
          if (!tenantSnapshot.empty) {
            const tenantDoc = tenantSnapshot.docs[0].data();
            isTenantInDB = true;
            landlordOwnerId = tenantDoc.ownerId;
            tenantRoom = tenantDoc.room || null;
            if (tenantDoc.name) {
              tenantName = tenantDoc.name;
            }
          }
        } catch (e) {
          console.warn("Lỗi tra cứu khách thuê từ Firestore:", e);
        }
        
        if (registeredUser?.status === 'blocked') {
          import('react-hot-toast').then(m => m.default.error('Tài khoản của bạn đã bị khóa truy cập.'));
          firebaseSignOut();
          setUser(null);
          return;
        }

        let finalRole = registeredUser?.role;
        let finalPlan = registeredUser?.plan;
        let finalTrialEndsAt = registeredUser?.trialEndsAt;
        let finalOwnerId = landlordOwnerId || registeredUser?.ownerId || firebaseUser.uid;
        
        // Nếu là người dùng mới tinh (đăng nhập Google lần đầu)
        if (!registeredUser) {
          if (isTenantInDB) {
            finalRole = 'tenant';
            finalPlan = 'none';
            finalTrialEndsAt = null;
          } else {
            finalRole = 'admin';
            finalPlan = 'trial';
            finalTrialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          }
          
          // Tự động lưu người dùng mới này vào local/firestore để lần sau đồng bộ
          const newUser = {
            id: firebaseUser.email,
            email: firebaseUser.email,
            name: tenantName || firebaseUser.displayName || 'Người dùng Google',
            role: finalRole,
            plan: finalPlan,
            trialEndsAt: finalTrialEndsAt,
            uid: firebaseUser.uid,
            room: tenantRoom || null,
            allowedBuildings: finalRole === 'tenant' ? [] : ['all'],
            ownerId: finalOwnerId
          };
          const localUsers = JSON.parse(localStorage.getItem('rentflow_users')) || [];
          if (!localUsers.find(u => u.email === firebaseUser.email)) {
            localUsers.push(newUser);
            localStorage.setItem('rentflow_users', JSON.stringify(localUsers));
          }
          setDoc(doc(db, 'users', newUser.id), newUser).catch(() => {});
          registeredUser = newUser;
        } else {
          // Auto-heal existing user if they are registered as admin/guest but are actually a tenant, or missing ownerId
          let needsUpdate = false;
          const updatedFields = {};

          if (isTenantInDB) {
            if (registeredUser.role !== 'tenant') {
              finalRole = 'tenant';
              updatedFields.role = 'tenant';
              finalPlan = 'none';
              updatedFields.plan = 'none';
              finalTrialEndsAt = null;
              updatedFields.trialEndsAt = null;
              needsUpdate = true;
            }
            if (registeredUser.room !== tenantRoom) {
              updatedFields.room = tenantRoom;
              needsUpdate = true;
            }
          }

          if (registeredUser.ownerId !== finalOwnerId) {
            updatedFields.ownerId = finalOwnerId;
            needsUpdate = true;
          }

          if (needsUpdate) {
            const docId = registeredUser.email || firebaseUser.email;
            setDoc(doc(db, 'users', docId), updatedFields, { merge: true })
              .then(() => console.log("Đã tự động cập nhật tài khoản khách thuê."))
              .catch(err => console.warn("Lỗi tự động cập nhật người dùng:", err));
          }
        }
        
        if (firebaseUser.email === 'nguyentienducbmt123@gmail.com') {
          finalRole = 'admin';
          finalPlan = 'pro';
          finalTrialEndsAt = null;
        }

        setUser({
          name: tenantName || registeredUser?.name || firebaseUser.displayName || 'Người dùng',
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,
          uid: firebaseUser.uid,
          role: finalRole,
          room: tenantRoom || registeredUser?.room || null,
          allowedBuildings: finalRole === 'tenant' ? [] : (registeredUser?.allowedBuildings || ['all']),
          plan: finalPlan || registeredUser?.plan,
          trialEndsAt: finalTrialEndsAt || registeredUser?.trialEndsAt,
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
      let landlordOwnerId = null;

      // Check if email already matches a tenant in the system
      try {
        const tenantQuery = query(collection(db, 'tenants'), where('email', '==', email));
        const tenantSnapshot = await getDocs(tenantQuery);
        if (!tenantSnapshot.empty) {
          const tenantDoc = tenantSnapshot.docs[0].data();
          determinedRole = 'tenant';
          determinedRoom = tenantDoc.room || null;
          landlordOwnerId = tenantDoc.ownerId || null;
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
          landlordOwnerId = matchedTenant.ownerId || null;
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
        id: email,
        email: email,
        name: tenantName,
        role: determinedRole,
        room: determinedRoom,
        uid: firebaseUser.uid,
        plan: plan,
        trialEndsAt: trialEndsAt,
        ownerId: landlordOwnerId || firebaseUser.uid
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
        trialEndsAt: newUser.trialEndsAt,
        ownerId: newUser.ownerId
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
      const userRef = doc(db, 'users', user.email);
      await setDoc(userRef, updatedData, { merge: true });
    } catch (err) {
      console.warn("Lỗi cập nhật role trên Firestore, lưu local:", err);
      const localUsers = JSON.parse(localStorage.getItem('rentflow_users')) || [];
      const userIndex = localUsers.findIndex(u => (u.uid === user.uid || u.email === user.email));
      if (userIndex !== -1) {
        localUsers[userIndex] = { ...localUsers[userIndex], ...updatedData };
      } else {
        localUsers.push({ ...user, ...updatedData, id: user.email });
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
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, loginWithEmail, signUpWithEmail, upgradeUserAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
