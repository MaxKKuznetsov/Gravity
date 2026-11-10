import { describe, expect, it } from 'vitest';
import { Vec2 } from '../src/core/Vec2';
import { Bullet } from '../src/entities/bullet';
import { Ship } from '../src/entities/ship';
import { Cannon, readiness } from '../src/game/weapon';
import { segmentHitsCircle } from '../src/physics/collision';

const params = { muzzleSpeed: 300, reloadTime: 0.5, muzzleOffset: 10 };

describe('Cannon', () => {
  it('стреляет в сторону прицела, а не по носу корабля', () => {
    const cannon = new Cannon(params);
    // Нос смотрит вправо (угол 0), прицел — вниз
    const ship = new Ship(Vec2.ZERO, 0);
    const [bullet] = cannon.fire(ship, new Vec2(0, 100));
    expect(bullet).toBeDefined();
    expect(bullet?.position.equals(new Vec2(0, 10))).toBe(true);
    expect(bullet?.velocity.equals(new Vec2(0, 300))).toBe(true);
  });

  it('скорость снаряда = скорость корабля + скорость выстрела', () => {
    const cannon = new Cannon(params);
    const ship = new Ship(Vec2.ZERO, 0);
    ship.velocity = new Vec2(100, -40);
    const [bullet] = cannon.fire(ship, new Vec2(-50, 0));
    expect(bullet?.velocity.equals(new Vec2(100 - 300, -40))).toBe(true);
  });

  it('не стреляет, пока идёт перезарядка', () => {
    const cannon = new Cannon(params);
    const ship = new Ship();
    expect(readiness(cannon)).toBe(1);
    expect(cannon.fire(ship, new Vec2(100, 0))).toHaveLength(1);
    expect(readiness(cannon)).toBe(0);
    expect(cannon.fire(ship, new Vec2(100, 0))).toHaveLength(0);
    cannon.tick(0.3);
    expect(readiness(cannon)).toBeCloseTo(0.6, 9);
    expect(cannon.fire(ship, new Vec2(100, 0))).toHaveLength(0);
    cannon.tick(0.2);
    expect(cannon.reloadLeft).toBe(0);
    expect(cannon.fire(ship, new Vec2(100, 0))).toHaveLength(1);
  });

  it('прицел прямо на корабле — выстрел по носу', () => {
    const cannon = new Cannon(params);
    const ship = new Ship(new Vec2(5, 5), Math.PI / 2);
    const [bullet] = cannon.fire(ship, new Vec2(5, 5));
    expect(bullet?.velocity.equals(new Vec2(0, 300), 1e-9)).toBe(true);
  });
});

describe('Bullet', () => {
  it('летит под действием ускорения и стареет', () => {
    const b = new Bullet(Vec2.ZERO, new Vec2(100, 0), 1);
    b.step(0.5, Vec2.ZERO);
    expect(b.previousPosition).toEqual(Vec2.ZERO);
    expect(b.position.equals(new Vec2(50, 0))).toBe(true);
    expect(b.expired).toBe(false);
    b.step(0.5, Vec2.ZERO);
    expect(b.expired).toBe(true);
  });
});

describe('segmentHitsCircle', () => {
  const c = new Vec2(10, 0);
  it('отрезок, проходящий сквозь круг, попадает', () => {
    expect(segmentHitsCircle(new Vec2(0, 0), new Vec2(20, 0), c, 2)).toBe(true);
  });
  it('отрезок мимо круга не попадает', () => {
    expect(segmentHitsCircle(new Vec2(0, 5), new Vec2(20, 5), c, 2)).toBe(false);
  });
  it('отрезок, не дотянувшийся до круга, не попадает', () => {
    expect(segmentHitsCircle(new Vec2(0, 0), new Vec2(7, 0), c, 2)).toBe(false);
    expect(segmentHitsCircle(new Vec2(0, 0), new Vec2(8, 0), c, 2)).toBe(true);
  });
  it('нулевой отрезок — это проверка точки', () => {
    expect(segmentHitsCircle(new Vec2(9, 0), new Vec2(9, 0), c, 2)).toBe(true);
    expect(segmentHitsCircle(new Vec2(0, 0), new Vec2(0, 0), c, 2)).toBe(false);
  });
});
