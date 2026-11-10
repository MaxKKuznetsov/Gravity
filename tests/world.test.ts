import { describe, expect, it } from 'vitest';
import type { Controls } from '../src/core/input';
import { seededRandom } from '../src/core/random';
import { Vec2 } from '../src/core/Vec2';
import { Meteor } from '../src/entities/meteor';
import { Planet } from '../src/entities/planet';
import { circularSpeed } from '../src/physics/gravity';
import { DEFAULT_METEOR_PARAMS } from '../src/game/meteorSpawner';
import {
  type WorldParams,
  createWorld,
  predictShipTrajectory,
  spawnShip,
  stepWorld,
} from '../src/game/world';

const DT = 1 / 120;
const idle: Controls = { turn: 0, thrust: false, fire: false, aimScreen: Vec2.ZERO };
const params: WorldParams = {
  fieldRadius: 1000,
  fieldStiffness: 0.6,
  startOrbitRadius: 220,
  respawnDelay: 1,
  // Метеоритов нет, чтобы случайно не сбили корабль; их проверяют отдельно
  meteors: { ...DEFAULT_METEOR_PARAMS, maxCount: 0 },
};

function run(world: ReturnType<typeof createWorld>, seconds: number): void {
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) stepWorld(world, idle, Vec2.ZERO, DT);
}

describe('World', () => {
  it('корабль стартует на круговой орбите и держится на ней', () => {
    const planet = new Planet(Vec2.ZERO, 60, 5_000_000);
    const world = createWorld(planet, params);
    const ship = world.ship;
    expect(ship).not.toBeNull();
    expect(ship?.speed).toBeCloseTo(circularSpeed(planet.gm, 220), 9);
    run(world, 20); // больше двух оборотов
    expect(world.stats.crashes).toBe(0);
    expect(world.ship?.position.length()).toBeCloseTo(220, -1);
  });

  it('без скорости корабль падает, взрывается и появляется снова', () => {
    const planet = new Planet(Vec2.ZERO, 60, 5_000_000);
    const world = createWorld(planet, params);
    // Останавливаем корабль: он должен упасть на планету
    if (world.ship) world.ship.velocity = Vec2.ZERO;
    // Падение с высоты r = 220 занимает ≈ 1.6 с, плюс 1 с до нового корабля
    run(world, 3);
    expect(world.stats.crashes).toBe(1);
    // Через секунду после взрыва (respawnDelay) появился новый корабль
    expect(world.ship).not.toBeNull();
    expect(world.explosions.length).toBeLessThanOrEqual(1);
  });

  it('сразу после взрыва корабля нет, а взрыв есть', () => {
    const planet = new Planet(Vec2.ZERO, 60, 5_000_000);
    const world = createWorld(planet, params);
    if (world.ship) {
      world.ship.position = new Vec2(0, -69);
      world.ship.velocity = Vec2.ZERO;
    }
    stepWorld(world, idle, Vec2.ZERO, DT);
    stepWorld(world, idle, Vec2.ZERO, DT);
    expect(world.ship).toBeNull();
    expect(world.explosions).toHaveLength(1);
    expect(predictShipTrajectory(world)).toBeNull();
  });

  it('за границей поля корабль тянет обратно', () => {
    const planet = new Planet(Vec2.ZERO, 60, 1); // гравитация почти нулевая
    const world = createWorld(planet, { ...params, fieldRadius: 300 });
    if (world.ship) {
      world.ship.position = new Vec2(400, 0);
      world.ship.velocity = new Vec2(50, 0);
    }
    run(world, 2);
    // Без границы за 2 с улетел бы на 500; пружина развернула корабль
    expect(world.ship?.velocity.x).toBeLessThan(0);
  });

  it('предсказание круговой орбиты замыкается и не упирается в планету', () => {
    const world = createWorld(new Planet(Vec2.ZERO, 60, 5_000_000), params);
    const t = predictShipTrajectory(world, 10, 1 / 60);
    expect(t?.stopped).toBe(false);
    for (const p of t?.points ?? []) expect(p.length()).toBeCloseTo(220, -1);
  });

  it('предсказание падения отмечает удар о планету', () => {
    const world = createWorld(new Planet(Vec2.ZERO, 60, 5_000_000), params);
    if (world.ship) world.ship.velocity = Vec2.ZERO;
    expect(predictShipTrajectory(world)?.stopped).toBe(true);
  });
});

