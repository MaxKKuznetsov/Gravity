import { describe, expect, it } from 'vitest';
import { Vec2 } from '../src/core/Vec2';

describe('Vec2', () => {
  it('складывает, вычитает и масштабирует', () => {
    const a = new Vec2(1, 2);
    const b = new Vec2(3, -5);
    expect(a.add(b)).toEqual(new Vec2(4, -3));
    expect(a.sub(b)).toEqual(new Vec2(-2, 7));
    expect(a.scale(3)).toEqual(new Vec2(3, 6));
  });

  it('не меняет исходные векторы', () => {
    const a = new Vec2(1, 2);
    a.add(new Vec2(10, 10));
    a.scale(5);
    expect(a).toEqual(new Vec2(1, 2));
  });

  it('считает скалярное и векторное произведения', () => {
    const x = new Vec2(1, 0);
    const y = new Vec2(0, 1);
    expect(x.dot(y)).toBe(0);
    expect(new Vec2(2, 3).dot(new Vec2(4, 5))).toBe(23);
    expect(x.cross(y)).toBe(1);
    expect(y.cross(x)).toBe(-1);
  });

  it('считает длину и расстояние', () => {
    expect(new Vec2(3, 4).length()).toBe(5);
    expect(new Vec2(3, 4).lengthSq()).toBe(25);
    expect(new Vec2(1, 1).distanceTo(new Vec2(4, 5))).toBe(5);
  });

  it('нормализует вектор, а нулевой оставляет нулевым', () => {
    const n = new Vec2(10, 0).normalize();
    expect(n).toEqual(new Vec2(1, 0));
    expect(new Vec2(3, 4).normalize().length()).toBeCloseTo(1, 12);
    expect(Vec2.ZERO.normalize()).toEqual(Vec2.ZERO);
  });

  it('поворот на +90° при оси Y вниз идёт по часовой стрелке: X → Y', () => {
    const r = new Vec2(1, 0).rotate(Math.PI / 2);
    expect(r.equals(new Vec2(0, 1))).toBe(true);
  });

  it('поворот сохраняет длину', () => {
    const v = new Vec2(3, -7);
    expect(v.rotate(1.234).length()).toBeCloseTo(v.length(), 12);
  });

  it('fromAngle и angle взаимно обратны', () => {
    const v = Vec2.fromAngle(0.75, 2);
    expect(v.length()).toBeCloseTo(2, 12);
    expect(v.angle()).toBeCloseTo(0.75, 12);
    expect(Vec2.fromAngle(Math.PI / 2).equals(new Vec2(0, 1))).toBe(true);
  });

  it('equals учитывает допуск', () => {
    expect(new Vec2(1, 1).equals(new Vec2(1 + 1e-12, 1))).toBe(true);
    expect(new Vec2(1, 1).equals(new Vec2(1.1, 1))).toBe(false);
  });
});
