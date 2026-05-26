import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { COFFEE_TYPES, SUGAR_LEVELS } from '../data/coffeeTypes';
import GroupSetup from './GroupSetup';

const TOPICS = [
  { key: 'tecnologia', emoji: '🖥️', label: 'Tecnologia' },
  { key: 'scienza', emoji: '🔬', label: 'Scienza' },
  { key: 'sport', emoji: '⚽', label: 'Sport' },
  { key: 'cinema', emoji: '🎬', label: 'Cinema' },
  { key: 'musica', emoji: '🎵', label: 'Musica' },
  { key: 'cucina', emoji: '🍳', label: 'Cucina' },
  { key: 'viaggi', emoji: '✈️', label: 'Viaggi' },
  { key: 'storia', emoji: '📜', label: 'Storia' },
  { key: 'natura', emoji: '🌿', label: 'Natura' },
  { key: 'arte', emoji: '🎨', label: 'Arte' },
  { key: 'gaming', emoji: '🎮', label: 'Gaming' },
  { key: 'spazio', emoji: '🚀', label: 'Spazio' }
];

export default function Onboarding() {
  const { state, dispatch, setUser } = useApp();
  const { authUser, isAuthenticated, signInWithGoogle, authError } = useAuth();

  // Determine starting step: 0=login, 1=profile, 2=group
  const getInitialStep = () => {
    if (!isAuthenticated) return 0;
    if (state.onboardingStep >= 3) return 1; // re-doing onboarding
    if (state.onboardingStep === 2) return 2;
    return 1;
  };

  const [step, setStep] = useState(getInitialStep);
  const [signingIn, setSigningIn] = useState(false);

  // Step 1 state
  const [name, setName] = useState(state.user?.userName || authUser?.displayName || '');
  const [coffeeType, setCoffeeType] = useState(state.user?.coffeeType || '');
  const [sugarLevel, setSugarLevel] = useState(state.user?.sugarLevel ?? 1);
  const [interests, setInterests] = useState(new Set(state.user?.interests || []));

  const toggleTopic = (key) => {
    setInterests(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Step 0: Google Sign-In
  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    const user = await signInWithGoogle();
    setSigningIn(false);
    if (user) {
      // Pre-fill name from Google account
      setName(user.displayName || '');
      setStep(1);
    }
  };

  // Step 1: Profile → Step 2
  const canGoStep2 = name.trim().length >= 2 && coffeeType && interests.size >= 1;

  const handleStep1Submit = () => {
    if (!canGoStep2) return;
    const user = {
      ...state.user,
      uid: authUser?.uid,
      email: authUser?.email,
      photoURL: authUser?.photoURL,
      userName: name.trim(),
      coffeeType,
      sugarLevel,
      interests: [...interests],
      group: state.user?.group || null
    };
    setUser(user);
    dispatch({ type: 'SET_ONBOARDING_STEP', payload: 2 });
    setStep(2);
  };

  // Step 2: Group Setup Complete
  const handleGroupComplete = (group) => {
    // If skipping group, just mark onboarding complete
    if (!group) {
      dispatch({ type: 'SET_ONBOARDING_STEP', payload: 3 });
      return;
    }

    // Save initial group to user profile in new format
    setUser({ 
        ...state.user, 
        groups: [group],
        activeGroupCode: group.code
    });
    dispatch({ type: 'SET_ONBOARDING_STEP', payload: 3 });
  };

  const handleSkipGroup = () => {
    const updatedUser = { ...state.user, group: null };
    setUser(updatedUser);
    dispatch({ type: 'SET_ONBOARDING_STEP', payload: 3 });
  };

  // Total steps for progress indicator
  const totalSteps = 3;
  const activeStep = step;

  return (
    <div className="onboarding-overlay active">
      <div className="onboarding-content">
        {/* Logo */}
        <div className="onboarding-logo">
          <span className="logo-icon">☕</span>
        </div>
        <h1 className="onboarding-title">
          {'CoffeeBreak'.split('').map((ch, i) => (
            <span key={i} className="title-letter" style={{ '--i': i }}>{ch}</span>
          ))}
        </h1>

        {/* Step 0: Google Sign-In */}
        {step === 0 && (
          <div className="onboarding-form onboarding-step-enter">
            <p className="onboarding-subtitle">Pausa caffè con i tuoi colleghi</p>

            <div className="auth-section">
              <button
                className="google-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={signingIn}
              >
                <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>{signingIn ? 'Accesso in corso...' : 'Continua con Google'}</span>
              </button>

              {authError && (
                <p className="auth-error">❌ {authError}</p>
              )}
            </div>
          </div>
        )}

        {/* Progress indicator (steps 1-2 only, after login) */}
        {step >= 1 && (
          <>
            <div className="onboarding-progress">
              <div className={`progress-dot ${step >= 1 ? 'active' : ''}`}>1</div>
              <div className="progress-line"><div className={`progress-fill ${step >= 2 ? 'filled' : ''}`} /></div>
              <div className={`progress-dot ${step >= 2 ? 'active' : ''}`}>2</div>
            </div>
            <p className="onboarding-step-label">
              {step === 1 ? 'Il tuo profilo' : 'Il tuo gruppo'}
            </p>
          </>
        )}

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="onboarding-form onboarding-step-enter">
            {/* Logged in as */}
            {authUser && (
              <div className="auth-user-badge">
                {authUser.photoURL ? (
                  <img src={authUser.photoURL} alt="" className="auth-user-avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="auth-user-avatar-placeholder">
                    {(authUser.displayName || authUser.email || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="auth-user-email">{authUser.email}</span>
              </div>
            )}

            {/* Name */}
            <label htmlFor="onboarding-name" className="onboarding-label">Il tuo nickname</label>
            <div className="input-wrapper">
              <input
                type="text" id="onboarding-name" className="onboarding-input"
                placeholder="Come vuoi essere chiamato..." autoComplete="off"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Coffee Type */}
            <label className="onboarding-label">Il tuo caffè preferito?</label>
            <div className="coffee-type-grid">
              {COFFEE_TYPES.map(c => (
                <button
                  key={c.key}
                  className={`coffee-type-card ${coffeeType === c.key ? 'selected' : ''}`}
                  onClick={() => setCoffeeType(c.key)}
                >
                  <span className="coffee-type-emoji">{c.emoji}</span>
                  <span className="coffee-type-name">{c.label}</span>
                  <span className="coffee-type-kcal">{c.kcal} kcal</span>
                </button>
              ))}
            </div>

            {/* Sugar Level */}
            <label className="onboarding-label">Quanto zucchero?</label>
            <div className="sugar-slider">
              {SUGAR_LEVELS.map(s => (
                <button
                  key={s.level}
                  className={`sugar-option ${sugarLevel === s.level ? 'selected' : ''}`}
                  onClick={() => setSugarLevel(s.level)}
                >
                  <span className="sugar-emoji">{s.emoji}</span>
                  <span className="sugar-label">{s.label}</span>
                  <span className="sugar-sub">{s.sublabel}</span>
                </button>
              ))}
            </div>

            {/* Interests */}
            <label className="onboarding-label">Quali argomenti ti appassionano?</label>
            <div className="interest-chips">
              {TOPICS.map(t => (
                <button
                  key={t.key}
                  className={`chip ${interests.has(t.key) ? 'selected' : ''}`}
                  onClick={() => toggleTopic(t.key)}
                >
                  <span className="chip-emoji">{t.emoji}</span>
                  <span className="chip-text">{t.label}</span>
                </button>
              ))}
            </div>

            <button className="onboarding-btn" disabled={!canGoStep2} onClick={handleStep1Submit}>
              <span className="btn-text">Avanti →</span>
            </button>
          </div>
        )}

        {/* Step 2: Group */}
        {step === 2 && (
          <div className="onboarding-form onboarding-step-enter">
            <GroupSetup
              onComplete={handleGroupComplete}
              onSkip={handleSkipGroup}
              showBack
              onBack={() => setStep(1)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
