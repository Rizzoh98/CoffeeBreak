import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Collection names
const USERS_COL = 'users';

/**
 * Syncs the entire user state (profile, stats, etc) to Firestore.
 * This can be used as a drop-in replacement/addition to localStorage.
 */
export async function syncUserStateToCloud(uid, fullState) {
  if (!uid) return;
  try {
    const userRef = doc(db, USERS_COL, uid);
    
    // Convert undefined to null for Firestore compatibility
    const cleanState = JSON.parse(JSON.stringify(fullState));
    
    await setDoc(userRef, {
      ...cleanState,
      lastSynced: new Date().toISOString()
    }, { merge: true });
    
  } catch (error) {
    console.error("Error syncing state to Firestore:", error);
  }
}

/**
 * Fetches the user's complete state from Firestore upon login.
 */
export async function fetchUserStateFromCloud(uid) {
  if (!uid) return null;
  try {
    const userRef = doc(db, USERS_COL, uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching state from Firestore:", error);
    return null;
  }
}
