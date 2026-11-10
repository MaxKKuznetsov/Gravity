// Генератор случайных чисел: функция без аргументов, которая возвращает
// число из [0, 1). Math.random подходит, а в тестах подставляем генератор
// с зерном, чтобы результат повторялся (как random.Random(seed) в Python).
export type Random = () => number;

// Mulberry32 — маленький быстрый генератор с 32-битным состоянием.
// Для игры его качества с запасом хватает.
export function seededRandom(seed: number): Random {
  // `>>> 0` приводит число к беззнаковому 32-битному целому
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Равномерно распределённое число из [min, max)
export function randomRange(random: Random, min: number, max: number): number {
  return min + (max - min) * random();
}

// Случайный знак: +1 или −1 с равной вероятностью
export function randomSign(random: Random): number {
  return random() < 0.5 ? -1 : 1;
}
