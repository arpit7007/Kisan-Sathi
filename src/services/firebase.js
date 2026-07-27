// Firebase Service with LocalStorage Fallback for evaluation ease
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc,
  query,
  where
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let auth = null;
let db = null;
let useLocalDb = true;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    useLocalDb = false;
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Firebase initialization failed, falling back to LocalStorage:", error);
    useLocalDb = true;
  }
} else {
  console.log("Firebase config not fully set in .env. Using LocalStorage fallback.");
  useLocalDb = true;
}

// Local Storage Fallback implementation
const localDb = {
  getProfile: (uid) => {
    const profile = localStorage.getItem(`kisan_profile_${uid}`);
    return profile ? JSON.parse(profile) : null;
  },
  saveProfile: (uid, profile) => {
    localStorage.setItem(`kisan_profile_${uid}`, JSON.stringify(profile));
    // Also save current user ID
    localStorage.setItem('kisan_current_uid', uid);
  },
  getClaims: (uid) => {
    const claims = localStorage.getItem(`kisan_claims_${uid}`);
    return claims ? JSON.parse(claims) : [];
  },
  saveClaim: (uid, claimData) => {
    const claims = localDb.getClaims(uid);
    const newClaim = {
      ...claimData,
      claimId: `KS-${Math.floor(100000 + Math.random() * 900000)}`,
      dateOfFiling: new Date().toISOString(),
      status: claimData.status || 'Filed',
    };
    claims.push(newClaim);
    localStorage.setItem(`kisan_claims_${uid}`, JSON.stringify(claims));
    return newClaim.claimId;
  },
  updateClaimStatus: (uid, claimId, status) => {
    const claims = localDb.getClaims(uid);
    const updated = claims.map(c => c.claimId === claimId ? { ...c, status } : c);
    localStorage.setItem(`kisan_claims_${uid}`, JSON.stringify(updated));
  },
  getApplications: (uid) => {
    const apps = localStorage.getItem(`kisan_applications_${uid}`);
    return apps ? JSON.parse(apps) : [];
  },
  saveApplication: (uid, appData) => {
    const apps = localDb.getApplications(uid);
    const newApp = {
      ...appData,
      appId: appData.appId || `APP-${Math.floor(100000 + Math.random() * 900000)}`,
      dateCreated: new Date().toISOString()
    };
    apps.push(newApp);
    localStorage.setItem(`kisan_applications_${uid}`, JSON.stringify(apps));
    return newApp.appId;
  }
};

// 1. Auth Setup (Anonymous Sign-In for demo)
export async function authenticateFarmer(onUserLoaded) {
  if (useLocalDb) {
    // Generate a static mock UID or fetch existing
    let uid = localStorage.getItem('kisan_current_uid');
    if (!uid) {
      uid = `farmer_demo_${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('kisan_current_uid', uid);
    }
    onUserLoaded({ uid, isAnonymous: true });
    return uid;
  }

  try {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        onUserLoaded(user);
      } else {
        const credential = await signInAnonymously(auth);
        onUserLoaded(credential.user);
      }
    });
  } catch (error) {
    console.error("Firebase Anonymous Auth failed, falling back to Local Auth:", error);
    // Fall back to local
    let uid = localStorage.getItem('kisan_current_uid') || `farmer_demo_fallback`;
    localStorage.setItem('kisan_current_uid', uid);
    onUserLoaded({ uid, isAnonymous: true });
  }
}

// 2. Profile Management
export async function saveFarmerProfile(uid, profile) {
  if (useLocalDb) {
    localDb.saveProfile(uid, profile);
    return true;
  }

  try {
    await setDoc(doc(db, "farmers", uid), {
      ...profile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Firestore saveProfile failed, saving locally:", error);
    localDb.saveProfile(uid, profile);
    return true;
  }
}

export async function getFarmerProfile(uid) {
  if (useLocalDb) {
    return localDb.getProfile(uid);
  }

  try {
    const docSnap = await getDoc(doc(db, "farmers", uid));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    // Try local
    return localDb.getProfile(uid);
  } catch (error) {
    console.error("Firestore getProfile failed, fetching locally:", error);
    return localDb.getProfile(uid);
  }
}

// 3. Claims Management
export async function saveClaim(uid, claimData) {
  if (useLocalDb) {
    return localDb.saveClaim(uid, claimData);
  }

  try {
    const claimId = `KS-${Math.floor(100000 + Math.random() * 900000)}`;
    const newClaim = {
      ...claimData,
      claimId,
      farmerId: uid,
      dateOfFiling: new Date().toISOString(),
      status: 'Filed'
    };
    await setDoc(doc(db, "claims", claimId), newClaim);
    
    // Also save in local storage for double-caching
    const claims = localDb.getClaims(uid);
    claims.push(newClaim);
    localStorage.setItem(`kisan_claims_${uid}`, JSON.stringify(claims));

    return claimId;
  } catch (error) {
    console.error("Firestore saveClaim failed, saving locally:", error);
    return localDb.saveClaim(uid, claimData);
  }
}

export async function getClaims(uid) {
  if (useLocalDb) {
    return localDb.getClaims(uid);
  }

  try {
    const q = query(collection(db, "claims"), where("farmerId", "==", uid));
    const querySnapshot = await getDocs(q);
    const claims = [];
    querySnapshot.forEach((doc) => {
      claims.push(doc.data());
    });
    
    if (claims.length === 0) {
      return localDb.getClaims(uid);
    }
    
    // Cache locally
    localStorage.setItem(`kisan_claims_${uid}`, JSON.stringify(claims));
    return claims;
  } catch (error) {
    console.error("Firestore getClaims failed, loading from cache:", error);
    return localDb.getClaims(uid);
  }
}

export async function updateClaimStatus(uid, claimId, status) {
  // Always update locally
  localDb.updateClaimStatus(uid, claimId, status);
  
  if (useLocalDb) return;

  try {
    await updateDoc(doc(db, "claims", claimId), { status });
  } catch (error) {
    console.error("Firestore updateClaimStatus failed, saved locally only:", error);
  }
}

export async function saveApplication(uid, appData) {
  if (useLocalDb) {
    return localDb.saveApplication(uid, appData);
  }

  try {
    const appId = appData.appId || `APP-${Math.floor(100000 + Math.random() * 900000)}`;
    const newApp = {
      ...appData,
      appId,
      farmerId: uid,
      dateCreated: new Date().toISOString()
    };
    await setDoc(doc(db, "applications", uid, "user_applications", appId), newApp);
    
    // Also save in local storage for double-caching
    localDb.saveApplication(uid, newApp);

    return appId;
  } catch (error) {
    console.error("Firestore saveApplication failed, saving locally:", error);
    return localDb.saveApplication(uid, appData);
  }
}

export async function getApplications(uid) {
  if (useLocalDb) {
    return localDb.getApplications(uid);
  }

  try {
    const q = collection(db, "applications", uid, "user_applications");
    const querySnapshot = await getDocs(q);
    const apps = [];
    querySnapshot.forEach((doc) => {
      apps.push(doc.data());
    });
    
    if (apps.length === 0) {
      return localDb.getApplications(uid);
    }
    
    // Cache locally
    localStorage.setItem(`kisan_applications_${uid}`, JSON.stringify(apps));
    return apps;
  } catch (error) {
    console.error("Firestore getApplications failed, loading from cache:", error);
    return localDb.getApplications(uid);
  }
}
