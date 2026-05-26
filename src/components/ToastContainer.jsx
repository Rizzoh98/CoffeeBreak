import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { TOAST_MESSAGES } from '../data/colleagues';

export default function ToastContainer() {
  const { state, addToast, dispatch } = useApp();
  const timerRef = useRef(null);

  // No more fake random toasts
  useEffect(() => {
    // In future, real-time listener for group events will go here
  }, []);

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
