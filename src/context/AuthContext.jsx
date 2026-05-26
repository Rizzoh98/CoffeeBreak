import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, googleProvider } from '../config/firebase';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);    // Firebase user object
  const [authLoading, setAuthLoading] = useState(true); // loading on init
  const [authError, setAuthError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      // User closed popup or error
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError(error.message);
      }
      return null;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      // Clear local app data
      localStorage.removeItem('coffeebreak_user');
      localStorage.removeItem('coffeebreak_state');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  const value = {
    authUser,
    authLoading,
    authError,
    isAuthenticated: !!authUser,
    signInWithGoogle,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
