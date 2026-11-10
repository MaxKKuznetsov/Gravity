import { METEOR_RADIUS_PER_SQRT_MASS } from '../config';
import { Vec2 } from '../core/Vec2';
import { type Body, integrate } from '../physics/integrator';
import { normalizeAngle } from './ship';

// Радиус метеорита по массе: r = k · √m, то есть площадь растёт с массой
export function meteorRadius(
  mass: number,
  radiusPerSqrtMass = METEOR_RADIUS_PER_SQRT_MASS,
): number {
  return radiusPerSqrtMass * Math.sqrt(mass);
}

// Камень, который летает в поле планеты. Масса влияет на размер (и позже на
// дробление и очки), но не на траекторию: ускорение от массы не зависит.
export class Meteor implements Body {
  readonly radius: number;

  constructor(
    public position: Vec2,
    public velocity: Vec2,
    readonly mass: number,
    // Поворот спрайта и скорость вращения, рад и рад/с. На физику не влияют
    public angle = 0,
    readonly spin = 0,
    // Форма: множители радиуса для вершин многоугольника по кругу.
    // `readonly number[]` — массив, который нельзя менять (как tuple в Python)
    readonly shape: readonly number[] = [1, 1, 1, 1, 1, 1, 1, 1],
  ) {
    this.radius = meteorRadius(mass);
  }

  // Один шаг физики: тот же интегратор, что и у корабля, плюс вращение
  step(dt: number, acceleration: Vec2): void {
    integrate(this, acceleration, dt);
    this.angle = normalizeAngle(this.angle + this.spin * dt);
  }
}
