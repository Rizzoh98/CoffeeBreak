import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { BADGES, checkBadgeCondition } from '../data/badges';
import { calculateCalories } from '../data/coffeeTypes';
import { useAuth } from './AuthContext';
import { syncUserStateToCloud, fetchUserStateFromCloud } from '../services/firestore';

const AppContext = createContext();

const DEFAULT_STATS = {
  breakCount: 0, breakToday: 0, breakTodayDate: '',
  curiosityCount: 0, riddleCount: 0,
  slotAttempts: 0, slotWins: 0,
  pollVotes: 0, zenCount: 0, rouletteChosen: 0,
  streak: 1, lastVisitDate: '',
  sectionsVisited: 0, visitedSections: {},
  totalCalories: 0, caloriesToday: 0, caloriesTodayDate: ''
};

const initialState = {
  user: null,
  /* user shape: {
    userName, interests,
    coffeeType,    // coffee key string
    sugarLevel,    // 0-3
    group: { name, code, isCreator } | null
  } */
  onboardingStep: 0,    // 0 = not started, 1 = profile, 2 = group, 3 = done
  currentScreen: 'break',
  stats: { ...DEFAULT_STATS },
  unlockedBadges: [],
  moodToday: null,
  pollVotedDays: {},
  mascotState: 'idle',
  pendingBadge: null,
  toasts: [],
  showProfile: false,   // profile drawer open/close
  coffeeLog: []         // array of { timestamp, coffeeType, sugarLevel, kcal }
};

