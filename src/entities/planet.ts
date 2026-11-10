import { GRAVITY_MIN_RADIUS, PLANET_GM, PLANET_RADIUS } from '../config';
import { Vec2 } from '../core/Vec2';
import { gravityAcceleration } from '../physics/gravity';

// Неподвижная планета, единственный источник гравитации
export class Planet {
  constructor(
    readonly position: Vec2 = Vec2.ZERO,
    readonly radius: number = PLANET_RADIUS,
    readonly gm: number = PLANET_GM,
    readonly minRadius: number = GRAVITY_MIN_RADIUS,
  ) {}

  // Ускорение, которое планета сообщает телу в точке point
  accelerationAt(point: Vec2): Vec2 {
    return gravityAcceleration(point, this.position, this.gm, this.minRadius);
  }

  // Высота точки над поверхностью (отрицательная — внутри планеты)
  altitudeOf(point: Vec2): number {
    return point.distanceTo(this.position) - this.radius;
  }
}
