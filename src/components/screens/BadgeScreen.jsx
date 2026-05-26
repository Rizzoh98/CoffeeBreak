import React from 'react';
import { useApp } from '../../context/AppContext';
import { BADGES } from '../../data/badges';

export default function BadgeScreen() {
  const { state } = useApp();
  const unlockedCount = state.unlockedBadges.length;
  const total = BADGES.length;

  return (
    <section className="screen active" data-screen="badge">
      <div className="screen-header">
        <h1 className="screen-title"><span className="title-emoji">🏆</span> Achievement</h1>
        <p className="screen-subtitle">Colleziona tutti i badge!</p>
      </div>

      <div className="badges-progress">
        <p className="badges-progress-text">{unlockedCount} / {total} sbloccati</p>
        <div className="badges-progress-bar">
          <div className="badges-progress-fill" style={{ width: `${(unlockedCount / total) * 100}%` }} />
        </div>
      </div>

      <div className="badges-grid">
        {BADGES.map(badge => {
          const isUnlocked = state.unlockedBadges.includes(badge.id);
          return (
            <div key={badge.id} className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
              <span className="badge-icon">{badge.icon}</span>
              <p className="badge-name">{badge.name}</p>
              <p className="badge-desc">{badge.desc}</p>
              {isUnlocked && <div className="badge-check">✓</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
