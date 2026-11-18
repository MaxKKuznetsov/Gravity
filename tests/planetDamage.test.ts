import { describe, expect, it } from 'vitest';
import { meteorSizeClass, planetDamageFromMass, scarRadiusFactor } from '../src/game/planetDamage';
import type { Controls } from '../src/core/input';
import { Vec2 } from '../src/core/Vec2';
import { Meteor } from '../src/entities/meteor';
import { Planet } from '../src/entities/planet';
import { DEFAULT_FRAGMENT_PARAMS } from '../src/game/fragmentation';
import { DEFAULT_METEOR_PARAMS } from '../src/game/meteorSpawner';
import { type WorldParams, createWorld, stepWorld } from '../src/game/world';

const DT = 1 / 120;
const idle: Controls = { turn: 0, thrust: false, fire: false, aimScreen: Vec2.ZERO };

const params: WorldParams = {
  fieldRadius: 1000,
  fieldStiffness: 0.6,
  startOrbitRadius: 220,
  respawnDelay: 1,
  meteors: { ...DEFAULT_METEOR_PARAMS, maxCount: 0 },
  fragments: DEFAULT_FRAGMENT_PARAMS,
  startingLives: 3,
  planetMaxHits: 25,
  scorePerMass: 100,
  waveBaseQuota: 0,
  waveQuotaGrowth: 0,
};

describe('planetDamage', () => {
  it('класс размера по массе', () => {
    expect(meteorSizeClass(1)).toBe('small');
    expect(meteorSizeClass(2)).toBe('small');
    expect(meteorSizeClass(3)).toBe('medium');
    expect(meteorSizeClass(5)).toBe('medium');
    expect(meteorSizeClass(6)).toBe('large');
    expect(meteorSizeClass(9)).toBe('large');
  });

  it('урон: малый 1, средний 2, крупный 3', () => {
    expect(planetDamageFromMass(1)).toBe(1);
    expect(planetDamageFromMass(4)).toBe(2);
    expect(planetDamageFromMass(9)).toBe(3);
    expect(scarRadiusFactor(9)).toBeGreaterThan(scarRadiusFactor(1));
  });
});

describe('Урон планете в мире', () => {
  it('падение метеорита снимает хиты и оставляет шрам', () => {
    const world = createWorld(new Planet(Vec2.ZERO, 60, 5_000_000), params);
    if (world.ship) world.ship.position = new Vec2(5000, 0);
    world.meteors.push(new Meteor(new Vec2(0, -150), Vec2.ZERO, 9));
    for (let i = 0; i < Math.round(1.5 / DT); i++) stepWorld(world, idle, Vec2.ZERO, DT);
    expect(world.stats.meteorImpacts).toBe(1);
    expect(world.planetHits).toBe(22);
    expect(world.planetScars).toHaveLength(1);
    expect(world.defeated).toBe(false);
  });

  it('малый метеорит снимает 1 хит', () => {
    const world = createWorld(new Planet(Vec2.ZERO, 60, 5_000_000), {
      ...params,
      planetMaxHits: 5,
    });
    if (world.ship) world.ship.position = new Vec2(5000, 0);
    world.meteors.push(new Meteor(new Vec2(0, -80), Vec2.ZERO, 1));
    for (let i = 0; i < Math.round(1 / DT); i++) stepWorld(world, idle, Vec2.ZERO, DT);
    expect(world.planetHits).toBe(4);
  });

  it('хиты планеты в ноль — проигрыш', () => {
    const world = createWorld(new Planet(Vec2.ZERO, 60, 5_000_000), {
      ...params,
      planetMaxHits: 3,
    });
    if (world.ship) world.ship.position = new Vec2(5000, 0);
    expect(world.planetHits).toBe(3);
    world.meteors.push(new Meteor(new Vec2(0, -80), Vec2.ZERO, 9));
    for (let i = 0; i < Math.round(1 / DT); i++) stepWorld(world, idle, Vec2.ZERO, DT);
    expect(world.planetHits).toBe(0);
    expect(world.defeated).toBe(true);
    expect(world.defeatCause).toBe('planet');
  });
});
