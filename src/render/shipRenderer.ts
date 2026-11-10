import {
  OFFSCREEN_MARKER_COLOR,
  OFFSCREEN_MARKER_MARGIN,
  SHIP_COLOR,
  SHIP_FLAME_COLOR,
  SHIP_FLAME_CORE_COLOR,
  SHIP_SIZE,
} from '../config';
import { Vec2 } from '../core/Vec2';
import type { Ship } from '../entities/ship';
import type { Camera } from './camera';

// Рисует корабль: корпус-стрелку носом по направлению angle и пламя
// из сопла, пока включён двигатель. time нужен только для мерцания пламени.
export function drawShip(
  ctx: CanvasRenderingContext2D,
  ship: Ship,
  camera: Camera,
  time: number,
): void {
  const at = camera.worldToScreen(ship.position);
  const s = SHIP_SIZE;

  ctx.save();
  // Переносим начало координат в центр корабля и поворачиваем так, что
  // дальше нос корабля — это ось +X
  ctx.translate(at.x, at.y);
  ctx.rotate(ship.angle);

  if (ship.thrusting) {
    // Длина пламени чуть «дышит»: две синусоиды с разной частотой
    const flicker = 0.75 + 0.15 * Math.sin(time * 47) + 0.1 * Math.sin(time * 83);
    const length = s * 1.4 * flicker;
    drawFlame(ctx, -s * 0.55, s * 0.4, length, SHIP_FLAME_COLOR);
    drawFlame(ctx, -s * 0.55, s * 0.2, length * 0.55, SHIP_FLAME_CORE_COLOR);
  }

  // Корпус: нос в (s, 0), задние «крылья» и выемка у сопла
  ctx.beginPath();
  ctx.moveTo(s, 0);
  ctx.lineTo(-s * 0.8, -s * 0.65);
  ctx.lineTo(-s * 0.45, 0);
  ctx.lineTo(-s * 0.8, s * 0.65);
  ctx.closePath();
  ctx.fillStyle = SHIP_COLOR;
  ctx.fill();

  ctx.restore();
}

// Треугольник пламени: основание шириной 2·halfWidth в точке x0, острие
// на length левее
function drawFlame(
  ctx: CanvasRenderingContext2D,
  x0: number,
  halfWidth: number,
  length: number,
  color: string,
): void {
  ctx.beginPath();
  ctx.moveTo(x0, -halfWidth);
  ctx.lineTo(x0 - length, 0);
  ctx.lineTo(x0, halfWidth);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Где на краю экрана показать стрелку на улетевший корабль.
// Возвращает null, если корабль виден. Чистая функция — её можно тестировать.
export function offscreenMarker(
  shipScreen: Vec2,
  viewWidth: number,
  viewHeight: number,
  margin: number,
): { position: Vec2; angle: number } | null {
  const inside =
    shipScreen.x >= 0 &&
    shipScreen.x <= viewWidth &&
    shipScreen.y >= 0 &&
    shipScreen.y <= viewHeight;
  if (inside) return null;

  // Луч из центра экрана к кораблю обрезаем прямоугольником с отступом margin
  const center = new Vec2(viewWidth / 2, viewHeight / 2);
  const dir = shipScreen.sub(center);
  const halfW = Math.max(1, viewWidth / 2 - margin);
  const halfH = Math.max(1, viewHeight / 2 - margin);
  const k = Math.min(
    dir.x !== 0 ? halfW / Math.abs(dir.x) : Infinity,
    dir.y !== 0 ? halfH / Math.abs(dir.y) : Infinity,
  );
  return { position: center.add(dir.scale(k)), angle: dir.angle() };
}

// Стрелка у края экрана в сторону корабля и расстояние до него
export function drawOffscreenMarker(
  ctx: CanvasRenderingContext2D,
  ship: Ship,
  camera: Camera,
): void {
  const shipScreen = camera.worldToScreen(ship.position);
  const marker = offscreenMarker(
    shipScreen,
    camera.viewWidth,
    camera.viewHeight,
    OFFSCREEN_MARKER_MARGIN,
  );
  if (!marker) return;

  const distance = shipScreen.distanceTo(marker.position);
  ctx.save();
  ctx.fillStyle = OFFSCREEN_MARKER_COLOR;
  ctx.font = '12px ui-monospace, Menlo, Consolas, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.save();
  ctx.translate(marker.position.x, marker.position.y);
  ctx.rotate(marker.angle);
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(-6, -7);
  ctx.lineTo(-6, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Подпись чуть ближе к центру экрана, чтобы не залезала за край
  const label = marker.position.sub(Vec2.fromAngle(marker.angle, 22));
  ctx.fillText(`${distance.toFixed(0)}`, label.x, label.y);
  ctx.restore();
}
