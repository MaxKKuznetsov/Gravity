import type { Vec2 } from '../core/Vec2';
import { type Body, integrate } from './integrator';

// Тип-функция: «любая функция, которая принимает Vec2 и возвращает Vec2».
// В Python это Callable[[Vec2], Vec2]. Сюда передаём поле ускорений
// (гравитация + граница), не зная, из чего оно состоит.
export type AccelerationField = (position: Vec2) => Vec2;

export interface TrajectoryOptions {
  // На сколько секунд вперёд и с каким шагом считать
  readonly seconds: number;
  readonly dt: number;
  // `?` — необязательное поле, как `maxSpeed: float | None = None` в Python
  readonly maxSpeed?: number;
  // Если вернёт true, траектория обрывается в этой точке (удар о планету)
  readonly stop?: (position: Vec2) => boolean;
}

export interface Trajectory {
  // Точки траектории, начиная с текущего положения
  readonly points: Vec2[];
  // Обрыв по stop: последняя точка — место удара
  readonly stopped: boolean;
}

// Где тело окажется, если оставить его без управления. Считает тем же
// интегратором, что и игра, но на копии тела: исходное не меняется.
export function predictTrajectory(
  body: Body,
  field: AccelerationField,
  options: TrajectoryOptions,
): Trajectory {
  // Копия тела-«зонда». Vec2 неизменяемый, поэтому глубокая копия не нужна
  const probe: Body = { position: body.position, velocity: body.velocity };
  const points = [probe.position];
  const steps = Math.ceil(options.seconds / options.dt);
  for (let i = 0; i < steps; i++) {
    integrate(probe, field(probe.position), options.dt, options.maxSpeed);
    points.push(probe.position);
    // `?.` — вызов, только если функция задана: в Python было бы
    // `if options.stop is not None and options.stop(pos)`
    if (options.stop?.(probe.position)) return { points, stopped: true };
  }
  return { points, stopped: false };
}
