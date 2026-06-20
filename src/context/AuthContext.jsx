import { createContext, useState, useContext, useEffect } from 'react';
import { auth, signInWithGoogle, firebaseSignOut, firebaseSignInWithEmail, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

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
          // Try to query role from Firestore users collection
          const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            registeredUser = querySnapshot.docs[0].data();
          }
        } catch (err) {
          console.warn("Lỗi truy vấn vai trò người dùng từ Firestore, sử dụng offline fallback:", err);
        }

        // Fallback to localStorage rentflow_users
        if (!registeredUser) {
          const allUsers = JSON.parse(localStorage.getItem('rentflow_users')) || [];
          registeredUser = allUsers.find(u => u.email === firebaseUser.email);
        }
        
        setUser({
          name: registeredUser?.name || firebaseUser.displayName || 'Người dùng',
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,
          uid: firebaseUser.uid,
          role: registeredUser?.role || 'guest',
          room: registeredUser?.room || null,
        });
      } else if (!firebaseUser && !storedUser) {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('chdv_user', JSON.stringify(userData));
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

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('chdv_user');
    await firebaseSignOut().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
