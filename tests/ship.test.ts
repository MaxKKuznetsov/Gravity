import { describe, expect, it } from 'vitest';
import type { Controls, TurnDirection } from '../src/core/input';
import { Vec2 } from '../src/core/Vec2';
import { Ship, normalizeAngle } from '../src/entities/ship';

const DT = 1 / 120;
const params = { thrust: 100, turnSpeed: 2, maxSpeed: 0 };

function controls(turn: TurnDirection = 0, thrust = false): Controls {
  return { turn, thrust, fire: false, aimScreen: Vec2.ZERO };
}

// Прогоняет n шагов с одними и теми же командами
function run(ship: Ship, c: Controls, steps: number): void {
  for (let i = 0; i < steps; i++) ship.step(c, DT);
}

describe('Ship', () => {
  it('без тяги летит по инерции с постоянной скоростью', () => {
    const ship = new Ship(Vec2.ZERO, 0, params);
    ship.velocity = new Vec2(30, -10);
    run(ship, controls(), 120); // 1 секунда
    expect(ship.velocity).toEqual(new Vec2(30, -10));
    expect(ship.position.equals(new Vec2(30, -10), 1e-9)).toBe(true);
  });

  it('тяга разгоняет вдоль носа: v = a·t', () => {
    // Нос смотрит вниз (угол π/2 при оси Y вниз)
    const ship = new Ship(Vec2.ZERO, Math.PI / 2, params);
    run(ship, controls(0, true), 240); // 2 секунды
    expect(ship.velocity.equals(new Vec2(0, 200), 1e-6)).toBe(true);
    expect(ship.thrusting).toBe(true);
    // Точный путь a·t²/2 = 200. Semi-implicit Euler сдвигает положение уже
    // новой скоростью, поэтому получается a·t²/2 + a·t·dt/2 ≈ 200.83
    expect(ship.position.y).toBeCloseTo(200 + (100 * 2 * DT) / 2, 9);
  });

  it('после выключения двигателя скорость сохраняется', () => {
    const ship = new Ship(Vec2.ZERO, 0, params);
    run(ship, controls(0, true), 120);
    run(ship, controls(), 120);
    expect(ship.velocity.equals(new Vec2(100, 0), 1e-6)).toBe(true);
    expect(ship.thrusting).toBe(false);
  });

  it('A крутит против часовой (угол уменьшается), D — по часовой', () => {
    const ship = new Ship(Vec2.ZERO, 0, params);
    run(ship, controls(-1), 60); // 0.5 с · 2 рад/с = 1 рад
    expect(ship.angle).toBeCloseTo(-1, 9);
    run(ship, controls(1), 120);
    expect(ship.angle).toBeCloseTo(1, 9);
  });

  it('поворот не меняет скорость: корабль продолжает лететь прежним курсом', () => {
    const ship = new Ship(Vec2.ZERO, 0, params);
    ship.velocity = new Vec2(50, 0);
    run(ship, controls(1), 120);
    expect(ship.velocity).toEqual(new Vec2(50, 0));
  });

  it('тяга против движения тормозит корабль', () => {
    const ship = new Ship(Vec2.ZERO, Math.PI, params); // нос влево
    ship.velocity = new Vec2(100, 0);
    run(ship, controls(0, true), 120);
    expect(ship.speed).toBeCloseTo(0, 6);
  });

  it('скорость не превышает maxSpeed, направление сохраняется', () => {
    const ship = new Ship(Vec2.ZERO, Math.PI / 4, { ...params, maxSpeed: 150 });
    run(ship, controls(0, true), 600); // без лимита было бы 500 пикс/с
    expect(ship.speed).toBeCloseTo(150, 9);
    expect(ship.velocity.angle()).toBeCloseTo(Math.PI / 4, 9);
  });

  it('учитывает внешнее ускорение (сюда придёт гравитация)', () => {
    const ship = new Ship(Vec2.ZERO, 0, params);
    for (let i = 0; i < 120; i++) ship.step(controls(), DT, new Vec2(0, 10));
    expect(ship.velocity.equals(new Vec2(0, 10), 1e-9)).toBe(true);
  });
});

describe('normalizeAngle', () => {
  it('приводит угол к (-π, π]', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI, 12);
    expect(normalizeAngle(-Math.PI)).toBeCloseTo(Math.PI, 12);
    expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 12);
    expect(normalizeAngle(2 * Math.PI + 0.5)).toBeCloseTo(0.5, 12);
    expect(normalizeAngle(-2 * Math.PI - 0.5)).toBeCloseTo(-0.5, 12);
  });
});
