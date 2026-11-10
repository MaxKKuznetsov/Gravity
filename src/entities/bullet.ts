import { BULLET_LIFETIME, BULLET_RADIUS } from '../config';
import type { Vec2 } from '../core/Vec2';
import { type Body, integrate } from '../physics/integrator';

// Снаряд пушки. Летит, как и всё остальное, в поле планеты; живёт
// ограниченное время, потом исчезает.
export class Bullet implements Body {
  // Сколько секунд снаряд уже летит
  age = 0;
  // Положение до последнего шага: по отрезку previous→position проверяем
  // попадание, чтобы быстрый снаряд не проскочил сквозь метеорит
  previousPosition: Vec2;

  constructor(
    public position: Vec2,
    public velocity: Vec2,
    readonly lifetime: number = BULLET_LIFETIME,
    readonly radius: number = BULLET_RADIUS,
  ) {
    this.previousPosition = position;
  }

  get expired(): boolean {
    return this.age >= this.lifetime;
  }

  step(dt: number, acceleration: Vec2): void {
    this.previousPosition = this.position;
    integrate(this, acceleration, dt);
    this.age += dt;
  }
}
