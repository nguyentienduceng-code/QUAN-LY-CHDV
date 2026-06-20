/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from 'react';
import { auth, signInWithGoogle, firebaseSignOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('chdv_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const storedUser = localStorage.getItem('chdv_user');
      // Nếu đăng nhập bằng Google (có firebaseUser) và không có user cứng trong localStorage (manager)
      if (firebaseUser && !storedUser) {
        // Look up role from rentflow_users
        const allUsers = JSON.parse(localStorage.getItem('rentflow_users')) || [];
        const registeredUser = allUsers.find(u => u.email === firebaseUser.email);
        
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

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('chdv_user');
    await firebaseSignOut().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
