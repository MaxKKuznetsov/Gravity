import { describe, expect, it } from 'vitest';
import { InputState, KEY_DEBUG } from '../src/core/input';

describe('InputState', () => {
  it('A — поворот против часовой (-1), D — по часовой (+1)', () => {
    const input = new InputState();
    expect(input.controls().turn).toBe(0);
    input.keyDown('KeyA');
    expect(input.controls().turn).toBe(-1);
    input.keyDown('KeyD');
    expect(input.controls().turn).toBe(0);
    input.keyUp('KeyA');
    expect(input.controls().turn).toBe(1);
  });

  it('W включает тягу', () => {
    const input = new InputState();
    input.keyDown('KeyW');
    expect(input.controls().thrust).toBe(true);
    input.keyUp('KeyW');
    expect(input.controls().thrust).toBe(false);
  });

  it('нажатие засчитывается один раз, автоповтор не считается', () => {
    const input = new InputState();
    input.keyDown(KEY_DEBUG);
    input.keyDown(KEY_DEBUG);
    expect(input.wasPressed(KEY_DEBUG)).toBe(true);
    input.endFrame();
    input.keyDown(KEY_DEBUG); // автоповтор, клавиша всё ещё зажата
    expect(input.wasPressed(KEY_DEBUG)).toBe(false);
  });

  it('считает клики ЛКМ за кадр', () => {
    const input = new InputState();
    input.mouseButton(true);
    input.mouseButton(false);
    input.mouseButton(true);
    expect(input.clickCount).toBe(2);
    expect(input.controls().fire).toBe(true);
    input.endFrame();
    expect(input.clickCount).toBe(0);
  });

  it('releaseAll отпускает клавиши и кнопку мыши', () => {
    const input = new InputState();
    input.keyDown('KeyW');
    input.mouseButton(true);
    input.releaseAll();
    expect(input.controls().thrust).toBe(false);
    expect(input.controls().fire).toBe(false);
  });
});
