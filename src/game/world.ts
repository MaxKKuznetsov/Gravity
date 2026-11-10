import type { Controls } from '../core/input';
import { Vec2 } from '../core/Vec2';
import { Ship } from '../entities/ship';

// Состояние мира: пока в нём только корабль
export interface World {
  time: number;
  ticks: number;
  shotsFired: number;
  aimWorld: Vec2;
  controls: Controls;
  ship: Ship;
}

export function createWorld(): World {
  return {
    time: 0,
    ticks: 0,
    shotsFired: 0,
    aimWorld: Vec2.ZERO,
    controls: { turn: 0, thrust: false, fire: false, aimScreen: Vec2.ZERO },
    ship: new Ship(),
  };
}

// Один шаг симуляции длиной dt
export function stepWorld(world: World, controls: Controls, aimWorld: Vec2, dt: number): void {
  world.time += dt;
  world.ticks += 1;
  world.controls = controls;
  world.aimWorld = aimWorld;
  world.ship.step(controls, dt);
}
