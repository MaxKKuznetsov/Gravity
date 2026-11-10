// Неизменяемый 2D-вектор. Каждая операция возвращает новый вектор,
// исходный не меняется (как кортеж или frozen dataclass в Python).
export class Vec2 {
  // `readonly` в параметрах конструктора сразу объявляет поля x и y
  // и запрещает их менять после создания
  constructor(
    readonly x: number,
    readonly y: number,
  ) {}

  static readonly ZERO = new Vec2(0, 0);

  // Единичный вектор под углом angle (радианы, по часовой стрелке от оси X,
  // потому что ось Y направлена вниз)
  static fromAngle(angle: number, length = 1): Vec2 {
    return new Vec2(Math.cos(angle) * length, Math.sin(angle) * length);
  }

  add(other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  sub(other: Vec2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  scale(k: number): Vec2 {
    return new Vec2(this.x * k, this.y * k);
  }

  dot(other: Vec2): number {
    return this.x * other.x + this.y * other.y;
  }

  // Z-компонента векторного произведения; знак показывает, в какую сторону
  // поворачивать от this к other
  cross(other: Vec2): number {
    return this.x * other.y - this.y * other.x;
  }

  length(): number {
    return Math.hypot(this.x, this.y);
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  distanceTo(other: Vec2): number {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }

  // Вектор той же направленности длины 1; нулевой вектор остаётся нулевым
  normalize(): Vec2 {
    const len = this.length();
    return len > 0 ? this.scale(1 / len) : Vec2.ZERO;
  }

  // Поворот на угол (по часовой стрелке при оси Y вниз)
  rotate(angle: number): Vec2 {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return new Vec2(this.x * c - this.y * s, this.x * s + this.y * c);
  }

  angle(): number {
    return Math.atan2(this.y, this.x);
  }

  equals(other: Vec2, eps = 1e-9): boolean {
    return Math.abs(this.x - other.x) <= eps && Math.abs(this.y - other.y) <= eps;
  }

  toString(): string {
    return `(${this.x.toFixed(1)}, ${this.y.toFixed(1)})`;
  }
}
