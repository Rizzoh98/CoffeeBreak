import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MOOD_DATA, MOOD_LIST } from '../../data/moods';

export default function MoodScreen() {
  const { state, dispatch, incrementStat, setMascot } = useApp();
  const [message, setMessage] = useState(null);

  const selectMood = (moodKey) => {
    dispatch({ type: 'SET_MOOD', payload: moodKey });

    if (moodKey === 'zen') incrementStat('zenCount');

    const moodInfo = MOOD_DATA[moodKey];
    const msg = moodInfo.messages[Math.floor(Math.random() * moodInfo.messages.length)];
    setMessage({ emoji: moodInfo.emoji, ...msg });

    if (moodKey === 'sonnolento') setMascot('sleeping');
    else if (moodKey === 'carico' || moodKey === 'creativo') setMascot('celebrating');
  };

  return (
    <section className="screen active" data-screen="mood">
      <div className="screen-header">
        <h1 className="screen-title"><span className="title-emoji">😄</span> Mood del Giorno</h1>
        <p className="screen-subtitle">Come ti senti oggi?</p>
      </div>

      <div className="mood-grid">
        {MOOD_LIST.map(m => (
          <div
            key={m.key}
            className={`mood-card ${state.moodToday === m.key ? 'selected' : ''}`}
            onClick={() => selectMood(m.key)}
          >
            <span className="mood-emoji">{m.emoji}</span>
            <span className="mood-label">{m.label}</span>
          </div>
        ))}
      </div>

      {message && (
        <div className="mood-message-card active">
          <span className="mood-message-emoji">{message.emoji}</span>
          <p className="mood-message-text">{message.text}</p>
          <p className="mood-message-sub">{message.sub}</p>
        </div>
      )}
    </section>
  );
}
