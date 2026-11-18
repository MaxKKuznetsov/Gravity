import { HUD_COLOR, HUD_MUTED_COLOR } from '../config';
import type { World } from '../game/world';
import type { Camera } from './camera';

// Игровой HUD: очки, жизни, хиты планеты, волна, скорость и высота
export function drawHud(ctx: CanvasRenderingContext2D, world: World, camera: Camera): void {
  const pad = 16;
  const line = 22;
  ctx.save();
  ctx.font = 'bold 16px ui-monospace, Menlo, Consolas, monospace';
  ctx.textBaseline = 'top';

  ctx.textAlign = 'left';
  ctx.fillStyle = HUD_COLOR;
  ctx.fillText(`Очки  ${world.score}`, pad, pad);
  ctx.fillStyle = HUD_MUTED_COLOR;
  ctx.fillText(`Волна ${world.wave}`, pad, pad + line);
  ctx.fillText(shipStatus(world), pad, pad + line * 2);

  ctx.textAlign = 'right';
  ctx.fillStyle = HUD_COLOR;
  ctx.fillText(livesLabel(world.lives), camera.viewWidth - pad, pad);
  ctx.fillStyle = planetHitsColor(world);
  ctx.fillText(
    `Планета  ${world.planetHits}/${world.params.planetMaxHits}`,
    camera.viewWidth - pad,
    pad + line,
  );
  ctx.restore();
}

function livesLabel(lives: number): string {
  if (lives <= 0) return 'Жизни  —';
  // Повторяем символ корабля столько раз, сколько жизней осталось
  return `Жизни  ${'▲'.repeat(lives)}`;
}

function planetHitsColor(world: World): string {
  const ratio = world.planetHits / Math.max(1, world.params.planetMaxHits);
  if (ratio <= 0) return '#e23b3b';
  if (ratio <= 0.3) return '#ffb347';
  return HUD_COLOR;
}

function shipStatus(world: World): string {
  const ship = world.ship;
  if (ship === null) {
    if (world.defeatCause === 'ship') return 'Корабль потерян';
    if (world.defeated) return 'Планета разрушена';
    return `Новый через ${Math.max(0, world.respawnTimer).toFixed(1)} с`;
  }
  const altitude = world.planet.altitudeOf(ship.position);
  return `v ${ship.speed.toFixed(0)}  h ${altitude.toFixed(0)}`;
}
