import React from 'react';
import { useApp } from '../context/AppContext';
import { getGreeting } from '../utils/helpers';

export default function Header() {
  const { state } = useApp();
  const { user, stats } = state;
  if (!user) return null;

  return (
    <header className="app-header" id="app-header">
      <div className="header-left">
        <span className="header-greeting">{getGreeting(user.userName)}</span>
      </div>
      <div className="header-right">
        <div className="streak-badge" title="Serie giornaliera">
          <span className="streak-icon">🔥</span>
          <span className="streak-count">{stats.streak}</span>
        </div>
        <button className="avatar-btn" title="Profilo">
          <span>{user.userName.charAt(0).toUpperCase()}</span>
        </button>
      </div>
    </header>
  );
}
