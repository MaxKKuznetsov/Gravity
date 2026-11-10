import { describe, expect, it } from 'vitest';
import { Vec2 } from '../src/core/Vec2';
import { offscreenMarker } from '../src/render/shipRenderer';

describe('offscreenMarker', () => {
  it('нет стрелки, когда корабль на экране', () => {
    expect(offscreenMarker(new Vec2(100, 100), 800, 600, 20)).toBeNull();
  });

  it('корабль справа — стрелка у правого края, смотрит вправо', () => {
    const m = offscreenMarker(new Vec2(2000, 300), 800, 600, 20);
    expect(m).not.toBeNull();
    expect(m!.position.equals(new Vec2(780, 300), 1e-9)).toBe(true);
    expect(m!.angle).toBeCloseTo(0, 12);
  });

  it('корабль по диагонали — стрелка внутри экрана с отступом', () => {
    const m = offscreenMarker(new Vec2(-1000, -1000), 800, 600, 20)!;
    expect(m.position.x).toBeGreaterThanOrEqual(20);
    expect(m.position.y).toBeCloseTo(20, 9);
  });
});
