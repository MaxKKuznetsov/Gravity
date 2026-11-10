import {
  BULLET_COLOR,
  BULLET_TRAIL_COLOR,
  BULLET_TRAIL_SECONDS,
  CROSSHAIR_COLOR,
  CROSSHAIR_FIRE_COLOR,
} from '../config';
import type { Vec2 } from '../core/Vec2';
import type { Bullet } from '../entities/bullet';
import type { Camera } from './camera';

// Снаряд: яркая точка с коротким хвостом назад по скорости. Под конец жизни
// снаряд гаснет
export function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet, camera: Camera): void {
  const at = camera.worldToScreen(bullet.position);
  const tail = camera.worldToScreen(
    bullet.position.sub(bullet.velocity.scale(BULLET_TRAIL_SECONDS)),
  );
  const lifeLeft = 1 - bullet.age / bullet.lifetime;

  ctx.save();
  ctx.globalAlpha = Math.min(1, lifeLeft * 4);
  ctx.strokeStyle = BULLET_TRAIL_COLOR;
  ctx.lineWidth = bullet.radius;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tail.x, tail.y);
  ctx.lineTo(at.x, at.y);
  ctx.stroke();
  ctx.fillStyle = BULLET_COLOR;
  ctx.beginPath();
  ctx.arc(at.x, at.y, bullet.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Перекрестие прицела на месте курсора (системный курсор над canvas скрыт).
// Дуга вокруг показывает перезарядку: полный круг — оружие готово.
// readiness — от 0 до 1, firing — зажата ли ЛКМ
export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  at: Vec2,
  readiness: number,
  firing: boolean,
): void {
  const inner = 4;
  const outer = 11;
  const ring = 8;
  ctx.save();
  ctx.strokeStyle = firing ? CROSSHAIR_FIRE_COLOR : CROSSHAIR_COLOR;
  ctx.lineWidth = 1.5;
  // Четыре штриха с зазором в центре, чтобы видеть, что под прицелом
  ctx.beginPath();
  ctx.moveTo(at.x - outer, at.y);
  ctx.lineTo(at.x - inner, at.y);
  ctx.moveTo(at.x + inner, at.y);
  ctx.lineTo(at.x + outer, at.y);
  ctx.moveTo(at.x, at.y - outer);
  ctx.lineTo(at.x, at.y - inner);
  ctx.moveTo(at.x, at.y + inner);
  ctx.lineTo(at.x, at.y + outer);
  ctx.stroke();

  // Дуга перезарядки растёт по часовой стрелке от верхней точки
  const start = -Math.PI / 2;
  ctx.globalAlpha = readiness >= 1 ? 0.9 : 0.5;
  ctx.beginPath();
  ctx.arc(at.x, at.y, ring, start, start + Math.max(0, Math.min(1, readiness)) * Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
