import { describe, expect, it } from 'vitest';
import { Vec2 } from '../src/core/Vec2';
import { clampSpeed, integrate } from '../src/physics/integrator';

describe('integrate (semi-implicit Euler)', () => {
  it('сначала обновляет скорость, потом положение новой скоростью', () => {
    const body = { position: Vec2.ZERO, velocity: new Vec2(1, 0) };
    integrate(body, new Vec2(0, 2), 0.5);
    expect(body.velocity).toEqual(new Vec2(1, 1));
    // Явный Euler дал бы (0.5, 0), semi-implicit — (0.5, 0.5)
    expect(body.position).toEqual(new Vec2(0.5, 0.5));
  });

  it('ограничивает скорость до сдвига положения', () => {
    const body = { position: Vec2.ZERO, velocity: Vec2.ZERO };
    integrate(body, new Vec2(1000, 0), 1, 10);
    expect(body.velocity).toEqual(new Vec2(10, 0));
    expect(body.position).toEqual(new Vec2(10, 0));
  });
});

describe('clampSpeed', () => {
  it('не трогает скорость в пределах лимита', () => {
    expect(clampSpeed(new Vec2(3, 4), 5)).toEqual(new Vec2(3, 4));
  });

  it('укорачивает вектор до лимита', () => {
    expect(clampSpeed(new Vec2(6, 8), 5).equals(new Vec2(3, 4))).toBe(true);
  });

  it('0 и Infinity означают «без ограничения»', () => {
    expect(clampSpeed(new Vec2(600, 800), 0)).toEqual(new Vec2(600, 800));
    expect(clampSpeed(new Vec2(600, 800), Infinity)).toEqual(new Vec2(600, 800));
  });
});
