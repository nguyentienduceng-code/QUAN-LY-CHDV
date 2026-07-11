import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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
  const email = "alpha_landlord@gmail.com";
  const password = "password123";

  console.log(`Logging in as ${email}...`);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  console.log(`Logged in successfully. UID: ${uid}`);

  console.log(`\nChecking room '101' owner...`);
  const roomSnap = await getDoc(doc(db, 'rooms', '101'));
  if (roomSnap.exists()) {
    console.log("Room '101' exists! Owner:", roomSnap.data().ownerId);
  } else {
    console.log("Room '101' does not exist!");
  }

  console.log(`\nChecking tenant 'TEN-101' owner...`);
  const tenantSnap = await getDoc(doc(db, 'tenants', 'TEN-101'));
  if (tenantSnap.exists()) {
    console.log("Tenant 'TEN-101' exists! Owner:", tenantSnap.data().ownerId);
  } else {
    console.log("Tenant 'TEN-101' does not exist!");
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
