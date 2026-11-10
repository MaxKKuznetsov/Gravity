import { Vec2 } from './Vec2';

// Тип-объединение: значение может быть только одним из трёх чисел.
// -1 — против часовой стрелки, 1 — по часовой, 0 — не поворачиваем.
export type TurnDirection = -1 | 0 | 1;

// Команды игрока на текущий момент, уже без привязки к конкретным клавишам
export interface Controls {
  readonly turn: TurnDirection;
  readonly thrust: boolean;
  readonly fire: boolean;
  // Курсор в экранных CSS-пикселях; в мир переводит камера
  readonly aimScreen: Vec2;
}

// Коды физических клавиш (не зависят от раскладки: на русской A — это «Ф»)
export const KEY_TURN_LEFT = 'KeyA';
export const KEY_TURN_RIGHT = 'KeyD';
export const KEY_THRUST = 'KeyW';
export const KEY_DEBUG = 'F1';

// Состояние клавиатуры и мыши. Сам класс про DOM не знает, поэтому его
// можно тестировать в Node; к событиям браузера его подключает attachInput.
export class InputState {
  private readonly down = new Set<string>();
  private readonly pressedThisFrame = new Set<string>();
  private mouse = Vec2.ZERO;
  private mouseDown = false;
  private clicks = 0;

  keyDown(code: string): void {
    // Автоповтор при зажатой клавише не считаем новым нажатием
    if (!this.down.has(code)) {
      this.pressedThisFrame.add(code);
    }
    this.down.add(code);
  }

  keyUp(code: string): void {
    this.down.delete(code);
  }

  mouseMove(x: number, y: number): void {
    this.mouse = new Vec2(x, y);
  }

  mouseButton(isDown: boolean): void {
    if (isDown && !this.mouseDown) {
      this.clicks += 1;
    }
    this.mouseDown = isDown;
  }

  // Окно потеряло фокус: keyup уже не придёт, поэтому отпускаем всё
  releaseAll(): void {
    this.down.clear();
    this.mouseDown = false;
    this.clicks = 0;
  }

  isDown(code: string): boolean {
    return this.down.has(code);
  }

  // Список зажатых клавиш, для отладки
  keysDown(): string[] {
    return [...this.down];
  }

  // Была ли клавиша нажата с прошлого вызова endFrame
  wasPressed(code: string): boolean {
    return this.pressedThisFrame.has(code);
  }

  // Сколько раз нажали ЛКМ с прошлого вызова consumeClicks
  get clickCount(): number {
    return this.clicks;
  }

  get mouseScreen(): Vec2 {
    return this.mouse;
  }

  get isMouseDown(): boolean {
    return this.mouseDown;
  }

  controls(): Controls {
    const left = this.isDown(KEY_TURN_LEFT);
    const right = this.isDown(KEY_TURN_RIGHT);
    // Зажаты обе клавиши — маневровые двигатели гасят друг друга
    const turn: TurnDirection = left === right ? 0 : left ? -1 : 1;
    return {
      turn,
      thrust: this.isDown(KEY_THRUST),
      // Короткий клик (тап по тачпаду) может начаться и закончиться между
      // двумя кадрами, и кнопка уже будет отпущена. Поэтому клик за этот
      // кадр тоже считается командой «стрелять»
      fire: this.mouseDown || this.clicks > 0,
      aimScreen: this.mouse,
    };
  }

  // Вызывается в конце кадра: сбрасывает одноразовые нажатия клавиш
  endFrame(): void {
    this.pressedThisFrame.clear();
  }

  // Вызывается после шага физики, который прочитал controls(): клики уже
  // учтены. Отдельно от endFrame, потому что в кадре может не быть ни
  // одного шага физики, и тогда клик не должен пропасть
  consumeClicks(): void {
    this.clicks = 0;
  }
}

// Подписывает InputState на события браузера. Возвращает функцию отписки.
export function attachInput(input: InputState, canvas: HTMLCanvasElement): () => void {
  const onKeyDown = (e: KeyboardEvent): void => {
    // F1 в браузере открывает справку — забираем клавишу себе
    if (e.code === KEY_DEBUG) e.preventDefault();
    input.keyDown(e.code);
  };
  const onKeyUp = (e: KeyboardEvent): void => input.keyUp(e.code);
  const onMove = (e: PointerEvent): void => {
    const rect = canvas.getBoundingClientRect();
    input.mouseMove(e.clientX - rect.left, e.clientY - rect.top);
  };
  const onPointerDown = (e: PointerEvent): void => {
    if (e.button === 0) input.mouseButton(true);
  };
  const onPointerUp = (e: PointerEvent): void => {
    if (e.button === 0) input.mouseButton(false);
  };
  const onBlur = (): void => input.releaseAll();

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('blur', onBlur);

  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('blur', onBlur);
  };
}
