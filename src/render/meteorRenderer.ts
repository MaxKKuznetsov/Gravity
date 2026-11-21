import type { Meteor } from '../entities/meteor';
import type { Camera } from './camera';

// Небольшой детерминированный шум: рисунок поверхности не меняется между кадрами.
function noise(seed: number, index: number, channel: number): number {
  const value = Math.sin(seed * 12.9898 + index * 78.233 + channel * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

function drawCrater(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  angle: number,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Светлый приподнятый край и тень с противоположной стороны создают рельеф.
  ctx.fillStyle = 'rgba(235, 238, 242, 0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX * 1.12, radiusY * 1.12, 0, 0, Math.PI * 2);
  ctx.fill();

  const pit = ctx.createRadialGradient(
    -radiusX * 0.28,
    -radiusY * 0.34,
    radiusX * 0.04,
    0,
    0,
    radiusX * 1.1,
  );
  pit.addColorStop(0, 'rgba(37, 39, 43, 0.94)');
  pit.addColorStop(0.62, 'rgba(75, 78, 83, 0.92)');
  pit.addColorStop(1, 'rgba(112, 115, 120, 0.88)');
  ctx.fillStyle = pit;
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(247, 248, 250, 0.46)';
  ctx.lineWidth = Math.max(0.45, radiusX * 0.09);
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX * 1.04, radiusY * 1.04, 0, Math.PI * 1.12, Math.PI * 1.88);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(18, 20, 24, 0.5)';
  ctx.lineWidth = Math.max(0.5, radiusX * 0.12);
  ctx.beginPath();
  ctx.ellipse(0, 0, radiusX * 1.08, radiusY * 1.08, 0, -0.18, Math.PI * 0.82);
  ctx.stroke();
  ctx.restore();
}

// Каменистый силуэт с кратерами разных размеров и направленным освещением.
export function drawMeteor(ctx: CanvasRenderingContext2D, meteor: Meteor, camera: Camera): void {
  const at = camera.worldToScreen(meteor.position);
  const n = meteor.shape.length;
  if (n < 3) return;

  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.rotate(meteor.angle);

  const r = meteor.radius;
  const outline = (): void => {
    ctx.beginPath();
    meteor.shape.forEach((factor, i) => {
      const angle = (i / n) * Math.PI * 2;
      const radius = r * factor;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  };

  outline();
  const stone = ctx.createRadialGradient(
    -r * 0.38,
    -r * 0.42,
    r * 0.04,
    r * 0.12,
    r * 0.1,
    r * 1.2,
  );
  stone.addColorStop(0, '#c6c8ca');
  stone.addColorStop(0.42, '#85898e');
  stone.addColorStop(1, '#35383d');
  ctx.fillStyle = stone;
  ctx.fill();

  // Внутренняя маска не даёт кратерам выходить за рваный край камня.
  outline();
  ctx.clip();

  let seed = 0;
  meteor.shape.forEach((factor, i) => {
    seed += Math.round(factor * 10000) * (i + 1);
  });

  const craterCount = Math.max(5, Math.round(r * 0.9));
  for (let i = 0; i < craterCount; i += 1) {
    const angle = noise(seed, i, 0) * Math.PI * 2;
    const distance = Math.sqrt(noise(seed, i, 1)) * r * 0.66;
    const sizeRoll = noise(seed, i, 2);
    const craterRadius = r * (sizeRoll > 0.82 ? 0.13 + sizeRoll * 0.08 : 0.035 + sizeRoll * 0.075);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const flattening = 0.68 + noise(seed, i, 3) * 0.52;
    drawCrater(ctx, x, y, craterRadius, craterRadius * flattening, noise(seed, i, 4) * Math.PI);
  }

  // Мелкая зернистость на крупных камнях, тоже зафиксированная по форме.
  const fleckCount = Math.round(r * 1.8);
  for (let i = 0; i < fleckCount; i += 1) {
    const angle = noise(seed, i, 5) * Math.PI * 2;
    const distance = Math.sqrt(noise(seed, i, 6)) * r * 0.82;
    const size = 0.25 + noise(seed, i, 7) * Math.max(0.35, r * 0.035);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(238, 240, 243, 0.25)' : 'rgba(24, 27, 31, 0.25)';
    ctx.beginPath();
    ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Чёткий, но неброский край отделяет силуэт от космоса.
  outline();
  ctx.strokeStyle = 'rgba(214, 218, 223, 0.6)';
  ctx.lineWidth = Math.max(0.8, r * 0.06);
  ctx.stroke();
  ctx.restore();
}
