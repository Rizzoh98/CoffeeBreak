import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

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
  const { setUser } = useApp();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState(new Set());

  const toggleTopic = (key) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const canSubmit = name.trim().length >= 2 && selected.size >= 1;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setUser({ userName: name.trim(), interests: [...selected] });
  };

  return (
    <div className="onboarding-overlay active">
      <div className="onboarding-content">
        <div className="onboarding-logo" id="onboarding-logo">
          <span className="logo-icon">☕</span>
        </div>
        <h1 className="onboarding-title">
          {'CoffeeBreak'.split('').map((ch, i) => (
            <span key={i} className="title-letter" style={{ '--i': i }}>{ch}</span>
          ))}
        </h1>
        <p className="onboarding-subtitle">Pausa caffè con i tuoi colleghi</p>

        <div className="onboarding-form">
          <label htmlFor="onboarding-name" className="onboarding-label">Come ti chiami?</label>
          <div className="input-wrapper">
            <input
              type="text" id="onboarding-name" className="onboarding-input"
              placeholder="Il tuo nome..." autoComplete="off"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>

          <label className="onboarding-label">Quali argomenti ti appassionano?</label>
          <div className="interest-chips">
            {TOPICS.map(t => (
              <button
                key={t.key}
                className={`chip ${selected.has(t.key) ? 'selected' : ''}`}
                onClick={() => toggleTopic(t.key)}
              >
                <span className="chip-emoji">{t.emoji}</span>
                <span className="chip-text">{t.label}</span>
              </button>
            ))}
          </div>

          <button
            className="onboarding-btn" disabled={!canSubmit}
            onClick={handleSubmit}
          >
            <span className="btn-text">Inizia la pausa ☕</span>
          </button>
        </div>
      </div>
    </div>
  );
}
