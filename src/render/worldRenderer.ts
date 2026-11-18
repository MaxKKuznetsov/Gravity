import {
  EXPLOSION_COLOR,
  EXPLOSION_DURATION,
  FIELD_BORDER_COLOR,
  FIELD_WARNING_COLOR,
  PLANET_COLOR,
  PLANET_CRACK_COLOR,
  PLANET_CRACK_GLOW_COLOR,
  PLANET_GLOW_COLOR,
  PLANET_SCAR_COLOR,
  PLANET_SCAR_EDGE_COLOR,
  TRAJECTORY_COLOR,
  TRAJECTORY_IMPACT_COLOR,
} from '../config';
import type { Planet } from '../entities/planet';
import type { Explosion, PlanetScar } from '../game/world';
import type { Trajectory } from '../physics/trajectory';
import type { Camera } from './camera';

export interface PlanetDrawOptions {
  readonly scars?: readonly PlanetScar[];
  // Хиты кончились — рисуем красные трещины (референс examples/crack)
  readonly cracked?: boolean;
}

// Планета: шар с градиентом, кляксами от ударов и трещинами при разрушении
export function drawPlanet(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  camera: Camera,
  options: PlanetDrawOptions = {},
): void {
  const at = camera.worldToScreen(planet.position);
  const r = planet.radius;
  const scars = options.scars ?? [];
  const cracked = options.cracked ?? false;

  ctx.save();
  const glow = ctx.createRadialGradient(at.x, at.y, r * 0.9, at.x, at.y, r * 1.6);
  glow.addColorStop(0, 'rgba(156, 200, 255, 0.25)');
  glow.addColorStop(1, 'rgba(156, 200, 255, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(at.x, at.y, r * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Блик смещён вверх-влево, будто свет падает оттуда
  const body = ctx.createRadialGradient(at.x - r * 0.35, at.y - r * 0.35, r * 0.1, at.x, at.y, r);
  body.addColorStop(0, PLANET_GLOW_COLOR);
  body.addColorStop(1, PLANET_COLOR);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(at.x, at.y, r, 0, Math.PI * 2);
  ctx.fill();

  // Кляксы и трещины только внутри диска планеты
  ctx.beginPath();
  ctx.arc(at.x, at.y, r, 0, Math.PI * 2);
  ctx.clip();
  for (const scar of scars) drawScar(ctx, at.x, at.y, r, scar);
  if (cracked) drawCracks(ctx, at.x, at.y, r, scars);
  ctx.restore();
}

// Тёмное пятно у поверхности в направлении удара
function drawScar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  planetR: number,
  scar: PlanetScar,
): void {
  const dist = planetR * 0.72;
  const x = cx + Math.cos(scar.angle) * dist;
  const y = cy + Math.sin(scar.angle) * dist;
  const size = planetR * scar.radiusFactor;

  ctx.fillStyle = PLANET_SCAR_COLOR;
  ctx.beginPath();
  // Неровная «клякса» из нескольких овалов
  ctx.ellipse(x, y, size, size * 0.72, scar.angle, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(
    x + Math.cos(scar.angle + 0.9) * size * 0.35,
    y + Math.sin(scar.angle + 0.9) * size * 0.35,
    size * 0.55,
    size * 0.4,
    scar.angle + 0.4,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.fillStyle = PLANET_SCAR_EDGE_COLOR;
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.45, size * 0.32, scar.angle - 0.3, 0, Math.PI * 2);
  ctx.fill();
}

// Красные трещины в стиле examples/crack/crack.jpeg: ломаные линии от шрамов
function drawCracks(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  planetR: number,
  scars: readonly PlanetScar[],
): void {
  const seeds = scars.length > 0 ? scars.map((s) => s.angle) : [0, 2.1, 4.0];

  ctx.strokeStyle = PLANET_CRACK_GLOW_COLOR;
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const angle of seeds) strokeCrackBranch(ctx, cx, cy, planetR, angle, 0);

  ctx.strokeStyle = PLANET_CRACK_COLOR;
  ctx.lineWidth = 1.6;
  for (const angle of seeds) strokeCrackBranch(ctx, cx, cy, planetR, angle, 0);
}

