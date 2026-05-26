import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { FAKE_COLLEAGUES } from '../../data/colleagues';
import { shuffleArray, launchConfetti } from '../../utils/helpers';
import { useTimer } from '../../hooks/useTimer';
import { useGroupMembers } from '../../hooks/useRealtime';
import { createInvite } from '../../services/firestore';
import { getCoffeeType } from '../../data/coffeeTypes';

export default function BreakScreen() {
  const { state, incrementStat, dispatch, setMascot, addToast, logCoffee } = useApp();
  const { authUser } = useAuth();

  const activeGroupCode = state.user?.activeGroupCode;
  const members = useGroupMembers(activeGroupCode);
  
  // Mostriamo tutti i membri, incluso se stesso, per permettere il test con un solo account
  const colleagues = members;

  return (
    <section className="screen active" data-screen="break">
      <div className="screen-header">
        <h1 className="screen-title"><span className="title-emoji">☕</span> Coffee Break</h1>
        <p className="screen-subtitle">Richiama i tuoi colleghi!</p>
      </div>

      <BreakButton 
        logCoffee={logCoffee} 
        setMascot={setMascot} 
        user={state.user} 
        authUser={authUser}
        activeGroupCode={activeGroupCode}
      />

      {activeGroupCode && colleagues.length > 0 && (
        <ColleaguesList colleagues={colleagues} />
      )}

      <div className="confetti-container" id="confetti-container" aria-hidden="true" />

      <RouletteSection 
        userName={state.user?.userName} 
        incrementStat={incrementStat} 
        setMascot={setMascot} 
        members={members}
      />

      <TimerSection addToast={addToast} />
    </section>
  );
}

