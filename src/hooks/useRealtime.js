import { useState, useEffect } from 'react';
import { listenToGroupMembers, listenToActiveInvite } from '../services/firestore';

export function useGroupMembers(activeGroupCode) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!activeGroupCode) {
      setMembers([]);
      return;
    }
    
    // Set up the real-time listener
    const unsubscribe = listenToGroupMembers(activeGroupCode, (newMembers) => {
      // Sort by status/stats if needed
      setMembers(newMembers);
    });

    return () => unsubscribe();
  }, [activeGroupCode]);

  return members;
}

export function useActiveInvite(activeGroupCode) {
  const [activeInvite, setActiveInvite] = useState(null);

  useEffect(() => {
    if (!activeGroupCode) {
      setActiveInvite(null);
      return;
    }

    const unsubscribe = listenToActiveInvite(activeGroupCode, (invite) => {
      setActiveInvite(invite);
    });

    return () => unsubscribe();
  }, [activeGroupCode]);

  return activeInvite;
}
