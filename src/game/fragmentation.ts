import {
  METEOR_FRAGMENTS_MAX,
  METEOR_FRAGMENTS_MIN,
  METEOR_FRAGMENT_MASS_SPREAD,
  METEOR_FRAGMENT_MIN_MASS,
  METEOR_FRAGMENT_SPEED,
  METEOR_MAX_SPIN,
} from '../config';
import { type Random, randomRange } from '../core/random';
import { Vec2 } from '../core/Vec2';
import { Meteor } from '../entities/meteor';
import { meteorShape } from './meteorSpawner';

export interface FragmentParams {
  readonly minCount: number;
  readonly maxCount: number;
  readonly minMass: number;
  readonly speed: number;
  readonly massSpread: number;
  readonly maxSpin: number;
}

export const DEFAULT_FRAGMENT_PARAMS: FragmentParams = {
  minCount: METEOR_FRAGMENTS_MIN,
  maxCount: METEOR_FRAGMENTS_MAX,
  minMass: METEOR_FRAGMENT_MIN_MASS,
  speed: METEOR_FRAGMENT_SPEED,
  massSpread: METEOR_FRAGMENT_MASS_SPREAD,
  maxSpin: METEOR_MAX_SPIN,
};

// Сумма масс и импульс системы тел: Σm и Σ m·v
export function totalMass(bodies: readonly Meteor[]): number {
  return bodies.reduce((sum, b) => sum + b.mass, 0);
}

export function totalMomentum(bodies: readonly Meteor[]): Vec2 {
  // reduce — как functools.reduce в Python: сворачивает список в одно значение
  return bodies.reduce((sum, b) => sum.add(b.velocity.scale(b.mass)), Vec2.ZERO);
}

// Центр масс: Σ m·r / Σm
export function centerOfMass(bodies: readonly Meteor[]): Vec2 {
  const m = totalMass(bodies);
  const moment = bodies.reduce((sum, b) => sum.add(b.position.scale(b.mass)), Vec2.ZERO);
  return m > 0 ? moment.scale(1 / m) : Vec2.ZERO;
}

// Раскалывает метеорит на 2–3 осколка. Масса делится между ними без
// остатка, а импульс и центр масс сохраняются: осколки разлетаются в разные
// стороны относительно общего центра масс, который продолжает лететь по
// старой орбите. Снаряд считаем невесомым, его импульс не учитываем.
// Возвращает все осколки, в том числе слишком мелкие: их отсеивает
// keepFragments, чтобы здесь было удобно проверять сохранение импульса.
export function splitMeteor(
  meteor: Meteor,
  random: Random,
  params: FragmentParams = DEFAULT_FRAGMENT_PARAMS,
): Meteor[] {
  const count = params.minCount + Math.floor(random() * (params.maxCount - params.minCount + 1));

  // Случайные доли массы, нормированные на 1
  const weights = Array.from({ length: count }, () =>
    randomRange(random, 1 - params.massSpread, 1 + params.massSpread),
  );
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const masses = weights.map((w) => (meteor.mass * w) / weightSum);

  // Направления разлёта — веером через равные углы со случайным поворотом
  const turn = random() * 2 * Math.PI;
  const directions = masses.map((_, i) => Vec2.fromAngle(turn + (i / count) * 2 * Math.PI));

  // Скорости разлёта и сдвиги до поправки. У осколков разной массы
  // Σ m·u ≠ 0, поэтому вычитаем средневзвешенное: тогда суммарный импульс
  // разлёта ровно 0, и импульс всей системы равен импульсу метеорита
  const kicks = directions.map((d) => d.scale(params.speed));
  const offsets = directions.map((d) => d.scale(meteor.radius * 0.5));
  const kickShift = weightedMean(kicks, masses);
  const offsetShift = weightedMean(offsets, masses);

  return masses.map((mass, i) => {
    // kicks[i] при строгих настройках tsconfig имеет тип `Vec2 | undefined`
    // (индекс может выйти за массив). `a ?? b` — «a, а если его нет, то b»,
    // как `a if a is not None else b` в Python
    const kick = (kicks[i] ?? Vec2.ZERO).sub(kickShift);
    const offset = (offsets[i] ?? Vec2.ZERO).sub(offsetShift);
    return new Meteor(
      meteor.position.add(offset),
      meteor.velocity.add(kick),
      mass,
      random() * 2 * Math.PI,
      randomRange(random, -params.maxSpin, params.maxSpin),
      meteorShape(random),
    );
  });
}

// Осколки, которые остаются в игре; остальные рассыпаются в пыль
export function keepFragments(
  fragments: readonly Meteor[],
  minMass: number = DEFAULT_FRAGMENT_PARAMS.minMass,
): Meteor[] {
  return fragments.filter((f) => f.mass >= minMass);
}

// Σ wᵢ·vᵢ / Σ wᵢ
function weightedMean(vectors: readonly Vec2[], weights: readonly number[]): Vec2 {
  let sum = Vec2.ZERO;
  let w = 0;
  vectors.forEach((v, i) => {
    const wi = weights[i] ?? 0;
    sum = sum.add(v.scale(wi));
    w += wi;
  });
  return w > 0 ? sum.scale(1 / w) : Vec2.ZERO;
}
