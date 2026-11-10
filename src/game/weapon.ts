import { CANNON_MUZZLE_SPEED, CANNON_RELOAD_TIME, SHIP_SIZE } from '../config';
import type { Vec2 } from '../core/Vec2';
import { Bullet } from '../entities/bullet';
import type { Ship } from '../entities/ship';

// Общий интерфейс оружия. Мир знает только про него, поэтому новое оружие
// (лазер, ракеты, мины) добавляется новым классом без правок в world.ts.
// В Python это был бы абстрактный класс или Protocol с методами tick и fire.
export interface Weapon {
  readonly name: string;
  // Полное время перезарядки и сколько ещё осталось, с
  readonly reloadTime: number;
  readonly reloadLeft: number;
  // Течёт время: перезарядка идёт
  tick(dt: number): void;
  // Попытка выстрела в сторону aimPoint (координаты мира). Пока оружие
  // перезаряжается, возвращает пустой список. Список, а не один снаряд,
  // чтобы потом сделать, например, дробовик
  fire(ship: Ship, aimPoint: Vec2): Bullet[];
}

// Доля готовности оружия от 0 (только что выстрелило) до 1 (готово)
export function readiness(weapon: Weapon): number {
  if (weapon.reloadTime <= 0) return 1;
  return 1 - weapon.reloadLeft / weapon.reloadTime;
}

export interface CannonParams {
  readonly muzzleSpeed: number;
  readonly reloadTime: number;
  // На каком расстоянии от центра корабля появляется снаряд, пикс
  readonly muzzleOffset: number;
}

export const DEFAULT_CANNON_PARAMS: CannonParams = {
  muzzleSpeed: CANNON_MUZZLE_SPEED,
  reloadTime: CANNON_RELOAD_TIME,
  muzzleOffset: SHIP_SIZE,
};

// Пушка: один снаряд в сторону прицела. Снаряд наследует скорость корабля:
// v = v_корабля + v_выстрела · направление на прицел
export class Cannon implements Weapon {
  readonly name = 'Пушка';
  // `private` — поле видно только внутри класса (в Python так договариваются
  // через `_reload_left`, а здесь запрет проверяет компилятор). Снаружи
  // значение читается через геттер reloadLeft, но поменять его нельзя
  private reloadTimer = 0;

  constructor(readonly params: CannonParams = DEFAULT_CANNON_PARAMS) {}

  get reloadTime(): number {
    return this.params.reloadTime;
  }

  get reloadLeft(): number {
    return this.reloadTimer;
  }

  tick(dt: number): void {
    this.reloadTimer = Math.max(0, this.reloadTimer - dt);
  }

  fire(ship: Ship, aimPoint: Vec2): Bullet[] {
    if (this.reloadTimer > 0) return [];
    // Прицел прямо на корабле — направление не определено, стреляем по носу
    const toAim = aimPoint.sub(ship.position);
    const direction = toAim.lengthSq() > 0 ? toAim.normalize() : ship.forward;
    const position = ship.position.add(direction.scale(this.params.muzzleOffset));
    const velocity = ship.velocity.add(direction.scale(this.params.muzzleSpeed));
    this.reloadTimer = this.params.reloadTime;
    return [new Bullet(position, velocity)];
  }
}
