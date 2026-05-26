export const COFFEE_TYPES = [
  { key: 'espresso', emoji: '☕', label: 'Espresso', kcal: 2 },
  { key: 'cappuccino', emoji: '🥛', label: 'Cappuccino', kcal: 80 },
  { key: 'americano', emoji: '🫗', label: 'Caffè Americano', kcal: 5 },
  { key: 'latte_macchiato', emoji: '🥛', label: 'Latte Macchiato', kcal: 120 },
  { key: 'lungo', emoji: '☕', label: 'Caffè Lungo', kcal: 4 },
  { key: 'macchiato', emoji: '☕', label: 'Caffè Macchiato', kcal: 15 },
  { key: 'mokaccino', emoji: '🍫', label: 'Mokaccino', kcal: 200 },
  { key: 'decaffeinato', emoji: '💤', label: 'Decaffeinato', kcal: 2 }
];

export const SUGAR_LEVELS = [
  { level: 0, label: 'Amaro', emoji: '😤', sublabel: 'Zero zucchero', kcal: 0 },
  { level: 1, label: 'Poco', emoji: '🥄', sublabel: '1 cucchiaino', kcal: 16 },
  { level: 2, label: 'Medio', emoji: '🥄🥄', sublabel: '2 cucchiaini', kcal: 32 },
  { level: 3, label: 'Tanto', emoji: '🥄🥄🥄', sublabel: '3 cucchiaini', kcal: 48 }
];

export function getCoffeeType(key) {
  return COFFEE_TYPES.find(c => c.key === key) || COFFEE_TYPES[0];
}

export function getSugarLevel(level) {
  return SUGAR_LEVELS.find(s => s.level === level) || SUGAR_LEVELS[0];
}

export function calculateCalories(coffeeKey, sugarLevel) {
  const coffee = getCoffeeType(coffeeKey);
  const sugar = getSugarLevel(sugarLevel);
  return coffee.kcal + sugar.kcal;
}

export function generateGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
