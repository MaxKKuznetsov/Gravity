import type { Vec2 } from '../core/Vec2';

// Пересекаются ли два круга (касание тоже считается)
export function circlesOverlap(a: Vec2, radiusA: number, b: Vec2, radiusB: number): boolean {
  const r = radiusA + radiusB;
  return a.sub(b).lengthSq() <= r * r;
}
