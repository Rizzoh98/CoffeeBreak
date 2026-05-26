import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { getCoffeeType, getSugarLevel, calculateCalories, COFFEE_TYPES, SUGAR_LEVELS } from '../data/coffeeTypes';

export default function ProfileDrawer() {
  const { state, dispatch, setUser } = useApp();
  const { authUser, signOut } = useAuth();
  const { user, stats, coffeeLog } = state;
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.userName || '');
  const [editCoffee, setEditCoffee] = useState(user?.coffeeType || '');
  const [editSugar, setEditSugar] = useState(user?.sugarLevel ?? 1);

  if (!state.showProfile || !user) return null;

  const coffee = getCoffeeType(user.coffeeType);
  const sugar = getSugarLevel(user.sugarLevel);
  const kcalPerCoffee = calculateCalories(user.coffeeType, user.sugarLevel);
  const sugarCalories = sugar.kcal * stats.breakCount;

  const close = () => dispatch({ type: 'CLOSE_PROFILE' });

  const saveEdit = () => {
    setUser({
      ...user,
      userName: editName.trim() || user.userName,
      coffeeType: editCoffee || user.coffeeType,
      sugarLevel: editSugar
    });
    setEditing(false);
  };

  // Coffee history for today
  const today = new Date().toDateString();
  const todaysLog = coffeeLog.filter(e => new Date(e.timestamp).toDateString() === today);

  return (
    <>
      <div className="profile-backdrop" onClick={close} />
      <div className="profile-drawer">
        <div className="profile-drawer-header">
          <h2>Il tuo Profilo</h2>
          <button className="profile-close-btn" onClick={close}>✕</button>
        </div>

        <div className="profile-drawer-body">
          {/* Avatar & Info */}
          <div className="profile-avatar-section">
            {authUser?.photoURL ? (
              <img src={authUser.photoURL} alt="" className="profile-avatar-large profile-avatar-img" referrerPolicy="no-referrer" />
            ) : (
              <div className="profile-avatar-large">
                <span>{user.userName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <h3 className="profile-name">{user.userName}</h3>
            {authUser?.email && (
              <p className="profile-email">{authUser.email}</p>
            )}
            {user.group && (
              <p className="profile-group-badge">
                👥 {user.group.name}
                <span className="profile-group-code">#{user.group.code}</span>
              </p>
            )}
          </div>

          {/* Coffee Preferences */}
          <div className="profile-section">
            <h4 className="profile-section-title">☕ Il mio Caffè</h4>
            <div className="profile-pref-card">
              <div className="profile-pref-row">
                <span className="profile-pref-emoji">{coffee.emoji}</span>
                <div className="profile-pref-info">
                  <span className="profile-pref-label">{coffee.label}</span>
                  <span className="profile-pref-sub">{coffee.kcal} kcal</span>
                </div>
              </div>
              <div className="profile-pref-row">
                <span className="profile-pref-emoji">{sugar.emoji}</span>
                <div className="profile-pref-info">
                  <span className="profile-pref-label">Zucchero: {sugar.label}</span>
                  <span className="profile-pref-sub">+{sugar.kcal} kcal</span>
                </div>
              </div>
              <div className="profile-pref-total">
                <span>= {kcalPerCoffee} kcal per caffè</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="profile-section">
            <h4 className="profile-section-title">📊 Statistiche</h4>
            <div className="profile-stats-grid">
              <div className="profile-stat-card">
                <span className="profile-stat-value">{stats.breakCount}</span>
                <span className="profile-stat-label">☕ Caffè totali</span>
              </div>
              <div className="profile-stat-card">
                <span className="profile-stat-value">{stats.breakToday}</span>
                <span className="profile-stat-label">📅 Oggi</span>
              </div>
              <div className="profile-stat-card accent">
                <span className="profile-stat-value">{stats.totalCalories}</span>
                <span className="profile-stat-label">🔥 kcal totali</span>
              </div>
              <div className="profile-stat-card">
                <span className="profile-stat-value">{stats.caloriesToday || 0}</span>
                <span className="profile-stat-label">🔥 kcal oggi</span>
              </div>
            </div>

            {/* Calorie Breakdown */}
            <div className="profile-calorie-breakdown">
              <div className="calorie-bar-row">
                <span className="calorie-bar-label">☕ Da caffè</span>
                <div className="calorie-bar-track">
                  <div className="calorie-bar-fill coffee-fill" style={{ width: stats.totalCalories > 0 ? `${((stats.totalCalories - sugarCalories) / Math.max(stats.totalCalories, 1)) * 100}%` : '0%' }} />
                </div>
                <span className="calorie-bar-value">{stats.totalCalories - sugarCalories} kcal</span>
              </div>
              <div className="calorie-bar-row">
                <span className="calorie-bar-label">🥄 Da zucchero</span>
                <div className="calorie-bar-track">
                  <div className="calorie-bar-fill sugar-fill" style={{ width: stats.totalCalories > 0 ? `${(sugarCalories / Math.max(stats.totalCalories, 1)) * 100}%` : '0%' }} />
                </div>
                <span className="calorie-bar-value">{sugarCalories} kcal</span>
              </div>
            </div>
          </div>

          {/* Today's Log */}
          {todaysLog.length > 0 && (
            <div className="profile-section">
              <h4 className="profile-section-title">📋 Caffè di oggi</h4>
              <div className="profile-log-list">
                {todaysLog.map((entry, i) => {
                  const c = getCoffeeType(entry.coffeeType);
                  return (
                    <div key={i} className="profile-log-entry">
                      <span className="log-time">
                        {new Date(entry.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="log-coffee">{c.emoji} {c.label}</span>
                      <span className="log-kcal">{entry.kcal} kcal</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group Info */}
          {user.group && (
            <div className="profile-section">
              <h4 className="profile-section-title">👥 Gruppo</h4>
              <div className="profile-group-card">
                <p className="profile-group-name">{user.group.name}</p>
                <div className="profile-group-code-display">
                  <span className="group-code-label">Codice:</span>
                  <span className="group-code">{user.group.code}</span>
                </div>
                {user.group.isCreator && <p className="profile-group-role">👑 Creatore del gruppo</p>}
              </div>
            </div>
          )}

          {/* Edit Profile */}
          {!editing ? (
            <button className="profile-edit-btn" onClick={() => setEditing(true)}>
              ✏️ Modifica Profilo
            </button>
          ) : (
            <div className="profile-edit-form">
              <label className="onboarding-label">Nickname</label>
              <div className="input-wrapper">
                <input type="text" className="onboarding-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>

              <label className="onboarding-label">Tipo caffè</label>
              <div className="coffee-type-grid compact">
                {COFFEE_TYPES.map(c => (
                  <button key={c.key} className={`coffee-type-card ${editCoffee === c.key ? 'selected' : ''}`} onClick={() => setEditCoffee(c.key)}>
                    <span className="coffee-type-emoji">{c.emoji}</span>
                    <span className="coffee-type-name">{c.label}</span>
                  </button>
                ))}
              </div>

              <label className="onboarding-label">Zucchero</label>
              <div className="sugar-slider compact">
                {SUGAR_LEVELS.map(s => (
                  <button key={s.level} className={`sugar-option ${editSugar === s.level ? 'selected' : ''}`} onClick={() => setEditSugar(s.level)}>
                    <span className="sugar-emoji">{s.emoji}</span>
                    <span className="sugar-label">{s.label}</span>
                  </button>
                ))}
              </div>

              <div className="profile-edit-actions">
                <button className="profile-save-btn" onClick={saveEdit}>💾 Salva</button>
                <button className="profile-cancel-btn" onClick={() => setEditing(false)}>Annulla</button>
              </div>
            </div>
          )}

          {/* Sign Out */}
          <button className="profile-signout-btn" onClick={signOut}>
            🚪 Esci dall'account
          </button>
        </div>
      </div>
    </>
  );
}
