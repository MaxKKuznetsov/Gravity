import {
  EXPLOSION_DURATION,
  EXPLOSION_RADIUS,
  FIELD_RADIUS,
  METEOR_EXPLOSION_SCALE,
  FIELD_RETURN_STIFFNESS,
  SHIP_COLLISION_RADIUS,
  SHIP_RESPAWN_DELAY,
  SHIP_START_ANGLE,
  SHIP_START_ORBIT_RADIUS,
  TRAJECTORY_SECONDS,
  TRAJECTORY_STEP,
} from '../config';
import type { Controls } from '../core/input';
import type { Random } from '../core/random';
import { Vec2 } from '../core/Vec2';
import type { Meteor } from '../entities/meteor';
import { Planet } from '../entities/planet';
import { Ship } from '../entities/ship';
import { boundaryAcceleration } from '../physics/boundary';
import { circlesOverlap } from '../physics/collision';
import { circularSpeed } from '../physics/gravity';
import { type Trajectory, predictTrajectory } from '../physics/trajectory';
import { DEFAULT_METEOR_PARAMS, type MeteorSpawnParams, spawnMeteor } from './meteorSpawner';

// Взрыв на месте разбившегося корабля или метеорита; age растёт от 0 до
// EXPLOSION_DURATION, radius — до какого размера расходится кольцо
export interface Explosion {
  readonly position: Vec2;
  readonly radius: number;
  age: number;
}

// Настройки мира, которые тесты могут подменить
export interface WorldParams {
  readonly fieldRadius: number;
  readonly fieldStiffness: number;
  readonly startOrbitRadius: number;
  readonly respawnDelay: number;
  readonly meteors: MeteorSpawnParams;
}

export const DEFAULT_WORLD_PARAMS: WorldParams = {
  fieldRadius: FIELD_RADIUS,
  fieldStiffness: FIELD_RETURN_STIFFNESS,
  startOrbitRadius: SHIP_START_ORBIT_RADIUS,
  respawnDelay: SHIP_RESPAWN_DELAY,
  meteors: DEFAULT_METEOR_PARAMS,
};

// Счётчики событий для оверлея (позже из них вырастут очки)
export interface WorldStats {
  crashes: number;
  meteorsSpawned: number;
  // Метеориты, упавшие на планету и улетевшие за край поля
  meteorImpacts: number;
  meteorsEscaped: number;
  // Сколько раз корабль разбился о метеорит (входит в crashes)
  shipHitsByMeteor: number;
}

// Состояние мира: планета, корабль, метеориты и эффекты
export interface World {
  time: number;
  ticks: number;
  shotsFired: number;
  aimWorld: Vec2;
  controls: Controls;
  readonly params: WorldParams;
  readonly planet: Planet;
  // `Ship | null` — как Optional[Ship] в Python: после взрыва корабля нет,
  // пока не истечёт respawnTimer. Компилятор заставит проверить на null
  // перед тем, как обратиться к полям корабля.
  ship: Ship | null;
  respawnTimer: number;
  meteors: Meteor[];
  // Сколько секунд до появления следующего метеорита
  meteorTimer: number;
  readonly random: Random;
  readonly stats: WorldStats;
  explosions: Explosion[];
}

export function createWorld(
  planet: Planet = new Planet(),
  params: WorldParams = DEFAULT_WORLD_PARAMS,
  random: Random = Math.random,
): World {
  return {
    time: 0,
    ticks: 0,
    shotsFired: 0,
    aimWorld: Vec2.ZERO,
    controls: { turn: 0, thrust: false, fire: false, aimScreen: Vec2.ZERO },
    params,
    planet,
    ship: spawnShip(planet, params.startOrbitRadius),
    respawnTimer: 0,
    meteors: [],
    meteorTimer: params.meteors.firstSpawnDelay,
    random,
    stats: {
      crashes: 0,
      meteorsSpawned: 0,
      meteorImpacts: 0,
      meteorsEscaped: 0,
      shipHitsByMeteor: 0,
    },
    explosions: [],
  };
}

// Новый корабль над планетой на круговой орбите радиуса orbitRadius,
// носом по ходу движения (облёт по часовой стрелке на экране).
// orbitRadius = 0 — корабль стоит в центре без скорости.
export function spawnShip(planet: Planet, orbitRadius: number): Ship {
  if (orbitRadius <= 0) return new Ship(planet.position, SHIP_START_ANGLE);
  const ship = new Ship(planet.position.add(new Vec2(0, -orbitRadius)), 0);
  ship.velocity = new Vec2(circularSpeed(planet.gm, orbitRadius), 0);
  return ship;
}

