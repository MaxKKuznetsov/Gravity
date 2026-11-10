import { describe, expect, it } from 'vitest';
import { seededRandom } from '../src/core/random';
import { Vec2 } from '../src/core/Vec2';
import { Meteor, meteorRadius } from '../src/entities/meteor';
import { Planet } from '../src/entities/planet';
import {
  DEFAULT_METEOR_PARAMS,
  apoapsisSpeed,
  escapeSpeed,
  meteorShape,
  spawnMeteor,
} from '../src/game/meteorSpawner';
import { circularSpeed, orbitInfo, specificEnergy } from '../src/physics/gravity';

const DT = 1 / 120;
const GM = 5_000_000;
const R = 400;
const planet = new Planet(Vec2.ZERO, 60, GM);

describe('Meteor', () => {
  it('радиус растёт как корень из массы', () => {
    expect(meteorRadius(4, 6)).toBe(12);
    expect(new Meteor(Vec2.ZERO, Vec2.ZERO, 9).radius).toBeCloseTo(meteorRadius(9), 9);
    expect(meteorRadius(9)).toBeCloseTo(3 * meteorRadius(1), 9);
  });

  it('летит под действием ускорения и вращается', () => {
    const m = new Meteor(Vec2.ZERO, new Vec2(10, 0), 1, 0, 1);
    for (let i = 0; i < 60; i++) m.step(DT, Vec2.ZERO);
    expect(m.position.x).toBeCloseTo(5, 9);
    expect(m.angle).toBeCloseTo(0.5, 9);
  });

  it('траектория в поле планеты не зависит от массы', () => {
    const light = new Meteor(new Vec2(300, 0), new Vec2(0, 100), 1);
    const heavy = new Meteor(new Vec2(300, 0), new Vec2(0, 100), 9);
    for (let i = 0; i < 600; i++) {
      light.step(DT, planet.accelerationAt(light.position));
      heavy.step(DT, planet.accelerationAt(heavy.position));
    }
    expect(heavy.position.equals(light.position, 1e-9)).toBe(true);
  });
});

describe('скорости орбит', () => {
  it('в апоцентре круговой «эллипс» даёт круговую скорость', () => {
    expect(apoapsisSpeed(GM, 300, 300)).toBeCloseTo(circularSpeed(GM, 300), 9);
  });

  it('вторая космическая — граница между эллипсом и гиперболой', () => {
    const v = escapeSpeed(GM, R);
    expect(specificEnergy(new Vec2(R, 0), new Vec2(0, v), Vec2.ZERO, GM)).toBeCloseTo(0, 6);
  });
});

describe('spawnMeteor', () => {
  it('эллиптический метеорит появляется в апоцентре на краю поля', () => {
    const random = seededRandom(3);
    for (let i = 0; i < 50; i++) {
      const m = spawnMeteor(planet, R, random, DEFAULT_METEOR_PARAMS, 'ellipse');
      expect(m.position.length()).toBeCloseTo(R, 9);
      const orbit = orbitInfo(m.position, m.velocity, Vec2.ZERO, GM);
      expect(orbit.eccentricity).toBeLessThan(1);
      expect(orbit.apoapsis).toBeCloseTo(R, 6);
      expect(orbit.periapsis).toBeGreaterThanOrEqual(
        DEFAULT_METEOR_PARAMS.ellipseMinPeriapsis - 1e-6,
      );
      expect(orbit.periapsis).toBeLessThanOrEqual(DEFAULT_METEOR_PARAMS.ellipseMaxPeriapsis + 1e-6);
      const mass = m.mass;
      expect(mass).toBeGreaterThanOrEqual(DEFAULT_METEOR_PARAMS.minMass);
      expect(mass).toBeLessThan(DEFAULT_METEOR_PARAMS.maxMass);
    }
  });

  it('гиперболический метеорит быстрее второй космической и летит внутрь', () => {
    const random = seededRandom(5);
    for (let i = 0; i < 50; i++) {
      const m = spawnMeteor(planet, R, random, DEFAULT_METEOR_PARAMS, 'hyperbola');
      expect(orbitInfo(m.position, m.velocity, Vec2.ZERO, GM).eccentricity).toBeGreaterThan(1);
      // Скорость направлена к планете: скалярное произведение с радиусом < 0
      expect(m.velocity.dot(m.position)).toBeLessThan(0);
    }
  });

  it('доля эллипсов примерно равна ellipseFraction', () => {
    const random = seededRandom(11);
    const n = 2000;
    let ellipses = 0;
    for (let i = 0; i < n; i++) {
      const m = spawnMeteor(planet, R, random);
      if (specificEnergy(m.position, m.velocity, Vec2.ZERO, GM) < 0) ellipses += 1;
    }
    expect(ellipses / n).toBeCloseTo(DEFAULT_METEOR_PARAMS.ellipseFraction, 1);
  });

  it('эллипс за полный оборот не выходит за край поля и возвращается', () => {
    const params = { ...DEFAULT_METEOR_PARAMS, ellipseMinPeriapsis: 200, ellipseMaxPeriapsis: 200 };
    const m = spawnMeteor(planet, R, seededRandom(1), params, 'ellipse');
    const start = m.position;
    // Период по третьему закону Кеплера: T = 2π · √(a³ / GM)
    const a = (R + 200) / 2;
    const period = 2 * Math.PI * Math.sqrt((a * a * a) / GM);
    let maxR = 0;
    let minR = Infinity;
    const steps = Math.round(period / DT);
    for (let i = 0; i < steps; i++) {
      m.step(DT, planet.accelerationAt(m.position));
      maxR = Math.max(maxR, m.position.length());
      minR = Math.min(minR, m.position.length());
    }
    expect(maxR).toBeLessThan(R + 1);
    expect(minR).toBeCloseTo(200, -1);
    expect(m.position.distanceTo(start)).toBeLessThan(5);
  });

  it('форма — заданное число вершин с разбросом roughness', () => {
    const shape = meteorShape(seededRandom(2), 7, 0.2);
    expect(shape).toHaveLength(7);
    for (const k of shape) {
      expect(k).toBeGreaterThanOrEqual(0.8);
      expect(k).toBeLessThan(1.2);
    }
  });
});