describe('spawnShip', () => {
  it('корабль над планетой, носом по ходу движения', () => {
    const ship = spawnShip(new Planet(new Vec2(10, 10), 60, 5_000_000), 200);
    expect(ship.position).toEqual(new Vec2(10, -190));
    expect(ship.velocity.y).toBe(0);
    expect(ship.velocity.x).toBeGreaterThan(0);
    expect(ship.angle).toBe(0);
  });
});

describe('Метеориты в мире', () => {
  const planet = () => new Planet(Vec2.ZERO, 60, 5_000_000);
  const withMeteors = (maxCount: number): WorldParams => ({
    ...params,
    fieldRadius: 400,
    meteors: { ...DEFAULT_METEOR_PARAMS, maxCount, spawnInterval: 0.5, firstSpawnDelay: 0 },
  });

  it('появляются на краю поля по таймеру, не больше maxCount', () => {
    const world = createWorld(planet(), withMeteors(3), seededRandom(1));
    // Корабль убираем подальше, чтобы его не задело
    if (world.ship) world.ship.position = new Vec2(5000, 0);
    stepWorld(world, idle, Vec2.ZERO, DT);
    expect(world.meteors).toHaveLength(1);
    // За один шаг метеорит успевает сдвинуться на пару пикселей
    expect(world.meteors[0]?.position.length()).toBeCloseTo(400, -1);
    run(world, 0.6);
    expect(world.meteors.length).toBe(2);
    run(world, 3);
    expect(world.meteors.length).toBeLessThanOrEqual(3);
    expect(world.stats.meteorsSpawned).toBeGreaterThanOrEqual(3);
  });

  it('метеорит, упавший на планету, исчезает со взрывом', () => {
    const world = createWorld(planet(), withMeteors(0));
    world.meteors.push(new Meteor(new Vec2(0, -150), Vec2.ZERO, 4));
    run(world, 1.5);
    expect(world.meteors).toHaveLength(0);
    expect(world.stats.meteorImpacts).toBe(1);
    expect(world.explosions.length).toBeGreaterThanOrEqual(1);
  });

  it('метеорит, вылетевший за край поля, исчезает без взрыва', () => {
    const world = createWorld(planet(), withMeteors(0));
    world.meteors.push(new Meteor(new Vec2(390, 0), new Vec2(400, 0), 1));
    run(world, 0.5);
    expect(world.meteors).toHaveLength(0);
    expect(world.stats.meteorsEscaped).toBe(1);
    expect(world.explosions).toHaveLength(0);
  });

  it('метеорит на эллипсе продолжает летать', () => {
    const world = createWorld(planet(), withMeteors(0));
    if (world.ship) world.ship.position = new Vec2(5000, 0);
    const v = circularSpeed(5_000_000, 300);
    world.meteors.push(new Meteor(new Vec2(300, 0), new Vec2(0, v), 1));
    run(world, 30);
    expect(world.meteors).toHaveLength(1);
    expect(world.meteors[0]?.position.length()).toBeCloseTo(300, -1);
  });

  it('метеорит разбивает корабль и разбивается сам', () => {
    const world = createWorld(planet(), withMeteors(0));
    const ship = world.ship;
    expect(ship).not.toBeNull();
    if (!ship) return;
    // Метеорит прямо на пути корабля
    world.meteors.push(new Meteor(ship.position.add(new Vec2(15, 0)), Vec2.ZERO, 1));
    stepWorld(world, idle, Vec2.ZERO, DT);
    expect(world.ship).toBeNull();
    expect(world.meteors).toHaveLength(0);
    expect(world.stats.crashes).toBe(1);
    expect(world.stats.shipHitsByMeteor).toBe(1);
    expect(world.explosions).toHaveLength(2);
  });

  it('пока корабля нет, метеориты продолжают двигаться', () => {
    const world = createWorld(planet(), withMeteors(0));
    world.ship = null;
    world.respawnTimer = 10;
    world.meteors.push(new Meteor(new Vec2(300, 0), new Vec2(0, 100), 1));
    stepWorld(world, idle, Vec2.ZERO, DT);
    expect(world.meteors[0]?.position.y).toBeGreaterThan(0);
  });
});
