import {
  BULLET_IMPACT_RADIUS,
  EXPLOSION_DURATION,
  EXPLOSION_RADIUS,
  FIELD_RADIUS,
  METEOR_EXPLOSION_SCALE,
  METEOR_HIT_EXPLOSION_SCALE,
  FIELD_RETURN_STIFFNESS,
  PLANET_MAX_HITS,
  SCORE_PER_MASS,
  SHIP_COLLISION_RADIUS,
  SHIP_RESPAWN_DELAY,
  SHIP_START_ANGLE,
  SHIP_START_ORBIT_RADIUS,
  STARTING_LIVES,
  TRAJECTORY_SECONDS,
  TRAJECTORY_STEP,
  WAVE_BASE_QUOTA,
  WAVE_QUOTA_GROWTH,
} from '../config';
import type { Controls } from '../core/input';
import type { Random } from '../core/random';
import { Vec2 } from '../core/Vec2';
import type { Bullet } from '../entities/bullet';
import type { Meteor } from '../entities/meteor';
import { Planet } from '../entities/planet';
import { Ship } from '../entities/ship';
import { boundaryAcceleration } from '../physics/boundary';
import { circlesOverlap, segmentHitsCircle } from '../physics/collision';
import { circularSpeed } from '../physics/gravity';
import { type Trajectory, predictTrajectory } from '../physics/trajectory';
import {
  DEFAULT_FRAGMENT_PARAMS,
  type FragmentParams,
  keepFragments,
  splitMeteor,
} from './fragmentation';
import { DEFAULT_METEOR_PARAMS, type MeteorSpawnParams, spawnMeteor } from './meteorSpawner';
import { planetDamageFromMass, scarRadiusFactor } from './planetDamage';
import { meteorParamsForWave, waveSettings } from './waves';
import { Cannon, type Weapon } from './weapon';

// Причина проигрыша. Тип-объединение строк — как Literal[...] в Python
export type DefeatCause = 'none' | 'ship' | 'planet';

// Тёмное пятно на поверхности планеты после падения метеорита
export interface PlanetScar {
  // Угол направления удара от центра планеты, рад
  readonly angle: number;
  // Размер кляксы в долях радиуса планеты
  readonly radiusFactor: number;
}

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
  readonly fragments: FragmentParams;
  readonly startingLives: number;
  readonly planetMaxHits: number;
  readonly scorePerMass: number;
  // 0 — бесконечный спавн как на этапах 4–5 (волны выключены)
  readonly waveBaseQuota: number;
  readonly waveQuotaGrowth: number;
}

export const DEFAULT_WORLD_PARAMS: WorldParams = {
  fieldRadius: FIELD_RADIUS,
  fieldStiffness: FIELD_RETURN_STIFFNESS,
  startOrbitRadius: SHIP_START_ORBIT_RADIUS,
  respawnDelay: SHIP_RESPAWN_DELAY,
  meteors: DEFAULT_METEOR_PARAMS,
  fragments: DEFAULT_FRAGMENT_PARAMS,
  startingLives: STARTING_LIVES,
  planetMaxHits: PLANET_MAX_HITS,
  scorePerMass: SCORE_PER_MASS,
  waveBaseQuota: WAVE_BASE_QUOTA,
  waveQuotaGrowth: WAVE_QUOTA_GROWTH,
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
  // Стрельба: выстрелы, попадания в метеориты, осколки, оставшиеся в игре,
  // и сколько мелочи рассыпалось в пыль
  shotsFired: number;
  meteorsShot: number;
  fragmentsCreated: number;
  fragmentsDusted: number;
}

// Состояние мира: планета, корабль, метеориты и эффекты
export interface World {
  time: number;
  ticks: number;
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
  // Оружие корабля и снаряды в полёте
  weapon: Weapon;
  bullets: Bullet[];
  // Правила партии
  lives: number;
  planetHits: number;
  score: number;
  wave: number;
  // Сколько метеоритов ещё нужно выпустить в этой волне (0 при выключенных волнах)
  meteorsLeftToSpawn: number;
  // Партия проиграна (корабль или планета)
  defeated: boolean;
  defeatCause: DefeatCause;
  // Кляксы на поверхности от упавших метеоритов
  planetScars: PlanetScar[];
}

