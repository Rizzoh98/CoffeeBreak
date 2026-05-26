import React from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useActiveInvite } from '../hooks/useRealtime';
import { respondToInvite } from '../services/firestore';
import { getCoffeeType } from '../data/coffeeTypes';

export default function InviteOverlay() {
  const { state } = useApp();
  const { authUser } = useAuth();
  
  const activeGroupCode = state.user?.activeGroupCode;
  const activeInvite = useActiveInvite(activeGroupCode);

  // If no active invite, or the current user is the one who sent it, don't show the receive overlay
  if (!activeInvite) return null;
  if (activeInvite.senderUid === authUser?.uid) return null;

  const handleResponse = async (status) => {
    if (authUser && state.user) {
      await respondToInvite(activeInvite.id, authUser.uid, state.user.userName, status);
    }
  };

  // Check if we already responded
  const myResponse = activeInvite.responses?.[authUser?.uid];

  if (myResponse) {
    // If we already responded, show a tiny toast-like confirmation instead of the full screen, or nothing
    return null;
  }

  const senderCoffee = getCoffeeType(activeInvite.coffeeType || 'espresso');

  return (
    <div className="invite-overlay-container">
      <div className="invite-overlay-content">
        <div className="invite-icon-wrapper">
          <span className="invite-icon">{senderCoffee.emoji}</span>
          <div className="invite-pulse" />
        </div>
        <h2 className="invite-title">Pausa Caffè!</h2>
        <p className="invite-message">
          <strong>{activeInvite.senderName}</strong> ha appena avviato un Coffee Break e ti sta aspettando.
        </p>

        <div className="invite-actions">
          <button className="invite-btn coming" onClick={() => handleResponse('coming')}>
            <span className="btn-icon">🏃</span>
            <span>Arrivo!</span>
          </button>
          
          <button className="invite-btn min5" onClick={() => handleResponse('5min')}>
            <span className="btn-icon">⏳</span>
            <span>5 minuti</span>
          </button>

          <button className="invite-btn skip" onClick={() => handleResponse('skipping')}>
            <span className="btn-icon">🚫</span>
            <span>Salto</span>
          </button>
        </div>
      </div>
    </div>
  );
}
