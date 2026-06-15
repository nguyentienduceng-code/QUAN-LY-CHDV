# Hướng dẫn Tích hợp Firebase Auth + Google Sign-In
# ============================================================
# File này chuẩn bị sẵn cho việc tích hợp Firebase Authentication.
# Khi bạn sẵn sàng, chỉ cần:
# 1. Tạo project Firebase tại https://console.firebase.google.com
# 2. Copy config từ Firebase Console vào file này
# 3. Chạy: npm install firebase

# BƯỚC 1: Cài đặt Firebase
# > npm install firebase

# BƯỚC 2: Tạo file src/firebase.js với nội dung dưới đây:
# ------------------------------------------------------------

"""
// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// TODO: Thay bằng config từ Firebase Console của bạn
// (Project Settings > General > Your apps > Firebase SDK snippet)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Sign in with Google popup
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

// Sign out
export const firebaseSignOut = () => signOut(auth);
"""

# BƯỚC 3: Cập nhật AuthContext.jsx để dùng Firebase
# ------------------------------------------------------------

"""
// src/context/AuthContext.jsx (updated with Firebase)
import { createContext, useState, useContext, useEffect } from 'react';
import { auth, signInWithGoogle, firebaseSignOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Map Firebase user to app user object
        setUser({
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          photo: firebaseUser.photoURL,
          uid: firebaseUser.uid,
          role: 'tenant', // default - can be stored in Firestore per user
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const result = await signInWithGoogle();
    return result.user;
  };

  const logout = () => firebaseSignOut();

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
"""

# BƯỚC 4: Firestore Rules (bảo mật)
# ------------------------------------------------------------
# Vào Firebase Console > Firestore Database > Rules:

"""
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chỉ user đã đăng nhập mới đọc được
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Manager check: phải có role=manager trong Firestore
    match /invoices/{id} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'manager';
    }
  }
}
"""

# BƯỚC 5: Enable Google Sign-In trong Firebase Console
# ------------------------------------------------------------
# Authentication > Sign-in method > Google > Enable
# Thêm authorized domain: localhost, your-vercel-app.vercel.app
