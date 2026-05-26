import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TOAST_MESSAGES } from '../data/colleagues';

export default function ToastContainer() {
  const { state, addToast, dispatch } = useApp();
  const timerRef = useRef(null);

  useEffect(() => {
    const scheduleNext = (delay) => {
      timerRef.current = setTimeout(() => {
        const t = TOAST_MESSAGES[Math.floor(Math.random() * TOAST_MESSAGES.length)];
        addToast(t.sender, t.msg);
        scheduleNext(45000 + Math.random() * 45000);
      }, delay);
    };
    scheduleNext(30000 + Math.random() * 30000);
    return () => clearTimeout(timerRef.current);
  }, [addToast]);

  const dismiss = (id) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  };

  return (
    <div className="toast-container" id="toast-container">
      {state.toasts.map(t => (
        <div key={t.id} className="toast" onClick={() => dismiss(t.id)}>
          <div className="toast-avatar">{t.sender.charAt(0).toUpperCase()}</div>
          <div className="toast-body">
            <div className="toast-sender">{t.sender}</div>
            <div className="toast-message">{t.msg}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
