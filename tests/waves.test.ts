import { describe, expect, it } from 'vitest';
import { waveSettings } from '../src/game/waves';

describe('waveSettings', () => {
  it('первая волна — базовая квота и интервал', () => {
    const w = waveSettings(1, 2, 1.5, 4, 2);
    expect(w.wave).toBe(1);
    expect(w.spawnQuota).toBe(4);
    expect(w.maxCount).toBe(2);
    expect(w.spawnInterval).toBe(1.5);
  });

  it('каждая волна добавляет квоту и одновременных метеоритов', () => {
    const w = waveSettings(3, 2, 1.5, 4, 2);
    expect(w.spawnQuota).toBe(8);
    expect(w.maxCount).toBe(4);
    expect(w.spawnInterval).toBeCloseTo(1.2, 9);
  });

  it('одновременных метеоритов не больше CAP, интервал не ниже MIN', () => {
    const w = waveSettings(20, 2, 1.5, 4, 2);
    expect(w.maxCount).toBe(6);
    expect(w.spawnInterval).toBe(0.55);
  });
});
