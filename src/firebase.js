import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB9T0kXiLB7vCh3zeP5KmesCD8o53rov1o",
  authDomain: "ql-chdv-77495.firebaseapp.com",
  projectId: "ql-chdv-77495",
  storageBucket: "ql-chdv-77495.firebasestorage.app",
  messagingSenderId: "404880396549",
  appId: "1:404880396549:web:7c781dc5b50195ecd8e76c",
  measurementId: "G-7DZQ9GTQ3P"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const firebaseSignOut = () => signOut(auth);
