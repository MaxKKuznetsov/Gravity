import { describe, expect, it } from 'vitest';
import { Vec2 } from '../src/core/Vec2';
import { predictTrajectory } from '../src/physics/trajectory';

describe('predictTrajectory', () => {
  it('без сил — прямая, исходное тело не меняется', () => {
    const body = { position: Vec2.ZERO, velocity: new Vec2(10, 0) };
    const t = predictTrajectory(body, () => Vec2.ZERO, { seconds: 2, dt: 0.5 });
    expect(t.points).toHaveLength(5); // старт + 4 шага
    expect(t.points[4]?.equals(new Vec2(20, 0), 1e-9)).toBe(true);
    expect(t.stopped).toBe(false);
    expect(body.position).toEqual(Vec2.ZERO);
  });

  it('обрывается в точке, где сработал stop', () => {
    const body = { position: Vec2.ZERO, velocity: new Vec2(10, 0) };
    const t = predictTrajectory(body, () => Vec2.ZERO, {
      seconds: 10,
      dt: 0.5,
      stop: (p) => p.x >= 12,
    });
    expect(t.stopped).toBe(true);
    expect(t.points.at(-1)?.x).toBeCloseTo(15, 9);
  });

  it('учитывает поле ускорений и лимит скорости', () => {
    const body = { position: Vec2.ZERO, velocity: Vec2.ZERO };
    const t = predictTrajectory(body, () => new Vec2(0, 100), {
      seconds: 1,
      dt: 0.1,
      maxSpeed: 20,
    });
    // Скорость 10, потом упирается в 20 пикс/с: 0.1·10 + 9·0.1·20 = 19
    expect(t.points.at(-1)?.y).toBeCloseTo(19, 9);
  });
});
