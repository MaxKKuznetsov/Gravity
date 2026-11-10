import { describe, expect, it } from 'vitest';
import { computeCanvasSize } from '../src/core/canvasSize';

describe('computeCanvasSize', () => {
  it('на обычном экране пиксели совпадают с CSS-размером', () => {
    const size = computeCanvasSize(800, 600, 1);
    expect(size.pixelWidth).toBe(800);
    expect(size.pixelHeight).toBe(600);
    expect(size.scale).toBe(1);
  });

  it('на экране с ratio 2 буфер вдвое больше', () => {
    const size = computeCanvasSize(800, 600, 2);
    expect(size.pixelWidth).toBe(1600);
    expect(size.pixelHeight).toBe(1200);
  });

  it('дробный ratio округляется до целых пикселей', () => {
    const size = computeCanvasSize(333, 101, 1.5);
    expect(size.pixelWidth).toBe(500);
    expect(size.pixelHeight).toBe(152);
  });

  it('некорректный ratio считается за 1', () => {
    expect(computeCanvasSize(100, 50, 0).scale).toBe(1);
    expect(computeCanvasSize(100, 50, Number.NaN).scale).toBe(1);
  });

  it('размер буфера не бывает нулевым', () => {
    const size = computeCanvasSize(0, 0, 1);
    expect(size.pixelWidth).toBe(1);
    expect(size.pixelHeight).toBe(1);
  });
});
