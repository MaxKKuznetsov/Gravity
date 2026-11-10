import { computeCanvasSize } from './core/canvasSize';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
if (!canvas) {
  throw new Error('Не найден <canvas id="game"> в index.html');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Браузер не поддерживает Canvas 2D');
}

// Подгоняем буфер canvas под окно и перерисовываем кадр
function resize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const size = computeCanvasSize(window.innerWidth, window.innerHeight, window.devicePixelRatio);
  canvas.width = size.pixelWidth;
  canvas.height = size.pixelHeight;
  // Дальше рисуем в CSS-пикселях, масштаб под плотность экрана берёт на себя transform
  ctx.setTransform(size.scale, 0, 0, size.scale, 0, 0);
  draw(ctx, size.cssWidth, size.cssHeight);
}

// Пока пустое поле; игровой цикл появится на этапе 1
function draw(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = '#05060a';
  ctx.fillRect(0, 0, width, height);
}

window.addEventListener('resize', () => resize(canvas, ctx));
resize(canvas, ctx);
