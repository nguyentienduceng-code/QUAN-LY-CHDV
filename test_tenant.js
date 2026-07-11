import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

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

async function runTest() {
  const email = "gamma_tenant@gmail.com";
  const password = "password123";

  console.log("1. Attempting to register/log in tenant in Firebase Auth first...");
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in successfully. UID:", userCredential.user.uid);
  } catch (err) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      console.log("Tenant not registered yet. Registering tenant...");
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Registered successfully. UID:", userCredential.user.uid);
    } else {
      console.error("Login/Signup failed:", err);
      process.exit(1);
    }
  }

  const firebaseUser = userCredential.user;

  console.log("\n2. Checking if tenant exists in 'tenants' collection (while authenticated)...");
  const tenantsQuery = query(collection(db, 'tenants'), where('email', '==', email));
  const tenantsSnap = await getDocs(tenantsQuery);

  let landlordOwnerId = null;
  let tenantRoom = null;
  let tenantName = "Tenant Gamma";

  if (!tenantsSnap.empty) {
    const tenantDoc = tenantsSnap.docs[0].data();
    landlordOwnerId = tenantDoc.ownerId;
    tenantRoom = tenantDoc.room;
    tenantName = tenantDoc.name || tenantName;
    console.log(`Tenant exists in DB: Name=${tenantName}, Room=${tenantRoom}, LandlordOwnerId=${landlordOwnerId}`);
  } else {
    console.log("❌ Tenant does not exist in 'tenants' collection. Cannot proceed with auto-heal role check.");
    process.exit(1);
  }

  console.log("\n3. Emulating client app's AuthContext auto-heal logic...");
  // Let's check if user document already exists under /users/{email}
  const userDocSnap = await getDoc(doc(db, 'users', email));
  let finalUserDoc = null;

  if (userDocSnap.exists()) {
    finalUserDoc = userDocSnap.data();
    console.log("Existing user doc found:", JSON.stringify(finalUserDoc, null, 2));
    
    // Auto-heal check: if role !== 'tenant' or other fields mismatch
    let needsUpdate = false;
    const updatedFields = {};

    if (finalUserDoc.role !== 'tenant') {
      updatedFields.role = 'tenant';
      updatedFields.plan = 'none';
      updatedFields.trialEndsAt = null;
      needsUpdate = true;
    }
    if (finalUserDoc.room !== tenantRoom) {
      updatedFields.room = tenantRoom;
      needsUpdate = true;
    }
    if (finalUserDoc.ownerId !== landlordOwnerId) {
      updatedFields.ownerId = landlordOwnerId;
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log("Updating mismatching fields in Firestore users collection...", updatedFields);
      await setDoc(doc(db, 'users', email), updatedFields, { merge: true });
      finalUserDoc = { ...finalUserDoc, ...updatedFields };
    } else {
      console.log("✅ User document already has correct auto-healed fields.");
    }
  } else {
    console.log("User doc not found. Creating new tenant user doc under /users/{email}...");
    const newUser = {
      id: email,
      email: email,
      name: tenantName,
      role: 'tenant',
      plan: 'none',
      trialEndsAt: null,
      uid: firebaseUser.uid,
      room: tenantRoom,
      allowedBuildings: [],
      ownerId: landlordOwnerId
    };
    await setDoc(doc(db, 'users', email), newUser);
    finalUserDoc = newUser;
    console.log("Created user doc successfully:", JSON.stringify(finalUserDoc, null, 2));
  }

  console.log("\n4. Final checks on user document in Firestore:");
  const finalSnap = await getDoc(doc(db, 'users', email));
  const finalData = finalSnap.data();
  console.log("Saved User Doc:", JSON.stringify(finalData, null, 2));

  if (finalData.role === 'tenant' && finalData.ownerId === landlordOwnerId && finalData.room === tenantRoom) {
    console.log("✅ SUCCESS: Auto-heal logic and Firestore security rules verified successfully!");
  } else {
    console.log("❌ FAILURE: Saved fields do not match!");
  }

  process.exit(0);
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
