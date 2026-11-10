import { DT, MAX_FRAME_TIME } from '../config';

// Аккумулятор времени для фиксированного шага физики.
// Браузер даёт кадры с плавающим интервалом (16.7 мс, 8.3 мс, иногда 40 мс),
// а физика всегда шагает ровно на dt. Накопленный остаток переносится в
// следующий кадр.
export class FixedStepAccumulator {
  private accumulator = 0;

  constructor(
    readonly dt: number = DT,
    readonly maxFrameTime: number = MAX_FRAME_TIME,
  ) {}

  // Добавляет прошедшее время кадра и возвращает, сколько шагов физики
  // нужно сделать
  advance(frameTime: number): number {
    const clamped = Math.min(Math.max(frameTime, 0), this.maxFrameTime);
    this.accumulator += clamped;
    // Небольшой допуск от ошибок округления: 0.1 + 0.2 != 0.3
    const steps = Math.floor(this.accumulator / this.dt + 1e-9);
    this.accumulator = Math.max(0, this.accumulator - steps * this.dt);
    return steps;
  }

  // Доля шага (0..1), на которую отрисовка опережает последнее состояние
  // физики; понадобится для интерполяции
  get alpha(): number {
    return this.accumulator / this.dt;
  }
}
