import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  const startStep = state.onboardingStep < 3 ? Math.max(state.onboardingStep, 1) : 1;
  const [step, setStep] = useState(startStep);

  // Step 1 state
  const [name, setName] = useState(state.user?.userName || '');
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

  const canGoStep2 = name.trim().length >= 2 && coffeeType && interests.size >= 1;

  const handleStep1Submit = () => {
    if (!canGoStep2) return;
    const user = {
      ...state.user,
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

  const handleGroupComplete = (group) => {
    const updatedUser = { ...state.user, group };
    setUser(updatedUser);
    dispatch({ type: 'SET_ONBOARDING_STEP', payload: 3 });
  };

  const handleSkipGroup = () => {
    const updatedUser = { ...state.user, group: null };
    setUser(updatedUser);
    dispatch({ type: 'SET_ONBOARDING_STEP', payload: 3 });
  };

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

        {/* Progress indicator */}
        <div className="onboarding-progress">
          <div className={`progress-dot ${step >= 1 ? 'active' : ''}`}>1</div>
          <div className="progress-line"><div className={`progress-fill ${step >= 2 ? 'filled' : ''}`} /></div>
          <div className={`progress-dot ${step >= 2 ? 'active' : ''}`}>2</div>
        </div>
        <p className="onboarding-step-label">
          {step === 1 ? 'Il tuo profilo' : 'Il tuo gruppo'}
        </p>

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="onboarding-form onboarding-step-enter">
            {/* Name */}
            <label htmlFor="onboarding-name" className="onboarding-label">Come ti chiami?</label>
            <div className="input-wrapper">
              <input
                type="text" id="onboarding-name" className="onboarding-input"
                placeholder="Il tuo nickname..." autoComplete="off"
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