function loadSavedState() {
  try {
    const userRaw = localStorage.getItem('coffeebreak_user');
    const stateRaw = localStorage.getItem('coffeebreak_state');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const saved = stateRaw ? JSON.parse(stateRaw) : {};

    // Migrate old user object to multi-group
    if (user && user.group && !user.groups) {
      user.groups = [user.group];
      user.activeGroupCode = user.group.code;
      delete user.group;
    }

    // Determine onboarding step
    let onboardingStep = 0;
    if (user) {
      if (user.coffeeType !== undefined && (user.groups !== undefined || user.group !== undefined)) {
        onboardingStep = 3; // fully done
      } else if (user.coffeeType !== undefined) {
        onboardingStep = 2; // needs group
      } else if (user.userName) {
        // Legacy user without coffee prefs — send to step 1 to complete
        onboardingStep = 1;
      }
    }

    return {
      ...initialState,
      user,
      onboardingStep,
      stats: { ...DEFAULT_STATS, ...(saved.stats || {}) },
      unlockedBadges: saved.unlockedBadges || [],
      moodToday: saved.moodToday || null,
      pollVotedDays: saved.pollVotedDays || {},
      coffeeLog: saved.coffeeLog || []
    };
  } catch {
    return initialState;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'ADD_GROUP': {
      const currentGroups = state.user.groups || [];
      const newGroups = [...currentGroups, action.payload];
      return {
        ...state,
        user: { ...state.user, groups: newGroups, activeGroupCode: action.payload.code }
      };
    }
    case 'SET_ACTIVE_GROUP':
      return { ...state, user: { ...state.user, activeGroupCode: action.payload } };
    case 'SET_ONBOARDING_STEP':
      return { ...state, onboardingStep: action.payload };
    case 'NAVIGATE':
      return { ...state, currentScreen: action.payload };
    case 'UPDATE_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } };
    case 'INCREMENT_STAT': {
      const key = action.payload;
      return { ...state, stats: { ...state.stats, [key]: (state.stats[key] || 0) + 1 } };
    }
    case 'LOG_COFFEE': {
      const { coffeeType, sugarLevel } = action.payload;
      const kcal = calculateCalories(coffeeType, sugarLevel);
      const today = new Date().toDateString();
      const entry = { timestamp: Date.now(), coffeeType, sugarLevel, kcal };
      const isNewDay = state.stats.caloriesTodayDate !== today;
      return {
        ...state,
        coffeeLog: [...state.coffeeLog, entry],
        stats: {
          ...state.stats,
          breakCount: state.stats.breakCount + 1,
          breakToday: (isNewDay ? 0 : state.stats.breakToday) + 1,
          breakTodayDate: today,
          totalCalories: state.stats.totalCalories + kcal,
          caloriesToday: (isNewDay ? 0 : state.stats.caloriesToday) + kcal,
          caloriesTodayDate: today
        }
      };
    }
    case 'UNLOCK_BADGE':
      if (state.unlockedBadges.includes(action.payload.id)) return state;
      return {
        ...state,
        unlockedBadges: [...state.unlockedBadges, action.payload.id],
        pendingBadge: action.payload
      };
    case 'DISMISS_BADGE':
      return { ...state, pendingBadge: null };
    case 'SET_MOOD':
      return { ...state, moodToday: action.payload };
    case 'VOTE_POLL':
      return {
        ...state,
        pollVotedDays: { ...state.pollVotedDays, [action.payload.key]: action.payload.index },
        stats: { ...state.stats, pollVotes: (state.stats.pollVotes || 0) + 1 }
      };
    case 'SET_MASCOT':
      return { ...state, mascotState: action.payload };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'TOGGLE_PROFILE':
      return { ...state, showProfile: !state.showProfile };
    case 'CLOSE_PROFILE':
      return { ...state, showProfile: false };
    case 'VISIT_SECTION': {
      const visited = { ...state.stats.visitedSections, [action.payload]: true };
      return {
        ...state,
        stats: { ...state.stats, visitedSections: visited, sectionsVisited: Object.keys(visited).length }
      };
    }
    case 'RESTORE_STATE_FROM_CLOUD': {
      let restoredUser = action.payload.user;
      if (restoredUser && restoredUser.group && !restoredUser.groups) {
        restoredUser.groups = [restoredUser.group];
        restoredUser.activeGroupCode = restoredUser.group.code;
        delete restoredUser.group;
      }
      return {
        ...state,
        ...action.payload,
        user: restoredUser,
        onboardingStep: 3 // If they have cloud state, they finished onboarding
      };
    }
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadSavedState);
  const mascotTimerRef = useRef(null);
  const { authUser, isAuthenticated } = useAuth();
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Load from Cloud on Login
  useEffect(() => {
    async function loadCloudState() {
      if (!authUser) return;
      setIsCloudSyncing(true);
      const cloudState = await fetchUserStateFromCloud(authUser.uid);
      if (cloudState) {
        // Strip out lastSynced so we don't mess up local state types
        const { lastSynced, ...cleanState } = cloudState;
        dispatch({ type: 'RESTORE_STATE_FROM_CLOUD', payload: cleanState });
      }
      setIsCloudSyncing(false);
    }
    loadCloudState();
  }, [authUser]);

  // Persist user to localStorage & Cloud
  useEffect(() => {
    if (state.user) {
      try {
        localStorage.setItem('coffeebreak_user', JSON.stringify(state.user));
        if (authUser && !isCloudSyncing) {
            syncUserStateToCloud(authUser.uid, {
                user: state.user,
                stats: state.stats,
                unlockedBadges: state.unlockedBadges,
                moodToday: state.moodToday,
                pollVotedDays: state.pollVotedDays,
                coffeeLog: state.coffeeLog
            });
        }
      } catch { /* ignore */ }
    }
  }, [state.user, authUser, isCloudSyncing, state.stats, state.unlockedBadges, state.moodToday, state.pollVotedDays, state.coffeeLog]);

  // Persist state changes to localStorage & Cloud
  useEffect(() => {
    try {
      const stateToSave = {
        stats: state.stats,
        unlockedBadges: state.unlockedBadges,
        moodToday: state.moodToday,
        pollVotedDays: state.pollVotedDays,
        coffeeLog: state.coffeeLog
      };
      localStorage.setItem('coffeebreak_state', JSON.stringify(stateToSave));
      
      if (authUser && state.user && !isCloudSyncing) {
          syncUserStateToCloud(authUser.uid, { user: state.user, ...stateToSave });
      }
    } catch { /* ignore */ }
  }, [state.stats, state.unlockedBadges, state.moodToday, state.pollVotedDays, state.coffeeLog, authUser, state.user, isCloudSyncing]);

  // Update streak on load
  useEffect(() => {
    const today = new Date().toDateString();
    const lastVisit = state.stats.lastVisitDate;
    if (lastVisit === today) return;

    let newStreak = state.stats.streak;
    if (lastVisit) {
      const diffDays = Math.floor((new Date(today) - new Date(lastVisit)) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) newStreak++;
      else if (diffDays > 1) newStreak = 1;
    }

    dispatch({
      type: 'UPDATE_STATS',
      payload: { streak: newStreak, lastVisitDate: today, breakToday: 0, breakTodayDate: today, caloriesToday: 0, caloriesTodayDate: today }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check badges
  const checkBadges = useCallback(() => {
    for (const badge of BADGES) {
      if (state.unlockedBadges.includes(badge.id)) continue;
      if (checkBadgeCondition(badge.id, state.stats)) {
        dispatch({ type: 'UNLOCK_BADGE', payload: badge });
        break;
      }
    }
  }, [state.stats, state.unlockedBadges]);

  useEffect(() => { checkBadges(); }, [state.stats]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mascot auto-reset
  useEffect(() => {
    if (state.mascotState !== 'idle' && state.mascotState !== 'sleeping') {
      const ms = state.mascotState === 'drinking' ? 1500 : 1000;
      mascotTimerRef.current = setTimeout(() => dispatch({ type: 'SET_MASCOT', payload: 'idle' }), ms);
      return () => clearTimeout(mascotTimerRef.current);
    }
  }, [state.mascotState]);

  // Helper actions
  const setUser = useCallback((user) => dispatch({ type: 'SET_USER', payload: user }), []);
  const updateUser = useCallback((data) => dispatch({ type: 'UPDATE_USER', payload: data }), []);
  const navigateTo = useCallback((screen) => {
    dispatch({ type: 'NAVIGATE', payload: screen });
    dispatch({ type: 'VISIT_SECTION', payload: screen });
  }, []);
  const incrementStat = useCallback((key) => dispatch({ type: 'INCREMENT_STAT', payload: key }), []);
  const setMascot = useCallback((s) => dispatch({ type: 'SET_MASCOT', payload: s }), []);
  const addToast = useCallback((sender, msg) => {
    const id = Date.now() + Math.random();
    dispatch({ type: 'ADD_TOAST', payload: { id, sender, msg } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4000);
  }, []);
  const logCoffee = useCallback((coffeeType, sugarLevel) => {
    dispatch({ type: 'LOG_COFFEE', payload: { coffeeType, sugarLevel } });
  }, []);

  const value = {
    state, dispatch,
    setUser, updateUser, navigateTo, incrementStat, setMascot, addToast, checkBadges, logCoffee
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
