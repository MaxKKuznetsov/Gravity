import { describe, expect, it } from 'vitest';
import { FpsMeter } from '../src/core/fpsMeter';

describe('FpsMeter', () => {
  it('показывает 60 при кадрах по 1/60 с', () => {
    const meter = new FpsMeter(0.5);
    for (let i = 0; i < 60; i++) meter.tick(1 / 60);
    expect(meter.fps).toBeCloseTo(60, 6);
  });
});
