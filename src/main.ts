import { BACKGROUND_COLOR } from './config';
import { computeCanvasSize } from './core/canvasSize';
import { FpsMeter } from './core/fpsMeter';
import { InputState, KEY_DEBUG, KEY_RESET, attachInput } from './core/input';
import { startLoop } from './core/loop';
import { Ship } from './entities/ship';
import { createWorld, stepWorld } from './game/world';
import { Camera } from './render/camera';
import { drawCrosshair, drawDebugOverlay } from './render/debugOverlay';
import { drawOffscreenMarker, drawShip } from './render/shipRenderer';

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
    // Пока у поля нет границы (она появится на этапе 3), улетевший корабль
    // можно вернуть в центр клавишей R
    if (input.wasPressed(KEY_RESET)) world.ship = new Ship();
    world.shotsFired += input.clickCount;
    input.endFrame();

    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);
    drawShip(ctx, world.ship, camera, world.time);
    drawOffscreenMarker(ctx, world.ship, camera);
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