// Всё, что действует на корабль, кроме его двигателя: гравитация планеты
// и возвращающая сила за краем поля
export function environmentAcceleration(world: World, position: Vec2): Vec2 {
  const { planet, params } = world;
  return planet
    .accelerationAt(position)
    .add(
      boundaryAcceleration(position, planet.position, params.fieldRadius, params.fieldStiffness),
    );
}

function hitsPlanet(world: World, position: Vec2, radius = SHIP_COLLISION_RADIUS): boolean {
  return circlesOverlap(position, radius, world.planet.position, world.planet.radius);
}

// Корабль взрывается; новый появится через respawnDelay
function destroyShip(world: World, ship: Ship): void {
  world.explosions.push({ position: ship.position, radius: EXPLOSION_RADIUS, age: 0 });
  world.ship = null;
  world.respawnTimer = world.params.respawnDelay;
  world.stats.crashes += 1;
}

function explodeMeteor(world: World, meteor: Meteor): void {
  world.explosions.push({
    position: meteor.position,
    radius: meteor.radius * METEOR_EXPLOSION_SCALE,
    age: 0,
  });
}

// Раз в spawnInterval добавляем метеорит на краю поля, пока их меньше maxCount
function spawnMeteors(world: World, dt: number): void {
  const { meteors: params, fieldRadius } = world.params;
  world.meteorTimer -= dt;
  if (world.meteorTimer > 0) return;
  world.meteorTimer += params.spawnInterval;
  if (world.meteors.length >= params.maxCount) return;
  world.meteors.push(spawnMeteor(world.planet, fieldRadius, world.random, params));
  world.stats.meteorsSpawned += 1;
}

// Двигаем метеориты и убираем тех, кто упал на планету или вылетел за поле.
// На метеориты действует только гравитация: мягкой границы у них нет
function stepMeteors(world: World, dt: number): void {
  const { planet, params } = world;
  // filter возвращает новый массив из тех, для кого функция вернула true
  world.meteors = world.meteors.filter((m) => {
    m.step(dt, planet.accelerationAt(m.position));
    if (hitsPlanet(world, m.position, m.radius)) {
      explodeMeteor(world, m);
      world.stats.meteorImpacts += 1;
      return false;
    }
    // Исчезает, когда целиком ушёл за край (центр дальше R + радиус)
    if (m.position.distanceTo(planet.position) > params.fieldRadius + m.radius) {
      world.stats.meteorsEscaped += 1;
      return false;
    }
    return true;
  });
}

// Первый метеорит, задевший корабль, или undefined
function meteorHittingShip(world: World, ship: Ship): Meteor | undefined {
  return world.meteors.find((m) =>
    circlesOverlap(ship.position, SHIP_COLLISION_RADIUS, m.position, m.radius),
  );
}

// Один шаг симуляции длиной dt
export function stepWorld(world: World, controls: Controls, aimWorld: Vec2, dt: number): void {
  world.time += dt;
  world.ticks += 1;
  world.controls = controls;
  world.aimWorld = aimWorld;

  for (const e of world.explosions) e.age += dt;
  world.explosions = world.explosions.filter((e) => e.age < EXPLOSION_DURATION);

  spawnMeteors(world, dt);
  stepMeteors(world, dt);

  const ship = world.ship;
  if (ship === null) {
    world.respawnTimer -= dt;
    if (world.respawnTimer <= 0) {
      world.ship = spawnShip(world.planet, world.params.startOrbitRadius);
    }
    return;
  }

  ship.step(controls, dt, environmentAcceleration(world, ship.position));
  if (hitsPlanet(world, ship.position)) {
    destroyShip(world, ship);
    return;
  }
  const meteor = meteorHittingShip(world, ship);
  if (meteor) {
    // Метеорит разбивается вместе с кораблём
    destroyShip(world, ship);
    explodeMeteor(world, meteor);
    world.meteors = world.meteors.filter((m) => m !== meteor);
    world.stats.shipHitsByMeteor += 1;
  }
}

// Куда полетит корабль, если отпустить управление. null — корабля нет
export function predictShipTrajectory(
  world: World,
  seconds = TRAJECTORY_SECONDS,
  dt = TRAJECTORY_STEP,
): Trajectory | null {
  const ship = world.ship;
  if (ship === null) return null;
  return predictTrajectory(ship, (p) => environmentAcceleration(world, p), {
    seconds,
    dt,
    maxSpeed: ship.params.maxSpeed,
    stop: (p) => hitsPlanet(world, p),
  });
}
