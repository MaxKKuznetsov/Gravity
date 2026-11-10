import { Vec2 } from '../core/Vec2';

// Ускорение от притяжения точечной массы в center:
// a = −GM · r̂ / max(r, rMin)². От массы самого тела не зависит.
export function gravityAcceleration(position: Vec2, center: Vec2, gm: number, rMin: number): Vec2 {
  const toCenter = center.sub(position);
  const r = toCenter.length();
  if (r === 0) return Vec2.ZERO; // в самом центре направление не определено
  const rClamped = Math.max(r, rMin);
  // toCenter / r — единичный вектор к центру, дальше умножаем на GM / r²
  return toCenter.scale(gm / (rClamped * rClamped * r));
}

// Скорость круговой орбиты на расстоянии r: v = √(GM / r)
export function circularSpeed(gm: number, r: number): number {
  return Math.sqrt(gm / r);
}

// Удельная (на единицу массы) полная энергия: кинетическая + потенциальная.
// E < 0 — тело привязано к планете (эллипс), E ≥ 0 — улетает (парабола,
// гипербола). Без rMin: используется вне планеты, где он не действует.
export function specificEnergy(position: Vec2, velocity: Vec2, center: Vec2, gm: number): number {
  return velocity.lengthSq() / 2 - gm / position.distanceTo(center);
}

// Форма орбиты по текущему положению и скорости
export interface OrbitInfo {
  readonly energy: number;
  // Эксцентриситет: 0 — круг, (0, 1) — эллипс, ≥ 1 — тело улетает
  readonly eccentricity: number;
  // Ближайшая к центру точка орбиты (перицентр), пикс от центра планеты
  readonly periapsis: number;
  // Самая дальняя точка (апоцентр); Infinity, если орбита незамкнутая
  readonly apoapsis: number;
}

export function orbitInfo(position: Vec2, velocity: Vec2, center: Vec2, gm: number): OrbitInfo {
  const rel = position.sub(center);
  const energy = specificEnergy(position, velocity, center, gm);
  // Момент импульса на единицу массы (в 2D — просто число)
  const h = rel.cross(velocity);
  const eccentricity = Math.sqrt(Math.max(0, 1 + (2 * energy * h * h) / (gm * gm)));
  // Формула перицентра p / (1 + e), p = h² / GM, годится для любой орбиты
  const periapsis = (h * h) / (gm * (1 + eccentricity));
  const apoapsis =
    eccentricity < 1 ? (h * h) / (gm * (1 - eccentricity)) : Number.POSITIVE_INFINITY;
  return { energy, eccentricity, periapsis, apoapsis };
}
