import { CROSSHAIR_COLOR, CROSSHAIR_FIRE_COLOR, DEBUG_TEXT_COLOR } from '../config';
import type { World } from '../game/world';
import type { Vec2 } from '../core/Vec2';

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

// Текстовый оверлей в левом верхнем углу
export function drawDebugOverlay(ctx: CanvasRenderingContext2D, info: DebugInfo): void {
  const { world } = info;
  const lines = [
    `FPS: ${info.fps.toFixed(0)}`,
    // Пока в мире только корабль; метеориты и снаряды появятся на этапах 4–5
    'Объектов: 1',
    `Время симуляции: ${world.time.toFixed(2)} с, шагов физики: ${world.ticks}`,
    `Клавиши: ${info.keysDown.length > 0 ? info.keysDown.join(' ') : '—'}`,
    `Поворот: ${TURN_LABEL[world.controls.turn]}`,
    `Тяга (W): ${world.controls.thrust ? 'ВКЛ' : 'выкл'}`,
    `ЛКМ: ${world.controls.fire ? 'зажата' : 'отпущена'}, выстрелов: ${world.shotsFired}`,
    `Корабль: ${world.ship.position.toString()}, скорость ${world.ship.speed.toFixed(0)} пикс/с, курс ${toDegrees(world.ship.angle)}°`,
    `Курсор: экран ${info.mouseScreen.toString()}, мир ${world.aimWorld.toString()}`,
    'R — вернуть корабль в центр, F1 — скрыть/показать',
  ];

  ctx.save();
  ctx.font = '14px ui-monospace, Menlo, Consolas, monospace';
  ctx.textBaseline = 'top';
  ctx.fillStyle = DEBUG_TEXT_COLOR;
  lines.forEach((line, i) => ctx.fillText(line, 12, 12 + i * 18));
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
