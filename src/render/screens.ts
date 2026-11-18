import {
  OVERLAY_ACCENT_COLOR,
  OVERLAY_DIM_COLOR,
  OVERLAY_TITLE_COLOR,
  HUD_MUTED_COLOR,
} from '../config';
import type { GamePhase, GameSession } from '../game/session';
import type { Camera } from './camera';

// Затемнение и текст поверх игры для title / pause / gameover
export function drawGameScreen(
  ctx: CanvasRenderingContext2D,
  session: GameSession,
  camera: Camera,
): void {
  if (session.phase === 'playing') return;

  ctx.save();
  ctx.fillStyle = OVERLAY_DIM_COLOR;
  ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);

  const cx = camera.viewWidth / 2;
  const cy = camera.viewHeight / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = OVERLAY_TITLE_COLOR;
  ctx.font = 'bold 48px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillText(titleFor(session.phase), cx, cy - 48);

  ctx.fillStyle = OVERLAY_ACCENT_COLOR;
  ctx.font = '18px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillText(subtitleFor(session), cx, cy + 8);

  ctx.fillStyle = HUD_MUTED_COLOR;
  ctx.font = '14px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillText(hintFor(session.phase), cx, cy + 48);

  if (session.phase === 'title') {
    ctx.fillText('Защищайте планету от падающих метеоритов', cx, cy + 76);
    ctx.fillText('A/D — поворот · W — тяга · мышь — прицел · ЛКМ — огонь', cx, cy + 98);
    ctx.fillText('P / Esc — пауза', cx, cy + 120);
  }
  ctx.restore();
}

function titleFor(phase: GamePhase): string {
  switch (phase) {
    case 'title':
      return 'GRAVITY';
    case 'paused':
      return 'ПАУЗА';
    case 'gameover':
      return 'GAME OVER';
    case 'playing':
      return '';
  }
}

function subtitleFor(session: GameSession): string {
  if (session.phase === 'gameover') {
    const cause = session.world.defeatCause === 'planet' ? 'Планета разрушена' : 'Корабли потеряны';
    return `${cause} · Очки ${session.world.score} · Волна ${session.world.wave}`;
  }
  if (session.phase === 'paused') {
    return `Очки ${session.world.score} · Волна ${session.world.wave}`;
  }
  return 'Защитите планету';
}

function hintFor(phase: GamePhase): string {
  switch (phase) {
    case 'title':
      return 'Enter / Space — начать';
    case 'paused':
      return 'P / Esc — продолжить';
    case 'gameover':
      return 'R / Enter / Space — заново';
    case 'playing':
      return '';
  }
}
