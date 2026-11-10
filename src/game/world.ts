import type { Controls } from '../core/input';
import { Vec2 } from '../core/Vec2';

// Состояние мира. На этапе 1 объектов ещё нет, есть только счётчики,
// чтобы видеть, что физика тикает и команды доходят.
export interface World {
  time: number;
  ticks: number;
  shotsFired: number;
  aimWorld: Vec2;
  controls: Controls;
  // Список объектов появится на этапе 2 (корабль) и дальше
  objectCount: number;
}

export function createWorld(): World {
  return {
    time: 0,
    ticks: 0,
    shotsFired: 0,
    aimWorld: Vec2.ZERO,
    controls: { turn: 0, thrust: false, fire: false, aimScreen: Vec2.ZERO },
    objectCount: 0,
  };
}

// Один шаг симуляции длиной dt
export function stepWorld(world: World, controls: Controls, aimWorld: Vec2, dt: number): void {
  world.time += dt;
  world.ticks += 1;
  world.controls = controls;
  world.aimWorld = aimWorld;
}
