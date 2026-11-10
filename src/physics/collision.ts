import type { Vec2 } from '../core/Vec2';

// Пересекаются ли два круга (касание тоже считается)
export function circlesOverlap(a: Vec2, radiusA: number, b: Vec2, radiusB: number): boolean {
  const r = radiusA + radiusB;
  return a.sub(b).lengthSq() <= r * r;
}

// Пересекает ли отрезок from→to круг с центром center и радиусом radius.
// Нужно для быстрых снарядов: за шаг физики снаряд может «перепрыгнуть»
// маленький метеорит, если проверять только конечную точку.
export function segmentHitsCircle(from: Vec2, to: Vec2, center: Vec2, radius: number): boolean {
  const d = to.sub(from);
  const lenSq = d.lengthSq();
  // Ближайшая к центру точка отрезка: проекция центра, зажатая в [0, 1]
  const t = lenSq > 0 ? Math.min(1, Math.max(0, center.sub(from).dot(d) / lenSq)) : 0;
  const closest = from.add(d.scale(t));
  return closest.sub(center).lengthSq() <= radius * radius;
}
