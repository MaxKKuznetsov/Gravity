import { BACKGROUND_COLOR } from './config';
import { computeCanvasSize } from './core/canvasSize';
import { FpsMeter } from './core/fpsMeter';
import {
  InputState,
  KEY_CONFIRM,
  KEY_CONFIRM_ALT,
  KEY_DEBUG,
  KEY_ESCAPE,
  KEY_PAUSE,
  KEY_RESTART,
  attachInput,
} from './core/input';
import { startLoop } from './core/loop';
import { createSession, restartGame, startGame, stepSession, togglePause } from './game/session';
import { readiness } from './game/weapon';
import { predictShipTrajectory } from './game/world';
import { isOutsideField } from './physics/boundary';
import { Camera } from './render/camera';
import { drawDebugOverlay } from './render/debugOverlay';
import { drawHud } from './render/hud';
import { drawMeteor } from './render/meteorRenderer';
import { drawGameScreen } from './render/screens';
import { drawOffscreenMarker, drawShip } from './render/shipRenderer';
import { drawBullet, drawCrosshair } from './render/weaponRenderer';
import {
  drawExplosion,
  drawFieldBorder,
  drawFieldWarning,
  drawPlanet,
  drawTrajectory,
} from './render/worldRenderer';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) {
  throw new Error('Не найден <canvas id="game"> в index.html');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Браузер не поддерживает Canvas 2D');
}

const camera = new Camera();
const input = new InputState();
const fps = new FpsMeter();
const session = createSession();
let debugVisible = false;

// Подгоняем буфер canvas под окно
function resize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const size = computeCanvasSize(window.innerWidth, window.innerHeight, window.devicePixelRatio);
  canvas.width = size.pixelWidth;
  canvas.height = size.pixelHeight;
  // Дальше рисуем в CSS-пикселях, масштаб под плотность экрана берёт на себя transform
  ctx.setTransform(size.scale, 0, 0, size.scale, 0, 0);
  camera.setViewSize(size.cssWidth, size.cssHeight);
}

// Меню читаем раз за кадр (в render): иначе при нескольких шагах
// физики пауза переключилась бы туда-сюда
function handleMenuInput(): void {
  const confirm =
    input.wasPressed(KEY_CONFIRM) || input.wasPressed(KEY_CONFIRM_ALT) || input.clickCount > 0;
  const restart = input.wasPressed(KEY_RESTART) || confirm;

  if (session.phase === 'title' && confirm) {
    startGame(session);
    return;
  }
  if (session.phase === 'gameover' && restart) {
    restartGame(session);
    return;
  }
  if (input.wasPressed(KEY_PAUSE) || input.wasPressed(KEY_ESCAPE)) {
    togglePause(session);
  }
}

window.addEventListener('resize', () => resize(canvas, ctx));
resize(canvas, ctx);
attachInput(input, canvas);

startLoop({
  update(dt) {
    if (session.phase !== 'playing') return;
    const controls = input.controls();
    stepSession(session, controls, camera.screenToWorld(controls.aimScreen), dt);
    input.consumeClicks();
  },
  render(frameTime) {
    fps.tick(frameTime);

    handleMenuInput();
    if (input.wasPressed(KEY_DEBUG)) debugVisible = !debugVisible;
    // Клики на экранах меню: физика их не съела
    if (session.phase !== 'playing') input.consumeClicks();
    input.endFrame();

    const { world } = session;
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);
    drawFieldBorder(ctx, world.planet, world.params.fieldRadius, camera);
    if (session.phase === 'playing' || session.phase === 'paused') {
      const trajectory = predictShipTrajectory(world);
      if (trajectory) drawTrajectory(ctx, trajectory, camera);
    }
    drawPlanet(ctx, world.planet, camera, {
      scars: world.planetScars,
      cracked: world.defeatCause === 'planet' || world.planetHits <= 0,
    });
    for (const meteor of world.meteors) drawMeteor(ctx, meteor, camera);
    for (const bullet of world.bullets) drawBullet(ctx, bullet, camera);
    for (const explosion of world.explosions) drawExplosion(ctx, explosion, camera);

    const ship = world.ship;
    if (ship) {
      drawShip(ctx, ship, camera, world.time);
      drawOffscreenMarker(ctx, ship, camera);
      if (
        session.phase === 'playing' &&
        isOutsideField(ship.position, world.planet.position, world.params.fieldRadius)
      ) {
        drawFieldWarning(ctx, camera, world.time);
      }
    }

    if (session.phase === 'playing' || session.phase === 'paused') {
      drawHud(ctx, world, camera);
    }
    if (session.phase === 'playing') {
      drawCrosshair(ctx, input.mouseScreen, readiness(world.weapon), input.isMouseDown);
    }
    drawGameScreen(ctx, session, camera);

    if (debugVisible) {
      drawDebugOverlay(ctx, {
        fps: fps.fps,
        world,
        keysDown: input.keysDown(),
        mouseScreen: input.mouseScreen,
      });
    }
  },
});
