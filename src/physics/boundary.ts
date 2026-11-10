import { Vec2 } from '../core/Vec2';

// Мягкая граница поля: внутри круга радиуса fieldRadius ничего не делает,
// за ним тянет к центру с ускорением k · (r − R), как пружина, которая
// растягивается только наружу.
export function boundaryAcceleration(
  position: Vec2,
  center: Vec2,
  fieldRadius: number,
  stiffness: number,
): Vec2 {
  const toCenter = center.sub(position);
  const r = toCenter.length();
  const excess = r - fieldRadius;
  if (excess <= 0) return Vec2.ZERO;
  return toCenter.scale((stiffness * excess) / r);
}

export function isOutsideField(position: Vec2, center: Vec2, fieldRadius: number): boolean {
  return position.distanceTo(center) > fieldRadius;
}
