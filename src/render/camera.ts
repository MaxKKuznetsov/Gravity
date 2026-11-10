import { Vec2 } from '../core/Vec2';

// Камера переводит экранные координаты в мировые и обратно.
// Пока без масштаба: центр экрана смотрит в точку center мира
// (там на этапе 3 будет планета).
export class Camera {
  constructor(
    public center: Vec2 = Vec2.ZERO,
    public viewWidth = 0,
    public viewHeight = 0,
  ) {}

  setViewSize(width: number, height: number): void {
    this.viewWidth = width;
    this.viewHeight = height;
  }

  screenToWorld(screen: Vec2): Vec2 {
    return new Vec2(
      screen.x - this.viewWidth / 2 + this.center.x,
      screen.y - this.viewHeight / 2 + this.center.y,
    );
  }

  worldToScreen(world: Vec2): Vec2 {
    return new Vec2(
      world.x - this.center.x + this.viewWidth / 2,
      world.y - this.center.y + this.viewHeight / 2,
    );
  }
}
