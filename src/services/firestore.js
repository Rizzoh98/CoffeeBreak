import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

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
    const groupCodes = cleanState.user?.groups?.map(g => g.code) || [];
    
    await setDoc(userRef, {
      ...cleanState,
      groupCodes,
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

/**
 * Real-time listener for all users in a specific group.
 * @param {string} groupCode - The code of the group to listen to.
 * @param {function} callback - Called with an array of user state objects.
 * @returns {function} unsubscribe function
 */
export function listenToGroupMembers(groupCode, callback) {
  if (!groupCode) return () => {};
  const q = query(
    collection(db, USERS_COL),
    where('groupCodes', 'array-contains', groupCode)
  );

  return onSnapshot(q, (snapshot) => {
    const members = [];
    snapshot.forEach((docSnap) => {
      members.push({ uid: docSnap.id, ...docSnap.data() });
    });
    callback(members);
  }, (error) => {
    console.error("Error listening to group members:", error);
  });
}

// --- INVITES SYSTEM ---

const INVITES_COL = 'invites';

export async function createInvite(groupCode, senderUid, senderName, coffeeType) {
  try {
    const invitesRef = collection(db, INVITES_COL);
    await addDoc(invitesRef, {
      groupCode,
      senderUid,
      senderName,
      coffeeType,
      status: 'active',
      timestamp: serverTimestamp(),
      responses: {} // uid -> { name, status: 'coming' | 'skipping' | '5min', timestamp }
    });
  } catch (error) {
    console.error("Error creating invite:", error);
  }
}

export async function respondToInvite(inviteId, uid, name, status) {
  try {
    const inviteRef = doc(db, INVITES_COL, inviteId);
    await updateDoc(inviteRef, {
      [`responses.${uid}`]: {
        name,
        status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error responding to invite:", error);
  }
}

export function listenToActiveInvite(groupCode, callback) {
  if (!groupCode) return () => {};
  
  // We look for the most recent active invite for this group
  // To avoid complex index requirements initially, we can just query active invites
  // and sort/limit in memory if needed, but since we expect low volume, this is fine.
  const q = query(
    collection(db, INVITES_COL),
    where('groupCode', '==', groupCode),
    where('status', '==', 'active')
  );

  return onSnapshot(q, (snapshot) => {
    const invites = [];
    snapshot.forEach((docSnap) => {
      invites.push({ id: docSnap.id, ...docSnap.data() });
    });
    // Sort by timestamp descending in memory (avoiding firestore composite index requirement)
    invites.sort((a, b) => {
      const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
      const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
      return tb - ta;
    });
    
    // Return the latest active invite
    callback(invites.length > 0 ? invites[0] : null);
  }, (error) => {
    console.error("Error listening to invites:", error);
  });
}
