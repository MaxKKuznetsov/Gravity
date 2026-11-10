import { SHIP_MAX_SPEED, SHIP_START_ANGLE, SHIP_THRUST, SHIP_TURN_SPEED } from '../config';
import type { Controls } from '../core/input';
import { Vec2 } from '../core/Vec2';
import { type Body, integrate } from '../physics/integrator';

// Параметры корабля. Вынесены отдельно, чтобы в тестах подставлять свои
export interface ShipParams {
  readonly thrust: number;
  readonly turnSpeed: number;
  readonly maxSpeed: number;
}

export const DEFAULT_SHIP_PARAMS: ShipParams = {
  thrust: SHIP_THRUST,
  turnSpeed: SHIP_TURN_SPEED,
  maxSpeed: SHIP_MAX_SPEED,
};

// `implements Body` — обещание компилятору, что у класса есть все поля
// интерфейса Body. Похоже на наследование от Protocol в Python, только
// проверяется при компиляции, а в готовом JS от него ничего не остаётся.
export class Ship implements Body {
  velocity = Vec2.ZERO;
  // Включён ли двигатель на последнем шаге; нужно отрисовке для пламени
  thrusting = false;

  constructor(
    public position: Vec2 = Vec2.ZERO,
    public angle: number = SHIP_START_ANGLE,
    readonly params: ShipParams = DEFAULT_SHIP_PARAMS,
  ) {}

  // Единичный вектор, куда смотрит нос
  get forward(): Vec2 {
    return Vec2.fromAngle(this.angle);
  }

  get speed(): number {
    return this.velocity.length();
  }

  // Один шаг физики. externalAcceleration — то, что действует на корабль
  // помимо его двигателя (на этапе 3 сюда придёт гравитация планеты)
  step(controls: Controls, dt: number, externalAcceleration: Vec2 = Vec2.ZERO): void {
    // Маневровые двигатели крутят корабль с постоянной скоростью;
    // угол держим в пределах (-π, π], чтобы он не рос бесконечно
    this.angle = normalizeAngle(this.angle + controls.turn * this.params.turnSpeed * dt);

    this.thrusting = controls.thrust;
    const engine = controls.thrust ? this.forward.scale(this.params.thrust) : Vec2.ZERO;
    integrate(this, engine.add(externalAcceleration), dt, this.params.maxSpeed);
  }
}

// Приводит угол к диапазону (-π, π]
export function normalizeAngle(angle: number): number {
  const twoPi = 2 * Math.PI;
  let a = angle % twoPi;
  if (a <= -Math.PI) a += twoPi;
  else if (a > Math.PI) a -= twoPi;
  return a;
}
