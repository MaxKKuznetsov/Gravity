import { METEOR_COLOR, METEOR_EDGE_COLOR } from '../config';
import type { Meteor } from '../entities/meteor';
import type { Camera } from './camera';

// Метеорит: неровный многоугольник, повёрнутый на meteor.angle
export function drawMeteor(ctx: CanvasRenderingContext2D, meteor: Meteor, camera: Camera): void {
  const at = camera.worldToScreen(meteor.position);
  const n = meteor.shape.length;
  if (n < 3) return;

  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.rotate(meteor.angle);
  ctx.beginPath();
  meteor.shape.forEach((k, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = meteor.radius * k;
    if (i === 0) ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
    else ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
  });
  ctx.closePath();
  ctx.fillStyle = METEOR_COLOR;
  ctx.fill();
  ctx.strokeStyle = METEOR_EDGE_COLOR;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Пара «кратеров», чтобы было видно вращение
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  const r = meteor.radius;
  ctx.beginPath();
  ctx.arc(r * 0.3, -r * 0.2, r * 0.22, 0, Math.PI * 2);
  // moveTo начинает новый контур, иначе arc соединит кратеры линией
  ctx.moveTo(-r * 0.2, r * 0.3);
  ctx.arc(-r * 0.35, r * 0.3, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
