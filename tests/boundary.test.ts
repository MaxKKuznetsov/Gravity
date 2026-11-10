import { describe, expect, it } from 'vitest';
import { Vec2 } from '../src/core/Vec2';
import { boundaryAcceleration, isOutsideField } from '../src/physics/boundary';
import { circlesOverlap } from '../src/physics/collision';

describe('boundaryAcceleration', () => {
  it('внутри поля и на самой границе — ноль', () => {
    expect(boundaryAcceleration(new Vec2(100, 0), Vec2.ZERO, 500, 1)).toEqual(Vec2.ZERO);
    expect(boundaryAcceleration(new Vec2(0, 500), Vec2.ZERO, 500, 1)).toEqual(Vec2.ZERO);
  });

  it('за краем тянет к центру пропорционально вылету', () => {
    const a = boundaryAcceleration(new Vec2(0, 600), Vec2.ZERO, 500, 0.5);
    expect(a.equals(new Vec2(0, -50), 1e-9)).toBe(true);
    const farther = boundaryAcceleration(new Vec2(0, 700), Vec2.ZERO, 500, 0.5);
    expect(farther.length()).toBeCloseTo(100, 9);
  });

  it('isOutsideField', () => {
    expect(isOutsideField(new Vec2(300, 400), Vec2.ZERO, 500)).toBe(false);
    expect(isOutsideField(new Vec2(300, 401), Vec2.ZERO, 500)).toBe(true);
  });
});

describe('circlesOverlap', () => {
  it('пересечение, касание и промах', () => {
    expect(circlesOverlap(Vec2.ZERO, 10, new Vec2(15, 0), 10)).toBe(true);
    expect(circlesOverlap(Vec2.ZERO, 10, new Vec2(20, 0), 10)).toBe(true);
    expect(circlesOverlap(Vec2.ZERO, 10, new Vec2(20.01, 0), 10)).toBe(false);
  });
});
