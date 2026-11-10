import { BACKGROUND_COLOR } from './config';
import { computeCanvasSize } from './core/canvasSize';
import { FpsMeter } from './core/fpsMeter';
import { InputState, KEY_DEBUG, attachInput } from './core/input';
import { startLoop } from './core/loop';
import { createWorld, predictShipTrajectory, stepWorld } from './game/world';
import { isOutsideField } from './physics/boundary';
import { Camera } from './render/camera';
import { drawMeteor } from './render/meteorRenderer';
import { drawCrosshair, drawDebugOverlay } from './render/debugOverlay';
import { drawOffscreenMarker, drawShip } from './render/shipRenderer';
import {
  drawExplosion,
  drawFieldBorder,
  drawFieldWarning,
  drawPlanet,
  drawRespawnNotice,
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
const world = createWorld();
let debugVisible = true;

// Подгоняем буфер canvas под окно
function resize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const size = computeCanvasSize(window.innerWidth, window.innerHeight, window.devicePixelRatio);
  canvas.width = size.pixelWidth;
  canvas.height = size.pixelHeight;
  // Дальше рисуем в CSS-пикселях, масштаб под плотность экрана берёт на себя transform
  ctx.setTransform(size.scale, 0, 0, size.scale, 0, 0);
  camera.setViewSize(size.cssWidth, size.cssHeight);
}

window.addEventListener('resize', () => resize(canvas, ctx));
resize(canvas, ctx);
attachInput(input, canvas);

startLoop({
  update(dt) {
    const controls = input.controls();
    stepWorld(world, controls, camera.screenToWorld(controls.aimScreen), dt);
  },
  render(frameTime) {
    fps.tick(frameTime);

    // Одноразовые события обрабатываем раз за кадр, чтобы клик не потерялся
    // в кадре, где не было ни одного шага физики
    if (input.wasPressed(KEY_DEBUG)) debugVisible = !debugVisible;
    world.shotsFired += input.clickCount;
    input.endFrame();

    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);
    drawFieldBorder(ctx, world.planet, world.params.fieldRadius, camera);
    const trajectory = predictShipTrajectory(world);
    if (trajectory) drawTrajectory(ctx, trajectory, camera);
    drawPlanet(ctx, world.planet, camera);
    for (const meteor of world.meteors) drawMeteor(ctx, meteor, camera);
    for (const explosion of world.explosions) drawExplosion(ctx, explosion, camera);

    const ship = world.ship;
    if (ship) {
      drawShip(ctx, ship, camera, world.time);
      drawOffscreenMarker(ctx, ship, camera);
      if (isOutsideField(ship.position, world.planet.position, world.params.fieldRadius)) {
        drawFieldWarning(ctx, camera, world.time);
      }
    } else {
      drawRespawnNotice(ctx, camera, world.respawnTimer);
    }
    drawCrosshair(ctx, input.mouseScreen, input.isMouseDown);
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
