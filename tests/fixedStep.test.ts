import { describe, expect, it } from 'vitest';
import { FixedStepAccumulator } from '../src/core/fixedStep';

describe('FixedStepAccumulator', () => {
  it('при 60 FPS и шаге 1/120 делает ровно 2 шага за кадр', () => {
    const acc = new FixedStepAccumulator(1 / 120, 0.25);
    for (let i = 0; i < 100; i++) {
      expect(acc.advance(1 / 60)).toBe(2);
    }
  });

  it('переносит остаток в следующий кадр', () => {
    const acc = new FixedStepAccumulator(0.01, 1);
    expect(acc.advance(0.015)).toBe(1);
    expect(acc.alpha).toBeCloseTo(0.5, 9);
    expect(acc.advance(0.005)).toBe(1);
    expect(acc.alpha).toBeCloseTo(0, 9);
  });

  it('число шагов за секунду не зависит от частоты кадров', () => {
    for (const fps of [30, 60, 75, 144, 240]) {
      const acc = new FixedStepAccumulator(1 / 120, 0.25);
      let steps = 0;
      for (let i = 0; i < fps; i++) steps += acc.advance(1 / fps);
      expect(steps).toBe(120);
    }
  });

  it('длинный кадр обрезается до maxFrameTime', () => {
    const acc = new FixedStepAccumulator(0.01, 0.1);
    expect(acc.advance(5)).toBe(10);
  });

  it('отрицательное время игнорируется', () => {
    const acc = new FixedStepAccumulator(0.01, 0.1);
    expect(acc.advance(-1)).toBe(0);
  });
});
