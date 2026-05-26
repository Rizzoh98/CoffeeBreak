import { db } from '../config/firebase';
import { 
  doc, getDoc, setDoc, updateDoc, deleteField,
  collection, query, where, onSnapshot, addDoc, 
  serverTimestamp, arrayUnion, arrayRemove
} from 'firebase/firestore';

// ============================================================
// COLLECTION NAMES
// ============================================================
const USERS_COL = 'users';
const GROUPS_COL = 'groups';
const INVITES_COL = 'invites';

// ============================================================
// USER STATE SYNC
// ============================================================

/**
 * Syncs the entire user state (profile, stats, etc) to Firestore.
 */
export async function syncUserStateToCloud(uid, fullState) {
  if (!uid) return;
  try {
    const userRef = doc(db, USERS_COL, uid);
    const cleanState = JSON.parse(JSON.stringify(fullState));
    
    // Compute groupCodes from the groups array for query indexing
    const groupCodes = (cleanState.user?.groups || []).map(g => g.code).filter(Boolean);
    
    await setDoc(userRef, {
      ...cleanState,
      groupCodes,
      lastSynced: new Date().toISOString()
    }, { merge: true });
    
  } catch (error) {
    console.error("[Firestore] Error syncing state:", error);
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
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error("[Firestore] Error fetching state:", error);
    return null;
  }
}

// ============================================================
// GROUPS — dedicated collection as source of truth
// ============================================================

/**
 * Creates a new group in Firestore.
 * Document ID = the group code itself.
 * @returns {{ name, code }} the group object for local state
 */
export async function createGroup(code, name, creatorUid, creatorName) {
  try {
    const groupRef = doc(db, GROUPS_COL, code);
    
    // Use Promise.race to enforce a timeout (Firebase sometimes hangs on permission errors or bad connections)
    const writePromise = setDoc(groupRef, {
      name,
      code,
      creatorUid,
      createdAt: serverTimestamp(),
      members: [{
        uid: creatorUid,
        name: creatorName,
        joinedAt: new Date().toISOString()
      }]
    });
    
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 5000)
    );
    
    await Promise.race([writePromise, timeoutPromise]);

    console.log("[Firestore] Group created:", code, name);
    return { name, code, isCreator: true };
  } catch (error) {
    console.error("[Firestore] Error creating group:", error);
    return null;
  }
}

/**
 * Joins an existing group by code.
 * Returns the group data if found, null if code doesn't exist.
 */
export async function joinGroup(code, uid, userName) {
  try {
    const groupRef = doc(db, GROUPS_COL, code);
    
    // Add timeout to prevent hanging on bad connections/permissions
    const getPromise = getDoc(groupRef);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), 5000)
    );
    
    const groupSnap = await Promise.race([getPromise, timeoutPromise]);
    
    if (!groupSnap.exists()) {
      console.warn("[Firestore] Group not found:", code);
      return null; // Group doesn't exist
    }
    
    const groupData = groupSnap.data();
    
    // Check if already a member
    const alreadyMember = groupData.members?.some(m => m.uid === uid);
    if (!alreadyMember) {
      // Add user to the group's member list
      const updatePromise = updateDoc(groupRef, {
        members: arrayUnion({
          uid,
          name: userName,
          joinedAt: new Date().toISOString()
        })
      });
      await Promise.race([updatePromise, timeoutPromise]);
      console.log("[Firestore] User joined group:", code);
    }
    
    return { name: groupData.name, code: groupData.code, isCreator: false };
  } catch (error) {
    console.error("[Firestore] Error joining group:", error);
    return null;
  }
}

/**
 * Fetches group info by code (for validation/display).
 */
export async function getGroup(code) {
  try {
    const groupRef = doc(db, GROUPS_COL, code);
    const groupSnap = await getDoc(groupRef);
    return groupSnap.exists() ? groupSnap.data() : null;
  } catch (error) {
    console.error("[Firestore] Error fetching group:", error);
    return null;
  }
}

/**
 * Real-time listener for all users in a specific group.
 * Uses the groupCodes array on user documents for efficient querying.
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
    console.log("[Firestore] Group members update:", groupCode, "→", members.length, "members");
    callback(members);
  }, (error) => {
    console.error("[Firestore] Error listening to group members:", error);
  });
}

/**
 * Leaves a group. Removes the user from the group's member list.
 * If no members remain, deletes the group document.
 */
export async function leaveGroup(code, uid) {
  try {
    const groupRef = doc(db, GROUPS_COL, code);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) return true;
    
    const groupData = groupSnap.data();
    const updatedMembers = (groupData.members || []).filter(m => m.uid !== uid);
    
    if (updatedMembers.length === 0) {
      // Last member leaving — delete the group
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(groupRef);
      console.log("[Firestore] Group deleted (empty):", code);
    } else {
      await updateDoc(groupRef, { members: updatedMembers });
      console.log("[Firestore] User left group:", code);
    }
    
    return true;
  } catch (error) {
    console.error("[Firestore] Error leaving group:", error);
    return false;
  }
}

// ============================================================
// INVITES SYSTEM
// ============================================================

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
      responses: {}
    });
  } catch (error) {
    console.error("[Firestore] Error creating invite:", error);
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
    console.error("[Firestore] Error responding to invite:", error);
  }
}

export function listenToActiveInvite(groupCode, callback) {
  if (!groupCode) return () => {};
  
  const q = query(
    collection(db, INVITES_COL),
    where('groupCode', '==', groupCode)
  );

  return onSnapshot(q, (snapshot) => {
    const invites = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'active') {
        invites.push({ id: docSnap.id, ...data });
      }
    });
    // Most recent first
    invites.sort((a, b) => {
      const ta = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
      const tb = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
      return tb - ta;
    });
    callback(invites.length > 0 ? invites[0] : null);
  }, (error) => {
    console.error("[Firestore] Error listening to invites:", error);
  });
}