export function createWorld(
  planet: Planet = new Planet(),
  params: WorldParams = DEFAULT_WORLD_PARAMS,
  random: Random = Math.random,
): World {
  const world: World = {
    time: 0,
    ticks: 0,
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
      shotsFired: 0,
      meteorsShot: 0,
      fragmentsCreated: 0,
      fragmentsDusted: 0,
    },
    explosions: [],
    weapon: new Cannon(),
    bullets: [],
    lives: params.startingLives,
    planetHits: params.planetMaxHits,
    score: 0,
    wave: 1,
    meteorsLeftToSpawn: 0,
    defeated: false,
    defeatCause: 'none',
    planetScars: [],
  };
  beginWave(world, 1);
  return world;
}

// Запускает волну: квота появления и таймер до первого метеорита
export function beginWave(world: World, wave: number): void {
  world.wave = Math.max(1, Math.floor(wave));
  if (world.params.waveBaseQuota <= 0) {
    world.meteorsLeftToSpawn = 0;
    return;
  }
  const settings = waveSettings(
    world.wave,
    world.params.meteors.maxCount,
    world.params.meteors.spawnInterval,
    world.params.waveBaseQuota,
    world.params.waveQuotaGrowth,
  );
  world.meteorsLeftToSpawn = settings.spawnQuota;
  world.meteorTimer = world.params.meteors.firstSpawnDelay;
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

// Корабль взрывается; жизнь тратится. Новый появится через respawnDelay,
// если жизни ещё остались; иначе партия проиграна
function destroyShip(world: World, ship: Ship): void {
  world.explosions.push({ position: ship.position, radius: EXPLOSION_RADIUS, age: 0 });
  world.ship = null;
  world.stats.crashes += 1;
  world.lives = Math.max(0, world.lives - 1);
  if (world.lives > 0) {
    world.respawnTimer = world.params.respawnDelay;
  } else {
    world.respawnTimer = 0;
    markDefeated(world, 'ship');
  }
}

function markDefeated(world: World, cause: Exclude<DefeatCause, 'none'>): void {
  if (world.defeated) return;
  world.defeated = true;
  world.defeatCause = cause;
}

function explodeMeteor(world: World, meteor: Meteor): void {
  world.explosions.push({
    position: meteor.position,
    radius: meteor.radius * METEOR_EXPLOSION_SCALE,
    age: 0,
  });
}

// Падение метеорита на планету: урон, шрам; при 0 хитов — проигрыш
function impactMeteorOnPlanet(world: World, meteor: Meteor): void {
  explodeMeteor(world, meteor);
  world.stats.meteorImpacts += 1;
  const offset = meteor.position.sub(world.planet.position);
  const angle = offset.lengthSq() > 0 ? Math.atan2(offset.y, offset.x) : 0;
  world.planetScars.push({
    angle,
    radiusFactor: scarRadiusFactor(meteor.mass),
  });
  const damage = planetDamageFromMass(meteor.mass);
  world.planetHits = Math.max(0, world.planetHits - damage);
  if (world.planetHits <= 0) markDefeated(world, 'planet');
}

// Раз в spawnInterval добавляем метеорит на краю поля, пока их меньше maxCount.
// При включённых волнах не выпускаем больше квоты текущей волны
function spawnMeteors(world: World, dt: number): void {
  const { fieldRadius, waveBaseQuota, waveQuotaGrowth } = world.params;
  const params = meteorParamsForWave(
    world.wave,
    world.params.meteors,
    waveBaseQuota,
    waveQuotaGrowth,
  );
  world.meteorTimer -= dt;
  if (world.meteorTimer > 0) return;
  world.meteorTimer += params.spawnInterval;
  if (waveBaseQuota > 0 && world.meteorsLeftToSpawn <= 0) return;
  if (world.meteors.length >= params.maxCount) return;
  world.meteors.push(spawnMeteor(world.planet, fieldRadius, world.random, params));
  world.stats.meteorsSpawned += 1;
  if (waveBaseQuota > 0) world.meteorsLeftToSpawn -= 1;
}

// Волна окончена: квота исчерпана и в поле никого не осталось
function maybeAdvanceWave(world: World): void {
  if (world.params.waveBaseQuota <= 0) return;
  if (world.meteorsLeftToSpawn > 0) return;
  if (world.meteors.length > 0) return;
  beginWave(world, world.wave + 1);
}

// Двигаем метеориты и убираем тех, кто упал на планету или вылетел за поле.
// На метеориты действует только гравитация: мягкой границы у них нет
function stepMeteors(world: World, dt: number): void {
  const { planet, params } = world;
  // filter возвращает новый массив из тех, для кого функция вернула true
  world.meteors = world.meteors.filter((m) => {
    m.step(dt, planet.accelerationAt(m.position));
    if (hitsPlanet(world, m.position, m.radius)) {
      impactMeteorOnPlanet(world, m);
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

// Двигаем снаряды и убираем истёкшие, вылетевшие за поле и попавшие в
// планету. Как и метеориты, снаряды чувствуют только гравитацию планеты
function stepBullets(world: World, dt: number): void {
  const { planet, params } = world;
  world.bullets = world.bullets.filter((b) => {
    b.step(dt, planet.accelerationAt(b.position));
    if (hitsPlanet(world, b.position, b.radius)) {
      world.explosions.push({ position: b.position, radius: BULLET_IMPACT_RADIUS, age: 0 });
      return false;
    }
    if (b.expired) return false;
    return b.position.distanceTo(planet.position) <= params.fieldRadius + b.radius;
  });
}

// Попадания снарядов в метеориты: метеорит раскалывается, снаряд исчезает.
// Каждый снаряд разбивает не больше одного метеорита за шаг
function resolveBulletHits(world: World): void {
  const survivors: Bullet[] = [];
  for (const bullet of world.bullets) {
    const target = world.meteors.find((m) =>
      segmentHitsCircle(
        bullet.previousPosition,
        bullet.position,
        m.position,
        m.radius + bullet.radius,
      ),
    );
    if (target === undefined) {
      survivors.push(bullet);
      continue;
    }
    world.explosions.push({
      position: target.position,
      radius: target.radius * METEOR_HIT_EXPLOSION_SCALE,
      age: 0,
    });
    // Очки за массу сбитого метеорита (осколки дадут очки при следующих попаданиях)
    world.score += Math.round(target.mass * world.params.scorePerMass);
    const fragments = splitMeteor(target, world.random, world.params.fragments);
    const kept = keepFragments(fragments, world.params.fragments.minMass);
    world.meteors = world.meteors.filter((m) => m !== target).concat(kept);
    world.stats.meteorsShot += 1;
    world.stats.fragmentsCreated += kept.length;
    world.stats.fragmentsDusted += fragments.length - kept.length;
  }
  world.bullets = survivors;
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
  stepBullets(world, dt);
  resolveBulletHits(world);
  maybeAdvanceWave(world);
  world.weapon.tick(dt);

  const ship = world.ship;
  if (ship === null) {
    if (!world.defeated) {
      world.respawnTimer -= dt;
      if (world.respawnTimer <= 0) {
        world.ship = spawnShip(world.planet, world.params.startOrbitRadius);
      }
    }
    return;
  }

  ship.step(controls, dt, environmentAcceleration(world, ship.position));
  if (controls.fire) {
    const shots = world.weapon.fire(ship, aimWorld);
    // `...shots` раскладывает массив на отдельные аргументы:
    // push(...shots) — то же, что bullets.extend(shots) в Python
    world.bullets.push(...shots);
    world.stats.shotsFired += shots.length;
  }
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
