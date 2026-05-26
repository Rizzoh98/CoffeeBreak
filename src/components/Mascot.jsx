import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { MASCOT_MESSAGES } from '../data/colleagues';

export default function Mascot() {
  const { state, setMascot } = useApp();
  const [bubble, setBubble] = useState(null);
  const idleTimerRef = useRef(null);
  const bubbleTimerRef = useRef(null);

  const resetIdleTimer = useCallback(() => {
    if (state.mascotState === 'sleeping') {
      setMascot('idle');
    }
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setMascot('sleeping');
    }, 30000);
  }, [state.mascotState, setMascot]);

  useEffect(() => {
    const handler = () => resetIdleTimer();
    document.addEventListener('click', handler);
    document.addEventListener('touchstart', handler);
    resetIdleTimer();
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
      clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  const handleClick = (e) => {
    e.stopPropagation();
    const msg = MASCOT_MESSAGES[Math.floor(Math.random() * MASCOT_MESSAGES.length)];
    setBubble(msg);
    setMascot('celebrating');
    clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => setBubble(null), 2500);
  };

  const getMascotEmoji = () => {
    switch (state.mascotState) {
      case 'drinking': return '😺';
      case 'celebrating': return '😸';
      default: return '🐱';
    }
  };

  return (
    <div
      className={`mascot ${state.mascotState}`}
      title="Clicca il gattino!"
      onClick={handleClick}
    >
      <span className="mascot-body">{getMascotEmoji()}</span>
      {state.mascotState === 'sleeping' && (
        <span className="mascot-zzz" style={{ display: 'block' }}>💤</span>
      )}
      {bubble && <div className="mascot-bubble">{bubble}</div>}
    </div>
  );
}