function strokeCrackBranch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  planetR: number,
  angle: number,
  depth: number,
): void {
  if (depth > 3) return;
  // Детерминированный «шум» от угла, без Math.random — картинка стабильна
  const jitter = Math.sin(angle * 12.9898 + depth * 78.233) * 0.55;
  const steps = 5 - depth;
  const length = planetR * (0.55 - depth * 0.1);
  let x = cx + Math.cos(angle) * planetR * 0.15;
  let y = cy + Math.sin(angle) * planetR * 0.15;
  let heading = angle + Math.PI + jitter * 0.4;

  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i < steps; i++) {
    heading += Math.sin(angle * 7.1 + i * 1.7 + depth) * 0.45;
    const stepLen = length / steps;
    x += Math.cos(heading) * stepLen;
    y += Math.sin(heading) * stepLen;
    ctx.lineTo(x, y);
  }
  ctx.stroke();

  if (depth < 2) {
    strokeCrackBranch(ctx, cx, cy, planetR, angle + 0.7 + jitter, depth + 1);
    strokeCrackBranch(ctx, cx, cy, planetR, angle - 0.9 - jitter * 0.5, depth + 1);
  }
}

// Граница поля: тонкий пунктирный круг
export function drawFieldBorder(
  ctx: CanvasRenderingContext2D,
  planet: Planet,
  fieldRadius: number,
  camera: Camera,
): void {
  const at = camera.worldToScreen(planet.position);
  ctx.save();
  ctx.strokeStyle = FIELD_BORDER_COLOR;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 10]);
  ctx.beginPath();
  ctx.arc(at.x, at.y, fieldRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// Пунктир предсказанной траектории; если она упирается в планету,
// в точке удара рисуем крестик
export function drawTrajectory(
  ctx: CanvasRenderingContext2D,
  trajectory: Trajectory,
  camera: Camera,
): void {
  const { points } = trajectory;
  if (points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = TRAJECTORY_COLOR;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  points.forEach((p, i) => {
    const s = camera.worldToScreen(p);
    if (i === 0) ctx.moveTo(s.x, s.y);
    else ctx.lineTo(s.x, s.y);
  });
  ctx.stroke();

  // В tsconfig включён noUncheckedIndexedAccess: points[i] имеет тип
  // `Vec2 | undefined`, потому что индекса может не быть. at(-1) — как
  // points[-1] в Python, только вместо IndexError возвращает undefined
  const last = points.at(-1);
  if (trajectory.stopped && last) {
    const end = camera.worldToScreen(last);
    const r = 6;
    ctx.setLineDash([]);
    ctx.strokeStyle = TRAJECTORY_IMPACT_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(end.x - r, end.y - r);
    ctx.lineTo(end.x + r, end.y + r);
    ctx.moveTo(end.x + r, end.y - r);
    ctx.lineTo(end.x - r, end.y + r);
    ctx.stroke();
  }
  ctx.restore();
}

// Взрыв: расширяющееся и гаснущее кольцо со вспышкой в центре
export function drawExplosion(
  ctx: CanvasRenderingContext2D,
  explosion: Explosion,
  camera: Camera,
): void {
  const t = Math.min(1, explosion.age / EXPLOSION_DURATION);
  const at = camera.worldToScreen(explosion.position);
  // Кольцо быстро растёт в начале и замедляется к концу
  const radius = explosion.radius * (1 - (1 - t) * (1 - t));

  ctx.save();
  ctx.globalAlpha = 1 - t;
  ctx.strokeStyle = EXPLOSION_COLOR;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(at.x, at.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(at.x, at.y, radius * 0.4 * (1 - t), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Надпись по центру сверху, пока корабль за границей поля. Мигает
export function drawFieldWarning(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  time: number,
): void {
  if (Math.sin(time * 8) < -0.3) return;
  ctx.save();
  ctx.fillStyle = FIELD_WARNING_COLOR;
  ctx.font = 'bold 18px ui-monospace, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('⚠ ГРАНИЦА ПОЛЯ — вас тянет обратно', camera.viewWidth / 2, 16);
  ctx.restore();
}

// Надпись, пока корабль не появился заново после взрыва
export function drawRespawnNotice(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  secondsLeft: number,
): void {
  ctx.save();
  ctx.fillStyle = FIELD_WARNING_COLOR;
  ctx.font = 'bold 18px ui-monospace, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(
    `Корабль разбился. Новый через ${Math.max(0, secondsLeft).toFixed(1)} с`,
    camera.viewWidth / 2,
    16,
  );
  ctx.restore();
}
