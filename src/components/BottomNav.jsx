import React from 'react';
import { useApp } from '../context/AppContext';

const NAV_ITEMS = [
  { key: 'curiosita', emoji: '💡', label: 'Curiosità', isMain: false },
  { key: 'giochi', emoji: '🎮', label: 'Giochi', isMain: false },
  { key: 'break', emoji: '☕', label: 'Break', isMain: true },
  { key: 'mood', emoji: '😄', label: 'Mood', isMain: false },
  { key: 'badge', emoji: '🏆', label: 'Badge', isMain: false }
];

export default function BottomNav() {
  const { state, navigateTo } = useApp();

  return (
    <nav className="bottom-nav" id="bottom-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.key}
          className={`nav-item ${state.currentScreen === item.key ? 'active' : ''}`}
          data-target={item.key}
          onClick={() => navigateTo(item.key)}
        >
          <div className={`nav-icon-wrapper ${item.isMain ? 'main-nav' : ''}`}>
            {item.isMain ? (
              <span className="main-nav-icon">{item.emoji}</span>
            ) : (
              <span className="nav-emoji">{item.emoji}</span>
            )}
          </div>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
