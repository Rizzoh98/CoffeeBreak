import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { launchConfetti } from '../utils/helpers';

export default function BadgePopup() {
  const { state, dispatch } = useApp();
  const badge = state.pendingBadge;

  useEffect(() => {
    if (badge) launchConfetti();
  }, [badge]);

  if (!badge) return null;

  const dismiss = () => dispatch({ type: 'DISMISS_BADGE' });

  return (
    <div className="badge-popup-overlay active" onClick={dismiss}>
      <div className="badge-popup">
        <span className="badge-popup-icon">{badge.icon}</span>
        <p className="badge-popup-title">Badge Sbloccato!</p>
        <p className="badge-popup-subtitle">{badge.name}</p>
        <p className="badge-popup-desc">{badge.desc}</p>
      </div>
    </div>
  );
}
