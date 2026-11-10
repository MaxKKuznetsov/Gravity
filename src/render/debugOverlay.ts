import { CROSSHAIR_COLOR, CROSSHAIR_FIRE_COLOR, DEBUG_TEXT_COLOR } from '../config';
import type { World } from '../game/world';
import type { Vec2 } from '../core/Vec2';
import { orbitInfo } from '../physics/gravity';

export interface DebugInfo {
  readonly fps: number;
  readonly world: World;
  readonly keysDown: readonly string[];
  readonly mouseScreen: Vec2;
}

const TURN_LABEL = { [-1]: 'влево (A)', 0: '—', 1: 'вправо (D)' } as const;

// Угол в градусах для показа; 0° — вправо, -90° — вверх
function toDegrees(angle: number): string {
  return ((angle * 180) / Math.PI).toFixed(0);
}

// Расстояние для показа; бесконечность — «∞»
function distanceLabel(d: number): string {
  return Number.isFinite(d) ? d.toFixed(0) : '∞';
}

// Строки про корабль и его орбиту
function shipLines(world: World): string[] {
  const { ship, planet } = world;
  if (ship === null) return ['Корабль: разбился, ждём новый'];

  const orbit = orbitInfo(ship.position, ship.velocity, planet.position, planet.gm);
  const periAlt = orbit.periapsis - planet.radius;
  const apoAlt = orbit.apoapsis - planet.radius;
  // Орбита «стабильная», если она замкнута, не задевает планету и не
  // выходит за границу поля
  let status: string;
  if (orbit.eccentricity >= 1) status = 'уход с орбиты (E ≥ 0)';
  else if (periAlt <= 0) status = 'падение на планету';
  else if (orbit.apoapsis > world.params.fieldRadius) status = 'выходит за границу поля';
  else status = 'стабильная орбита ✓';

  return [
    `Корабль: ${ship.position.toString()}, скорость ${ship.speed.toFixed(0)} пикс/с, курс ${toDegrees(ship.angle)}°`,
    `Высота над планетой: ${planet.altitudeOf(ship.position).toFixed(0)} пикс`,
    `Орбита: перицентр ${distanceLabel(periAlt)}, апоцентр ${distanceLabel(apoAlt)} (высоты), e = ${orbit.eccentricity.toFixed(3)}, E = ${orbit.energy.toFixed(0)}`,
    `Статус: ${status}`,
  ];
}

// Текстовый оверлей в левом верхнем углу
export function drawDebugOverlay(ctx: CanvasRenderingContext2D, info: DebugInfo): void {
  const { world } = info;
  const objects = 1 + (world.ship ? 1 : 0) + world.explosions.length;
  const lines = [
    `FPS: ${info.fps.toFixed(0)}`,
    `Объектов: ${objects} (планета, корабль, взрывы)`,
    `Время симуляции: ${world.time.toFixed(2)} с, шагов физики: ${world.ticks}`,
    `Клавиши: ${info.keysDown.length > 0 ? info.keysDown.join(' ') : '—'}`,
    `Поворот: ${TURN_LABEL[world.controls.turn]}`,
    `Тяга (W): ${world.controls.thrust ? 'ВКЛ' : 'выкл'}`,
    `ЛКМ: ${world.controls.fire ? 'зажата' : 'отпущена'}, выстрелов: ${world.shotsFired}`,
    ...shipLines(world),
    `Разбито кораблей: ${world.crashes}`,
    `Курсор: экран ${info.mouseScreen.toString()}, мир ${world.aimWorld.toString()}`,
    'F1 — скрыть/показать',
  ];

  ctx.save();
  ctx.font = '14px ui-monospace, Menlo, Consolas, monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle = DEBUG_TEXT_COLOR;
  // Сдвигаем вниз, чтобы не налезать на предупреждения по центру сверху
  lines.forEach((line, i) => ctx.fillText(line, 12, 44 + i * 18));
  ctx.restore();
}

// Временное перекрестие на месте курсора, чтобы было видно прицел
export function drawCrosshair(ctx: CanvasRenderingContext2D, at: Vec2, firing: boolean): void {
  const r = 8;
  ctx.save();
  ctx.strokeStyle = firing ? CROSSHAIR_FIRE_COLOR : CROSSHAIR_COLOR;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(at.x - r, at.y);
  ctx.lineTo(at.x + r, at.y);
  ctx.moveTo(at.x, at.y - r);
  ctx.lineTo(at.x, at.y + r);
  ctx.stroke();
  ctx.restore();
}
