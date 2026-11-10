import type { Vec2 } from '../core/Vec2';

// Всё, что двигается по законам механики: точка с положением и скоростью
export interface Body {
  position: Vec2;
  velocity: Vec2;
}

// Один шаг semi-implicit (symplectic) Euler: сначала обновляем скорость,
// потом положение — уже новой скоростью. Явный Euler делает наоборот
// (положение старой скоростью) и на орбитах постепенно набирает энергию.
// maxSpeed (по желанию) ограничивает скорость до того, как она сдвинет тело.
export function integrate(body: Body, acceleration: Vec2, dt: number, maxSpeed = Infinity): void {
  body.velocity = clampSpeed(body.velocity.add(acceleration.scale(dt)), maxSpeed);
  body.position = body.position.add(body.velocity.scale(dt));
}

// Если скорость больше maxSpeed, укорачиваем вектор до maxSpeed, направление
// сохраняется. maxSpeed <= 0 или Infinity — без ограничения.
export function clampSpeed(velocity: Vec2, maxSpeed: number): Vec2 {
  if (!(maxSpeed > 0) || !Number.isFinite(maxSpeed)) return velocity;
  const speedSq = velocity.lengthSq();
  if (speedSq <= maxSpeed * maxSpeed) return velocity;
  return velocity.scale(maxSpeed / Math.sqrt(speedSq));
}
