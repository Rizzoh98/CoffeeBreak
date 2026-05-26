import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { CURIOSITIES } from '../../data/curiosities';
import { DAILY_POLLS } from '../../data/polls';
import { shuffleArray, getTopicEmoji, getTopicName, generatePollResults, getTodayKey } from '../../utils/helpers';

export default function CuriositaScreen() {
  const { state, incrementStat, dispatch, setMascot } = useApp();
  const { user } = state;
  const [curiosity, setCuriosity] = useState(() => getRandomCuriosity(user?.interests));
  const [pollVoted, setPollVoted] = useState(false);
  const cardRef = useRef(null);

  function getRandomCuriosity(interests) {
    if (!interests || !interests.length) return null;
    const topic = interests[Math.floor(Math.random() * interests.length)];
    const items = CURIOSITIES[topic] || [];
    if (!items.length) return null;
    const text = items[Math.floor(Math.random() * items.length)];
    return { topic, text };
  }

  const refresh = useCallback(() => {
    const next = getRandomCuriosity(user?.interests);
    setCuriosity(next);
    incrementStat('curiosityCount');
    if (cardRef.current) {
      cardRef.current.style.animation = 'none';
      cardRef.current.offsetHeight;
      cardRef.current.style.animation = 'slideInCard 0.4s ease forwards';
    }
  }, [user, incrementStat]);

  // Poll logic
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % DAILY_POLLS.length;
  const poll = DAILY_POLLS[dayIndex];
  const todayKey = getTodayKey();
  const alreadyVoted = state.pollVotedDays[todayKey] !== undefined;
  const votedIndex = state.pollVotedDays[todayKey];
  const fakePercentages = generatePollResults(poll.options.length, dayIndex * 100);

  const votePoll = (i) => {
    if (alreadyVoted || pollVoted) return;
    setPollVoted(true);
    dispatch({ type: 'VOTE_POLL', payload: { key: todayKey, index: i } });
    setMascot('celebrating');
  };

  const isVoted = alreadyVoted || pollVoted;
  const selectedIdx = pollVoted ? votedIndex : (alreadyVoted ? votedIndex : -1);
  const currentSelectedIdx = pollVoted ? state.pollVotedDays[todayKey] : votedIndex;

  return (
    <section className="screen active" data-screen="curiosita">
      <div className="screen-header">
        <h1 className="screen-title"><span className="title-emoji">💡</span> Curiosità</h1>
        <p className="screen-subtitle">Scopri qualcosa di nuovo ogni giorno</p>
      </div>

      {curiosity && (
        <div className="curiosity-card" ref={cardRef}>
          <div className="curiosity-category">
            <span className="category-emoji">{getTopicEmoji(curiosity.topic)}</span>
            <span className="category-name">{getTopicName(curiosity.topic)}</span>
          </div>
          <p className="curiosity-text">{curiosity.text}</p>
          <button className="curiosity-refresh" title="Nuova curiosità" onClick={refresh}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      )}

      <div className="fun-fact-footer">
        <span className="sparkle-group">
          <span className="sparkle s1">✨</span>
          <span className="sparkle s2">⭐</span>
          <span className="sparkle s3">✨</span>
        </span>
        Basato sui tuoi interessi
      </div>

      {/* Sondaggio del Giorno */}
      <div className="poll-section">
        <div className="poll-card">
          <div className="poll-badge"><span>🗳️</span> Sondaggio del Giorno</div>
          <p className="poll-question">{poll.q}</p>
          <div className="poll-options">
            {poll.options.map((opt, i) => (
              <button
                key={i}
                className={`poll-option ${isVoted ? 'voted' : ''} ${isVoted && currentSelectedIdx === i ? 'selected' : ''}`}
                onClick={() => votePoll(i)}
              >
                <div className="poll-bar" style={{ width: isVoted ? `${fakePercentages[i]}%` : '0%' }} />
                <div className="poll-option-text">
                  <span>{opt}</span>
                  <span className="poll-percentage">{fakePercentages[i]}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
