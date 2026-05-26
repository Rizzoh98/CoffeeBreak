export function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getTopicEmoji(topic) {
  const emojis = {
    tecnologia: '🖥️', scienza: '🔬', sport: '⚽', cinema: '🎬',
    musica: '🎵', cucina: '🍳', viaggi: '✈️', storia: '📜',
    natura: '🌿', arte: '🎨', gaming: '🎮', spazio: '🚀'
  };
  return emojis[topic] || '💡';
}

export function getTopicName(topic) {
  const names = {
    tecnologia: 'Tecnologia', scienza: 'Scienza', sport: 'Sport', cinema: 'Cinema',
    musica: 'Musica', cucina: 'Cucina', viaggi: 'Viaggi', storia: 'Storia',
    natura: 'Natura', arte: 'Arte', gaming: 'Gaming', spazio: 'Spazio'
  };
  return names[topic] || topic;
}

export function generatePollResults(count, seed) {
  const rng = (s) => { s = Math.sin(s) * 10000; return s - Math.floor(s); };
  const raw = [];
  let total = 0;
  for (let i = 0; i < count; i++) {
    const v = 20 + Math.floor(rng(seed + i * 7) * 60);
    raw.push(v);
    total += v;
  }
  return raw.map(v => Math.round(v / total * 100));
}

export function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function getGreeting(name) {
  const hour = new Date().getHours();
  let greeting = 'Buongiorno';
  if (hour >= 13 && hour < 18) greeting = 'Buon pomeriggio';
  else if (hour >= 18) greeting = 'Buonasera';
  return `${greeting}, ${name} ☕`;
}

export function launchConfetti(containerRef) {
  const container = containerRef?.current || document.getElementById('confetti-container');
  if (!container) return;
  const colors = ['#d4943a', '#e8b86d', '#f0a500', '#a855f7', '#ec4899', '#3b82f6', '#22c55e', '#ef4444'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.top = -10 + 'px';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = (6 + Math.random() * 8) + 'px';
    piece.style.height = (6 + Math.random() * 8) + 'px';
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    container.appendChild(piece);
  }
  setTimeout(() => { container.innerHTML = ''; }, 4500);
}
