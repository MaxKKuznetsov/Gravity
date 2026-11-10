import { describe, expect, it } from 'vitest';
import { Vec2 } from '../src/core/Vec2';
import { type Body, integrate } from '../src/physics/integrator';
import {
  circularSpeed,
  gravityAcceleration,
  orbitInfo,
  specificEnergy,
} from '../src/physics/gravity';

const GM = 5_000_000;
const C = Vec2.ZERO;

describe('gravityAcceleration', () => {
  it('направлено к центру, модуль GM / r²', () => {
    const a = gravityAcceleration(new Vec2(200, 0), C, GM, 10);
    expect(a.equals(new Vec2(-GM / 200 ** 2, 0), 1e-9)).toBe(true);
  });

  it('убывает как 1/r²: вдвое дальше — вчетверо слабее', () => {
    const near = gravityAcceleration(new Vec2(0, 150), C, GM, 10).length();
    const far = gravityAcceleration(new Vec2(0, 300), C, GM, 10).length();
    expect(near / far).toBeCloseTo(4, 12);
  });

  it('внутри rMin ускорение не растёт, в центре — ноль', () => {
    const a = gravityAcceleration(new Vec2(5, 0), C, GM, 50);
    expect(a.length()).toBeCloseTo(GM / 50 ** 2, 9);
    expect(gravityAcceleration(C, C, GM, 50)).toEqual(Vec2.ZERO);
  });

  it('учитывает положение центра', () => {
    const center = new Vec2(100, 100);
    const a = gravityAcceleration(new Vec2(100, 300), center, GM, 10);
    expect(a.x).toBeCloseTo(0, 12);
    expect(a.y).toBeLessThan(0);
  });
});

describe('круговая орбита (semi-implicit Euler, DT = 1/120)', () => {
  // Эталонный тест из CLAUDE.md: v = √(GM/r), несколько оборотов
  const r0 = 220;
  const v0 = circularSpeed(GM, r0);
  const period = (2 * Math.PI * r0) / v0;
  const dt = 1 / 120;
  const orbits = 5;

  it('радиус и энергия сохраняются за 5 оборотов', () => {
    const body: Body = { position: new Vec2(0, -r0), velocity: new Vec2(v0, 0) };
    const e0 = specificEnergy(body.position, body.velocity, C, GM);
    let minR = r0;
    let maxR = r0;
    let maxEnergyError = 0;

    const steps = Math.round((orbits * period) / dt);
    for (let i = 0; i < steps; i++) {
      integrate(body, gravityAcceleration(body.position, C, GM, 1), dt);
      const r = body.position.length();
      minR = Math.min(minR, r);
      maxR = Math.max(maxR, r);
      const e = specificEnergy(body.position, body.velocity, C, GM);
      maxEnergyError = Math.max(maxEnergyError, Math.abs((e - e0) / e0));
    }

    // Радиус гуляет меньше чем на 0.5 %, энергия — меньше чем на 0.5 %
    expect(minR).toBeGreaterThan(r0 * 0.995);
    expect(maxR).toBeLessThan(r0 * 1.005);
    expect(maxEnergyError).toBeLessThan(0.005);
    // И тело действительно облетело планету, а не стоит на месте: за целое
    // число оборотов вернулось близко к старту
    expect(body.position.distanceTo(new Vec2(0, -r0))).toBeLessThan(r0 * 0.05);
  });
});

describe('orbitInfo', () => {
  it('круговая орбита: e = 0, перицентр = апоцентр = r', () => {
    const r = 300;
    const o = orbitInfo(new Vec2(r, 0), new Vec2(0, circularSpeed(GM, r)), C, GM);
    expect(o.eccentricity).toBeCloseTo(0, 9);
    expect(o.periapsis).toBeCloseTo(r, 6);
    expect(o.apoapsis).toBeCloseTo(r, 6);
    expect(o.energy).toBeCloseTo(-GM / (2 * r), 6);
  });

  it('скорость больше круговой: эллипс, текущая точка — перицентр', () => {
    const r = 200;
    const o = orbitInfo(new Vec2(0, r), new Vec2(1.2 * circularSpeed(GM, r), 0), C, GM);
    expect(o.eccentricity).toBeGreaterThan(0);
    expect(o.eccentricity).toBeLessThan(1);
    expect(o.periapsis).toBeCloseTo(r, 6);
    expect(o.apoapsis).toBeGreaterThan(r);
  });

  it('вторая космическая и выше: орбита незамкнутая', () => {
    const r = 200;
    const escape = Math.SQRT2 * circularSpeed(GM, r);
    const o = orbitInfo(new Vec2(r, 0), new Vec2(0, escape * 1.1), C, GM);
    expect(o.energy).toBeGreaterThan(0);
    expect(o.eccentricity).toBeGreaterThan(1);
    expect(o.apoapsis).toBe(Number.POSITIVE_INFINITY);
  });

  it('падение отвесно вниз: перицентр 0', () => {
    const o = orbitInfo(new Vec2(300, 0), new Vec2(-50, 0), C, GM);
    expect(o.periapsis).toBeCloseTo(0, 9);
  });
});
