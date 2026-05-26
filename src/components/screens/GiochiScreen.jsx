import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { RIDDLES } from '../../data/riddles';
import { SLOT_SYMBOLS } from '../../data/slotSymbols';
import { shuffleArray, launchConfetti } from '../../utils/helpers';

export default function GiochiScreen() {
  const { state, incrementStat, dispatch, setMascot } = useApp();
  const [activeGame, setActiveGame] = useState('riddles');

  return (
    <section className="screen active" data-screen="giochi">
      <div className="screen-header">
        <h1 className="screen-title"><span className="title-emoji">🎮</span> Giochi</h1>
        <p className="screen-subtitle">Metti alla prova la mente!</p>
      </div>

      <div className="game-toggle">
        <button className={`game-toggle-btn ${activeGame === 'riddles' ? 'active' : ''}`} onClick={() => setActiveGame('riddles')}>🧩 Indovinelli</button>
        <button className={`game-toggle-btn ${activeGame === 'slot' ? 'active' : ''}`} onClick={() => setActiveGame('slot')}>🎰 Slot Machine</button>
      </div>

      {activeGame === 'riddles' ? (
        <RiddlesPanel incrementStat={incrementStat} stats={state.stats} />
      ) : (
        <SlotPanel incrementStat={incrementStat} dispatch={dispatch} stats={state.stats} setMascot={setMascot} />
      )}
    </section>
  );
}

function RiddlesPanel({ incrementStat, stats }) {
  const [riddles] = useState(() => shuffleArray(RIDDLES));
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [solved, setSolved] = useState(0);
  const cardRef = useRef(null);

  const riddle = riddles[index % riddles.length];

  const reveal = () => {
    setRevealed(true);
    incrementStat('riddleCount');
    setSolved(s => s + 1);
  };

  const next = () => {
    setIndex(i => i + 1);
    setRevealed(false);
    if (cardRef.current) {
      cardRef.current.style.animation = 'none';
      cardRef.current.offsetHeight;
      cardRef.current.style.animation = 'slideInCard 0.4s ease forwards';
    }
  };

  return (
    <div className="game-panel active">
      <div className="score-display">
        <div className="score-item">
          <span className="score-label">Risolti</span>
          <span className="score-value">{solved}</span>
        </div>
        <div className="score-divider" />
        <div className="score-item">
          <span className="score-label">Totali</span>
          <span className="score-value score-streak">{stats.riddleCount}</span>
        </div>
      </div>

      <div className="riddle-card" ref={cardRef}>
        <div className="riddle-badge"><span>🧩</span> Indovinello</div>
        <p className="riddle-text">{riddle.q}</p>
        <div className="riddle-answer-container">
          {!revealed ? (
            <button className="reveal-btn" onClick={reveal}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
              Mostra Risposta
            </button>
          ) : (
            <div className="riddle-answer">
              <span className="answer-label">Risposta:</span>
              <span className="answer-text">{riddle.a}</span>
            </div>
          )}
        </div>
        <button className="riddle-next" onClick={next}>
          Nuovo Indovinello
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function SlotPanel({ incrementStat, dispatch, stats, setMascot }) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const reelRefs = [useRef(null), useRef(null), useRef(null)];

  const pull = useCallback(() => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    const results = [
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)],
      SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]
    ];

    // Animate each reel
    reelRefs.forEach((ref, i) => {
      if (!ref.current) return;
      const spinCount = 12 + i * 4;
      let html = '';
      for (let j = 0; j < spinCount; j++) {
        html += `<div class="slot-symbol">${SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]}</div>`;
      }
      html += `<div class="slot-symbol">${results[i]}</div>`;
      ref.current.innerHTML = html;
      ref.current.style.transition = 'none';
      ref.current.style.transform = 'translateY(0)';
      ref.current.offsetHeight;
      const offset = -(spinCount * 90);
      const duration = 800 + i * 500;
      ref.current.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.35, 1)`;
      ref.current.style.transform = `translateY(${offset}px)`;
    });

    const totalDuration = 800 + 3 * 500 + 200;
    setTimeout(() => {
      incrementStat('slotAttempts');
      const allSame = results[0] === results[1] && results[1] === results[2];
      const hasPair = results[0] === results[1] || results[1] === results[2] || results[0] === results[2];

      if (allSame) {
        setResult({ type: 'win', text: `🎉 JACKPOT! Tris di ${results[0]}! Oggi il caffè te lo offre il destino!` });
        incrementStat('slotWins');
        launchConfetti();
        setMascot('celebrating');
      } else if (hasPair) {
        const pair = results.find((v, i, a) => a.indexOf(v) !== i);
        setResult({ type: 'almost', text: `😏 Quasi! Una coppia di ${pair}! Ritenta!` });
      } else {
        setResult({ type: 'lose', text: '😅 Niente di fatto... Ritenta la fortuna!' });
      }
      setSpinning(false);
    }, totalDuration);
  }, [spinning, incrementStat, setMascot]);

  return (
    <div className="game-panel active">
      <div className="slot-card">
        <div className="slot-badge"><span>🎰</span> Slot Machine Caffè</div>
        <div className="slot-reels">
          {[0, 1, 2].map(i => (
            <div key={i} className="slot-reel-window">
              <div className="slot-reel" ref={reelRefs[i]}>
                <div className="slot-symbol">☕</div>
              </div>
            </div>
          ))}
        </div>
        <button className="slot-pull-btn" onClick={pull} disabled={spinning}>🎰 Tira la leva!</button>
        {result && (
          <div className={`slot-result active ${result.type}`}>
            <span>{result.text}</span>
          </div>
        )}
        <div className="slot-stats">
          Tentativi: <strong>{stats.slotAttempts}</strong> · Vittorie: <strong>{stats.slotWins}</strong>
        </div>
      </div>
    </div>
  );
}
