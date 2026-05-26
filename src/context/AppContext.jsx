import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { BADGES, checkBadgeCondition } from '../data/badges';

const AppContext = createContext();

const DEFAULT_STATS = {
  breakCount: 0, breakToday: 0, breakTodayDate: '',
  curiosityCount: 0, riddleCount: 0,
  slotAttempts: 0, slotWins: 0,
  pollVotes: 0, zenCount: 0, rouletteChosen: 0,
  streak: 1, lastVisitDate: '',
  sectionsVisited: 0, visitedSections: {}
};

const initialState = {
  user: null,             // { userName, interests }
  currentScreen: 'break',
  stats: { ...DEFAULT_STATS },
  unlockedBadges: [],
  moodToday: null,
  pollVotedDays: {},
  mascotState: 'idle',    // idle | sleeping | drinking | celebrating
  pendingBadge: null,     // badge object to show in popup
  toasts: []              // active toast messages
};

function loadSavedState() {
  try {
    const userRaw = localStorage.getItem('coffeebreak_user');
    const stateRaw = localStorage.getItem('coffeebreak_state');
    const user = userRaw ? JSON.parse(userRaw) : null;
    const saved = stateRaw ? JSON.parse(stateRaw) : {};
    return {
      ...initialState,
      user,
      stats: { ...DEFAULT_STATS, ...(saved.stats || {}) },
      unlockedBadges: saved.unlockedBadges || [],
      moodToday: saved.moodToday || null,
      pollVotedDays: saved.pollVotedDays || {}
    };
  } catch {
    return initialState;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'NAVIGATE':
      return { ...state, currentScreen: action.payload };
    case 'UPDATE_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } };
    case 'INCREMENT_STAT': {
      const key = action.payload;
      return { ...state, stats: { ...state.stats, [key]: (state.stats[key] || 0) + 1 } };
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
    case 'VISIT_SECTION': {
      const visited = { ...state.stats.visitedSections, [action.payload]: true };
      return {
        ...state,
        stats: {
          ...state.stats,
          visitedSections: visited,
          sectionsVisited: Object.keys(visited).length
        }
      };
    }
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadSavedState);
  const mascotTimerRef = useRef(null);

  // Persist state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('coffeebreak_state', JSON.stringify({
        stats: state.stats,
        unlockedBadges: state.unlockedBadges,
        moodToday: state.moodToday,
        pollVotedDays: state.pollVotedDays
      }));
    } catch { /* ignore */ }
  }, [state.stats, state.unlockedBadges, state.moodToday, state.pollVotedDays]);

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
      payload: { streak: newStreak, lastVisitDate: today, breakToday: 0, breakTodayDate: today }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Check badges whenever stats change
  const checkBadges = useCallback(() => {
    for (const badge of BADGES) {
      if (state.unlockedBadges.includes(badge.id)) continue;
      if (checkBadgeCondition(badge.id, state.stats)) {
        dispatch({ type: 'UNLOCK_BADGE', payload: badge });
        break; // Show one badge at a time
      }
    }
  }, [state.stats, state.unlockedBadges]);

  useEffect(() => {
    checkBadges();
  }, [state.stats]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mascot auto-reset
  useEffect(() => {
    if (state.mascotState !== 'idle' && state.mascotState !== 'sleeping') {
      const ms = state.mascotState === 'drinking' ? 1500 : 1000;
      mascotTimerRef.current = setTimeout(() => {
        dispatch({ type: 'SET_MASCOT', payload: 'idle' });
      }, ms);
      return () => clearTimeout(mascotTimerRef.current);
    }
  }, [state.mascotState]);

  // Helper actions
  const setUser = useCallback((user) => {
    localStorage.setItem('coffeebreak_user', JSON.stringify(user));
    dispatch({ type: 'SET_USER', payload: user });
  }, []);

  const navigateTo = useCallback((screen) => {
    dispatch({ type: 'NAVIGATE', payload: screen });
    dispatch({ type: 'VISIT_SECTION', payload: screen });
  }, []);

  const incrementStat = useCallback((key) => {
    dispatch({ type: 'INCREMENT_STAT', payload: key });
  }, []);

  const setMascot = useCallback((s) => {
    dispatch({ type: 'SET_MASCOT', payload: s });
  }, []);

  const addToast = useCallback((sender, msg) => {
    const id = Date.now() + Math.random();
    dispatch({ type: 'ADD_TOAST', payload: { id, sender, msg } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4000);
  }, []);

  const value = {
    state, dispatch,
    setUser, navigateTo, incrementStat, setMascot, addToast, checkBadges
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
