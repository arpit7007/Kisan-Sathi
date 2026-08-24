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
      try {
        if (user) {
          onUserLoaded(user);
        } else {
          const credential = await signInAnonymously(auth);
          onUserLoaded(credential.user);
        }
      } catch (authErr) {
        console.warn("Firebase Anonymous Auth restricted or failed, using local auth:", authErr?.message || authErr);
        useLocalDb = true;
        let uid = localStorage.getItem('kisan_current_uid') || `farmer_demo_fallback`;
        localStorage.setItem('kisan_current_uid', uid);
        onUserLoaded({ uid, isAnonymous: true });
      }
    });
  } catch (error) {
    console.warn("Firebase Auth failed, falling back to Local Auth:", error?.message || error);
    useLocalDb = true;
    let uid = localStorage.getItem('kisan_current_uid') || `farmer_demo_fallback`;
    localStorage.setItem('kisan_current_uid', uid);
    onUserLoaded({ uid, isAnonymous: true });
  }
}

// Helper to handle Firestore permission or network failures gracefully
function handleFirestoreError(methodName, error) {
  console.warn(`Firestore ${methodName} warning (${error?.code || 'error'}): ${error?.message || error}. Falling back to LocalStorage.`);
  if (error?.code === 'permission-denied' || error?.message?.includes('permissions')) {
    // Switch to local DB for the remainder of session to avoid constant logs
    useLocalDb = true;
  }
}

// 2. Profile Management
export async function saveFarmerProfile(uid, profile) {
  // Always update LocalStorage first as local backup
  localDb.saveProfile(uid, profile);

  if (useLocalDb) {
    return true;
  }

  try {
    await setDoc(doc(db, "farmers", uid), {
      ...profile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError("saveProfile", error);
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
    return localDb.getProfile(uid);
  } catch (error) {
    handleFirestoreError("getProfile", error);
    return localDb.getProfile(uid);
  }
}

// 3. Claims Management
export async function saveClaim(uid, claimData) {
  const localClaimId = localDb.saveClaim(uid, claimData);

  if (useLocalDb) {
    return localClaimId;
  }

  try {
    const claimId = localClaimId;
    const newClaim = {
      ...claimData,
      claimId,
      farmerId: uid,
      dateOfFiling: new Date().toISOString(),
      status: 'Filed'
    };
    await setDoc(doc(db, "claims", claimId), newClaim);
    return claimId;
  } catch (error) {
    handleFirestoreError("saveClaim", error);
    return localClaimId;
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
    
    localStorage.setItem(`kisan_claims_${uid}`, JSON.stringify(claims));
    return claims;
  } catch (error) {
    handleFirestoreError("getClaims", error);
    return localDb.getClaims(uid);
  }
}

export async function updateClaimStatus(uid, claimId, status) {
  localDb.updateClaimStatus(uid, claimId, status);
  
  if (useLocalDb) return;

  try {
    await updateDoc(doc(db, "claims", claimId), { status });
  } catch (error) {
    handleFirestoreError("updateClaimStatus", error);
  }
}

export async function addClaimStatusHistory(uid, claimId, historyEvent) {
  const existingClaims = localDb.getClaims(uid);
  const updated = existingClaims.map(c => {
    if ((c.claimId || c.internalReportId) === claimId) {
      const history = c.statusHistory || [];
      return {
        ...c,
        status: historyEvent.status || c.status,
        statusSource: historyEvent.source || c.statusSource || 'FARMER_REPORTED',
        officialClaimId: historyEvent.officialReference || c.officialClaimId,
        updatedAt: new Date().toISOString(),
        statusHistory: [...history, { ...historyEvent, timestamp: new Date().toISOString() }]
      };
    }
    return c;
  });
  localStorage.setItem(`kisan_claims_${uid}`, JSON.stringify(updated));

  const activeReportStr = localStorage.getItem('kisan_active_loss_report');
  if (activeReportStr) {
    try {
      const active = JSON.parse(activeReportStr);
      if ((active.claimId || active.internalReportId) === claimId) {
        const history = active.statusHistory || [];
        const updatedActive = {
          ...active,
          status: historyEvent.status || active.status,
          statusSource: historyEvent.source || active.statusSource || 'FARMER_REPORTED',
          officialClaimId: historyEvent.officialReference || active.officialClaimId,
          updatedAt: new Date().toISOString(),
          statusHistory: [...history, { ...historyEvent, timestamp: new Date().toISOString() }]
        };
        localStorage.setItem('kisan_active_loss_report', JSON.stringify(updatedActive));
      }
    } catch (e) {}
  }
}

export async function saveApplication(uid, appData) {
  const localAppId = localDb.saveApplication(uid, appData);

  if (useLocalDb) {
    return localAppId;
  }

  try {
    const appId = localAppId;
    const newApp = {
      ...appData,
      appId,
      farmerId: uid,
      dateCreated: new Date().toISOString()
    };
    await setDoc(doc(db, "applications", uid, "user_applications", appId), newApp);
    return appId;
  } catch (error) {
    handleFirestoreError("saveApplication", error);
    return localAppId;
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
    
    localStorage.setItem(`kisan_applications_${uid}`, JSON.stringify(apps));
    return apps;
  } catch (error) {
    handleFirestoreError("getApplications", error);
    return localDb.getApplications(uid);
  }
}