function ColleaguesList({ colleagues }) {
  return (
    <div className="colleagues-section">
      <span className="section-label">👥 Nel tuo gruppo ora</span>
      <div className="colleagues-horizontal-list">
        {colleagues.map(c => {
          const coffee = getCoffeeType(c.user?.coffeeType || 'espresso');
          return (
            <div key={c.uid} className="colleague-avatar-card">
               <div className="avatar-circle">{c.user?.userName?.charAt(0).toUpperCase()}</div>
               <span className="colleague-name">{c.user?.userName?.split(' ')[0]} {c.uid === authUser?.uid ? '(Tu)' : ''}</span>
               <span className="colleague-status">{coffee.emoji} {c.stats?.breakToday || 0}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --- Break Button --- */
function BreakButton({ logCoffee, setMascot, user, authUser, activeGroupCode }) {
  const [status, setStatus] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);

  const sendBreak = async () => {
    setMascot('drinking');
    // Log coffee with user's preferences — auto-tracks calories
    logCoffee(user?.coffeeType || 'espresso', user?.sugarLevel ?? 0);

    // Create real invite in Firestore
    if (activeGroupCode && authUser) {
      await createInvite(activeGroupCode, authUser.uid, user.userName, user.coffeeType || 'espresso');
    }

    setTimeout(() => {
      setShowOverlay(true);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      launchConfetti();

      setTimeout(() => {
        setShowOverlay(false);
        setStatus(`✅ Ultimo break: ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`);
      }, 3000);
    }, 800);
  };

  return (
    <>
      <div className="break-container">
        <div className="coffee-cup-wrapper">
          <div className="cup-ripple cup-ripple-1" />
          <div className="cup-ripple cup-ripple-2" />
          <div className="cup-ripple cup-ripple-3" />
          <div className="steam-container">
            <div className="steam steam-1" /><div className="steam steam-2" /><div className="steam steam-3" />
          </div>
          <button className="break-button" title="Avvia Coffee Break" onClick={sendBreak}>
            <span className="break-icon">☕</span>
            <div className="break-button-glow" />
          </button>
        </div>
        <p className="break-instruction">
          <span className="instruction-arrow">👆</span>
          Tocca per avviare il Coffee Break!
        </p>
        {status && <p className="break-status">{status}</p>}
      </div>

      {showOverlay && (
        <div className="break-overlay active">
          <span className="break-overlay-title">☕ Pausa inviata!</span>
          <span className="break-overlay-subtitle">I tuoi colleghi hanno ricevuto l'invito.</span>
        </div>
      )}
    </>
  );
}

/* --- Roulette --- */
function RouletteSection({ userName, incrementStat, setMascot, members }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState('');
  const stripRef = useRef(null);

  const allNames = useMemo(() => {
    if (members && members.length > 1) {
      return members.map(m => m.user?.userName || 'Sconosciuto');
    }
    return [userName, ...FAKE_COLLEAGUES];
  }, [userName, members]);

  const buildStrip = useCallback(() => {
    if (!stripRef.current) return;
    const strip = stripRef.current;
    strip.innerHTML = '';
    const shuffled = shuffleArray(allNames);
    for (let r = 0; r < 8; r++) {
      shuffled.forEach(name => {
        const div = document.createElement('div');
        div.className = 'roulette-name';
        div.textContent = name;
        strip.appendChild(div);
      });
    }
  }, [allNames]);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult('');
    buildStrip();

    const winner = allNames[Math.floor(Math.random() * allNames.length)];
    const strip = stripRef.current;
    const names = strip.querySelectorAll('.roulette-name');
    const nameHeight = 52;
    const windowHeight = 200;
    const centerOffset = windowHeight / 2 - nameHeight / 2;

    let targetIndex = -1;
    for (let i = names.length - allNames.length * 2; i < names.length; i++) {
      if (names[i].textContent === winner) { targetIndex = i; break; }
    }
    if (targetIndex === -1) targetIndex = names.length - 5;

    const targetY = -(targetIndex * nameHeight - centerOffset);
    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0)';
    strip.offsetHeight;
    strip.style.transition = 'transform 3.5s cubic-bezier(0.15, 0.85, 0.35, 1)';
    strip.style.transform = `translateY(${targetY}px)`;

    setTimeout(() => {
      names.forEach(n => n.classList.remove('highlighted'));
      if (names[targetIndex]) names[targetIndex].classList.add('highlighted');

      if (winner === userName) incrementStat('rouletteChosen');
      setResult(`☕ ${winner} prepara il caffè per tutti! 🎉`);
      setSpinning(false);
      launchConfetti();
      setMascot('celebrating');
    }, 3600);
  };

  return (
    <div className="roulette-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span className="section-label">🎯 Coffee Roulette</span>
      <span className="section-sublabel">Chi prepara il caffè per tutti?</span>
      <div className="roulette-container">
        <div className="roulette-window">
          <div className="roulette-pointer" />
          <div className="roulette-strip" ref={stripRef} />
        </div>
        <button className="roulette-spin-btn" onClick={spin} disabled={spinning}>🎯 Gira la ruota!</button>
        {result && (
          <div className="roulette-result active">
            <span className="roulette-result-text">{result}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Timer --- */
function TimerSection({ addToast }) {
  const onComplete = useCallback(() => {
    addToast('Timer', '⏱️ Timer terminato! La pausa è finita.');
  }, [addToast]);

  const timer = useTimer(onComplete);

  return (
    <div className="timer-section">
      <span className="section-label">⏱️ Timer Pausa</span>
      <span className="section-sublabel">Rilassati con un timer e suoni ambient</span>

      <div className="timer-presets">
        {[5, 10, 15].map(m => (
          <button
            key={m}
            className={`timer-preset-btn ${timer.total === m * 60 ? 'active' : ''}`}
            data-minutes={m}
            onClick={() => timer.setPreset(m)}
          >{m} min</button>
        ))}
      </div>

      <div className="timer-circle-container">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <defs>
            <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d4943a" />
              <stop offset="100%" stopColor="#f0a500" />
            </linearGradient>
          </defs>
          <circle className="timer-circle-bg" cx="80" cy="80" r="72" />
          <circle
            className="timer-circle-progress" cx="80" cy="80" r="72"
            strokeDasharray={timer.circumference}
            strokeDashoffset={timer.dashOffset}
          />
        </svg>
        <span className="timer-display">{timer.display}</span>
      </div>

      <div className="timer-controls">
        {!timer.running ? (
          <button className="timer-start-btn" onClick={timer.start}>▶ Avvia</button>
        ) : (
          <button className="timer-stop-btn" onClick={timer.stop}>■ Stop</button>
        )}
      </div>

      <div className="timer-sound-toggle">
        {[
          { key: 'none', icon: '🔇', label: 'Silenzio' },
          { key: 'rain', icon: '🌧️', label: 'Pioggia' },
          { key: 'cafe', icon: '☕', label: 'Caffetteria' }
        ].map(s => (
          <button
            key={s.key}
            className={`sound-btn ${timer.selectedSound === s.key ? 'active' : ''}`}
            onClick={() => timer.changeSound(s.key)}
          >{s.icon} {s.label}</button>
        ))}
      </div>
    </div>
  );
}
