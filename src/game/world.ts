import {
  EXPLOSION_DURATION,
  FIELD_RADIUS,
  FIELD_RETURN_STIFFNESS,
  SHIP_COLLISION_RADIUS,
  SHIP_RESPAWN_DELAY,
  SHIP_START_ANGLE,
  SHIP_START_ORBIT_RADIUS,
  TRAJECTORY_SECONDS,
  TRAJECTORY_STEP,
} from '../config';
import type { Controls } from '../core/input';
import { Vec2 } from '../core/Vec2';
import { Planet } from '../entities/planet';
import { Ship } from '../entities/ship';
import { boundaryAcceleration } from '../physics/boundary';
import { circlesOverlap } from '../physics/collision';
import { circularSpeed } from '../physics/gravity';
import { type Trajectory, predictTrajectory } from '../physics/trajectory';

// Взрыв на месте разбившегося корабля; age растёт от 0 до EXPLOSION_DURATION
export interface Explosion {
  readonly position: Vec2;
  age: number;
}

// Настройки мира, которые тесты могут подменить
export interface WorldParams {
  readonly fieldRadius: number;
  readonly fieldStiffness: number;
  readonly startOrbitRadius: number;
  readonly respawnDelay: number;
}

export const DEFAULT_WORLD_PARAMS: WorldParams = {
  fieldRadius: FIELD_RADIUS,
  fieldStiffness: FIELD_RETURN_STIFFNESS,
  startOrbitRadius: SHIP_START_ORBIT_RADIUS,
  respawnDelay: SHIP_RESPAWN_DELAY,
};

// Состояние мира: планета, корабль и эффекты
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
  crashes: number;
  explosions: Explosion[];
}

export function createWorld(
  planet: Planet = new Planet(),
  params: WorldParams = DEFAULT_WORLD_PARAMS,
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
    crashes: 0,
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

function hitsPlanet(world: World, position: Vec2): boolean {
  return circlesOverlap(
    position,
    SHIP_COLLISION_RADIUS,
    world.planet.position,
    world.planet.radius,
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
    world.explosions.push({ position: ship.position, age: 0 });
    world.ship = null;
    world.respawnTimer = world.params.respawnDelay;
    world.crashes += 1;
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
