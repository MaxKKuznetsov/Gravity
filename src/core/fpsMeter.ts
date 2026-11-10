// Считает кадры в секунду: раз в window секунд обновляет показание
export class FpsMeter {
  private frames = 0;
  private elapsed = 0;
  private current = 0;

  constructor(readonly window = 0.5) {}

  tick(frameTime: number): void {
    this.frames += 1;
    this.elapsed += frameTime;
    if (this.elapsed >= this.window) {
      this.current = this.frames / this.elapsed;
      this.frames = 0;
      this.elapsed = 0;
    }
  }

  get fps(): number {
    return this.current;
  }
}
