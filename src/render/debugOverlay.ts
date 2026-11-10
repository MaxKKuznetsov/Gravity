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

// Текстовый оверлей в левом верхнем углу
export function drawDebugOverlay(ctx: CanvasRenderingContext2D, info: DebugInfo): void {
  const { world } = info;
  const lines = [
    `FPS: ${info.fps.toFixed(0)}`,
    `Объектов: ${world.objectCount}`,
    `Время симуляции: ${world.time.toFixed(2)} с, шагов физики: ${world.ticks}`,
    `Клавиши: ${info.keysDown.length > 0 ? info.keysDown.join(' ') : '—'}`,
    `Поворот: ${TURN_LABEL[world.controls.turn]}`,
    `Тяга (W): ${world.controls.thrust ? 'ВКЛ' : 'выкл'}`,
    `ЛКМ: ${world.controls.fire ? 'зажата' : 'отпущена'}, выстрелов: ${world.shotsFired}`,
    `Курсор: экран ${info.mouseScreen.toString()}, мир ${world.aimWorld.toString()}`,
    'F1 — скрыть/показать',
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
