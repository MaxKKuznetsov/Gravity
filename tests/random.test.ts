import { describe, expect, it } from 'vitest';
import { randomRange, randomSign, seededRandom } from '../src/core/random';

describe('seededRandom', () => {
  it('одно и то же зерно даёт одну и ту же последовательность', () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });

  it('числа лежат в [0, 1) и распределены примерно равномерно', () => {
    const random = seededRandom(1);
    let sum = 0;
    const n = 10_000;
    for (let i = 0; i < n; i++) {
      const x = random();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
      sum += x;
    }
    expect(sum / n).toBeCloseTo(0.5, 1);
  });

  it('randomRange и randomSign', () => {
    const random = seededRandom(7);
    const signs = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const x = randomRange(random, 3, 5);
      expect(x).toBeGreaterThanOrEqual(3);
      expect(x).toBeLessThan(5);
      signs.add(randomSign(random));
    }
    expect([...signs].sort()).toEqual([-1, 1]);
  });
});
