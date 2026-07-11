import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

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
  const email = "gamma_landlord@gmail.com";
  const password = "password123";

  console.log(`Logging in as ${email}...`);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  console.log(`Logged in successfully. UID: ${uid}`);

  console.log(`\nQuerying 'tenants' collection where ownerId == ${uid}...`);
  const tenantsQuery = query(collection(db, 'tenants'), where('ownerId', '==', uid));
  const tenantsSnap = await getDocs(tenantsQuery);
  console.log(`Total tenant documents found: ${tenantsSnap.size}`);
  tenantsSnap.forEach(d => {
    console.log(`Doc ID: ${d.id} => Email: ${d.data().email}, Name: ${d.data().name}, Room: ${d.data().room}, OwnerId: ${d.data().ownerId}`);
  });

  console.log(`\nQuerying 'rooms' collection where ownerId == ${uid}...`);
  const roomsQuery = query(collection(db, 'rooms'), where('ownerId', '==', uid));
  const roomsSnap = await getDocs(roomsQuery);
  console.log(`Total room documents found: ${roomsSnap.size}`);
  roomsSnap.forEach(d => {
    console.log(`Doc ID: ${d.id} => Name: ${d.data().name}, Building: ${d.data().building}, Floor: ${d.data().floor}, Status: ${d.data().status}`);
  });

  console.log(`\nQuerying 'users' collection where ownerId == ${uid}...`);
  const usersQuery = query(collection(db, 'users'), where('ownerId', '==', uid));
  const usersSnap = await getDocs(usersQuery);
  console.log(`Total user documents found: ${usersSnap.size}`);
  usersSnap.forEach(d => {
    console.log(`Doc ID: ${d.id} => Email: ${d.data().email}, Name: ${d.data().name}, Role: ${d.data().role}, ownerId: ${d.data().ownerId}`);
  });

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
