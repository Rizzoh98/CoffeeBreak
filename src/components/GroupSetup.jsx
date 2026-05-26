import React, { useState, useMemo } from 'react';
import { generateGroupCode } from '../data/coffeeTypes';
import { createGroup, joinGroup } from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function GroupSetup({ onComplete, onSkip, showBack, onBack }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [createdGroup, setCreatedGroup] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');
  
  const { authUser } = useAuth();
  const { state } = useApp();

  const handleCreateGroup = async () => {
    if (groupName.trim().length < 2) return;
    const code = generateGroupCode();
    const userName = state.user?.userName || authUser?.displayName || 'Anonimo';
    
    // Create group in Firestore
    const group = await createGroup(code, groupName.trim(), authUser.uid, userName);
    if (group) {
      setCreatedGroup(group);
    }
  };

  const handleConfirmCreate = () => {
    onComplete(createdGroup);
  };

  const handleJoinGroup = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    
    setJoining(true);
    setJoinError('');
    
    const userName = state.user?.userName || authUser?.displayName || 'Anonimo';
    
    // Try to join the group on Firestore
    const group = await joinGroup(code, authUser.uid, userName);
    
    if (group) {
      onComplete(group);
    } else {
      setJoinError('Gruppo non trovato. Controlla il codice e riprova.');
    }
    setJoining(false);
  };

  // Generate invite link
  const inviteLink = useMemo(() => {
    if (!createdGroup) return '';
    return `${window.location.origin}?group=${createdGroup.code}`;
  }, [createdGroup]);

  const copyLink = () => {
    if (inviteLink) {
      navigator.clipboard?.writeText(inviteLink);
    }
  };
  
  const copyCode = () => {
    if (createdGroup?.code) {
      navigator.clipboard?.writeText(createdGroup.code);
    }
  };

  return (
    <div className="group-setup">
      {/* Mode Selection */}
      {!mode && (
        <div className="group-mode-select">
          <p className="group-title">☕ Il tuo Coffee Break</p>
          <p className="group-subtitle">Crea un gruppo o unisciti ad uno esistente</p>

          <button className="group-choice-card" onClick={() => setMode('create')}>
            <span className="group-choice-icon">🏗️</span>
            <div className="group-choice-info">
              <span className="group-choice-title">Crea un nuovo gruppo</span>
              <span className="group-choice-desc">Invita i colleghi con un codice</span>
            </div>
          </button>

          <button className="group-choice-card" onClick={() => setMode('join')}>
            <span className="group-choice-icon">🤝</span>
            <div className="group-choice-info">
              <span className="group-choice-title">Unisciti a un gruppo</span>
              <span className="group-choice-desc">Inserisci il codice ricevuto</span>
            </div>
          </button>

          <div className="group-actions">
            {showBack ? (
              <button className="group-back-btn" onClick={onBack}>← Indietro</button>
            ) : (
              onSkip && <button className="group-skip-btn" onClick={onSkip}>Salta per ora →</button>
            )}
          </div>
        </div>
      )}

      {/* Create Group */}
      {mode === 'create' && !createdGroup && (
        <div className="group-create onboarding-step-enter">
          <p className="group-title">🏗️ Crea il tuo gruppo</p>
          <label className="onboarding-label">Come si chiama il gruppo?</label>
          <div className="input-wrapper">
            <input
              type="text" className="onboarding-input"
              placeholder="Es: Team Caffè, Pausa Dev..."
              value={groupName} onChange={(e) => setGroupName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <button className="onboarding-btn" disabled={groupName.trim().length < 2} onClick={handleCreateGroup}>
            <span className="btn-text">Crea Gruppo ✨</span>
          </button>
          <button className="group-back-btn" onClick={() => setMode(null)}>← Indietro</button>
        </div>
      )}

      {/* Group Created — Show code */}
      {mode === 'create' && createdGroup && (
        <div className="group-created onboarding-step-enter">
          <p className="group-title">🎉 Gruppo creato!</p>
          <p className="group-subtitle">{createdGroup.name}</p>

          <div className="group-code-display">
            <span className="group-code-label">Codice invito</span>
            <span className="group-code">{createdGroup.code}</span>
          </div>

          <div className="group-share-section">
            <p className="group-share-label">Condividi con i colleghi:</p>

            <button className="group-share-btn" onClick={copyCode}>
              📋 Copia codice
            </button>
            
            <button className="group-share-btn" onClick={copyLink} style={{ marginTop: '8px' }}>
              🔗 Copia link invito
            </button>
          </div>

          <button className="onboarding-btn" onClick={handleConfirmCreate}>
            <span className="btn-text">Inizia il Coffee Break ☕</span>
          </button>
        </div>
      )}

      {/* Join Group */}
      {mode === 'join' && (
        <div className="group-join onboarding-step-enter">
          <p className="group-title">🤝 Unisciti a un gruppo</p>

          <div className="join-methods">
            <div className="join-method">
              <label className="onboarding-label">Inserisci il codice invito</label>
              <div className="input-wrapper">
                <input
                  type="text" className="onboarding-input code-input"
                  placeholder="Es: ABC123"
                  value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6} autoComplete="off"
                />
              </div>
              
              {joinError && (
                <p className="join-error">❌ {joinError}</p>
              )}
              
              <button 
                className="onboarding-btn" 
                disabled={joinCode.trim().length < 4 || joining} 
                onClick={handleJoinGroup}
              >
                <span className="btn-text">{joining ? 'Ricerca...' : 'Unisciti ✨'}</span>
              </button>
            </div>
          </div>

          <button className="group-back-btn" onClick={() => { setMode(null); setJoinError(''); }}>← Indietro</button>
        </div>
      )}
    </div>
  );
}
