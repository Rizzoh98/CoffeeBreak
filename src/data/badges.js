export const BADGES = [
  { id: 'first_break', name: 'Prima Pausa', desc: 'Hai lanciato il tuo primo Coffee Break', icon: '🥇' },
  { id: 'curious', name: 'Curioso', desc: 'Hai letto 10 curiosità', icon: '📚' },
  { id: 'riddle_king', name: 'Re degli Indovinelli', desc: 'Hai visto 10 indovinelli', icon: '🧠' },
  { id: 'caffeine_addict', name: 'Caffeina Addict', desc: '5 break in un solo giorno', icon: '☕' },
  { id: 'jackpot', name: 'Jackpot!', desc: 'Hai fatto tris alla slot machine', icon: '🎰' },
  { id: 'pollster', name: 'Sondaggista', desc: 'Hai votato 5 sondaggi', icon: '🗳️' },
  { id: 'zen_master', name: 'Zen Master', desc: 'Mood "Zen" scelto 3 volte', icon: '🧘' },
  { id: 'barista', name: 'Barista Fortunato', desc: 'Scelto dalla roulette per fare il caffè', icon: '🎯' },
  { id: 'streak_7', name: 'Streak 7!', desc: '7 giorni consecutivi di utilizzo', icon: '🔥' },
  { id: 'explorer', name: 'Esploratore', desc: 'Hai visitato tutte le 5 sezioni', icon: '🗺️' }
];

export function checkBadgeCondition(badgeId, stats) {
  const conditions = {
    first_break: (s) => s.breakCount >= 1,
    curious: (s) => s.curiosityCount >= 10,
    riddle_king: (s) => s.riddleCount >= 10,
    caffeine_addict: (s) => s.breakToday >= 5,
    jackpot: (s) => s.slotWins >= 1,
    pollster: (s) => s.pollVotes >= 5,
    zen_master: (s) => s.zenCount >= 3,
    barista: (s) => s.rouletteChosen >= 1,
    streak_7: (s) => s.streak >= 7,
    explorer: (s) => s.sectionsVisited >= 5
  };
  return conditions[badgeId] ? conditions[badgeId](stats) : false;
}
