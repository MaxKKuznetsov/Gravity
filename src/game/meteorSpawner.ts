import {
  METEOR_ELLIPSE_FRACTION,
  METEOR_ELLIPSE_MAX_PERIAPSIS,
  METEOR_ELLIPSE_MIN_PERIAPSIS,
  METEOR_FIRST_SPAWN_DELAY,
  METEOR_HYPERBOLA_MAX_AIM_OFFSET,
  METEOR_HYPERBOLA_MAX_SPEED_FACTOR,
  METEOR_HYPERBOLA_MIN_SPEED_FACTOR,
  METEOR_MAX_COUNT,
  METEOR_MAX_MASS,
  METEOR_MAX_SPIN,
  METEOR_MIN_MASS,
  METEOR_SHAPE_ROUGHNESS,
  METEOR_SHAPE_VERTICES,
  METEOR_SPAWN_INTERVAL,
} from '../config';
import { type Random, randomRange, randomSign } from '../core/random';
import { Vec2 } from '../core/Vec2';
import { Meteor } from '../entities/meteor';
import type { Planet } from '../entities/planet';

// Тип-объединение из строк: значение может быть только 'ellipse' или
// 'hyperbola'. В Python это Literal['ellipse', 'hyperbola']; опечатку
// вроде 'elipse' компилятор не пропустит.
export type OrbitKind = 'ellipse' | 'hyperbola';

// Настройки появления метеоритов, которые тесты могут подменить
export interface MeteorSpawnParams {
  readonly maxCount: number;
  readonly spawnInterval: number;
  readonly firstSpawnDelay: number;
  readonly ellipseFraction: number;
  readonly minMass: number;
  readonly maxMass: number;
  readonly ellipseMinPeriapsis: number;
  readonly ellipseMaxPeriapsis: number;
  readonly hyperbolaMinSpeedFactor: number;
  readonly hyperbolaMaxSpeedFactor: number;
  readonly hyperbolaMaxAimOffset: number;
  readonly maxSpin: number;
}

export const DEFAULT_METEOR_PARAMS: MeteorSpawnParams = {
  maxCount: METEOR_MAX_COUNT,
  spawnInterval: METEOR_SPAWN_INTERVAL,
  firstSpawnDelay: METEOR_FIRST_SPAWN_DELAY,
  ellipseFraction: METEOR_ELLIPSE_FRACTION,
  minMass: METEOR_MIN_MASS,
  maxMass: METEOR_MAX_MASS,
  ellipseMinPeriapsis: METEOR_ELLIPSE_MIN_PERIAPSIS,
  ellipseMaxPeriapsis: METEOR_ELLIPSE_MAX_PERIAPSIS,
  hyperbolaMinSpeedFactor: METEOR_HYPERBOLA_MIN_SPEED_FACTOR,
  hyperbolaMaxSpeedFactor: METEOR_HYPERBOLA_MAX_SPEED_FACTOR,
  hyperbolaMaxAimOffset: METEOR_HYPERBOLA_MAX_AIM_OFFSET,
  maxSpin: METEOR_MAX_SPIN,
};

// Скорость в апоцентре эллипса с апоцентром ra и перицентром rp.
// Из формулы vis-viva v² = GM · (2/r − 1/a), где a = (ra + rp) / 2:
// v² = 2·GM·rp / (ra · (ra + rp))
export function apoapsisSpeed(gm: number, ra: number, rp: number): number {
  return Math.sqrt((2 * gm * rp) / (ra * (ra + rp)));
}

// Вторая космическая (скорость убегания) на расстоянии r: v = √(2GM / r)
export function escapeSpeed(gm: number, r: number): number {
  return Math.sqrt((2 * gm) / r);
}

// Новый метеорит на окружности радиуса spawnRadius вокруг планеты.
// kind не задан — выбираем случайно с долей эллипсов params.ellipseFraction.
export function spawnMeteor(
  planet: Planet,
  spawnRadius: number,
  random: Random,
  params: MeteorSpawnParams = DEFAULT_METEOR_PARAMS,
  kind: OrbitKind = random() < params.ellipseFraction ? 'ellipse' : 'hyperbola',
): Meteor {
  const where = random() * 2 * Math.PI;
  const outward = Vec2.fromAngle(where);
  const position = planet.position.add(outward.scale(spawnRadius));
  // Направление облёта (по или против часовой стрелки) — случайное
  const direction = randomSign(random);

  let velocity: Vec2;
  if (kind === 'ellipse') {
    // Точка появления — апоцентр: скорость перпендикулярна радиусу, поэтому
    // дальше края поля метеорит не уйдёт и будет кружить, пока не врежется
    const rp = Math.min(
      spawnRadius,
      randomRange(random, params.ellipseMinPeriapsis, params.ellipseMaxPeriapsis),
    );
    const tangent = outward.rotate((direction * Math.PI) / 2);
    velocity = tangent.scale(apoapsisSpeed(planet.gm, spawnRadius, rp));
  } else {
    // Быстрее второй космической, примерно в сторону планеты: метеорит
    // пролетит мимо (или врежется) и уйдёт за край поля
    const speed =
      escapeSpeed(planet.gm, spawnRadius) *
      randomRange(random, params.hyperbolaMinSpeedFactor, params.hyperbolaMaxSpeedFactor);
    const offset = direction * random() * params.hyperbolaMaxAimOffset;
    velocity = outward.scale(-1).rotate(offset).scale(speed);
  }

  const mass = randomRange(random, params.minMass, params.maxMass);
  const angle = random() * 2 * Math.PI;
  const spin = randomRange(random, -params.maxSpin, params.maxSpin);
  return new Meteor(position, velocity, mass, angle, spin, meteorShape(random));
}

// Неровный многоугольник: каждая вершина на своём расстоянии от центра
export function meteorShape(
  random: Random,
  vertices = METEOR_SHAPE_VERTICES,
  roughness = METEOR_SHAPE_ROUGHNESS,
): number[] {
  // Array.from({ length: n }, f) — как [f() for _ in range(n)] в Python
  return Array.from({ length: vertices }, () => randomRange(random, 1 - roughness, 1 + roughness));
}
