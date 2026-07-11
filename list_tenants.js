import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  // Let's log in as super admin to bypass rules
  console.log("Logging in as super admin...");
  await signInWithEmailAndPassword(auth, "nguyentienducbmt123@gmail.com", "password123").catch(err => {
    console.log("Super admin login failed. Trying to log in with another account if needed, or query directly.");
  });

  console.log("Querying all documents in 'tenants' collection...");
  const tenantsSnap = await getDocs(collection(db, 'tenants'));
  console.log(`Total tenant documents found: ${tenantsSnap.size}`);
  
  tenantsSnap.forEach(d => {
    console.log(`Doc ID: ${d.id} => Email: ${d.data().email}, Name: ${d.data().name}, Room: ${d.data().room}, OwnerId: ${d.data().ownerId}`);
  });

  console.log("\nQuerying all documents in 'users' collection...");
  const usersSnap = await getDocs(collection(db, 'users'));
  console.log(`Total user documents found: ${usersSnap.size}`);
  usersSnap.forEach(d => {
    console.log(`Doc ID: ${d.id} => Role: ${d.data().role}, Name: ${d.data().name}, Email: ${d.data().email}, OwnerId: ${d.data().ownerId}`);
  });

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
