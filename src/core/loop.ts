import { FixedStepAccumulator } from './fixedStep';

export interface LoopCallbacks {
  // Один шаг физики длиной dt секунд
  update(dt: number): void;
  // Отрисовка кадра; frameTime — реальное время с прошлого кадра
  render(frameTime: number, alpha: number): void;
}

// Запускает игровой цикл на requestAnimationFrame. Возвращает функцию остановки.
export function startLoop(
  callbacks: LoopCallbacks,
  stepper = new FixedStepAccumulator(),
): () => void {
  let lastTime: number | null = null;
  let handle = 0;

  // Стрелочная функция: внутри неё не возникает своего `this`,
  // поэтому её безопасно отдавать в requestAnimationFrame как колбэк
  const frame = (now: number): void => {
    // now — миллисекунды, физика считает в секундах
    const frameTime = lastTime === null ? 0 : (now - lastTime) / 1000;
    lastTime = now;

    const steps = stepper.advance(frameTime);
    for (let i = 0; i < steps; i++) {
      callbacks.update(stepper.dt);
    }
    callbacks.render(frameTime, stepper.alpha);

    handle = requestAnimationFrame(frame);
  };

  handle = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(handle);
}
